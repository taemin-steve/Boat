import * as THREE from 'three';
import World from './World';
import Ocean from './components/Ocean';
import Sky from './components/Sky';
import Lighting from './components/Lighting';
import ShipFactory from './entities/ship/ShipFactory';
import ManualMovement from './entities/ship/movement/ManualMovement';
import AutoMovement from './entities/ship/movement/AutoMovement';
import interfaceManager from './ui/InterfaceManager';
import Minimap from './utils/Minimap';
import { toggleEoirWindow, captureAndSendEoirFrame } from './utils/EOIR';

// 전역 변수 선언
let world;
let mainShip; // 현재 선택된 선박 (제어 대상)
let activeCamera; // 현재 활성화된 카메라 (1인칭 또는 3인칭)
let useShipCamera = true; // 기본적으로 드론 카메라 사용
let ourFleet; // 드론 함대 배열
let activeShipIndex = 0; // 현재 활성화된 선박의 인덱스
let minimap; // 미니맵 컴포넌트

// 화면 분할 변수
let splitScreenMode = true; // 분할 화면 모드 활성화
let minimapViewport = { x: 0, y: 0, width: 0, height: 0 }; // 미니맵 뷰포트
let mainViewport = { x: 0, y: 0, width: 0, height: 0 }; // 메인 뷰포트


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
    
    if (event.key === 'v' || event.key === 'V') {
        // 'V' 키를 누르면 분할 화면 모드 토글
        splitScreenMode = !splitScreenMode;
        console.log(`분할 화면 모드: ${splitScreenMode ? '활성화' : '비활성화'}`);
        updateViewports(); // 뷰포트 재계산
        event.preventDefault();
    }
    
    if (event.key === 'm' || event.key === 'M') {
        // 'M' 키를 누르면 미니맵 확대/축소 토글
        if (minimap) {
            // 미니맵 확대/축소 비율 토글 (기본 -> 확대 -> 더 확대 -> 기본)
            const currentZoom = minimap.options.zoom;
            if (currentZoom === 0.05) {
                minimap.options.zoom = 0.1; // 확대
            } else if (currentZoom === 0.1) {
                minimap.options.zoom = 0.02; // 더 축소된 뷰
            } else {
                minimap.options.zoom = 0.05; // 기본으로 복귀
            }
            console.log(`미니맵 확대/축소 변경: ${minimap.options.zoom}`);
        }
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
        
        minimapViewport.x = width / 2;
        minimapViewport.y = 0;
        minimapViewport.width = width / 2;
        minimapViewport.height = height;
    } else {
        // 전체 화면 모드
        mainViewport.x = 0;
        mainViewport.y = 0;
        mainViewport.width = width;
        mainViewport.height = height;
        
        // 미니맵은 작은 창으로 표시
        const minimapSize = Math.min(300, width * 0.25);
        minimapViewport.x = width - minimapSize - 20;
        minimapViewport.y = 20;
        minimapViewport.width = minimapSize;
        minimapViewport.height = minimapSize;
    }
    
    // 카메라 종횡비 업데이트
    if (mainShip) {
        if (mainShip.shipCamera) {
            mainShip.shipCamera.aspect = mainViewport.width / mainViewport.height;
            mainShip.shipCamera.updateProjectionMatrix();
        }
        
        if (mainShip.eoirCamera) {
            mainShip.eoirCamera.aspect = mainViewport.width / mainViewport.height;
            mainShip.eoirCamera.updateProjectionMatrix();
        }
    }
    
    // 월드 카메라도 업데이트
    if (world && world.camera) {
        world.camera.aspect = mainViewport.width / mainViewport.height;
        world.camera.updateProjectionMatrix();
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
    
    // 미니맵 초기화
    minimap = new Minimap({
        size: 350,
        height: 300,
        zoom: 0.05,
        followPlayer: false // 플레이어 추적 비활성화
    });
    minimap.create();

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
        
        // 미니맵에 드론 추가
        minimap.addEntity(drone, index === 0 ? 0x00FF00 : 0xFFFF00, 1.0, index);
    });
    
    // 현재 플레이어 설정
    minimap.setPlayer(mainShip);
    
    // 모든 드론을 월드에 추가
    ourFleet.forEach(drone => {
        world.addEntity(drone);
    });
    
    // 섬들을 미니맵에 추가
    world.islands.forEach(island => {
        minimap.addIsland(island);
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
        
        // 미니맵 업데이트
        if (minimap) {
            minimap.update(time);
        }
    };

    // World.render 함수를 오버라이드
    world.render = () => {
        const renderer = world.renderer;
        
        if (splitScreenMode) {
            // 메인 뷰 렌더링 (활성 카메라)
            renderer.setViewport(mainViewport.x, mainViewport.y, mainViewport.width, mainViewport.height);
            renderer.setScissor(mainViewport.x, mainViewport.y, mainViewport.width, mainViewport.height);
            renderer.setScissorTest(true);
            renderer.render(world.scene, activeCamera);
            
            // 미니맵 렌더링
            renderer.setViewport(minimapViewport.x, minimapViewport.y, minimapViewport.width, minimapViewport.height);
            renderer.setScissor(minimapViewport.x, minimapViewport.y, minimapViewport.width, minimapViewport.height);
            renderer.render(minimap.scene, minimap.camera);
            
            // 화면 분할선 표시
            interfaceManager.drawSplitLineOverlay(splitScreenMode);
            
            // 뷰 정보 표시
            interfaceManager.drawViewInfo(activeShipIndex, useShipCamera, splitScreenMode, mainShip);
        } else {
            // 전체 화면 모드 - 활성 카메라 렌더링
            renderer.setViewport(mainViewport.x, mainViewport.y, mainViewport.width, mainViewport.height);
            renderer.setScissor(mainViewport.x, mainViewport.y, mainViewport.width, mainViewport.height);
            renderer.setScissorTest(true);
            renderer.render(world.scene, activeCamera);
            
            // 미니맵을 작은 창으로 렌더링
            if (minimapViewport.width > 0) {
                renderer.setViewport(minimapViewport.x, minimapViewport.y, minimapViewport.width, minimapViewport.height);
                renderer.setScissor(minimapViewport.x, minimapViewport.y, minimapViewport.width, minimapViewport.height);
                renderer.render(minimap.scene, minimap.camera);
                
                // 미니맵 테두리 그리기
                interfaceManager.drawMinimapBorder(minimapViewport);
            }
        }
        
        // EOIR 창이 열려있으면 프레임 캡처 및 전송
        captureAndSendEoirFrame(world, mainShip, activeShipIndex);
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
    
    // 미니맵에서 플레이어 업데이트
    if (minimap) {
        minimap.setPlayer(mainShip);
    }
    
    // 카메라 업데이트
    updateCameras();
    
    // 뷰포트 업데이트
    updateViewports();
}

// 앱 초기화
document.addEventListener('DOMContentLoaded', initializeApp); 