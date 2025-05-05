import * as THREE from 'three';
import World from './World';
import Ocean from './components/Ocean';
import Sky from './components/Sky';
import Lighting from './components/Lighting';
import ShipFactory from './entities/ship/ShipFactory';
import ManualMovement from './entities/ship/movement/ManualMovement';
import AutoMovement from './entities/ship/movement/AutoMovement';
import interfaceManager from './ui/InterfaceManager';

// 전역 변수 선언
let world;
let mainShip; // 현재 선택된 선박 (제어 대상)
let activeCamera; // 현재 활성화된 카메라 (1인칭 또는 3인칭)
let useShipCamera = true; // 기본적으로 드론 카메라 사용
let ourFleet; // 드론 함대 배열
let activeShipIndex = 0; // 현재 활성화된 선박의 인덱스

// 화면 분할 변수
let splitScreenMode = true; // 분할 화면 모드 활성화
let eoirViewport = { x: 0, y: 0, width: 0, height: 0 }; // EOIR 뷰포트
let mainViewport = { x: 0, y: 0, width: 0, height: 0 }; // 메인 뷰포트

// EOIR 외부 창 관련 변수
let eoirWindow = null;
let isEoirWindowOpen = false;
let eoirFrameCount = 0;

// 최상위 레벨에서 키 이벤트 리스너 등록
document.addEventListener('keydown', (event) => {
    console.log(`index.js에서 감지된 키: ${event.key}`);
    
    // Control + 숫자키로 선박 전환
    if (event.ctrlKey && !isNaN(parseInt(event.key)) && parseInt(event.key) > 0) {
        const shipIndex = parseInt(event.key) - 1; // 0부터 시작하는 인덱스로 변환
        if (ourFleet && shipIndex < ourFleet.length) {
            switchActiveShip(shipIndex);
            console.log(`${shipIndex + 1}번 드론으로 전환했습니다.`);
            event.preventDefault();
            return;
        }
    }
    
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
        console.log(`카메라 모드 변경: ${useShipCamera ? '드론 1인칭 카메라' : '3인칭 외부 카메라'}`);
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
    
    // 'O' 키를 누르면 EOIR 창 열기/닫기
    if (event.key === 'o' || event.key === 'O') {
        toggleEoirWindow();
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

    // 추가 공격용 드론 5대 생성 (일렬 배치, 간격 50)
    // 첫 번째 드론은 수동 제어, 나머지는 자동 제어로 설정
    const droneOptions = {
        movementType: 'auto',  // 기본적으로 자동 제어
        basePosition: new THREE.Vector3(0, 0, 0)  // 원점에서 시작
    };
    
    // 드론 함대 생성
    ourFleet = world.createDroneFleet(ShipFactory, 5, 50, droneOptions);
    
    // 첫 번째 드론을 메인 선박으로 설정
    mainShip = ourFleet[0];
    activeShipIndex = 0;
    
    // 각 드론에 고유한 속성 부여
    ourFleet.forEach((drone, index) => {
        // 각 드론에 ID 부여
        drone.id = `Drone-${index + 1}`;
        
        // 기존 이동 전략 제거
        drone.movementStrategy = null;
        
        // 첫 번째 드론만 수동 제어로 설정
        if (index === 0) {
            const manualMove = new ManualMovement();
            drone.setMovementStrategy(manualMove);
        } else {
            // 나머지 드론은 자동 이동 전략 적용
            const autoMove = new AutoMovement();
            drone.setMovementStrategy(autoMove);
        }
    });
    
    // 모든 드론을 월드에 추가
    ourFleet.forEach(drone => {
        world.addEntity(drone);
    });
    
    // 메인 선박을 World에 등록
    world.setMainShip(mainShip);
    
    // 카메라 설정 및 관리
    activeCamera = world.camera; // 기본값은 월드 카메라 (3인칭)
    
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
        
        if (splitScreenMode && mainShip && mainShip.eoirCamera) {
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
            interfaceManager.drawSplitLineOverlay(splitScreenMode);
            
            // 뷰 정보 표시
            interfaceManager.drawViewInfo(activeShipIndex, useShipCamera, splitScreenMode, mainShip);
            
            // EOIR 창이 열려있으면 프레임 캡처 및 전송
            captureAndSendEoirFrame();
        } else {
            // 전체 화면 모드 - 활성 카메라만 사용
            renderer.setViewport(0, 0, window.innerWidth, window.innerHeight);
            renderer.setScissor(0, 0, window.innerWidth, window.innerHeight);
            renderer.setScissorTest(false);
            renderer.render(world.scene, activeCamera);
            
            // EOIR 창이 열려있으면 프레임 캡처 및 전송
            captureAndSendEoirFrame();
        }
    };

    // 애니메이션 시작
    world.start();
}

// 카메라 업데이트 함수
const updateCameras = () => {
    if (!mainShip || !mainShip.mesh) return;
    
    // 현재 활성화된 카메라 결정
    if (useShipCamera && mainShip.shipCamera) {
        activeCamera = mainShip.shipCamera;
    } else {
        // 3인칭 시점 - 월드 카메라를 활성 선박 뒤에 위치시킴
        const offset = new THREE.Vector3(
            -Math.sin(mainShip.direction) * 30,
            20,
            -Math.cos(mainShip.direction) * 30
        );
        
        // 월드 카메라 위치 부드럽게 업데이트
        world.camera.position.lerp(
            mainShip.mesh.position.clone().add(offset), 
            0.05
        );
        
        world.camera.lookAt(mainShip.mesh.position);
        activeCamera = world.camera;
    }
};

// EOIR 창을 열거나 닫는 함수
function toggleEoirWindow() {
    if (isEoirWindowOpen && eoirWindow && !eoirWindow.closed) {
        eoirWindow.close();
        isEoirWindowOpen = false;
        console.log('EOIR 창 닫기');
    } else {
        // 새 창 열기
        eoirWindow = window.open('eoir-view.html', 'EOIR View', 'width=800,height=600,resizable=yes');
        if (eoirWindow) {
            isEoirWindowOpen = true;
            console.log('EOIR 창 열기');
            
            // 창이 닫힐 때 상태 업데이트
            eoirWindow.addEventListener('beforeunload', () => {
                isEoirWindowOpen = false;
                console.log('EOIR 창이 닫혔습니다');
            });
        } else {
            console.error('EOIR 창을 열 수 없습니다. 팝업 차단을 확인하세요.');
        }
    }
}

// EOIR 이미지를 캡처하고 새 창으로 전송하는 함수
function captureAndSendEoirFrame() {
    if (!isEoirWindowOpen || !eoirWindow || eoirWindow.closed || !mainShip || !mainShip.eoirCamera) {
        return;
    }
    
    // 2프레임마다 업데이트 (성능 최적화)
    if (eoirFrameCount++ % 2 !== 0) {
        return;
    }
    
    // 렌더링된 이미지 캡처
    const renderer = world.renderer;

    // 150% 해상도로 증가 (더 선명한 이미지를 위해)
    const scale = 1.5;
    const width = Math.floor(renderer.domElement.width * scale);
    const height = Math.floor(renderer.domElement.height * scale);
    
    // 임시 렌더 대상 생성 (고해상도)
    const renderTarget = new THREE.WebGLRenderTarget(width, height, {
        minFilter: THREE.LinearFilter,
        magFilter: THREE.LinearFilter,
        format: THREE.RGBAFormat,
        encoding: THREE.sRGBEncoding
    });
    
    // 원래 렌더러 설정 백업
    const originalRenderTarget = renderer.getRenderTarget();
    
    // 현재 선택된 드론의 EOIR 카메라로 씬을 렌더링
    renderer.setRenderTarget(renderTarget);
    renderer.render(world.scene, mainShip.eoirCamera);
    
    // 렌더링된 이미지 데이터 가져오기
    const buffer = new Uint8Array(width * height * 4);
    renderer.readRenderTargetPixels(renderTarget, 0, 0, width, height, buffer);
    
    // 원래 렌더 대상으로 복원
    renderer.setRenderTarget(originalRenderTarget);
    
    // 캔버스 생성 및 이미지 데이터 변환
    const canvas = document.createElement('canvas');
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext('2d');
    
    // 이미지 데이터 생성
    const imageData = context.createImageData(width, height);
    imageData.data.set(buffer);
    context.putImageData(imageData, 0, 0);
    
    // 이미지 후처리 - 선명도 향상
    context.filter = 'contrast(1.1) brightness(1.05) saturate(1.2)';
    context.drawImage(canvas, 0, 0);
    context.filter = 'none';
    
    // 드론 번호 및 상태 정보 표시
    context.font = 'bold 16px Arial';
    context.fillStyle = '#00FF00';
    context.fillText(`드론 #${activeShipIndex + 1} EOIR`, 20, 30);
    
    // 이미지를 고품질 JPEG로 변환 (0.92 품질)
    const dataURL = canvas.toDataURL('image/jpeg', 0.92);
    
    // 새 창으로 데이터 전송
    eoirWindow.postMessage({
        type: 'eoirFrame',
        imageData: dataURL,
        isDestroyed: false, // 필요한 경우 파괴 상태 설정
        droneId: activeShipIndex + 1 // 현재 드론 번호 전달
    }, '*');
    
    // 렌더 대상 해제
    renderTarget.dispose();
}

// 선박 전환 함수
function switchActiveShip(newIndex) {
    if (!ourFleet || newIndex >= ourFleet.length) return;
    
    // 이전 활성 선박의 움직임 타입을 자동으로 변경
    if (mainShip && mainShip.movementStrategy) {
        // 기존 이동 전략이 수동 제어인 경우 자동 제어로 변경
        if (mainShip.movementStrategy instanceof ManualMovement) {
            // 기존 수동 이동 전략 제거
            mainShip.movementStrategy = null;
            
            // 자동 이동 전략으로 교체
            const autoMove = new AutoMovement();
            mainShip.setMovementStrategy(autoMove);
        }
    }
    
    // 인덱스 업데이트
    activeShipIndex = newIndex;
    mainShip = ourFleet[activeShipIndex];
    
    // 새 선박의 움직임 타입을 수동으로 변경
    if (mainShip) {
        // 기존 이동 전략 제거
        mainShip.movementStrategy = null;
        
        // 수동 이동 전략 적용
        const manualMove = new ManualMovement();
        mainShip.setMovementStrategy(manualMove);
    }
    
    // 메인 선박을 World에 등록
    world.setMainShip(mainShip);
    
    // 카메라 업데이트
    updateCameras();
    
    // 뷰포트 업데이트
    updateViewports();
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', initializeApp); 