import * as THREE from 'three';
import World from './World';
import Ocean from './components/Ocean';
import Sky from './components/Sky';
import Lighting from './components/Lighting';
import ShipFactory from './entities/ship/ShipFactory';
import ManualMovement from './entities/ship/movement/ManualMovement';

// 전역 변수 선언
let world;
let mainShip;
let activeCamera;
let thirdPersonCamera;
let useShipCamera = true; // 기본적으로 드론 카메라 사용

// 화면 분할 변수
let splitScreenMode = true; // 분할 화면 모드 활성화
let eoirViewport = { x: 0, y: 0, width: 0, height: 0 }; // EOIR 뷰포트
let mainViewport = { x: 0, y: 0, width: 0, height: 0 }; // 메인 뷰포트

// 최상위 레벨에서 키 이벤트 리스너 등록
document.addEventListener('keydown', (event) => {
    console.log(`index.js에서 감지된 키: ${event.key}`);
    
    // EOIR 카메라 제어 키 처리 (WASD는 항상 EOIR 카메라 제어에 사용)
    if (mainShip && mainShip.eoirControls && mainShip.eoirControls.keys) {
        let eoirKeyHandled = true;
        
        switch (event.key.toLowerCase()) {
            case 'w':
                mainShip.eoirControls.keys.tiltUp = true;
                break;
            case 'a':
                mainShip.eoirControls.keys.panLeft = true;
                break;
            case 's':
                mainShip.eoirControls.keys.tiltDown = true;
                break;
            case 'd':
                mainShip.eoirControls.keys.panRight = true;
                break;
            case 'q':
                mainShip.eoirControls.keys.zoomIn = true;
                break;
            case 'e':
                mainShip.eoirControls.keys.zoomOut = true;
                break;
            default:
                eoirKeyHandled = false;
        }
        
        // EOIR 카메라 관련 키 이벤트는 배 이동에 영향을 주지 않도록 preventDefault
        if (eoirKeyHandled) {
            event.preventDefault();
            return; // 이후 코드 실행 방지
        }
    }
    
    // 배 이동 제어는 화살표 키만 사용
    if (mainShip && mainShip.movementStrategy) {
        switch (event.key) {
            case 'ArrowUp':
                mainShip.movementStrategy.keys.forward = true;
                event.preventDefault();
                break;
            case 'ArrowDown':
                mainShip.movementStrategy.keys.backward = true;
                event.preventDefault();
                break;
            case 'ArrowLeft':
                mainShip.movementStrategy.keys.left = true;
                event.preventDefault();
                break;
            case 'ArrowRight':
                mainShip.movementStrategy.keys.right = true;
                event.preventDefault();
                break;
        }
    }
    
    if (event.key === 'c' || event.key === 'C') {
        // 'C' 키를 누르면 카메라 모드 전환
        useShipCamera = !useShipCamera;
        console.log(`카메라 모드 변경: ${useShipCamera ? '드론 1인칭 시점' : '3인칭 시점'}`);
        event.preventDefault();
    }
    
    if (event.key === 'h' || event.key === 'H') {
        // 'H' 키를 누르면 카메라 헬퍼 토글
        if (mainShip && mainShip.toggleCameraHelper) {
            mainShip.toggleCameraHelper();
            console.log('카메라 헬퍼 표시 토글');
        }
        event.preventDefault();
    }
    
    if (event.key === 'f' || event.key === 'F') {
        // 'F' 키를 누르면 무기 발사 시도
        if (mainShip && mainShip.fireWeapon) {
            const fired = mainShip.fireWeapon();
            if (fired) {
                console.log('무기 발사 성공!');
            } else {
                console.log('무기가 충전 중이거나 준비되지 않았습니다.');
            }
        }
        event.preventDefault();
    }
    
    if (event.key === 'r' || event.key === 'R') {
        // 'R' 키를 누르면 무기 충전
        if (mainShip && mainShip.chargeWeapon) {
            mainShip.chargeWeapon(20); // 20% 충전
            console.log('무기 충전 중...');
        }
        event.preventDefault();
    }
    
    if (event.key === 'v' || event.key === 'V') {
        // 'V' 키를 누르면 분할 화면 모드 토글
        splitScreenMode = !splitScreenMode;
        console.log(`분할 화면 모드: ${splitScreenMode ? '활성화' : '비활성화'}`);
        updateViewports(); // 뷰포트 재계산
        event.preventDefault();
    }
}, true); // 캡처 단계에서 이벤트 처리 (true)

