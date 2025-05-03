import * as THREE from 'three';
import World from './World';
import Ocean from './components/Ocean';
import Sky from './components/Sky';
import Lighting from './components/Lighting';
import ShipFactory from './entities/ship/ShipFactory';
import ManualMovement from './entities/ship/movement/ManualMovement';

// 월드 생성
const world = new World();

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

// 메인 선박 추가 (패트롤 보트 타입으로 변경, 수동 조작 가능)
const mainShip = ShipFactory.createShip('patrol', {
    position: new THREE.Vector3(0, 0, 0),
    size: { length: 15, width: 7, height: 5 },
    color: 0xDD4444,
    bouyancyFactor: 1.2, // 파도 위에서 약간 더 떠오르게
    pitchFactor: 1.2,    // 상하 회전 약간 더 강하게
    rollFactor: 1.3,     // 좌우 회전 더 강하게
    movementType: 'manual' // 수동 조작 전략 사용
});

world.addEntity(mainShip);

// 카메라를 메인 선박 뒤에 배치
world.camera.position.set(-30, 20, -30);
world.camera.lookAt(mainShip.mesh.position);

// 카메라 업데이트 함수 (메인 선박을 따라다니게)
const updateCamera = () => {
    // 선박 뒤에서 약간 위에 위치
    const offset = new THREE.Vector3(
        -Math.sin(mainShip.direction) * 30,
        20,
        -Math.cos(mainShip.direction) * 30
    );
    
    // 카메라 위치 부드럽게 업데이트
    world.camera.position.lerp(
        mainShip.mesh.position.clone().add(offset), 
        0.05
    );
    
    world.camera.lookAt(mainShip.mesh.position);
};

// 원래 World.update 함수를 백업
const originalUpdate = world.update.bind(world);

// World.update 함수를 오버라이드하여 카메라 업데이트 로직 추가
world.update = (time) => {
    originalUpdate(time);
    updateCamera();
};

// 애니메이션 시작
world.start();

// 범선 타입 배의 돛 조작 테스트용 이벤트 리스너
window.addEventListener('keydown', (event) => {
    if (event.key === ' ') { // 스페이스바
        // 모든 범선의 돛 상태 토글
        ships.forEach(ship => {
            if (ship.toggleSails && typeof ship.toggleSails === 'function') {
                ship.toggleSails();
            }
        });
    }
});

// 기능 설명 표시
console.log('조작법:');
console.log('W/↑: 전진, S/↓: 후진');
console.log('A/←: 좌회전, D/→: 우회전');
console.log('스페이스바: 범선 돛 펼치기/접기'); 