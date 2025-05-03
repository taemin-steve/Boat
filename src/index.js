import * as THREE from 'three';
import World from './World';
import Ocean from './components/Ocean';
import Sky from './components/Sky';
import Lighting from './components/Lighting';
import Ship from './entities/Ship';

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

// 메인 선박 추가
const mainShip = new Ship({
    position: new THREE.Vector3(0, 0, 0),
    size: { length: 15, width: 7, height: 5 },
    color: 0xDD4444,
    bouyancyFactor: 1.2, // 파도 위에서 약간 더 떠오르게
    pitchFactor: 1.2,    // 상하 회전 약간 더 강하게
    rollFactor: 1.3      // 좌우 회전 더 강하게
});

world.addEntity(mainShip);

// 선박에 초기 움직임 설정
mainShip.setDirection(Math.PI / 4); // 45도 방향
mainShip.setSpeed(0.1);             // 천천히 움직임

// 추가 선박들 생성
const ships = [];
const shipColors = [0x3388DD, 0x55AA33, 0x997722, 0xAA5500];
const shipCount = 4;

for (let i = 0; i < shipCount; i++) {
    const angle = (i / shipCount) * Math.PI * 2;
    const distance = 30 + Math.random() * 20;
    
    const x = Math.cos(angle) * distance;
    const z = Math.sin(angle) * distance;
    
    const shipSize = {
        length: 10 + Math.random() * 10,
        width: 4 + Math.random() * 4,
        height: 3 + Math.random() * 3
    };
    
    const ship = new Ship({
        position: new THREE.Vector3(x, 0, z),
        size: shipSize,
        color: shipColors[i % shipColors.length],
        bouyancyFactor: 1.1 + Math.random() * 0.3,
        pitchFactor: 0.8 + Math.random() * 0.8,
        rollFactor: 0.8 + Math.random() * 0.8
    });
    
    ship.setDirection(Math.random() * Math.PI * 2);
    ship.setSpeed(0.05 + Math.random() * 0.1);
    
    world.addEntity(ship);
    ships.push(ship);
}

// 카메라를 메인 선박 뒤에 배치
world.camera.position.set(-30, 20, -30);
world.camera.lookAt(mainShip.mesh.position);

// 애니메이션 시작
world.start();

// 선박 이동 방향 무작위 변경 (주기적으로)
setInterval(() => {
    for (const ship of ships) {
        // 30% 확률로 방향 변경
        if (Math.random() < 0.3) {
            const newDirection = ship.direction + (Math.random() - 0.5) * Math.PI / 2;
            ship.setDirection(newDirection);
        }
        
        // 20% 확률로 속도 변경
        if (Math.random() < 0.2) {
            const newSpeed = 0.05 + Math.random() * 0.15;
            ship.setSpeed(newSpeed);
        }
    }
}, 5000); // 5초마다 