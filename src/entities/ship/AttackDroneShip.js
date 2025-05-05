import * as THREE from 'three';
import Ship from './Ship.js';

/**
 * 공격용 드론 선박 클래스 - Ship의 구체적인 구현
 */
class AttackDroneShip extends Ship {
    constructor(options = {}) {
        // 공격용 드론 선박의 기본 속성 설정
        const droneShipOptions = {
            ...options,
            size: options.size || { length: 12, width: 6, height: 3 },
            color: options.color || 0xFFD580, // 밝은 주황색
            speed: options.speed || 0.2,
            bouyancyFactor: options.bouyancyFactor || 1.2, // 높은 부력 (빠르게 파도 위에 떠있음)
            pitchFactor: options.pitchFactor || 0.9,       // 낮은 피치 (안정적인 선체)
            rollFactor: options.rollFactor || 0.8          // 낮은 롤링 (안정적인 선체)
        };
        
        super(droneShipOptions);
        
        // 공격용 드론 선박에 특화된 추가 속성
        this.weaponState = options.weaponState || 'ready'; // ready, charging, firing
        this.weaponChargeLevel = 0;
        this.maxWeaponCharge = 100;
        this.weaponColor = options.weaponColor || 0x00FFFF; // 청록색 무기 효과
        
        // EOIR 카메라 조작 관련 속성 (먼저 초기화)
        this.eoirControls = {
            panSpeed: 0.007,       // 패닝 속도
            tiltSpeed: 0.007,      // 틸트 속도
            minFOV: 10,           // 최소 FOV (최대 줌인)
            maxFOV: 60,           // 최대 FOV (최소 줌인)
            defaultFOV: 40,       // 기본 FOV
            zoomSpeed: 0.5,         // 줌 속도
            keys: {               // 키 상태
                panLeft: false,   // A
                panRight: false,  // D
                tiltUp: false,    // W
                tiltDown: false,  // S
                zoomIn: false,    // Q
                zoomOut: false    // E
            },
            limits: {             // 회전 한계
                minPan: -Math.PI * 2,  // 좌측 회전 한계
                maxPan: Math.PI * 2,   // 우측 회전 한계
                minTilt: -Math.PI * 2, // 하단 회전 한계
                maxTilt: Math.PI * 2   // 상단 회전 한계
            },
            currentRotation: {    // 현재 회전 상태
                pan: 0,           // 수평 회전 (좌우)
                tilt: 0           // 수직 회전 (상하)
            }
        };
        
        // 카메라 설정
        this.shipCamera = null;
        this.cameraHelper = null;
        this.setupShipCamera();
        
        // EOIR 카메라 설정
        this.eoirCamera = null;
        this.eoirCameraHelper = null;
        this.setupEOIRCamera();
        
        // EOIR 카메라 키보드 이벤트 설정
        this.setupEOIRCameraControls();
    }
    
    // 선박 카메라 설정
    setupShipCamera() {
        // 넓은 FOV를 가진 카메라 (90도)
        this.shipCamera = new THREE.PerspectiveCamera(90, window.innerWidth / window.innerHeight, 0.1, 10000);
        
        // 카메라 헬퍼 생성 (디버깅용, 필요시 활성화)
        this.cameraHelper = new THREE.CameraHelper(this.shipCamera);
        this.cameraHelper.visible = false; // 기본적으로 보이지 않게 설정
    }
    
    // EOIR 카메라 설정
    setupEOIRCamera() {
        // EOIR 카메라 - 좁은 FOV로 시작
        this.eoirCamera = new THREE.PerspectiveCamera(
            this.eoirControls.defaultFOV, 
            window.innerWidth / window.innerHeight,
            0.1, 
            10000
        );
        
        // 디버깅용 카메라 헬퍼
        this.eoirCameraHelper = new THREE.CameraHelper(this.eoirCamera);
        this.eoirCameraHelper.visible = false;
    }
    
