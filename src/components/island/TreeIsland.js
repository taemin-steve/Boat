import * as THREE from 'three';
import Island from './island';

class TreeIsland extends Island {
    constructor(options = {}) {
        super(options);
        this.group = null;
        this.mesh = null;
        this.groundMesh = null;
        this.rockMeshes = [];
        this.fogMeshes = [];
        this.valleyMesh = null;
    }

    create(scene) {
        // 섬 그룹 생성 (모든 섬 요소 포함)
        this.group = new THREE.Group();
        this.group.position.copy(this.options.position);
        
        // 1. 지형 생성 (산 형태)
        this.createTerrain();
        
        // 3. 돌덩어리 생성
        this.createRocks();

        // 충돌체 생성
        this.collider = new THREE.Box3().setFromObject(this.mesh);
        
        // 씬에 그룹 추가
        scene.add(this.group);

        return this;
    }
    
    // 간단한 2D 노이즈 함수
    noise2D(x, z, seed = 42) {
        // 간단한 해시 기반 노이즈
        const hash = (x, z) => {
            const h = (x * 12.9898 + z * 78.233 + seed) % 1000;
            return Math.sin(h) * 43758.5453 % 1;
        };

        // 정수 좌표와 소수 부분 분리
        const ix = Math.floor(x);
        const iz = Math.floor(z);
        const fx = x - ix;
        const fz = z - iz;
        
        // 4개 코너 값
        const a = hash(ix, iz);
        const b = hash(ix + 1, iz);
        const c = hash(ix, iz + 1);
        const d = hash(ix + 1, iz + 1);
        
        // 부드러운 보간 함수
        const smoothstep = t => t * t * (3 - 2 * t);
        
        // 보간
        const ux = smoothstep(fx);
        const uz = smoothstep(fz);
        
        // 보간된 값 반환
        return a * (1 - ux) * (1 - uz) + b * ux * (1 - uz) + c * (1 - ux) * uz + d * ux * uz;
    }
    
    // 간단한 옥타브 노이즈 (여러 주파수 노이즈 합치기)
    octaveNoise(x, z, octaves, persistence) {
        let total = 0;
        let frequency = 1;
        let amplitude = 1;
        let maxValue = 0;
        
        for (let i = 0; i < octaves; i++) {
            total += this.noise2D(x * frequency, z * frequency, i * 100) * amplitude;
            maxValue += amplitude;
            amplitude *= persistence;
            frequency *= 2;
        }
        
        return total / maxValue;
    }
    
    createTerrain() {
        const width = this.options.size.width;
        const depth = this.options.size.depth;
        const height = this.options.size.height;
        
        // 지형 지오메트리 생성
        const geometry = new THREE.PlaneGeometry(width, depth, 64, 64);
        geometry.rotateX(-Math.PI / 2); // 수평으로 회전
        
        // 각 정점의 높이 조정
        const positions = geometry.attributes.position;
        
        // 최대 높이 계산용 변수
        let maxHeight = 0;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            
            // 중심으로부터의 거리 계산
            const distFromCenter = Math.sqrt(x * x + z * z);
            const normalizedDist = 2 * distFromCenter / width;
            
            // 거리에 따른 감쇠 (가장자리로 갈수록 높이가 낮아짐)
            const falloff = Math.pow(1 - Math.min(1, normalizedDist), 2);
            
            // 옥타브 노이즈를 사용한 자연스러운 지형 생성
            const noise = this.octaveNoise(x * 0.01, z * 0.01, 4, 0.5) * 0.7;
            
            // 산 형태를 만들기 위한 기본 높이와 노이즈 적용
            const terrainHeight = falloff * height * (1 + noise);
            
            // 높이 설정
            positions.setY(i, terrainHeight);
            
            // 최대 높이 업데이트
            if (terrainHeight > maxHeight) {
                maxHeight = terrainHeight;
            }
        }
        
        // 법선 벡터 재계산
        geometry.computeVertexNormals();
        positions.needsUpdate = true;
        
        // 지형 재질 생성 (초록색 산)
        const mountainMaterial = new THREE.MeshStandardMaterial({
            color: 0x4CAF50,
            roughness: 0.9,
            metalness: 0.1,
            side: THREE.DoubleSide,
            flatShading: true
        });
        
        // 메시 생성
        this.mesh = new THREE.Mesh(geometry, mountainMaterial);
        this.mesh.castShadow = true;
        this.mesh.receiveShadow = true;
        
        // 그룹에 추가
        this.group.add(this.mesh);
        
