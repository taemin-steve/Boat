import * as THREE from 'three';

class Island {
    constructor(options = {}) {
        this.options = {
            position: options.position || new THREE.Vector3(0, 0, 0),
            size: options.size || { width: 50, height: 20, depth: 50 },
            rotation: options.rotation || new THREE.Euler(0, 0, 0),
            ...options
        };

        this.mesh = null;
        this.collider = null;
    }

    create(scene) {
        // 기본 섬 지오메트리 생성
        const geometry = new THREE.BoxGeometry(
            this.options.size.width,
            this.options.size.height,
            this.options.size.depth
        );
        
        // 기본 재질 생성
        const material = new THREE.MeshStandardMaterial({
            color: 0x808080,
            roughness: 0.8,
            metalness: 0.2
        });

        // 메시 생성
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.options.position);
        this.mesh.rotation.copy(this.options.rotation);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // 충돌체 생성
        this.collider = new THREE.Box3().setFromObject(this.mesh);

        // 씬에 추가
        scene.add(this.mesh);

        return this;
    }

    update(time) {
        // 기본 업데이트 로직
        if (this.mesh) {
            // 충돌체 업데이트
            this.collider.setFromObject(this.mesh);
        }
    }

    // 섬의 특정 지점 높이 반환
    getHeightAt(x, z) {
        if (!this.mesh) return 0;
        
        const localX = x - this.mesh.position.x;
        const localZ = z - this.mesh.position.z;
        
        // 기본적으로 섬의 최대 높이 반환
        return this.mesh.position.y + this.options.size.height / 2;
    }

    // 섬과의 충돌 체크
    checkCollision(object) {
        if (!this.collider || !object.collider) return false;
        return this.collider.intersectsBox(object.collider);
    }
}

export default Island;
