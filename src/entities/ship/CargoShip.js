import * as THREE from 'three';
import Ship from './Ship.js';

/**
 * 화물선 클래스 - Ship의 구체적인 구현
 */
class CargoShip extends Ship {
    constructor(options = {}) {
        // 화물선의 기본 속성 설정
        const cargoShipOptions = {
            ...options,
            size: options.size || { length: 25, width: 10, height: 8 },
            color: options.color || 0x997722,
            speed: options.speed || 0.08,
            bouyancyFactor: options.bouyancyFactor || 1.1, // 더 안정적인 부력
            pitchFactor: options.pitchFactor || 0.8,       // 덜 민감한 피치
            rollFactor: options.rollFactor || 0.7          // 덜 민감한 롤링
        };
        
        super(cargoShipOptions);
        
        // 화물 컨테이너의
        this.containers = [];
        this.containerCount = options.containerCount || Math.floor(Math.random() * 10) + 5;
    }
    
    // Template Method 패턴의 구체적인 구현
    createShipMesh() {
        const { length, width, height } = this.size;
        
        // 선체 형태 생성
        const shipMesh = new THREE.Group();
        
        // 기본 선체 - 더 넓고 둔한 형태
        const baseHull = new THREE.Mesh(
            new THREE.BoxGeometry(length, height * 0.8, width),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        baseHull.position.y = -height * 0.1;
        shipMesh.add(baseHull);
        
        // 선체 하단 (넓적한 부분)
        const bottomHull = new THREE.Mesh(
            new THREE.CylinderGeometry(width / 2, width / 3, length * 0.4, 8, 1),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        bottomHull.rotation.z = Math.PI / 2;
        bottomHull.position.set(length * 0.25, -height * 0.3, 0);
        shipMesh.add(bottomHull);
        
        // 선체 상단 (컨테이너 영역) - 평평한 플랫폼
        const deckGeometry = new THREE.BoxGeometry(length * 0.8, height * 0.1, width * 0.9);
        const deckMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
        const deck = new THREE.Mesh(deckGeometry, deckMaterial);
        deck.position.set(0, height * 0.4, 0);
        shipMesh.add(deck);
        
        // 함교 (브릿지) - 뒤쪽에 위치
        const bridgeGeometry = new THREE.BoxGeometry(length * 0.15, height * 1.5, width * 0.7);
        const bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0xCCCCCC });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(-length * 0.4, height * 1.2, 0);
        shipMesh.add(bridge);
        
        // 굴뚝
        const chimney = new THREE.Mesh(
            new THREE.CylinderGeometry(width * 0.1, width * 0.15, height * 1.2, 8),
            new THREE.MeshPhongMaterial({ color: 0xFF4400 })
        );
        chimney.position.set(-length * 0.3, height * 1.5, 0);
        shipMesh.add(chimney);
        
        // 컨테이너 추가
        this.addContainers(shipMesh);
        
        return shipMesh;
    }
    
    // 컨테이너 추가 메서드
    addContainers(shipMesh) {
        const { length, width, height } = this.size;
        const containerSize = { 
            length: length * 0.15, 
            width: width * 0.3, 
            height: height * 0.4 
        };
        
        const containerColors = [0xE74C3C, 0x3498DB, 0x2ECC71, 0xF1C40F, 0x9B59B6];
        
        // 컨테이너 배치 위치 계산 (선박 앞쪽에 격자 형태로)
        const rows = 3;  // 세로 줄 수
        const cols = Math.ceil(this.containerCount / rows);  // 가로 줄 수
        
        let containerIndex = 0;
        
        for (let row = 0; row < rows && containerIndex < this.containerCount; row++) {
            for (let col = 0; col < cols && containerIndex < this.containerCount; col++) {
                const container = new THREE.Mesh(
                    new THREE.BoxGeometry(
                        containerSize.length, 
                        containerSize.height, 
                        containerSize.width
                    ),
                    new THREE.MeshPhongMaterial({ 
                        color: containerColors[containerIndex % containerColors.length] 
                    })
                );
                
                // 컨테이너 위치 설정
                container.position.set(
                    length * 0.3 - (col * containerSize.length), 
                    height * 0.4 + (containerSize.height / 2) + (row * containerSize.height),
                    0
                );
                
                shipMesh.add(container);
                this.containers.push(container);
                containerIndex++;
            }
        }
    }
}

export default CargoShip; 