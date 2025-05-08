import * as THREE from 'three';
import Cloud from './Cloud';

class Sky {
    constructor(options = {}) {
        this.radius = options.radius || 2000;
        this.sky = null;
        
        // 하늘 색상 설정 - 더 밝은 하늘색으로 변경
        this.topColor = options.topColor || new THREE.Color(0x4499ff); // 더 밝은 하늘색
        this.bottomColor = options.bottomColor || new THREE.Color(0xaaddff); // 수평선 주변 색상
        this.exponent = options.exponent || 0.5;
        this.fogColor = options.fogColor || new THREE.Color(0x88bbff); // 안개 색상
        this.fogDensity = options.fogDensity || 0.0005;
        
        // 구름 설정
        this.clouds = [];
        this.cloudCount = options.cloudCount || 10;
    }
    
    create(scene) {
        this.createSkybox(scene);
        
        // 안개 추가 (수평선 효과)
        scene.fog = new THREE.FogExp2(this.fogColor, this.fogDensity);
        
        // 구름 생성
        this.createClouds(scene);
        
        return this;
    }
    
    createSkybox(scene) {
        // 셰이더 기반 그라데이션 스카이박스
        const vertexShader = `
            varying vec3 vWorldPosition;
            
            void main() {
                vec4 worldPosition = modelMatrix * vec4(position, 1.0);
                vWorldPosition = worldPosition.xyz;
                gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
            }
        `;
        
        const fragmentShader = `
            uniform vec3 topColor;
            uniform vec3 bottomColor;
            uniform float offset;
            uniform float exponent;
            
            varying vec3 vWorldPosition;
            
            void main() {
                float h = normalize(vWorldPosition + offset).y;
                gl_FragColor = vec4(mix(bottomColor, topColor, max(pow(max(h, 0.0), exponent), 0.0)), 1.0);
            }
        `;
        
        const uniforms = {
            topColor: { value: this.topColor },
            bottomColor: { value: this.bottomColor },
            offset: { value: 400 },
            exponent: { value: this.exponent }
        };
        
        const skyGeo = new THREE.SphereGeometry(this.radius, 32, 32);
        const skyMat = new THREE.ShaderMaterial({
            uniforms: uniforms,
            vertexShader: vertexShader,
            fragmentShader: fragmentShader,
            side: THREE.BackSide
        });
        
        this.sky = new THREE.Mesh(skyGeo, skyMat);
        scene.add(this.sky);
        
        // 태양 효과 (간단한 빛나는 구) 추가
        const sunGeometry = new THREE.SphereGeometry(20, 16, 16);
        const sunMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffee,
            transparent: true,
            opacity: 0.8
        });
        
        this.sun = new THREE.Mesh(sunGeometry, sunMaterial);
        this.sun.position.set(500, 300, 500);
        scene.add(this.sun);
        
        // 태양 주변 빛 효과 (glow)
        const sunGlowGeometry = new THREE.SphereGeometry(30, 16, 16);
        const sunGlowMaterial = new THREE.MeshBasicMaterial({
            color: 0xffffdd,
            transparent: true,
            opacity: 0.4,
            side: THREE.BackSide
        });
        
        this.sunGlow = new THREE.Mesh(sunGlowGeometry, sunGlowMaterial);
        this.sunGlow.position.copy(this.sun.position);
        scene.add(this.sunGlow);
    }
    
    // 구름 생성 함수
    createClouds(scene) {
        // 구름 높이와 분포 범위 설정
        const bounds = {
            minX: -this.radius * 0.7,
            maxX: this.radius * 0.7,
            minZ: -this.radius * 0.7,
            maxZ: this.radius * 0.7
        };
        
        // 여러 구름 생성
        for (let i = 0; i < this.cloudCount; i++) {
            // 랜덤 위치 선택
            const position = new THREE.Vector3(
                bounds.minX + Math.random() * (bounds.maxX - bounds.minX),
                150 + Math.random() * 250, // 높이 150~400 사이
                bounds.minZ + Math.random() * (bounds.maxZ - bounds.minZ)
            );
            
            // 랜덤 크기 (작은 것부터 큰 것까지 다양하게)
            const size = {
                width: 40 + Math.random() * 80,
                height: 15 + Math.random() * 25,
                depth: 40 + Math.random() * 80
            };
            
            // 랜덤 이동 방향 (주로 서쪽에서 동쪽으로, 약간의 남북 편차)
            const direction = new THREE.Vector3(
                1 + (Math.random() * 0.4 - 0.2), // 동쪽 방향으로 약간의 변화
                0,
                Math.random() * 0.4 - 0.2        // 약간의 남북 편차
            );
            
            // 랜덤 속도 (느리게 움직이도록)
            const speed = 0.05 + Math.random() * 0.15;
            
            // 구름 생성
            const cloud = new Cloud({
                position: position,
                size: size,
                direction: direction,
                speed: speed,
                bounds: bounds
            });
            
            // 씬에 추가하고 배열에 저장
            cloud.create(scene);
            this.clouds.push(cloud);
        }
    }
    
    update(time) {
        // 구름 업데이트
        this.clouds.forEach(cloud => {
            cloud.update(time);
        });
    }
}

export default Sky; 