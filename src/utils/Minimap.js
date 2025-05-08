import * as THREE from 'three';

class Minimap {
    constructor(options = {}) {
        this.options = {
            size: options.size || 350, // 미니맵 크기
            height: options.height || 300, // 미니맵 시점 높이
            zoom: options.zoom || 0.05, // 미니맵 확대/축소 비율
            ...options
        };
        
        this.camera = null;
        this.scene = null;
        this.entities = [];
        this.islands = [];
        this.player = null;
        this.markers = {};
        this.labels = {}; // 드론 넘버링 라벨 저장
    }
    
    create(scene) {
        // 새로운 씬 생성 (미니맵 전용)
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x82AFC1); // 옅은 파란색 배경 (바다 느낌)
        
        // 미니맵 전용 카메라 생성 (정사영 카메라)
        this.camera = new THREE.OrthographicCamera(
            -this.options.size / 2, 
            this.options.size / 2, 
            this.options.size / 2, 
            -this.options.size / 2, 
            1, 
            1000
        );
        
        // 카메라 위치 설정 (위에서 내려다보는 뷰)
        this.camera.position.set(0, this.options.height, 0);
        this.camera.lookAt(0, 0, 0);
        this.camera.up.set(0, 0, -1); // Z축이 위쪽을 향하도록 설정
        this.camera.rotation.z = Math.PI; // 지도 방향 조정
        
