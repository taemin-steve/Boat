import * as THREE from 'three';

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
        
        this.mesh = null;
        this.createMesh();
    }
    
    createMesh() {
        // 선박의 기본 형태 (배 모양으로 개선)
        const { length, width, height } = this.size;
        
        // 선체 형태 생성
        const hullGeometry = new THREE.Group();
        
        // 기본 선체
        const baseHull = new THREE.Mesh(
            new THREE.BoxGeometry(length, height * 0.7, width),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        baseHull.position.y = -height * 0.15;
        hullGeometry.add(baseHull);
        
        // 선체 하단 (뾰족한 부분)
        const bottomHull = new THREE.Mesh(
            new THREE.CylinderGeometry(width / 2, 0, length * 0.5, 4, 1),
            new THREE.MeshPhongMaterial({ color: this.color })
        );
        bottomHull.rotation.z = Math.PI / 2;
        bottomHull.position.set(length * 0.25, -height * 0.4, 0);
        hullGeometry.add(bottomHull);
        
        // 선체 상단 (선실)
        const cabinGeometry = new THREE.BoxGeometry(length * 0.5, height * 0.8, width * 0.8);
        const cabinMaterial = new THREE.MeshPhongMaterial({ color: 0xEEEEEE });
        const cabin = new THREE.Mesh(cabinGeometry, cabinMaterial);
        cabin.position.set(-length * 0.1, height * 0.4, 0);
        hullGeometry.add(cabin);
        
        // 메인 마스트
        const mastGeometry = new THREE.CylinderGeometry(width * 0.05, width * 0.05, height * 3, 8);
        const mastMaterial = new THREE.MeshPhongMaterial({ color: 0x885533 });
        const mast = new THREE.Mesh(mastGeometry, mastMaterial);
        mast.position.set(0, height * 1.5, 0);
        hullGeometry.add(mast);
        
        // 메쉬 생성 및 설정
        this.mesh = hullGeometry;
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
    
    update(time, ocean) {
        if (!this.mesh || !ocean) return;
        
        const pos = this.mesh.position;
        
        // 움직임 처리 (방향과 속도에 따라)
        if (this.speed !== 0) {
            const moveX = Math.sin(this.direction) * this.speed;
            const moveZ = Math.cos(this.direction) * this.speed;
            
            pos.x += moveX;
            pos.z += moveZ;
        }
        
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
    
    setDirection(direction) {
        this.direction = direction;
        this.mesh.rotation.y = direction;
    }
    
    setSpeed(speed) {
        this.speed = speed;
    }
}

export default Ship; 