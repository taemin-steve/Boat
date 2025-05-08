import * as THREE from 'three';

class Cloud {
    constructor(options = {}) {
        this.options = {
            position: options.position || new THREE.Vector3(0, 0, 0),
            size: options.size || { width: 50, height: 20, depth: 50 },
            speed: options.speed || 0.2,
            direction: options.direction || new THREE.Vector3(1, 0, 0),
            ...options
        };
        
        this.group = null;
        this.cloudMeshes = [];
        this.bounds = options.bounds || {
            minX: -1000, maxX: 1000,
            minZ: -1000, maxZ: 1000
        };
    }

    create(scene) {
        // 구름 그룹 생성
        this.group = new THREE.Group();
        this.group.position.copy(this.options.position);
        
        // 깃털 모양 구름 메쉬 생성
        this.createFeatherCloud();
        
        // 씬에 추가
        scene.add(this.group);
        
        return this;
    }
    
    createFeatherCloud() {
        // 순수한 흰색 구름 색상
        const cloudColor = new THREE.Color(1, 1, 1);
        
        // 기본 구름 재질 (빛 반사 없이 투과되는 느낌)
        const cloudMaterial = new THREE.MeshBasicMaterial({
            color: cloudColor,
            transparent: true,
            opacity: 0.6,
            depthWrite: false, // 깊이 버퍼에 쓰지 않아 투과 효과
            side: THREE.DoubleSide
        });
        
        // 구름 전체 크기
        const width = this.options.size.width;
        const height = this.options.size.height;
        const depth = this.options.size.depth;
        
        // 깃털 모양 구름을 만들기 위한 원판 형태들
        const discCount = 7 + Math.floor(Math.random() * 5); // 7~11개 원판
        
        for (let i = 0; i < discCount; i++) {
            // 랜덤 위치와 크기 (중앙에 가까울수록 더 큰 원판)
            const distanceFromCenter = Math.random();
            const discRadius = (0.6 - distanceFromCenter * 0.3) * Math.min(width, depth) * 0.5;
            
            // 납작하고 불규칙한 원판 형태
            const discGeometry = new THREE.CircleGeometry(
                discRadius, 
                8 + Math.floor(Math.random() * 5) // 8~12개 세그먼트 (불규칙한 모양)
            );
            
            // 랜덤한 위치 계산
            const offsetX = (Math.random() - 0.5) * width * 0.8;
            const offsetY = (Math.random() - 0.5) * height * 0.3;
            const offsetZ = (Math.random() - 0.5) * depth * 0.8;
            
            // 랜덤한 회전 적용
            const rotX = Math.random() * Math.PI * 2;
            const rotY = Math.random() * Math.PI * 2;
            const rotZ = Math.random() * Math.PI * 2;
            
            const discMesh = new THREE.Mesh(discGeometry, cloudMaterial.clone());
            
            // 약간 다른 투명도 (다양한 깊이감)
            discMesh.material.opacity = 0.3 + Math.random() * 0.4;
            
            // 위치와 회전 설정
            discMesh.position.set(offsetX, offsetY, offsetZ);
            discMesh.rotation.set(rotX, rotY, rotZ);
            
            this.group.add(discMesh);
            this.cloudMeshes.push(discMesh);
        }
        
        // 좀 더 부드러운 형태를 위한 작은 원판 추가
        const smallDiscCount = 10 + Math.floor(Math.random() * 8);
        
        for (let i = 0; i < smallDiscCount; i++) {
            // 더 작은 원판들
            const smallRadius = 0.1 * Math.min(width, depth) * 0.5 * (0.5 + Math.random() * 0.5);
            
            const smallDiscGeometry = new THREE.CircleGeometry(
                smallRadius, 
                5 + Math.floor(Math.random() * 3)
            );
            
            // 전체 영역에 넓게 분포
            const offsetX = (Math.random() - 0.5) * width;
            const offsetY = (Math.random() - 0.5) * height * 0.5;
            const offsetZ = (Math.random() - 0.5) * depth;
            
            const rotX = Math.random() * Math.PI * 2;
            const rotY = Math.random() * Math.PI * 2;
            const rotZ = Math.random() * Math.PI * 2;
            
            const smallDiscMesh = new THREE.Mesh(smallDiscGeometry, cloudMaterial.clone());
            smallDiscMesh.material.opacity = 0.2 + Math.random() * 0.3; // 더 투명하게
            
            smallDiscMesh.position.set(offsetX, offsetY, offsetZ);
            smallDiscMesh.rotation.set(rotX, rotY, rotZ);
            
            this.group.add(smallDiscMesh);
            this.cloudMeshes.push(smallDiscMesh);
        }
    }
    
    update(time) {
        if (!this.group) return;
        
        // 구름의 현재 위치
        const currentPosition = this.group.position;
        
        // 움직임 벡터 계산 (아주 천천히 이동)
        const moveVector = this.options.direction.clone()
            .normalize()
            .multiplyScalar(this.options.speed * 0.1);
        
        // 새 위치 계산
        currentPosition.add(moveVector);
        
        // 경계를 벗어나면 반대편으로 이동
        if (currentPosition.x > this.bounds.maxX) {
            currentPosition.x = this.bounds.minX;
        } else if (currentPosition.x < this.bounds.minX) {
            currentPosition.x = this.bounds.maxX;
        }
        
        if (currentPosition.z > this.bounds.maxZ) {
            currentPosition.z = this.bounds.minZ;
        } else if (currentPosition.z < this.bounds.minZ) {
            currentPosition.z = this.bounds.maxZ;
        }
        
        // 구름 메쉬들 천천히 회전 (깃털 같은 움직임)
        this.cloudMeshes.forEach((mesh, index) => {
            // 각 메쉬마다 다른 속도로 회전
            const rotSpeed = 0.0001 * (index % 3 + 1);
            mesh.rotation.x += rotSpeed * Math.sin(time * 0.0005);
            mesh.rotation.y += rotSpeed * Math.cos(time * 0.0003);
            mesh.rotation.z += rotSpeed * Math.sin(time * 0.0007);
        });
    }
}

export default Cloud; 