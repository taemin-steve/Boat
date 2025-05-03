import * as THREE from 'three';
import Ship from './Ship.js';

/**
 * 순찰선 클래스 - Ship의 구체적인 구현
 */
class PatrolBoat extends Ship {
    constructor(options = {}) {
        // 순찰선의 기본 속성 설정
        const patrolBoatOptions = {
            ...options,
            size: options.size || { length: 15, width: 6, height: 4 },
            color: options.color || 0x3388DD,
            speed: options.speed || 0.5,
            bouyancyFactor: options.bouyancyFactor || 1.3, // 높은 부력
            pitchFactor: options.pitchFactor || 1.4,       // 더 민감한 피치
            rollFactor: options.rollFactor || 1.2          // 표준 롤링
        };
        
        super(patrolBoatOptions);
    }
    
    // Template Method 패턴의 구체적인 구현
    createShipMesh() {
        const { length, width, height } = this.size;
        
        // 선체 형태 생성
        const shipMesh = new THREE.Group();
        
        // 기본 선체 - 더 날렵한 형태
        const baseHull = new THREE.Mesh(
            new THREE.BoxGeometry(length, height * 0.6, width),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        baseHull.position.y = -height * 0.15;
        shipMesh.add(baseHull);
        
        // 선체 하단 (뾰족한 부분)
        const bottomHull = new THREE.Mesh(
            new THREE.CylinderGeometry(width / 2, 0, length * 0.6, 8, 1),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        bottomHull.rotation.z = Math.PI / 2;
        bottomHull.position.set(length * 0.3, -height * 0.4, 0);
        shipMesh.add(bottomHull);
        
        // 함교 (브릿지)
        const bridgeGeometry = new THREE.BoxGeometry(length * 0.3, height * 1.2, width * 0.7);
        const bridgeMaterial = new THREE.MeshPhongMaterial({ color: 0x444444 });
        const bridge = new THREE.Mesh(bridgeGeometry, bridgeMaterial);
        bridge.position.set(-length * 0.2, height * 0.6, 0);
        shipMesh.add(bridge);
        
        // 레이더/안테나 타워
        const radarTower = new THREE.Mesh(
            new THREE.CylinderGeometry(width * 0.05, width * 0.08, height * 1.5, 8),
            new THREE.MeshPhongMaterial({ color: 0x333333 })
        );
        radarTower.position.set(-length * 0.2, height * 1.7, 0);
        shipMesh.add(radarTower);
        
        // 레이더 접시
        const radar = new THREE.Mesh(
            new THREE.CylinderGeometry(width * 0.3, width * 0.3, width * 0.05, 16),
            new THREE.MeshPhongMaterial({ color: 0x666666 })
        );
        radar.rotation.x = Math.PI / 2;
        radar.position.set(-length * 0.2, height * 2.5, 0);
        shipMesh.add(radar);
        
        return shipMesh;
    }
}

export default PatrolBoat; 