// 키 업 이벤트 리스너
document.addEventListener('keyup', (event) => {
    // EOIR 카메라 제어 키 해제
    if (mainShip && mainShip.eoirControls && mainShip.eoirControls.keys) {
        let eoirKeyHandled = true;
        
        switch (event.key.toLowerCase()) {
            case 'w':
                mainShip.eoirControls.keys.tiltUp = false;
                break;
            case 'a':
                mainShip.eoirControls.keys.panLeft = false;
                break;
            case 's':
                mainShip.eoirControls.keys.tiltDown = false;
                break;
            case 'd':
                mainShip.eoirControls.keys.panRight = false;
                break;
            case 'q':
                mainShip.eoirControls.keys.zoomIn = false;
                break;
            case 'e':
                mainShip.eoirControls.keys.zoomOut = false;
                break;
            default:
                eoirKeyHandled = false;
        }
        
        // EOIR 카메라 관련 키 이벤트는 여기서 처리 종료
        if (eoirKeyHandled) {
            event.preventDefault();
            return;
        }
    }
    
    // 배 이동 제어 키 해제 (화살표 키만 사용)
    if (mainShip && mainShip.movementStrategy) {
        switch (event.key) {
            case 'ArrowUp':
                mainShip.movementStrategy.keys.forward = false;
                event.preventDefault();
                break;
            case 'ArrowDown':
                mainShip.movementStrategy.keys.backward = false;
                event.preventDefault();
                break;
            case 'ArrowLeft':
                mainShip.movementStrategy.keys.left = false;
                event.preventDefault();
                break;
            case 'ArrowRight':
                mainShip.movementStrategy.keys.right = false;
                event.preventDefault();
                break;
        }
    }
}, true);

// 뷰포트 업데이트 함수
function updateViewports() {
    const width = window.innerWidth;
    const height = window.innerHeight;
    
    if (splitScreenMode) {
        // 분할 화면 모드 - 좌우로 분할
        mainViewport.x = 0;
        mainViewport.y = 0;
        mainViewport.width = width / 2;
        mainViewport.height = height;
        
        eoirViewport.x = width / 2;
        eoirViewport.y = 0;
        eoirViewport.width = width / 2;
        eoirViewport.height = height;
    } else {
        // 전체 화면 모드
        mainViewport.x = 0;
        mainViewport.y = 0;
        mainViewport.width = width;
        mainViewport.height = height;
        
        // EOIR 뷰포트는 사용하지 않지만 일관성을 위해 설정
        eoirViewport.x = 0;
        eoirViewport.y = 0;
        eoirViewport.width = 0;
        eoirViewport.height = 0;
    }
    
    // 카메라 종횡비 업데이트
    if (thirdPersonCamera) {
        thirdPersonCamera.aspect = mainViewport.width / mainViewport.height;
        thirdPersonCamera.updateProjectionMatrix();
    }
    
    if (mainShip) {
        if (mainShip.shipCamera) {
            mainShip.shipCamera.aspect = mainViewport.width / mainViewport.height;
            mainShip.shipCamera.updateProjectionMatrix();
        }
        
        if (mainShip.eoirCamera) {
            mainShip.eoirCamera.aspect = eoirViewport.width / eoirViewport.height;
            mainShip.eoirCamera.updateProjectionMatrix();
        }
    }
}

