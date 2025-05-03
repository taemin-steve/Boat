import * as THREE from 'three';

class Lighting {
    constructor(options = {}) {
        this.sunLightColor = options.sunLightColor || 0xffffaa;
        this.sunLightIntensity = options.sunLightIntensity || 1.5;
        this.sunPosition = options.sunPosition || new THREE.Vector3(500, 300, 500);
        this.ambientLightColor = options.ambientLightColor || 0xffffff;
        this.ambientLightIntensity = options.ambientLightIntensity || 0.5;
        
        this.sunLight = null;
        this.ambientLight = null;
    }
    
    create(scene) {
        // 환경광
        this.ambientLight = new THREE.AmbientLight(
            this.ambientLightColor, 
            this.ambientLightIntensity
        );
        scene.add(this.ambientLight);
        
        // 태양 (주 광원)
        this.sunLight = new THREE.DirectionalLight(
            this.sunLightColor, 
            this.sunLightIntensity
        );
        this.sunLight.position.copy(this.sunPosition);
        this.sunLight.castShadow = true;
        
        // 그림자 품질 설정
        this.sunLight.shadow.mapSize.width = 2048;
        this.sunLight.shadow.mapSize.height = 2048;
        this.sunLight.shadow.camera.near = 0.5;
        this.sunLight.shadow.camera.far = 1000;
        this.sunLight.shadow.camera.left = -500;
        this.sunLight.shadow.camera.right = 500;
        this.sunLight.shadow.camera.top = 500;
        this.sunLight.shadow.camera.bottom = -500;
        
        scene.add(this.sunLight);
        
        return this;
    }
    
    update(time) {
        // 여기에 조명 애니메이션이 필요하면 추가
        // 예: 태양 위치 변경, 시간에 따른 밝기 조절 등
    }
}

export default Lighting; 