        // 바다 평면 생성 (미니맵 배경)
        const seaGeometry = new THREE.PlaneGeometry(this.options.size * 20, this.options.size * 20);
        const seaMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x0066AA, 
            transparent: true,
            opacity: 0.6
        });
        const seaMesh = new THREE.Mesh(seaGeometry, seaMaterial);
        seaMesh.rotation.x = -Math.PI / 2; // 수평면으로 회전
        seaMesh.position.y = -1; // 약간 아래로 이동해서 다른 객체와 겹치지 않게
        this.scene.add(seaMesh);
        
        // 좌표축 격자 생성 (방향 참조용)
        const gridHelper = new THREE.GridHelper(this.options.size * 15, 20, 0x888888, 0x444444);
        this.scene.add(gridHelper);
        
        // 동서남북 방향 표시
        this.createDirectionMarkers();
        
        return this;
    }
    
    // 동서남북 방향 표시 생성
    createDirectionMarkers() {
        const directions = [
            { text: 'N', position: new THREE.Vector3(0, 0, -this.options.size * 7), color: 0xFF0000 },
            { text: 'S', position: new THREE.Vector3(0, 0, this.options.size * 7), color: 0xFFFFFF },
            { text: 'E', position: new THREE.Vector3(this.options.size * 7, 0, 0), color: 0xFFFFFF },
            { text: 'W', position: new THREE.Vector3(-this.options.size * 7, 0, 0), color: 0xFFFFFF }
        ];
        
        directions.forEach(dir => {
            // 방향 표시용 구체 생성
            const sphereGeometry = new THREE.SphereGeometry(this.options.size * 0.15, 8, 8);
            const sphereMaterial = new THREE.MeshBasicMaterial({ 
                color: dir.color,
                transparent: true,
                opacity: 0.8
            });
            const marker = new THREE.Mesh(sphereGeometry, sphereMaterial);
            marker.position.copy(dir.position);
            marker.position.y = 5; // 약간 높게 배치
            this.scene.add(marker);
            
            // 방향 텍스트 생성
            this.createTextLabel(dir.text, dir.position, dir.color, 1.5);
        });
    }
    
    // 텍스트 라벨 생성 (캔버스 텍스처 기반)
    createTextLabel(text, position, color = 0xFFFFFF, scale = 1.0) {
        // 캔버스 생성
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 64;
        canvas.height = 64;
        
        // 배경 투명하게
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // 텍스트 스타일 설정 - 항상 검은색으로 (방향 표시 제외)
        if(text === 'N' || text === 'S' || text === 'E' || text === 'W') {
            // 방향 표시는 원래 색상 사용
            ctx.fillStyle = '#' + new THREE.Color(color).getHexString();
        } else {
            // 숫자 라벨은 검은색으로 고정
            ctx.fillStyle = '#000000';
        }
        
        ctx.font = 'bold 40px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        
        // 텍스트 그리기
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 텍스처 생성
        const texture = new THREE.CanvasTexture(canvas);
        
        // 스프라이트 생성
        const spriteMaterial = new THREE.SpriteMaterial({ 
            map: texture,
            transparent: true
        });
        const sprite = new THREE.Sprite(spriteMaterial);
        
        // 위치 및 크기 설정
        sprite.position.copy(position);
        sprite.position.y += 10; // 마커보다 위에 표시
        sprite.scale.set(15 * scale, 15 * scale, 1);
        
        // 씬에 추가
        this.scene.add(sprite);
        
        return sprite;
    }
    
    // 미니맵에 추가할 엔티티 등록
    addEntity(entity, color = 0xFFFF00, scale = 1.0, index = -1) {
        if (!entity || !entity.mesh) return;
        
        // 미니맵에 표시할 마커 생성 (화살표 모양)
        const markerGeometry = new THREE.ConeGeometry(5 * scale, 12 * scale, 4);
        const markerMaterial = new THREE.MeshBasicMaterial({ color: color });
        const marker = new THREE.Mesh(markerGeometry, markerMaterial);
        
        // 마커 회전 - 콘의 축이 처음에는 평면(XZ 평면)에 누워있게 설정
        marker.rotateX(-Math.PI / 2); // -90도 회전하여 콘이 XZ 평면에 누워있게 함
        
        // 마커를 미니맵 씬에 추가
        this.scene.add(marker);
        
        // 엔티티와 마커 연결 저장
        const entityData = { 
            entity: entity, 
            marker: marker,
            isPlayer: false,
            index: index
        };
        
        this.entities.push(entityData);
        
        // 인덱스가 있으면 넘버링 라벨 추가
        if (index >= 0) {
            const labelPosition = marker.position.clone();
            labelPosition.y += 10; // 마커 위에 라벨 위치
            
            const label = this.createTextLabel((index + 1).toString(), labelPosition, color, 0.8);
            entityData.label = label;
            this.labels[index] = label;
        }
        
        return marker;
    }
    
    // 플레이어(현재 제어 중인 선박) 설정
    setPlayer(player, color = 0x00FF00) {
        if (!player || !player.mesh) return;
        
        // 기존 플레이어 마커가 있으면 일반 엔티티로 변경
        if (this.player) {
            const existingPlayerIndex = this.entities.findIndex(e => e.isPlayer);
            if (existingPlayerIndex >= 0) {
                this.entities[existingPlayerIndex].isPlayer = false;
                this.entities[existingPlayerIndex].marker.material.color.setHex(0xFFFF00);
                
                // 라벨 색상도 변경 (숫자는 항상 검은색으로 유지)
                if (this.entities[existingPlayerIndex].label) {
                    const texture = this.entities[existingPlayerIndex].label.material.map;
                    const canvas = texture.image;
                    const ctx = canvas.getContext('2d');
                    
                    // 캔버스 클리어
                    ctx.clearRect(0, 0, canvas.width, canvas.height);
                    
                    // 텍스트 다시 그리기 (항상 검은색)
                    ctx.fillStyle = '#000000';
                    ctx.font = 'bold 40px Arial';
                    ctx.textAlign = 'center';
                    ctx.textBaseline = 'middle';
                    ctx.fillText((this.entities[existingPlayerIndex].index + 1).toString(), canvas.width / 2, canvas.height / 2);
                    
                    texture.needsUpdate = true;
                }
            }
        }
        
        // 새 플레이어가 이미 엔티티로 등록되어 있는지 확인
        const entityIndex = this.entities.findIndex(e => e.entity === player);
        
        if (entityIndex >= 0) {
            // 기존 엔티티를 플레이어로 설정
            this.entities[entityIndex].isPlayer = true;
            this.entities[entityIndex].marker.material.color.setHex(color);
            this.player = player;
            
            // 라벨 색상도 변경 (숫자는 항상 검은색으로 유지)
            if (this.entities[entityIndex].label) {
                const texture = this.entities[entityIndex].label.material.map;
                const canvas = texture.image;
                const ctx = canvas.getContext('2d');
                
                // 캔버스 클리어
                ctx.clearRect(0, 0, canvas.width, canvas.height);
                
                // 텍스트 다시 그리기 (항상 검은색)
                ctx.fillStyle = '#000000';
                ctx.font = 'bold 40px Arial';
                ctx.textAlign = 'center';
                ctx.textBaseline = 'middle';
                ctx.fillText((this.entities[entityIndex].index + 1).toString(), canvas.width / 2, canvas.height / 2);
                
                texture.needsUpdate = true;
            }
        } else {
            // 새로운 플레이어 마커 생성
            const newIndex = this.entities.length; // 새 인덱스 할당
            const playerMarker = this.addEntity(player, color, 1.5, newIndex);
            
            if (playerMarker) {
                const lastIndex = this.entities.length - 1;
                this.entities[lastIndex].isPlayer = true;
                this.player = player;
            }
        }
    }
    
    // 미니맵에 섬 추가
    addIsland(island, color = 0x7E5D36) {
        if (!island || (!island.mesh && !island.group)) return;
        
        let size = { width: 100, depth: 100 };
        
        // 섬의 크기 정보가 있으면 활용
        if (island.options && island.options.size) {
            size = island.options.size;
        }
        
        // 섬 위치 가져오기
        const islandPosition = island.group 
            ? island.group.position 
            : (island.mesh ? island.mesh.position : new THREE.Vector3());
        
        // 실제 섬 형태에 맞는 지오메트리 생성 시도
        let islandGeometry;
        let yScale = 0.2; // 높이는 축소
        
        if (island.constructor.name.includes('Rock')) {
            // 바위섬은 불규칙한 형태
            islandGeometry = new THREE.DodecahedronGeometry(
                Math.max(size.width, size.depth) * 0.5 * this.options.zoom,
                1
            );
            color = 0x8B4513; // 어두운 갈색
            yScale = 0.3;
        } else if (island.constructor.name.includes('Volcano')) {
            // 화산섬은 원뿔 형태
            islandGeometry = new THREE.ConeGeometry(
                Math.max(size.width, size.depth) * 0.5 * this.options.zoom,
                size.height * this.options.zoom,
                16
            );
            color = 0x696969; // 어두운 회색
            yScale = 0.5; // 화산은 높이 강조
        } else {
            // 기본 섬은 둥근 형태
            islandGeometry = new THREE.CylinderGeometry(
                Math.max(size.width, size.depth) * 0.5 * this.options.zoom,
                Math.max(size.width, size.depth) * 0.45 * this.options.zoom,
                size.height * 0.3 * this.options.zoom,
                16
            );
        }
        
        // 섬 재질
        const islandMaterial = new THREE.MeshBasicMaterial({ 
            color: color,
            transparent: true,
            opacity: 0.9
        });
        
        // 섬 메시 생성
        const islandMarker = new THREE.Mesh(islandGeometry, islandMaterial);
        
        // 메시 위치 및 회전 설정
        islandMarker.position.set(
            islandPosition.x * this.options.zoom,
            size.height * 0.1 * this.options.zoom, // 바다면 위로 약간 올림
            islandPosition.z * this.options.zoom
        );
        
        // 실린더는 Y축이 높이방향이므로 회전 필요 없음
        if (island.constructor.name.includes('Volcano')) {
            islandMarker.rotation.x = Math.PI; // 화산은 뒤집어서 뾰족한 부분이 위로
        }
        
        // 크기 조정 (너비와 깊이는 크기에 맞춰, 높이는 축소)
        islandMarker.scale.set(1, yScale, 1);
        
        // 미니맵 씬에 추가
        this.scene.add(islandMarker);
        
        // 섬과 마커 연결 저장
        this.islands.push({ 
            island: island, 
            marker: islandMarker
        });
    }
    
    // 모든 마커 위치 업데이트
    update(time) {
        // 엔티티 마커 위치 업데이트
        this.entities.forEach(item => {
            if (item.entity && item.entity.mesh && item.marker) {
                // 엔티티 위치를 마커에 복사
                item.marker.position.x = item.entity.mesh.position.x * this.options.zoom;
                item.marker.position.z = item.entity.mesh.position.z * this.options.zoom;
                
                // 마커 방향 업데이트 (선박의 선수 방향에 맞춤)
                if (typeof item.entity.direction !== 'undefined') {
                    // 현재 구현에서는 direction 값이 선박의 진행 방향(선수 방향)을 나타냄
                    // 마커의 방향과 맞추기 위해 회전 변환 필요
                    
                    // 초기화된 회전 행렬 생성 (X축 -90도 회전이 적용된 상태)
                    const rotationMatrix = new THREE.Matrix4().makeRotationX(-Math.PI / 2);
                    
                    // Y축 회전 행렬 생성 (선박의 direction 값 사용)
                    // 주의: 미니맵에서 선박 방향 표시를 위해 direction에 맞는 회전 필요
                    const directionMatrix = new THREE.Matrix4().makeRotationY(item.entity.direction);
                    
                    // 회전 행렬을 조합하여 최종 회전 계산
                    rotationMatrix.multiply(directionMatrix);
                    
                    // 회전 행렬에서 쿼터니언 계산
                    const quaternion = new THREE.Quaternion();
                    quaternion.setFromRotationMatrix(rotationMatrix);
                    
                    // 마커의 쿼터니언 설정
                    item.marker.quaternion.copy(quaternion);
                }
                
                // 라벨 위치도 업데이트
                if (item.label) {
                    item.label.position.x = item.marker.position.x;
                    item.label.position.z = item.marker.position.z;
                    item.label.position.y = item.marker.position.y + 10;
                }
            }
        });
        
        // 섬 마커 위치 업데이트 (섬의 위치가 변경될 경우)
        this.islands.forEach(item => {
            if (item.island && item.marker) {
                const islandPos = item.island.group 
                    ? item.island.group.position 
                    : (item.island.mesh ? item.island.mesh.position : null);
                    
                if (islandPos) {
                    item.marker.position.x = islandPos.x * this.options.zoom;
                    item.marker.position.z = islandPos.z * this.options.zoom;
                }
            }
        });
        
        // 카메라 위치 업데이트 (플레이어 추적 옵션)
        if (this.player && this.player.mesh && this.options.followPlayer) {
            // 플레이어 중심으로 카메라 이동
            const targetX = -this.player.mesh.position.x * this.options.zoom;
            const targetZ = -this.player.mesh.position.z * this.options.zoom;
            
            // 부드러운 이동을 위한 보간
            this.camera.position.x += (targetX - this.camera.position.x) * 0.1;
            this.camera.position.z += (targetZ - this.camera.position.z) * 0.1;
            
            // lookAt 타겟도 같이 이동
            this.camera.lookAt(
                this.camera.position.x, 
                0, 
                this.camera.position.z
            );
        }
    }
}

export default Minimap; 