// 메인 초기화 함수
function initializeApp() {
    // 월드 생성
    world = new World();

    // 컴포넌트 추가
    const sky = new Sky();
    sky.create(world.scene);
    world.addComponent('sky', sky);

    const lighting = new Lighting();
    lighting.create(world.scene);
    world.addComponent('lighting', lighting);

    const ocean = new Ocean();
    ocean.create(world.scene);
    world.addComponent('ocean', ocean);

    // 메인 선박 추가 (AttackDroneShip으로 변경)
    mainShip = ShipFactory.createShip('drone', {
        position: new THREE.Vector3(0, 0, 0),
        size: { length: 12, width: 6, height: 3 },
        color: 0xFF5500, // 밝은 주황색
        bouyancyFactor: 1.4, // 높은 부력
        pitchFactor: 0.9,    // 안정적인 피치
        rollFactor: 0.8,     // 안정적인 롤링
        movementType: 'manual' // 수동 조작 전략 사용
    });

    world.addEntity(mainShip);

    // 드론의 카메라 헬퍼를 씬에 추가 (필요시 활성화)
    if (mainShip.addCameraHelperToScene) {
        mainShip.addCameraHelperToScene(world.scene);
    }

    // 카메라 설정 및 관리
    activeCamera = world.camera; // 기본값은 월드 카메라 (3인칭)
    thirdPersonCamera = world.camera; // 3인칭 카메라 참조 저장
    
    // 초기 뷰포트 설정
    updateViewports();
    
    // 창 크기 변경 시 카메라 설정 업데이트
    window.addEventListener('resize', () => {
        // 뷰포트 업데이트
        updateViewports();
        
        // 렌더러 크기도 업데이트
        world.renderer.setSize(window.innerWidth, window.innerHeight);
    });

    // 원래 World.update 함수를 백업
    const originalUpdate = world.update.bind(world);

    // World.update 함수를 오버라이드하여 카메라 업데이트 로직 추가
    world.update = (time) => {
        originalUpdate(time);
        updateCameras();
    };

    // World.render 함수를 오버라이드
    world.render = () => {
        const renderer = world.renderer;
        
        if (splitScreenMode && mainShip.eoirCamera) {
            // 메인 뷰 렌더링 (활성 카메라)
            renderer.setViewport(mainViewport.x, mainViewport.y, mainViewport.width, mainViewport.height);
            renderer.setScissor(mainViewport.x, mainViewport.y, mainViewport.width, mainViewport.height);
            renderer.setScissorTest(true);
            renderer.render(world.scene, activeCamera);
            
            // EOIR 카메라 뷰 렌더링
            renderer.setViewport(eoirViewport.x, eoirViewport.y, eoirViewport.width, eoirViewport.height);
            renderer.setScissor(eoirViewport.x, eoirViewport.y, eoirViewport.width, eoirViewport.height);
            renderer.render(world.scene, mainShip.eoirCamera);
            
            // 화면 분할선 표시
            drawSplitLineOverlay();
            
            // 뷰 정보 표시
            drawViewInfo();
        } else {
            // 전체 화면 모드 - 활성 카메라만 사용
            renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
            renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
            renderer.setScissorTest(false);
            renderer.render(world.scene, activeCamera);
        }
    };

    // 애니메이션 시작
    world.start();

    // 기능 설명 표시
    console.log('배 시뮬레이션 조작법:');
    console.log('=== 배 이동 컨트롤 (화살표 키) ===');
    console.log('↑: 전진, ↓: 후진');
    console.log('←: 좌회전, →: 우회전');
    console.log('')
    console.log('=== EOIR 카메라 컨트롤 (WASD 키) ===');
    console.log('W: EOIR 카메라 위쪽 틸트, S: EOIR 카메라 아래쪽 틸트');
    console.log('A: EOIR 카메라 왼쪽 패닝, D: EOIR 카메라 오른쪽 패닝');
    console.log('Q: EOIR 카메라 줌인, E: EOIR 카메라 줌아웃');
    console.log('')
    console.log('=== 기타 컨트롤 ===');
    console.log('C: 카메라 모드 변경 (1인칭/3인칭)');
    console.log('V: 분할 화면 모드 토글');
    console.log('H: 카메라 헬퍼 표시 토글 (디버깅용)');
    console.log('R: 무기 충전');
    console.log('F: 무기 발사');
}

// 카메라 업데이트 함수
const updateCameras = () => {
    if (!mainShip || !mainShip.mesh) return;
    
    // 3인칭 카메라 업데이트
    const offset = new THREE.Vector3(
        -Math.sin(mainShip.direction) * 30,
        20,
        -Math.cos(mainShip.direction) * 30
    );
    
    // 3인칭 카메라 위치 부드럽게 업데이트
    thirdPersonCamera.position.lerp(
        mainShip.mesh.position.clone().add(offset), 
        0.05
    );
    
    thirdPersonCamera.lookAt(mainShip.mesh.position);
    
    // 현재 활성화된 카메라 결정
    if (useShipCamera && mainShip.shipCamera) {
        activeCamera = mainShip.shipCamera;
    } else {
        activeCamera = thirdPersonCamera;
    }
};

// 분할선 오버레이 그리기
const drawSplitLineOverlay = () => {
    // DOM 요소가 없으면 생성
    let splitLine = document.getElementById('split-line');
    if (!splitLine) {
        splitLine = document.createElement('div');
        splitLine.id = 'split-line';
        splitLine.style.position = 'absolute';
        splitLine.style.top = '0';
        splitLine.style.width = '2px';
        splitLine.style.height = '100%';
        splitLine.style.backgroundColor = 'white';
        splitLine.style.zIndex = '1000';
        document.body.appendChild(splitLine);
    }
    
    // 위치 업데이트
    splitLine.style.left = (window.innerWidth / 2 - 1) + 'px';
    splitLine.style.display = splitScreenMode ? 'block' : 'none';
};

