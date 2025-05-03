import MovementStrategy from './MovementStrategy.js';
import * as THREE from 'three';

/**
 * 자동 이동 전략 - 설정된 경로를 따라 움직임
 */
class AutoMovement extends MovementStrategy {
    constructor(options = {}) {
        super();
        
        // 웨이포인트 설정 (이동 경로)
        this.waypoints = options.waypoints || [];
        
        // 현재 웨이포인트 인덱스
        this.currentWaypointIndex = 0;
        
        // 이동 설정
        this.speed = options.speed || 0.1;
        this.rotationSpeed = options.rotationSpeed || 0.02;
        this.waypointThreshold = options.waypointThreshold || 5; // 웨이포인트 도달 기준 거리
        
        // 거리 계산을 위한 벡터
        this.tempVector = new THREE.Vector3();
        
        // 루프 모드 (마지막 웨이포인트 도달 후 처음으로 돌아갈지)
        this.loopMode = options.loopMode !== undefined ? options.loopMode : true;
    }
    
    // 웨이포인트 추가
    addWaypoint(x, z) {
        this.waypoints.push(new THREE.Vector2(x, z));
    }
    
    // 웨이포인트 설정
    setWaypoints(waypoints) {
        this.waypoints = waypoints;
        this.currentWaypointIndex = 0;
    }
    
    // 현재 웨이포인트 얻기
    getCurrentWaypoint() {
        if (this.waypoints.length === 0) return null;
        return this.waypoints[this.currentWaypointIndex];
    }
    
    // 다음 웨이포인트로 이동
    moveToNextWaypoint() {
        if (this.waypoints.length === 0) return;
        
        this.currentWaypointIndex++;
        
        if (this.currentWaypointIndex >= this.waypoints.length) {
            if (this.loopMode) {
                // 루프 모드면 처음으로 돌아감
                this.currentWaypointIndex = 0;
            } else {
                // 루프 모드가 아니면 마지막 인덱스로 유지
                this.currentWaypointIndex = this.waypoints.length - 1;
            }
        }
    }
    
    // 이동 처리 구현
    move(ship, time) {
        if (!ship || !ship.mesh || this.waypoints.length === 0) return;
        
        const currentWaypoint = this.getCurrentWaypoint();
        if (!currentWaypoint) return;
        
        const shipPosition = ship.mesh.position;
        
        // 선박에서 웨이포인트까지의 벡터 계산
        this.tempVector.set(
            currentWaypoint.x - shipPosition.x,
            0,
            currentWaypoint.y - shipPosition.z
        );
        
        // 목표 지점까지의 거리
        const distance = this.tempVector.length();
        
        // 웨이포인트에 도달했는지 확인
        if (distance < this.waypointThreshold) {
            this.moveToNextWaypoint();
            return;
        }
        
        // 목표 방향 계산 (arctan2 사용)
        const targetDirection = Math.atan2(
            currentWaypoint.x - shipPosition.x,
            currentWaypoint.y - shipPosition.z
        );
        
        // 현재 방향과 목표 방향의 차이 계산
        let directionDiff = targetDirection - ship.direction;
        
        // 차이를 -PI ~ PI 범위로 조정
        while (directionDiff > Math.PI) directionDiff -= Math.PI * 2;
        while (directionDiff < -Math.PI) directionDiff += Math.PI * 2;
        
        // 부드러운 회전
        if (Math.abs(directionDiff) > 0.01) {
            const step = Math.sign(directionDiff) * Math.min(this.rotationSpeed, Math.abs(directionDiff));
            ship.direction += step;
            ship.mesh.rotation.y = ship.direction;
        }
        
        // 선박 이동
        const moveX = Math.sin(ship.direction) * this.speed;
        const moveZ = Math.cos(ship.direction) * this.speed;
        
        shipPosition.x += moveX;
        shipPosition.z += moveZ;
    }
}

export default AutoMovement; 