    // EOIR 카메라 키보드 컨트롤 설정
    setupEOIRCameraControls() {
        // 키 다운 이벤트 - 이벤트 버블링 단계가 아닌 캡처 단계에서 이벤트 처리
        window.addEventListener('keydown', (event) => {
            console.log(`키 입력 감지: ${event.key}`);
            switch (event.key.toLowerCase()) {
                case 'a':
                    this.eoirControls.keys.panLeft = true;
                    event.preventDefault();
                    break;
                case 'd':
                    this.eoirControls.keys.panRight = true;
                    event.preventDefault();
                    break;
                case 'w':
                    this.eoirControls.keys.tiltUp = true;
                    event.preventDefault();
                    break;
                case 's':
                    this.eoirControls.keys.tiltDown = true;
                    event.preventDefault();
                    break;
                case 'q':
                    this.eoirControls.keys.zoomIn = true;
                    event.preventDefault();
                    break;
                case 'e':
                    this.eoirControls.keys.zoomOut = true;
                    event.preventDefault();
                    break;
            }
        }, true); // true는 캡처 단계에서 이벤트를 처리함
        
        // 키 업 이벤트 - 이벤트 버블링 단계가 아닌 캡처 단계에서 이벤트 처리
        window.addEventListener('keyup', (event) => {
            switch (event.key.toLowerCase()) {
                case 'a':
                    this.eoirControls.keys.panLeft = false;
                    event.preventDefault();
                    break;
                case 'd':
                    this.eoirControls.keys.panRight = false;
                    event.preventDefault();
                    break;
                case 'w':
                    this.eoirControls.keys.tiltUp = false;
                    event.preventDefault();
                    break;
                case 's':
                    this.eoirControls.keys.tiltDown = false;
                    event.preventDefault();
                    break;
                case 'q':
                    this.eoirControls.keys.zoomIn = false;
                    event.preventDefault();
                    break;
                case 'e':
                    this.eoirControls.keys.zoomOut = false;
                    event.preventDefault();
                    break;
            }
        }, true); // true는 캡처 단계에서 이벤트를 처리함
    }
    
    // 카메라 헬퍼를 씬에 추가
    addCameraHelperToScene(scene) {
        if (scene) {
            if (this.cameraHelper) {
                scene.add(this.cameraHelper);
            }
            if (this.eoirCameraHelper) {
                scene.add(this.eoirCameraHelper);
            }
        }
    }
    
    // 카메라 헬퍼 토글 (디버깅용)
    toggleCameraHelper() {
        if (this.cameraHelper) {
            this.cameraHelper.visible = !this.cameraHelper.visible;
        }
        if (this.eoirCameraHelper) {
            this.eoirCameraHelper.visible = !this.eoirCameraHelper.visible;
        }
    }
    
    // 선박 카메라 업데이트 (선박의 움직임에 따라 카메라도 업데이트)
    updateCamera() {
        if (!this.shipCamera || !this.mesh) return;
        
        // 선박 위치와 방향 가져오기
        const position = this.mesh.position.clone();
        const direction = this.direction;
        
        // 선수 방향으로 약간 앞쪽, 높이는 선체 위에 위치
        const cameraOffsetForward = 2; // 선수로부터 전방 오프셋
        const cameraHeight = 1.5;      // 선체 위 높이
        
        // 카메라 위치 계산 (선수 방향으로)
        // z+ 방향이 선수 방향이므로 그에 맞게 계산
        position.x += Math.sin(direction) * cameraOffsetForward;
        position.z += Math.cos(direction) * cameraOffsetForward;
        position.y += cameraHeight + this.size.height / 2;
        
        // 카메라 위치 설정
        this.shipCamera.position.copy(position);
        
        // 카메라가 바라보는 방향 설정 (선수 앞쪽 30 유닛)
        const lookAtPoint = new THREE.Vector3(
            position.x + Math.sin(direction) * 30,
            position.y,
            position.z + Math.cos(direction) * 30
        );
        
        this.shipCamera.lookAt(lookAtPoint);
        
        // 카메라 헬퍼 업데이트
        if (this.cameraHelper) {
            this.cameraHelper.update();
        }
        
        // EOIR 카메라 업데이트
        this.updateEOIRCamera();
    }
    
