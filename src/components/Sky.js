import * as THREE from 'three';

class Sky {
    constructor(options = {}) {
        this.radius = options.radius || 1000;
        this.sky = null;
        
        // 하늘 색상 설정 - 더 밝은 하늘색으로 변경
        this.topColor = options.topColor || new THREE.Color(0x4499ff); // 더 밝은 하늘색
        this.bottomColor = options.bottomColor || new THREE.Color(0xaaddff); // 수평선 주변 색상
        this.exponent = options.exponent || 0.5;
        this.fogColor = options.fogColor || new THREE.Color(0x88bbff); // 안개 색상
        this.fogDensity = options.fogDensity || 0.0005;
    }
    
    create(scene) {
        this.createSkybox(scene);
        
        // 안개 추가 (수평선 효과)
        scene.fog = new THREE.FogExp2(this.fogColor, this.fogDensity);
        
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
    
    update(time) {
        // 여기에 하늘 관련 애니메이션이 필요하면 추가
    }
}

export default Sky; 