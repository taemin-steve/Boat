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
        this.acceleration = 0.01; // 가속도
        this.maxSpeed = 0.2;    // 최대 속도
        this.rotationSpeed = 0.03; // 회전 속도
        this.deceleration = 0.005; // 감속도
        
        // 키보드 이벤트 리스너 설정
        this.setupEventListeners();
    }
    
    setupEventListeners() {
        // 키 다운 이벤트
        window.addEventListener('keydown', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.keys.forward = true;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.backward = true;
                    break;
                case 'a':
                case 'arrowleft':
                    this.keys.left = true;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = true;
                    break;
            }
        });
        
        // 키 업 이벤트
        window.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'w':
                case 'arrowup':
                    this.keys.forward = false;
                    break;
                case 's':
                case 'arrowdown':
                    this.keys.backward = false;
                    break;
                case 'a':
                case 'arrowleft':
                    this.keys.left = false;
                    break;
                case 'd':
                case 'arrowright':
                    this.keys.right = false;
                    break;
            }
        });
    }
    
    move(ship, time) {
        if (!ship || !ship.mesh) return;
        
        // 속도 변경 (가속/감속)
        if (this.keys.forward) {
            ship.speed = Math.min(ship.speed + this.acceleration, this.maxSpeed);
        } else if (this.keys.backward) {
            ship.speed = Math.max(ship.speed - this.acceleration, -this.maxSpeed / 2);
        } 
        // else {
        //     // 자연 감속 (키를 누르지 않으면 서서히 멈춤)
        //     if (Math.abs(ship.speed) < this.deceleration) {
        //         ship.speed = 0;
        //     } else if (ship.speed > 0) {
        //         ship.speed -= this.deceleration;
        //     } else if (ship.speed < 0) {
        //         ship.speed += this.deceleration;
        //     }
        // }
        else {
            // 부드러운 자연 감속
            ship.speed *= 0.98;
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