import * as THREE from 'three';
import Ship from './Ship.js';

/**
 * 범선 클래스 - Ship의 구체적인 구현
 */
class SailingShip extends Ship {
    constructor(options = {}) {
        // 범선의 기본 속성 설정
        const sailingShipOptions = {
            ...options,
            size: options.size || { length: 20, width: 6, height: 5 },
            color: options.color || 0x8B4513, // 갈색 선체
            speed: options.speed || 0.12,
            bouyancyFactor: options.bouyancyFactor || 1.25, // 중간 부력
            pitchFactor: options.pitchFactor || 1.3,        // 민감한 피치
            rollFactor: options.rollFactor || 1.5           // 매우 민감한 롤링
        };
        
        super(sailingShipOptions);
        
        // 범선에 특화된 추가 속성 (super 호출 후에 초기화)
        this.sailsOpen = options.sailsOpen !== undefined ? options.sailsOpen : true;
        this.sailColor = options.sailColor || 0xF8F8FF;
        this.sails = []; // 이 배열은 createShipMesh() 메서드에서 사용됨
    }
    
    // Template Method 패턴의 구체적인 구현
    createShipMesh() {
        const { length, width, height } = this.size;
        
        // 선체 형태 생성
        const shipMesh = new THREE.Group();
        
        // 기본 선체 - 나무배 형태
        const baseHull = new THREE.Mesh(
            new THREE.BoxGeometry(length, height * 0.6, width),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        baseHull.position.y = -height * 0.2;
        shipMesh.add(baseHull);
        
        // 선체 하단 (둥근 형태)
        const bottomHull = new THREE.Mesh(
            new THREE.CylinderGeometry(width / 3, width / 2, length * 0.9, 8, 1),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        bottomHull.rotation.z = Math.PI / 2;
        bottomHull.position.set(0, -height * 0.4, 0);
        shipMesh.add(bottomHull);
        
        // 갑판
        const deckGeometry = new THREE.BoxGeometry(length * 0.9, height * 0.1, width * 0.8);
        const deckMaterial = new THREE.MeshPhongMaterial({ color: 0xA0522D });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.set(0, height * 0.1, 0);
        shipMesh.add(deck);
        
        // 마스트들 추가
        this.addMastsAndSails(shipMesh);
        
        return shipMesh;
    }
    
    // 마스트와 돛 추가 메서드 (createShipMesh에서 호출)
    addMastsAndSails(shipMesh) {
        const { length, width, height } = this.size;
        const sailsList = []; // 로컬 배열에 돛 저장
        
        // 마스트 위치 (전방, 중앙, 후방)
        const mastPositions = [
            { x: length * 0.3, y: 0, z: 0 },
            { x: 0, y: 0, z: 0 },
            { x: -length * 0.3, y: 0, z: 0 }
        ];
        
        // 각 마스트 추가
        for (let i = 0; i < mastPositions.length; i++) {
            const pos = mastPositions[i];
            
            // 마스트 기둥
            const mastHeight = height * (i === 1 ? 3.2 : 2.8); // 중앙 마스트가 가장 높음
            const mast = new THREE.Mesh(
                new THREE.CylinderGeometry(width * 0.03, width * 0.04, mastHeight, 8),
                new THREE.MeshPhongMaterial({ color: 0x8B4513 })
            );
            mast.position.set(pos.x, height * 0.1 + mastHeight / 2, pos.z);
            shipMesh.add(mast);
            
            // 가로 돛대 (야드암)
            const yardWidth = width * 1.6;
            const yard = new THREE.Mesh(
                new THREE.CylinderGeometry(width * 0.02, width * 0.02, yardWidth, 8),
                new THREE.MeshPhongMaterial({ color: 0x8B4513 })
            );
            yard.rotation.z = Math.PI / 2;
            yard.position.set(pos.x, height * 0.1 + mastHeight * 0.7, pos.z);
            shipMesh.add(yard);
            
            // 돛 추가
            const sail = this.createSail(pos.x, height * 0.1 + mastHeight * 0.35, pos.z, mastHeight * 0.7, yardWidth * 0.9);
            shipMesh.add(sail);
            sailsList.push(sail);
        }
        
        // 모든 돛이 생성된 후에 this.sails에 할당
        this.sails = sailsList;
    }
    
    // 돛 생성 메서드 (돛을 생성하고 반환만 함)
    createSail(x, y, z, sailHeight, sailWidth) {
        // 돛의 형태 (사다리꼴)
        const sailShape = new THREE.Shape();
        sailShape.moveTo(-sailWidth / 2, -sailHeight / 2);
        sailShape.lineTo(sailWidth / 2, -sailHeight / 2);
        sailShape.lineTo(sailWidth / 2.5, sailHeight / 2);
        sailShape.lineTo(-sailWidth / 2.5, sailHeight / 2);
        sailShape.lineTo(-sailWidth / 2, -sailHeight / 2);
        
        const sailGeometry = new THREE.ShapeGeometry(sailShape);
        const sailMaterial = new THREE.MeshPhongMaterial({
            color: this.sailColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.9
        });
        
        const sail = new THREE.Mesh(sailGeometry, sailMaterial);
        sail.position.set(x, y, z);
        sail.rotation.x = this.sailsOpen ? 0 : Math.PI / 2; // 돛이 접힌 경우 회전
        
        return sail;
    }
    
    // 돛 상태 변경 메서드
    toggleSails() {
        this.sailsOpen = !this.sailsOpen;
        
        if (this.sails && this.sails.length > 0) {
            for (const sail of this.sails) {
                // 돛 회전 애니메이션 효과
                sail.rotation.x = this.sailsOpen ? 0 : Math.PI / 2;
            }
            
            // 돛 상태에 따라 속도 조절
            this.setSpeed(this.sailsOpen ? 0.12 : 0.04);
        }
    }
}

export default SailingShip; 