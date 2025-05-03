import * as THREE from 'three';

/**
 * 배의 기본 추상 클래스 - Template Method 패턴 적용
 */
class Ship {
    constructor(options = {}) {
        this.position = options.position || new THREE.Vector3(0, 0, 0);
        this.rotation = options.rotation || new THREE.Euler(0, 0, 0);
        this.size = options.size || { length: 10, width: 5, height: 3 };
        this.color = options.color || 0xAAAAAA;
        this.speed = options.speed || 0;
        this.direction = options.direction || 0; // 라디안 단위의 방향
        
        // 물리 계수 추가
        this.bouyancyFactor = options.bouyancyFactor || 1.2; // 부력 계수 (파도에 따른 높이 조정)
        this.pitchFactor = options.pitchFactor || 1.0; // 상하 회전 계수
        this.rollFactor = options.rollFactor || 1.0; // 좌우 회전 계수
        
        // 이동 전략 (Strategy 패턴)
        this.movementStrategy = null;
        
        // 충돌 처리를 위한 콜백
        this.onCollisionCallbacks = [];
        
        this.mesh = null;
        this.initMesh();
    }
    
    // Template Method 패턴 - 기본 골격 메서드
    initMesh() {
        const shipMesh = this.createShipMesh();
        
        // 메쉬 생성 및 설정
        this.mesh = shipMesh;
        this.mesh.position.copy(this.position);
        this.mesh.rotation.copy(this.rotation);
        
        // 그림자 설정
        this.mesh.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
            }
        });
    }
    
    // 서브클래스에서 오버라이드할 메서드 (Template Method 패턴)
    createShipMesh() {
        throw new Error('createShipMesh() 메서드는 자식 클래스에서 구현해야 합니다.');
    }
    
    // Template Method: 배의 업데이트 로직
    update(time, ocean) {
        if (!this.mesh || !ocean) return;
        
        // 이동 전략이 있으면 그에 따라 움직임 처리
        if (this.movementStrategy) {
            this.movementStrategy.move(this, time);
        } else {
            this.defaultMovement();
        }
        
        this.applyOceanPhysics(time, ocean);
    }
    
    // 기본 이동 동작 (전략이 없을 때)
    defaultMovement() {
        if (this.speed !== 0) {
            const moveX = Math.sin(this.direction) * this.speed;
            const moveZ = Math.cos(this.direction) * this.speed;
            
            this.mesh.position.x += moveX;
            this.mesh.position.z += moveZ;
        }
    }
    
    // 바다의 물리 효과 적용
    applyOceanPhysics(time, ocean) {
        const pos = this.mesh.position;
        
        // 파도 높이 계산
        const waveHeight = ocean.getWaveHeight(pos.x, pos.z, time);
        
        // 선박의 높이를 파도 높이에 맞춤 (부력 계수 적용)
        this.mesh.position.y = waveHeight * this.bouyancyFactor + this.size.height / 2;
        
        // 파도의 기울기에 따라 선박 회전
        const { slopeX, slopeZ } = ocean.getWaveSlope(pos.x, pos.z, time);
        
        // 선박의 현재 y축 회전 각도 유지
        const currentYRotation = this.mesh.rotation.y;
        
        // x, z 회전 업데이트 (회전 계수 적용)
        this.mesh.rotation.x = slopeZ * 0.8 * this.pitchFactor;
        this.mesh.rotation.z = -slopeX * 0.8 * this.rollFactor;
        
        // y 회전 복원 (선박 방향 유지)
        this.mesh.rotation.y = currentYRotation;
        
        // 파도의 영향에 따른 추가 요동 효과 (더 생동감 있는 움직임)
        const wobble = Math.sin(time * 2.5) * 0.02;
        this.mesh.rotation.z += wobble * this.rollFactor;
    }
    
    // 방향 설정
    setDirection(direction) {
        this.direction = direction;
        this.mesh.rotation.y = direction;
    }
    
    // 속도 설정
    setSpeed(speed) {
        this.speed = speed;
    }
    
    // 이동 전략 설정 (Strategy 패턴)
    setMovementStrategy(strategy) {
        this.movementStrategy = strategy;
    }
    
    // 충돌 처리를 위한 콜백 추가 (Observer 패턴)
    addCollisionCallback(callback) {
        if (typeof callback === 'function') {
            this.onCollisionCallbacks.push(callback);
        }
    }
    
    // 충돌 이벤트 발생 시 콜백 호출
    handleCollision(otherEntity) {
        for (const callback of this.onCollisionCallbacks) {
            callback(this, otherEntity);
        }
    }
}

export default Ship; 