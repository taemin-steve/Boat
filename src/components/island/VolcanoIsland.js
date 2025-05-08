import * as THREE from 'three';
import Island from './island';

class VolcanoIsland extends Island {
    constructor(options = {}) {
        super(options);
        this.particleSystem = null;
        this.eruptionActive = false;
        this.eruptionTimer = 0;
        this.eruptionInterval = 7; // 7초마다 분출
        this.eruptionDuration = 5; // 5초 동안 분출
        this.particles = [];
    }

    create(scene) {
        // 화산섬의 지오메트리 생성
        const geometry = new THREE.ConeGeometry(
            this.options.size.width / 2,
            this.options.size.height,
            32
        );
        
        // 화산섬 재질 생성
        const material = new THREE.MeshStandardMaterial({
            color: 0x8B4513,
            roughness: 0.9,
            metalness: 0.1
        });

        // 메시 생성
        this.mesh = new THREE.Mesh(geometry, material);
        this.mesh.position.copy(this.options.position);
        this.mesh.rotation.copy(this.options.rotation);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;

        // 용암 분출 효과 생성
        this.createLavaEffect(scene);

        // 충돌체 생성
        this.collider = new THREE.Box3().setFromObject(this.mesh);

        // 씬에 추가
        scene.add(this.mesh);

        return this;
    }

    createLavaEffect(scene) {
        // 용암 입자 시스템 생성
        const particleCount = 200;
        const particleGeometry = new THREE.BufferGeometry();
        const particlePositions = new Float32Array(particleCount * 3);
        const particleSizes = new Float32Array(particleCount);
        const particleOpacities = new Float32Array(particleCount);

        // 초기화
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            particlePositions[i3] = 0;
            particlePositions[i3 + 1] = 0;
            particlePositions[i3 + 2] = 0;
            particleSizes[i] = 0;
            particleOpacities[i] = 0;
        }

        particleGeometry.setAttribute('position', new THREE.BufferAttribute(particlePositions, 3));
        particleGeometry.setAttribute('size', new THREE.BufferAttribute(particleSizes, 1));
        particleGeometry.setAttribute('opacity', new THREE.BufferAttribute(particleOpacities, 1));

        // 용암 재질
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff4500,
            size: 1,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            sizeAttenuation: true
        });

        this.particleSystem = new THREE.Points(particleGeometry, particleMaterial);
        this.particleSystem.position.copy(this.mesh.position);
        scene.add(this.particleSystem);

        // 용암 빛 효과
        const lavaLight = new THREE.PointLight(0xff4500, 2, 100);
        lavaLight.position.copy(this.mesh.position);
        lavaLight.position.y += this.options.size.height * 0.8;
        scene.add(lavaLight);
        this.lavaLight = lavaLight;
    }

    createParticles() {
        const positions = this.particleSystem.geometry.attributes.position.array;
        const sizes = this.particleSystem.geometry.attributes.size.array;
        const opacities = this.particleSystem.geometry.attributes.opacity.array;
        
        this.particles = [];
        
        // 화산 꼭대기 위치 계산
        const topPosition = new THREE.Vector3(0, this.options.size.height/2, 0);
        topPosition.applyQuaternion(this.mesh.quaternion);
        topPosition.add(this.mesh.position);
        
        for (let i = 0; i < positions.length; i += 3) {
            // 화산 꼭대기에서 랜덤한 위치 생성
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 5;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // 로컬 좌표를 월드 좌표로 변환
            const localPos = new THREE.Vector3(x, 0, z);
            localPos.applyQuaternion(this.mesh.quaternion);
            localPos.add(topPosition);
            
            positions[i] = localPos.x - this.mesh.position.x;
            positions[i + 1] = localPos.y - this.mesh.position.y;
            positions[i + 2] = localPos.z - this.mesh.position.z;
            
            // 랜덤한 속도 할당 (로컬 좌표계 기준)
            const speed = 2 + Math.random() * 3;
            const angle2 = Math.random() * Math.PI * 2;
            const spread = Math.random() * 0.5;
            
            const velocity = new THREE.Vector3(
                Math.cos(angle2) * spread,
                speed,
                Math.sin(angle2) * spread
            );
            velocity.applyQuaternion(this.mesh.quaternion);
            
            this.particles.push({
                velocity: velocity,
                size: 2 + Math.random() * 3,
                opacity: 1.0,
                active: true
            });
            
            sizes[i/3] = this.particles[i/3].size;
            opacities[i/3] = 1.0;
        }
        
        this.particleSystem.geometry.attributes.position.needsUpdate = true;
        this.particleSystem.geometry.attributes.size.needsUpdate = true;
        this.particleSystem.geometry.attributes.opacity.needsUpdate = true;
    }

    update(time) {
        super.update(time);

        // 분출 타이머 업데이트
        this.eruptionTimer += 0.016;

        // 분출 상태 전환
        if (!this.eruptionActive && this.eruptionTimer >= this.eruptionInterval) {
            this.eruptionActive = true;
            this.eruptionTimer = 0;
            this.createParticles();
        } else if (this.eruptionActive && this.eruptionTimer >= this.eruptionDuration) {
            this.eruptionActive = false;
            this.eruptionTimer = 0;
        }

        if (this.particleSystem && this.eruptionActive) {
            const positions = this.particleSystem.geometry.attributes.position.array;
            const sizes = this.particleSystem.geometry.attributes.size.array;
            const opacities = this.particleSystem.geometry.attributes.opacity.array;
            
            let activeParticles = 0;
            
            for (let i = 0; i < positions.length; i += 3) {
                if (!this.particles[i/3].active) continue;
                
                // 입자 위치 업데이트
                positions[i] += this.particles[i/3].velocity.x;
                positions[i + 1] += this.particles[i/3].velocity.y;
                positions[i + 2] += this.particles[i/3].velocity.z;
                
                // 중력 효과
                this.particles[i/3].velocity.y -= 0.05;
                
                // 바다에 닿으면 비활성화 (월드 좌표계 기준)
                const worldY = positions[i + 1] + this.mesh.position.y;
                if (worldY <= 0) {
                    this.particles[i/3].active = false;
                    opacities[i/3] = 0;
                } else {
                    activeParticles++;
                    // 크기와 투명도 감소
                    sizes[i/3] = Math.max(0, sizes[i/3] - 0.02);
                    opacities[i/3] = Math.max(0, opacities[i/3] - 0.01);
                }
            }
            
            this.particleSystem.geometry.attributes.position.needsUpdate = true;
            this.particleSystem.geometry.attributes.size.needsUpdate = true;
            this.particleSystem.geometry.attributes.opacity.needsUpdate = true;
            
            // 용암 빛 효과 업데이트
            if (this.lavaLight) {
                this.lavaLight.intensity = activeParticles > 0 ? 
                    (2 + Math.sin(time * 2) * 0.5) : 
                    Math.max(0, this.lavaLight.intensity - 0.1);
            }
        }
    }
}

export default VolcanoIsland; 