        // 바닥 지형 생성 (어두운 갈색 땅)
        this.createGround(width, depth);
    }
    
    createGround(width, depth) {
        // 바닥 지오메트리
        const groundGeometry = new THREE.PlaneGeometry(width * 1.2, depth * 1.2, 1, 1);
        groundGeometry.rotateX(-Math.PI / 2);
        
        // 갈색 바닥 재질
        const groundMaterial = new THREE.MeshStandardMaterial({
            color: 0x5D4037, // 어두운 갈색
            roughness: 1.0,
            metalness: 0.0,
            side: THREE.DoubleSide
        });
        
        // 메시 생성
        this.groundMesh = new THREE.Mesh(groundGeometry, groundMaterial);
        this.groundMesh.position.y = -0.5; // 지형보다 아래에 위치
        this.groundMesh.receiveShadow = true;
        
        // 그룹에 추가
        this.group.add(this.groundMesh);
    }

    createRocks() {
        // 큰 돌덩어리 생성
        const rockCount = 5; // 큰 돌덩어리 5개
        
        for (let i = 0; i < rockCount; i++) {
            // 랜덤한 위치 선택 (섬의 중앙부 쪽으로)
            const angle = Math.random() * Math.PI * 2;
            const distance = Math.random() * this.options.size.width * 0.3;
            const x = Math.cos(angle) * distance;
            const z = Math.sin(angle) * distance;
            
            // 지형 높이 추정
            const heightAtPosition = this.getHeightAt(x, z);
            
            // 돌 지오메트리 생성
            let rockGeometry;
            const rockType = Math.floor(Math.random() * 3);
            
            switch (rockType) {
                case 0:
                    rockGeometry = new THREE.DodecahedronGeometry(
                        2 + Math.random() * 3, // 크기
                        0                      // 디테일 레벨
                    );
                    break;
                case 1:
                    rockGeometry = new THREE.OctahedronGeometry(
                        2 + Math.random() * 3,
                        0
                    );
                    break;
                case 2:
                default:
                    rockGeometry = new THREE.IcosahedronGeometry(
                        2 + Math.random() * 3,
                        0
                    );
                    break;
            }
            
            // 돌덩어리 모양 변형
            const positions = rockGeometry.attributes.position;
            for (let j = 0; j < positions.count; j++) {
                const vx = positions.getX(j);
                const vy = positions.getY(j);
                const vz = positions.getZ(j);
                
                // 약간의 변형 추가
                const noise = 0.2 + Math.random() * 0.4;
                positions.setXYZ(
                    j,
                    vx * (1 + noise * 0.2),
                    vy * (1 + noise * 0.1),
                    vz * (1 + noise * 0.2)
                );
            }
            
            positions.needsUpdate = true;
            rockGeometry.computeVertexNormals();
            
            // 돌 재질
            const rockMaterial = new THREE.MeshStandardMaterial({
                color: 0x757575, // 회색
                roughness: 0.9,
                metalness: 0.1,
                flatShading: true
            });
            
            // 돌 메시 생성
            const rockMesh = new THREE.Mesh(rockGeometry, rockMaterial);
            rockMesh.position.set(x, heightAtPosition, z);
            
            // 랜덤한 크기와 회전
            const scale = 0.8 + Math.random() * 1.5;
            rockMesh.scale.set(scale, scale * 0.8, scale);
            rockMesh.rotation.set(
                Math.random() * Math.PI,
                Math.random() * Math.PI,
                Math.random() * Math.PI
            );
            
            rockMesh.castShadow = true;
            rockMesh.receiveShadow = true;
            
            // 배열과 그룹에 추가
            this.rockMeshes.push(rockMesh);
            this.group.add(rockMesh);
        }
    }
    
    update(time) {
        super.update(time);
        
        // 계곡(강물) 애니메이션 - 단순화
        if (this.valleyMesh && this.valleyMesh.material) {
            // 물 색상 약간 변화 - 파란색 범위 내에서만
            const hue = 0.58 + Math.sin(time * 0.001) * 0.02;
            this.valleyMesh.material.color.setHSL(hue, 0.75, 0.55);
        }
    }
    
    getHeightAt(x, z) {
        if (!this.mesh) return 0;
        
        // 중심으로부터의 거리 계산
        const distFromCenter = Math.sqrt(x * x + z * z);
        const normalizedDist = 2 * distFromCenter / this.options.size.width;
        
        // 거리에 따른 감쇠
        const falloff = Math.pow(1 - Math.min(1, normalizedDist), 2);
        
        // 옥타브 노이즈
        const noise = this.octaveNoise(x * 0.01, z * 0.01, 4, 0.5) * 0.7;
        
        // 높이 계산
        return falloff * this.options.size.height * (1 + noise);
    }
}

export default TreeIsland;