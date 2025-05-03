import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

class World {
    constructor() {
        // 기본 Three.js 설정
        this.scene = new THREE.Scene();
        this.camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.clock = new THREE.Clock();
        
        // 컴포넌트 저장
        this.components = {};
        
        // 엔티티 저장
        this.entities = [];
        
        // 기본 설정
        this.init();
    }
    
    init() {
        // 렌더러 설정
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // 카메라 위치 설정
        this.camera.position.set(50, 30, 50);
        this.camera.lookAt(0, 0, 0);
        
        // 컨트롤 추가
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 1000; // 카메라 최대 거리 제한
        
        // 이벤트 리스너 등록
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    // 컴포넌트 등록
    addComponent(name, component) {
        this.components[name] = component;
        return this;
    }
    
    // 엔티티 등록
    addEntity(entity) {
        this.entities.push(entity);
        if (entity.mesh) {
            this.scene.add(entity.mesh);
        }
        return this;
    }
    
    // 엔티티 제거
    removeEntity(entity) {
        const index = this.entities.indexOf(entity);
        if (index !== -1) {
            this.entities.splice(index, 1);
            if (entity.mesh) {
                this.scene.remove(entity.mesh);
            }
        }
        return this;
    }
    
    // 월드 업데이트
    update() {
        const time = this.clock.getElapsedTime();
        
        // 컴포넌트 업데이트
        for (const name in this.components) {
            const component = this.components[name];
            if (component && typeof component.update === 'function') {
                component.update(time);
            }
        }
        
        // 엔티티 업데이트
        for (const entity of this.entities) {
            if (typeof entity.update === 'function') {
                // 바다 컴포넌트가 있으면 파도 정보를 엔티티에 전달
                entity.update(time, this.components.ocean);
            }
        }
        
        // 컨트롤 업데이트
        this.controls.update();
    }
    
    // 렌더링
    render() {
        this.renderer.render(this.scene, this.camera);
    }
    
    // 애니메이션 루프
    animate() {
        requestAnimationFrame(this.animate.bind(this));
        
        this.update();
        this.render();
    }
    
    // 애니메이션 시작
    start() {
        this.animate();
        return this;
    }
    
    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();
        this.renderer.setSize(window.innerWidth, window.innerHeight);
    }
}

export default World; 