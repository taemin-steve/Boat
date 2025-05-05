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
        this.mainShip = null; // 메인 선박 참조 저장
        
        // 기본 설정
        this.init();
    }
    
    init() {
        // 렌더러 설정
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        document.body.appendChild(this.renderer.domElement);
        
        // 카메라 위치 설정 - 더 넓은 시야를 위해 높이와 거리 조정
        this.camera.position.set(50, 40, 70);
        this.camera.lookAt(0, 0, 0);
        
        // 컨트롤 추가
        this.controls = new OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.maxDistance = 1000; // 카메라 최대 거리 제한
        
        // 우클릭 비활성화 (우클릭 이벤트가 다른 이벤트 핸들러에 전달되도록)
        this.controls.mouseButtons = {
            LEFT: THREE.MOUSE.ROTATE,
            MIDDLE: THREE.MOUSE.DOLLY
        };
        
        // 이벤트 리스너 등록
        window.addEventListener('resize', this.onWindowResize.bind(this));
    }
    
    // 메인 선박 설정
    setMainShip(ship) {
        this.mainShip = ship;
        this.addEntity(ship);
        return this;
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
    
    // 일렬로 배치된 추가 드론 생성
    createDroneFleet(ShipFactory, count, spacing, options = {}) {
        // this.mainShip 체크는 제거하고 진행
        
        const defaultOptions = {
            basePosition: new THREE.Vector3(0, 0, -spacing), // 시작 위치
            direction: 0, // 기본 방향 (z+ 방향)
            movementType: 'auto',
            bouyancyRange: { min: 1.2, max: 1.4 },
            pitchRange: { min: 0.8, max: 0.9 },
            rollRange: { min: 0.7, max: 0.9 },
            sizeScaleRange: { min: 0.8, max: 1.1 }
        };
        
        // 기본 옵션과 사용자 옵션 병합
        const finalOptions = { ...defaultOptions, ...options };
        
        // 생성된 드론 저장 배열
        const createdDrones = [];
        
        // 드론 생성
        for (let i = 0; i < count; i++) {
            // 일렬 배치 좌표 계산 (메인 드론 뒤에 일정 간격으로)
            const position = new THREE.Vector3(
                finalOptions.basePosition.x,
                finalOptions.basePosition.y, 
                finalOptions.basePosition.z - (i + 1) * spacing
            );
            
            // 크기 스케일 (다양성 추가)
            const sizeScale = finalOptions.sizeScaleRange.min + 
                Math.random() * (finalOptions.sizeScaleRange.max - finalOptions.sizeScaleRange.min);
            
            // 다양한 물리적 특성 계산
            const bouyancyFactor = finalOptions.bouyancyRange.min + 
                Math.random() * (finalOptions.bouyancyRange.max - finalOptions.bouyancyRange.min);
            
            const pitchFactor = finalOptions.pitchRange.min + 
                Math.random() * (finalOptions.pitchRange.max - finalOptions.pitchRange.min);
            
            const rollFactor = finalOptions.rollRange.min + 
                Math.random() * (finalOptions.rollRange.max - finalOptions.rollRange.min);
            
            // 드론 생성
            const drone = ShipFactory.createShip('drone', {
                position: position,
                size: { 
                    length: 12 * sizeScale, 
                    width: 6 * sizeScale, 
                    height: 3 * sizeScale 
                },
                bouyancyFactor: bouyancyFactor,
                pitchFactor: pitchFactor,
                rollFactor: rollFactor,
                movementType: finalOptions.movementType
            });
            
            // 초기 방향 설정
            drone.direction = finalOptions.direction;
            
            // 배열에만 추가하고, 월드에는 아직 추가하지 않음
            createdDrones.push(drone);
            
            // 콘솔에 드론 생성 로그
            console.log(`드론 #${i+1} 생성: 위치(${position.x.toFixed(1)}, ${position.y.toFixed(1)}, ${position.z.toFixed(1)})`);
        }
        
        return createdDrones;
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