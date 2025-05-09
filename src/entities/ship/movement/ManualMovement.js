import MovementStrategy from './MovementStrategy.js';

/**
 * 수동 이동 전략 - 사용자 입력에 의한 배 조종
 */
class ManualMovement extends MovementStrategy {
    constructor() {
        super();
        
        // 키보드 입력 상태
        this.keys = {
            forward: false,
            backward: false,
            left: false,
            right: false
        };
        
        // 기본 설정
        this.acceleration = 0.05; // 가속도
        this.maxSpeed = 0.4;    // 최대 속도
        this.rotationSpeed = 0.03; // 회전 속도
        this.deceleration = 0.005; // 감속도
        
        // 키보드 이벤트 리스너 설정
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 키 다운 이벤트
        window.addEventListener('keydown', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.keys.forward = true;
                    break;
                case 'ArrowDown':
                    this.keys.backward = true;
                    break;
                case 'ArrowLeft':
                    this.keys.left = true;
                    break;
                case 'ArrowRight':
                    this.keys.right = true;
                    break;
            }
        });
        
        // 키 업 이벤트
        window.addEventListener('keyup', (event) => {
            switch (event.key) {
                case 'ArrowUp':
                    this.keys.forward = false;
                    break;
                case 'ArrowDown':
                    this.keys.backward = false;
                    break;
                case 'ArrowLeft':
                    this.keys.left = false;
                    break;
                case 'ArrowRight':
                    this.keys.right = false;
                    break;
            }
        });
    }
    
    move(ship, time) {
        if (!ship || !ship.mesh) return;
        
        // 속도 변경 (가속/감속)
    if (this.keys.forward) {
        ship.speed += this.acceleration;
        ship.speed = Math.min(ship.speed, this.maxSpeed);
    } else if (this.keys.backward) {
        ship.speed -= this.acceleration;
        ship.speed = Math.max(ship.speed, -this.maxSpeed / 2);
    } else {
        // 부드러운 자연 감속
        ship.speed *= 0.995;
        if (Math.abs(ship.speed) < 0.0001) {
            ship.speed = 0;
        }
    }
        
        // 방향 변경
        if (this.keys.left) {
            // 속도가 빠를수록 회전 속도 감소 (더 넓은 회전반경)
            const turnSpeed = this.rotationSpeed * (1 - Math.abs(ship.speed) / this.maxSpeed * 0.5);
            ship.direction += turnSpeed;
            ship.mesh.rotation.y = ship.direction;
        }
        
        if (this.keys.right) {
            const turnSpeed = this.rotationSpeed * (1 - Math.abs(ship.speed) / this.maxSpeed * 0.5);
            ship.direction -= turnSpeed;
            ship.mesh.rotation.y = ship.direction;
        }
        
        // 선박 위치 업데이트
        if (ship.speed !== 0) {
            const moveX = Math.sin(ship.direction) * ship.speed;
            const moveZ = Math.cos(ship.direction) * ship.speed;
            
            ship.mesh.position.x += moveX;
            ship.mesh.position.z += moveZ;
        }
    }
}

export default ManualMovement; 