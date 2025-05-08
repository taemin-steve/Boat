import * as THREE from 'three';
import Island from './island';

class RockIsland extends Island {
    constructor(options = {}) {
        super(options);
    }

    create(scene) {
        // 바위섬의 지오메트리 생성 (더 큰 삼각형)
        const geometry = new THREE.IcosahedronGeometry(
            this.options.size.width / 2,
            1  // 세그먼트 수를 1로 줄여서 더 큰 삼각형 생성
        );
        
        // 버텍스 위치를 수정하여 울퉁불퉁한 표면 생성
        const positions = geometry.attributes.position;
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const y = positions.getY(i);
            const z = positions.getZ(i);
            
            // 거리에 따른 변형 강도 계산
            const distance = Math.sqrt(x * x + y * y + z * z);
            const deformation = Math.sin(distance * 3) * 0.4; // 변형 강도 증가
            
            // 각 축별로 다른 변형 적용
            const xDeform = deformation * (1 + Math.sin(y * 2) * 0.3);
            const yDeform = deformation * (1 + Math.sin(z * 2) * 0.3);
            const zDeform = deformation * (1 + Math.sin(x * 2) * 0.3);
            
            positions.setXYZ(
                i,
                x * (1 + xDeform),
                y * (1 + yDeform),
                z * (1 + zDeform)
            );
        }
        positions.needsUpdate = true;

        // 엣지 지오메트리 생성
        const edges = new THREE.EdgesGeometry(geometry);
        const lineMaterial = new THREE.LineBasicMaterial({ 
            color: 0x303030,
            linewidth: 2
        });
        const edgeLines = new THREE.LineSegments(edges, lineMaterial);
        
        // 바위 재질 생성 (더 짙은 회색)
        const material = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 0.9,
            metalness: 0.1,
            bumpScale: 1.0,
            wireframe: false
        });

        // 메시 생성
        this.mesh = new THREE.Group();
        const rockMesh = new THREE.Mesh(geometry, material);
        rockMesh.castShadow = true;
        rockMesh.receiveShadow = true;
        
        this.mesh.add(rockMesh);
        this.mesh.add(edgeLines);
        
        this.mesh.position.copy(this.options.position);
        this.mesh.rotation.copy(this.options.rotation);

        // 충돌체 생성
        this.collider = new THREE.Box3().setFromObject(this.mesh);

        // 씬에 추가
        scene.add(this.mesh);

        return this;
    }

    getHeightAt(x, z) {
        if (!this.mesh) return 0;
        
        const localX = x - this.mesh.position.x;
        const localZ = z - this.mesh.position.z;
        
        // 구형 지형의 높이 계산
        const distance = Math.sqrt(localX * localX + localZ * localZ);
        const maxRadius = this.options.size.width / 2;
        
        if (distance > maxRadius) return 0;
        
        // 구형 지형의 높이 계산
        const height = this.options.size.height * 
            Math.sqrt(1 - (distance / maxRadius) * (distance / maxRadius));
        
        return this.mesh.position.y + height;
    }
}

export default RockIsland; 