// 뷰 정보 표시
const drawViewInfo = () => {
    // 메인 뷰 라벨
    let mainViewLabel = document.getElementById('main-view-label');
    if (!mainViewLabel) {
        mainViewLabel = document.createElement('div');
        mainViewLabel.id = 'main-view-label';
        mainViewLabel.style.position = 'absolute';
        mainViewLabel.style.top = '10px';
        mainViewLabel.style.left = '10px';
        mainViewLabel.style.color = 'white';
        mainViewLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        mainViewLabel.style.padding = '5px';
        mainViewLabel.style.borderRadius = '3px';
        mainViewLabel.style.fontFamily = 'Arial, sans-serif';
        mainViewLabel.style.fontSize = '14px';
        mainViewLabel.style.zIndex = '1001';
        document.body.appendChild(mainViewLabel);
    }
    
    // EOIR 뷰 라벨
    let eoirViewLabel = document.getElementById('eoir-view-label');
    if (!eoirViewLabel) {
        eoirViewLabel = document.createElement('div');
        eoirViewLabel.id = 'eoir-view-label';
        eoirViewLabel.style.position = 'absolute';
        eoirViewLabel.style.top = '10px';
        eoirViewLabel.style.color = 'white';
        eoirViewLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        eoirViewLabel.style.padding = '5px';
        eoirViewLabel.style.borderRadius = '3px';
        eoirViewLabel.style.fontFamily = 'Arial, sans-serif';
        eoirViewLabel.style.fontSize = '14px';
        eoirViewLabel.style.zIndex = '1001';
        document.body.appendChild(eoirViewLabel);
    }
    
    // 위치와 내용 업데이트
    mainViewLabel.textContent = `메인 카메라 ${useShipCamera ? '(1인칭)' : '(3인칭)'} - 화살표 키로 이동`;
    mainViewLabel.style.display = splitScreenMode ? 'block' : 'none';
    
    eoirViewLabel.textContent = `EOIR 카메라 - WASDQE로 제어`;
    eoirViewLabel.style.left = (window.innerWidth / 2 + 10) + 'px';
    eoirViewLabel.style.display = splitScreenMode ? 'block' : 'none';
    
    // EOIR 카메라 상태 표시
    if (mainShip && mainShip.eoirCamera) {
        let eoirStatus = document.getElementById('eoir-status');
        if (!eoirStatus) {
            eoirStatus = document.createElement('div');
            eoirStatus.id = 'eoir-status';
            eoirStatus.style.position = 'absolute';
            eoirStatus.style.bottom = '10px';
            eoirStatus.style.right = '10px';
            eoirStatus.style.color = 'white';
            eoirStatus.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            eoirStatus.style.padding = '5px';
            eoirStatus.style.borderRadius = '3px';
            eoirStatus.style.fontFamily = 'monospace';
            eoirStatus.style.fontSize = '12px';
            eoirStatus.style.zIndex = '1001';
            document.body.appendChild(eoirStatus);
        }
        
        // 컨트롤 가이드 생성
        let controlGuide = document.getElementById('control-guide');
        if (!controlGuide) {
            controlGuide = document.createElement('div');
            controlGuide.id = 'control-guide';
            controlGuide.style.position = 'absolute';
            controlGuide.style.bottom = '10px';
            controlGuide.style.left = (window.innerWidth / 2 + 10) + 'px';
            controlGuide.style.color = 'white';
            controlGuide.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            controlGuide.style.padding = '5px';
            controlGuide.style.borderRadius = '3px';
            controlGuide.style.fontFamily = 'monospace';
            controlGuide.style.fontSize = '12px';
            controlGuide.style.zIndex = '1001';
            document.body.appendChild(controlGuide);
        }
        
        const pan = Math.round(mainShip.eoirControls.currentRotation.pan * 180 / Math.PI);
        const tilt = Math.round(mainShip.eoirControls.currentRotation.tilt * 180 / Math.PI);
        const fov = Math.round(mainShip.eoirCamera.fov);
        const zoom = Math.round(60 / fov * 40); // 40x를 기준으로 계산
        
        eoirStatus.textContent = `EOIR 상태: 팬: ${pan}° 틸트: ${tilt}° 줌: ${zoom}x`;
        eoirStatus.style.display = splitScreenMode ? 'block' : 'none';
        
        controlGuide.innerHTML = `EOIR 제어: W/S - 틸트 상/하 | A/D - 팬 좌/우 | Q/E - 줌 인/아웃`;
        controlGuide.style.display = splitScreenMode ? 'block' : 'none';
    }
    
    // 이동 컨트롤 가이드
    let moveGuide = document.getElementById('move-guide');
    if (!moveGuide) {
        moveGuide = document.createElement('div');
        moveGuide.id = 'move-guide';
        moveGuide.style.position = 'absolute';
        moveGuide.style.bottom = '10px';
        moveGuide.style.left = '10px';
        moveGuide.style.color = 'white';
        moveGuide.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
        moveGuide.style.padding = '5px';
        moveGuide.style.borderRadius = '3px';
        moveGuide.style.fontFamily = 'monospace';
        moveGuide.style.fontSize = '12px';
        moveGuide.style.zIndex = '1001';
        document.body.appendChild(moveGuide);
    }
    
    moveGuide.innerHTML = `배 조종: ↑/↓ - 전진/후진 | ←/→ - 좌/우회전 | C - 카메라 전환 | V - 화면분할 전환`;
    moveGuide.style.display = 'block';
};

// 앱 초기화
document.addEventListener('DOMContentLoaded', initializeApp); 