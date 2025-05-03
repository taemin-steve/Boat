import * as THREE from 'three';
import Ship from './Ship.js';
import PatrolBoat from './PatrolBoat.js';
import CargoShip from './CargoShip.js';
import SailingShip from './SailingShip.js';
import AttackDroneShip from './AttackDroneShip.js';


// Movement Strategies
import ManualMovement from './movement/ManualMovement.js';
import AutoMovement from './movement/AutoMovement.js';

/**
 * 선박 생성을 위한 팩토리 클래스
 */
class ShipFactory {
    /**
     * 선박 타입에 따라 적절한 선박 객체 생성
     * @param {string} type - 선박 유형 (patrol, cargo, sailing, drone)
     * @param {object} options - 선박 생성 옵션
     * @returns {Ship} 생성된 선박 객체
     */
    static createShip(type, options = {}) {
        let ship;
        
        switch (type.toLowerCase()) {
            case 'patrol':
                ship = new PatrolBoat(options);
                break;
                
            case 'cargo':
                ship = new CargoShip(options);
                break;
                
            case 'sailing':
                ship = new SailingShip(options);
                break;
            
            case 'drone':
                ship = new AttackDroneShip(options);
                break;
                
            default:
                console.warn(`Unknown ship type: ${type}. Creating default ship.`);
                ship = new Ship(options);
        }
        
        // 이동 전략 설정
        if (options.movementType) {
            const movementStrategy = this.createMovementStrategy(
                options.movementType, 
                options.movementOptions || {}
            );
            
            if (movementStrategy) {
                ship.setMovementStrategy(movementStrategy);
            }
        }
        
        return ship;
    }
    
    /**
     * 이동 전략 생성
     * @param {string} type - 이동 전략 유형 (manual, auto, ai)
     * @param {object} options - 이동 전략 옵션
     * @returns {MovementStrategy} 생성된 이동 전략 객체
     */
    static createMovementStrategy(type, options = {}) {
        switch (type.toLowerCase()) {
            case 'manual':
                return new ManualMovement(options);
                
            case 'auto':
                // 웨이포인트 변환 (배열이 THREE.Vector2 객체가 아닌 경우)
                if (options.waypoints && Array.isArray(options.waypoints)) {
                    options.waypoints = options.waypoints.map(wp => {
                        if (wp instanceof THREE.Vector2) return wp;
                        return new THREE.Vector2(wp.x || wp[0] || 0, wp.z || wp[1] || 0);
                    });
                }
                return new AutoMovement(options);
                
            default:
                console.warn(`Unknown movement type: ${type}. No movement strategy assigned.`);
                return null;
        }
    }
    
    /**
     * 유형별 함대 생성
     * @param {string} type - 함대 유형 (mixed, patrol, cargo, sailing, drone)
     * @param {number} count - 생성할 배의 수
     * @param {object} options - 함대 생성 옵션
     * @returns {Array<Ship>} 선박 객체 배열
     */
    static createFleet(type, count, options = {}) {
        const fleet = [];
        const defaultOptions = {
            radius: options.radius || 50,
            centerX: options.centerX || 0,
            centerZ: options.centerZ || 0
        };
        
        for (let i = 0; i < count; i++) {
            // 함대 내 위치 계산 (원형 배치)
            const angle = (i / count) * Math.PI * 2;
            const distance = defaultOptions.radius * (0.5 + Math.random() * 0.5);
            const x = defaultOptions.centerX + Math.cos(angle) * distance;
            const z = defaultOptions.centerZ + Math.sin(angle) * distance;
            
            // 선박 유형 결정
            let shipType;
            if (type === 'mixed') {
                // 혼합 함대의 경우 랜덤하게 선택
                const types = ['patrol', 'cargo', 'sailing', 'drone'];
                shipType = types[Math.floor(Math.random() * types.length)];
            } else {
                shipType = type;
            }
            
            // 선박 생성 옵션
            const shipOptions = {
                ...options,
                position: new THREE.Vector3(x, 0, z),
                direction: Math.random() * Math.PI * 2
            };
            
            // 이동 전략 설정 (기본적으로 AI 이동)
            if (!shipOptions.movementType) {
                shipOptions.movementType = 'ai';
                shipOptions.movementOptions = {
                    mode: 'patrol',
                    patrolRadius: distance * 0.7,
                    patrolCenter: new THREE.Vector2(x, z)
                };
            }
            
            // 선박 생성 및 추가
            const ship = this.createShip(shipType, shipOptions);
            fleet.push(ship);
        }
        
        return fleet;
    }
}

export default ShipFactory; 