    // EOIR 카메라 업데이트
    updateEOIRCamera() {
        if (!this.eoirCamera || !this.mesh) return;
        
        // 키 입력에 따른 EOIR 카메라 제어
        this.processEOIRCameraInput();
        
        // 선박 위치와 방향 가져오기
        const position = this.mesh.position.clone();
        const direction = this.direction;
        
        // 운항용 카메라와 완전히 같은 위치에 EOIR 카메라 배치 (선체에 부착된 형태)
        const cameraOffsetForward = 2; // 선수로부터 전방 오프셋 (운항용 카메라와 동일)
        const cameraHeight = 10;      // 선체 위 높이 (운항용 카메라와 동일)
        
        // EOIR 카메라 위치 설정 (운항용 카메라와 동일한 위치)
        position.x += Math.sin(direction) * cameraOffsetForward;
        position.z += Math.cos(direction) * cameraOffsetForward;
        position.y += cameraHeight + this.size.height / 2;
        
        this.eoirCamera.position.copy(position);
        
        // 카메라 기본 방향 설정 (배의 z+ 방향과 같은 방향)
        const lookAtPoint = new THREE.Vector3(
            position.x + Math.sin(direction) * 30,
            position.y,
            position.z + Math.cos(direction) * 30
        );
        
        // 틸트와 팬 각도에 따른 조정
        const rotatedOffset = new THREE.Vector3(0, 0, 30); // 기본 z+ 방향을 바라봄
        
        // 틸트 (X축 회전) 적용
        rotatedOffset.applyAxisAngle(new THREE.Vector3(1, 0, 0), this.eoirControls.currentRotation.tilt);
        
        // 팬 (Y축 회전) 적용
        rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), this.eoirControls.currentRotation.pan);
        
        // 배 방향 회전 적용 (Y축)
        rotatedOffset.applyAxisAngle(new THREE.Vector3(0, 1, 0), direction);
        
        // 카메라가 바라보는 방향 설정
        const finalLookPoint = new THREE.Vector3().addVectors(this.eoirCamera.position, rotatedOffset);
        this.eoirCamera.lookAt(finalLookPoint);
        
        // 카메라 헬퍼 업데이트
        if (this.eoirCameraHelper) {
            this.eoirCameraHelper.update();
        }
    }
    
    // EOIR 카메라 입력 처리
    processEOIRCameraInput() {
        const controls = this.eoirControls;
        
        // 좌우 회전 (Pan)
        if (controls.keys.panLeft) {
            controls.currentRotation.pan = Math.max(
                controls.currentRotation.pan + controls.panSpeed,
                controls.limits.minPan
            );
        }
        if (controls.keys.panRight) {
            controls.currentRotation.pan = Math.min(
                controls.currentRotation.pan - controls.panSpeed,
                controls.limits.maxPan
            );
        }
        
        // 상하 회전 (Tilt) - 방향 반대로 수정
        if (controls.keys.tiltUp) {
            controls.currentRotation.tilt = Math.min(
                controls.currentRotation.tilt - controls.tiltSpeed, // 부호 변경
                controls.limits.maxTilt
            );
        }
        if (controls.keys.tiltDown) {
            controls.currentRotation.tilt = Math.max(
                controls.currentRotation.tilt + controls.tiltSpeed, // 부호 변경
                controls.limits.minTilt
            );
        }
        
        // 줌 인/아웃 (FOV를 반대로 설정하여 직관적인 동작으로 수정)
        if (controls.keys.zoomIn) {
            this.eoirCamera.fov = Math.max(
                this.eoirCamera.fov - controls.zoomSpeed, // 부호 변경
                controls.minFOV
            );
            this.eoirCamera.updateProjectionMatrix();
        }
        if (controls.keys.zoomOut) {
            this.eoirCamera.fov = Math.min(
                this.eoirCamera.fov + controls.zoomSpeed, // 부호 변경
                controls.maxFOV
            );
            this.eoirCamera.updateProjectionMatrix();
        }
    }
    
    // 선박 카메라 설정 업데이트 (해상도 변경 등)
    updateCameraAspect(width, height) {
        if (this.shipCamera) {
            this.shipCamera.aspect = width / height;
            this.shipCamera.updateProjectionMatrix();
        }
        if (this.eoirCamera) {
            this.eoirCamera.aspect = width / height;
            this.eoirCamera.updateProjectionMatrix();
        }
    }
    
    // Template Method 패턴의 구체적인 구현
    createShipMesh() {
        const { length, width, height } = this.size;
        
        // 선체 형태 생성
        const shipMesh = new THREE.Group();
        
        // 기본 선체 - 날카로운 형태 (선수=앞쪽이 z+ 방향)
        const hullShape = new THREE.Shape();
        hullShape.moveTo(0, width / 2);              // 오른쪽 중간에서 시작
        hullShape.lineTo(length, 0);                 // 선수 끝점 (x+ 방향)
        hullShape.lineTo(0, -width / 2);             // 왼쪽 중간
        hullShape.lineTo(-length * 0.7, -width / 2); // 왼쪽 선미
        hullShape.lineTo(-length * 0.7, width / 2);  // 오른쪽 선미
        hullShape.lineTo(0, width / 2);              // 시작점으로 닫기
    
        const hullGeometry = new THREE.ExtrudeGeometry(hullShape, {
            depth: height * 0.7,
            bevelEnabled: true,
            bevelThickness: height * 0.15,
            bevelSize: 0.5,
            bevelSegments: 3
        });
    
        // Z+ 방향이 선수 방향이 되도록 눕힘 (Y → Z extrusion)
        hullGeometry.rotateX(Math.PI / 2);
        hullGeometry.rotateY(-Math.PI / 2);
        // rotateY(Math.PI) 제거 → 이제 실제 선수는 z+ 방향이 됨
    
        const hullMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            shininess: 60
        });
    
        const hull = new THREE.Mesh(hullGeometry, hullMaterial);
        hull.position.y = -height * 0.2;
        shipMesh.add(hull);
    
        // 상부 구조물
        const upperDeckGeometry = new THREE.BoxGeometry(width * 0.6, height * 0.6, length * 0.3);
        const upperDeckMaterial = new THREE.MeshPhongMaterial({ color: 0x333333 });
        const upperDeck = new THREE.Mesh(upperDeckGeometry, upperDeckMaterial);
        upperDeck.position.set(0, height * 0.3, length * 0.3);
        shipMesh.add(upperDeck);
    
        // 무기
        const weaponGeometry = new THREE.CylinderGeometry(width * 0.12, width * 0.1, length * 0.4, 8);
        const weaponMaterial = new THREE.MeshPhongMaterial({ color: 0x222222 });
        const weapon = new THREE.Mesh(weaponGeometry, weaponMaterial);
        weapon.rotation.x = Math.PI / 2;
        weapon.position.set(0, height * 0.2, length * 0.5);
        shipMesh.add(weapon);
    
        // 무기 에너지 표시등
        const energyGlowGeometry = new THREE.RingGeometry(width * 0.05, width * 0.08, 16);
        const energyGlowMaterial = new THREE.MeshBasicMaterial({ 
            color: this.weaponColor,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.8
        });
        const energyGlow = new THREE.Mesh(energyGlowGeometry, energyGlowMaterial);
        energyGlow.rotation.x = Math.PI / 2;
        energyGlow.position.set(0, height * 0.2, length * 0.7);
        shipMesh.add(energyGlow);
        this.weaponGlow = energyGlow;
    
        // 안테나
        const antennaGeometry = new THREE.CylinderGeometry(0.05, 0.05, height * 1.5, 4);
        const antennaMaterial = new THREE.MeshPhongMaterial({ color: 0x888888 });
        const antenna = new THREE.Mesh(antennaGeometry, antennaMaterial);
        antenna.position.set(0, height * 1, -length * 0.3);
        shipMesh.add(antenna);
    
        // 운항용 카메라 하우징
        const cameraHousingGeometry = new THREE.SphereGeometry(width * 0.1, 8, 8);
        const cameraHousingMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const cameraHousing = new THREE.Mesh(cameraHousingGeometry, cameraHousingMaterial);
        cameraHousing.position.set(0, height * 0.3, length * 0.85);
        shipMesh.add(cameraHousing);
        
        // EOIR 카메라 시각적 모델 제거 - 실제 카메라는 코드 상으로만 존재하고 시각적 모델은 표시하지 않음
    
        // 안정기 날개
        this.addStabilizers(shipMesh);
    
        return shipMesh;
    }
    
    // 안정기 날개 추가
    addStabilizers(shipMesh) {
        const { length, width, height } = this.size;
        
        // 날개 형태
        const stabilizerShape = new THREE.Shape();
        stabilizerShape.moveTo(0, 0);
        stabilizerShape.lineTo(length * 0.25, height * 0.6);
        stabilizerShape.lineTo(length * 0.5, height * 0.6);
        stabilizerShape.lineTo(0, 0);
        
        const stabilizerGeometry = new THREE.ShapeGeometry(stabilizerShape);
        const stabilizerMaterial = new THREE.MeshPhongMaterial({ 
            color: this.color,
            side: THREE.DoubleSide
        });
        
        // 왼쪽 안정기
        const leftStabilizer = new THREE.Mesh(stabilizerGeometry, stabilizerMaterial);
        leftStabilizer.rotation.z = Math.PI / 2;
        leftStabilizer.rotation.y = Math.PI / 2;
        leftStabilizer.position.set(-width * 0.4, -height * 0.3, -length * 0.2);
        shipMesh.add(leftStabilizer);
        
        // 오른쪽 안정기
        const rightStabilizer = new THREE.Mesh(stabilizerGeometry.clone(), stabilizerMaterial);
        rightStabilizer.rotation.z = -Math.PI / 2;
        rightStabilizer.rotation.y = Math.PI / 2;
        rightStabilizer.position.set(width * 0.4, -height * 0.3, -length * 0.2);
        shipMesh.add(rightStabilizer);
    }
    
    // 상위 클래스의 update 메서드 오버라이드
    update(time, ocean) {
        super.update(time, ocean); // 부모 클래스의 update 호출
        
        // 카메라 업데이트
        this.updateCamera();
    }
}

export default AttackDroneShip; 