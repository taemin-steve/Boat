import * as THREE from 'three';

class Ocean {
    constructor(options = {}) {
        this.oceanSize = options.oceanSize || 2000;
        this.gridSize = options.gridSize || 64;
        this.waveHeight = options.waveHeight || 5.0;
        this.waveSpeed = options.waveSpeed || 1.2;
        
        this.oceanMesh = null;
        this.wireframe = null;
        this.horizon = null;
        this.oceanFloor = null;
        
        // 바다 색상을 더 짙은 푸른색으로 설정
        this.deepColor = options.deepColor || new THREE.Color(0x001a44);
        this.shallowColor = options.shallowColor || new THREE.Color(0x003388);
        
        // 디버그용
        this._lastUpdateTime = 0;
    }
    
    create(scene) {
        this.createOcean(scene);
        this.createHorizon(scene);
        return this;
    }
    
    createOcean(scene) {
        // 삼각형으로 구성된 바다 지오메트리 생성
        const geometry = new THREE.BufferGeometry();
        
        // 그리드 크기에 따른 정점 및 삼각형 생성
        const gridSize = this.gridSize;
        const cellSize = this.oceanSize / gridSize;
        
        // 정점 위치 배열
        const vertices = [];
        const indices = [];
        const colors = [];
        
        // 정점 생성
        for (let z = 0; z <= gridSize; z++) {
            for (let x = 0; x <= gridSize; x++) {
                const posX = (x * cellSize) - (this.oceanSize / 2);
                const posZ = (z * cellSize) - (this.oceanSize / 2);
                
                vertices.push(posX, 0, posZ);
                
                // 중심에서 멀어질수록 깊은 바다 색상으로
                const distanceFromCenter = Math.sqrt(posX * posX + posZ * posZ) / (this.oceanSize * 0.5);
                const depthFactor = Math.min(distanceFromCenter, 1);
                
                // 깊은 바다와 얕은 바다 색상을 혼합
                const color = new THREE.Color().lerpColors(
                    this.shallowColor,
                    this.deepColor,
                    depthFactor
                );
                
                colors.push(color.r, color.g, color.b);
            }
        }
        
        // 삼각형 인덱스 생성
        for (let z = 0; z < gridSize; z++) {
            for (let x = 0; x < gridSize; x++) {
                const a = z * (gridSize + 1) + x;
                const b = z * (gridSize + 1) + x + 1;
                const c = (z + 1) * (gridSize + 1) + x;
                const d = (z + 1) * (gridSize + 1) + x + 1;
                
                // 각 사각형은 두 개의 삼각형으로 구성
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }
        
        // 버퍼 지오메트리에 정점과 인덱스 설정
        geometry.setIndex(indices);
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
        
        // 바다 머티리얼 생성 (정점 색상 사용)
        const material = new THREE.MeshPhongMaterial({
            vertexColors: true,
            side: THREE.DoubleSide,
            flatShading: true,
            transparent: true,
            opacity: 0.95,
            shininess: 150,
            specular: 0x0055aa
        });
        
        // 바다 메쉬 생성
        this.oceanMesh = new THREE.Mesh(geometry, material);
        scene.add(this.oceanMesh);
        
        // 초기 파도 설정
        this.updateWaves(0);
        
        // 각 삼각형 윤곽선 표시 - 파도 윤곽 강조
        const wireframeMaterial = new THREE.LineBasicMaterial({
            color: 0x0055aa,
            transparent: true,
            opacity: 0.25
        });
        
        const wireframe = new THREE.WireframeGeometry(geometry);
        this.wireframe = new THREE.LineSegments(wireframe, wireframeMaterial);
        scene.add(this.wireframe);
    }
    
    createHorizon(scene) {
        // 원통형 지평선 (수평선 효과)
        const horizonRadius = this.oceanSize * 0.95;
        const horizonHeight = 1;
        const horizonGeometry = new THREE.CylinderGeometry(
            horizonRadius, horizonRadius, horizonHeight, 128, 1, true
        );
        
        const horizonMaterial = new THREE.MeshBasicMaterial({
            color: this.deepColor,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.9
        });
        
        this.horizon = new THREE.Mesh(horizonGeometry, horizonMaterial);
        this.horizon.position.y = -horizonHeight / 2;
        scene.add(this.horizon);
        
        // 바다 바닥 (더욱 어두운 색상)
        const oceanFloorGeometry = new THREE.CircleGeometry(horizonRadius, 64);
        const oceanFloorMaterial = new THREE.MeshBasicMaterial({
            color: 0x000d22,
            side: THREE.DoubleSide
        });
        
        this.oceanFloor = new THREE.Mesh(oceanFloorGeometry, oceanFloorMaterial);
        this.oceanFloor.rotation.x = -Math.PI / 2;
        this.oceanFloor.position.y = -5;
        scene.add(this.oceanFloor);
    }
    
    // 이 메서드는 매 프레임마다 호출되어야 합니다
    update(time) {
        // 디버그 로그 - 실제 업데이트가 일어나고 있는지 확인
        if (time - this._lastUpdateTime > 5) {
            console.log("Ocean update called at time:", time);
            this._lastUpdateTime = time;
        }
        
        this.updateWaves(time);
    }
    
    updateWaves(time) {
        if (!this.oceanMesh) return;
        
        const positions = this.oceanMesh.geometry.attributes.position;
        
        // 각 정점에 대해 파도 높이 계산
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            
            // 거리 계산 (중심에서 멀수록 잔잔한 파도)
            const distanceFromCenter = Math.min(Math.sqrt(x * x + z * z) / (this.oceanSize * 0.5), 1);
            const waveFactor = 1 - (distanceFromCenter * 0.7);
            
            // 여러 삼각 함수의 조합으로 파도 생성 - 주파수와 진폭 조정
            const height = 
                Math.sin(x * 0.07 + time * this.waveSpeed) * this.waveHeight * 0.6 * waveFactor +
                Math.sin(z * 0.05 + time * this.waveSpeed * 0.9) * this.waveHeight * 0.4 * waveFactor +
                Math.sin((x + z) * 0.04 + time * this.waveSpeed * 1.3) * this.waveHeight * 0.3 * waveFactor;
            
            positions.setY(i, height);
        }
        
        positions.needsUpdate = true;
        this.oceanMesh.geometry.computeVertexNormals();
        
        // 와이어프레임도 업데이트
        if (this.wireframe) {
            this.wireframe.geometry.attributes.position = positions;
            this.wireframe.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    // 특정 위치에서의 파도 높이 계산
    getWaveHeight(x, z, time) {
        const distanceFromCenter = Math.min(Math.sqrt(x * x + z * z) / (this.oceanSize * 0.5), 1);
        const waveFactor = 1 - (distanceFromCenter * 0.7);
        
        return Math.sin(x * 0.07 + time * this.waveSpeed) * this.waveHeight * 0.6 * waveFactor +
               Math.sin(z * 0.05 + time * this.waveSpeed * 0.9) * this.waveHeight * 0.4 * waveFactor +
               Math.sin((x + z) * 0.04 + time * this.waveSpeed * 1.3) * this.waveHeight * 0.3 * waveFactor;
    }
    
    // 특정 위치에서의 파도 기울기 계산
    getWaveSlope(x, z, time) {
        const distanceFromCenter = Math.min(Math.sqrt(x * x + z * z) / (this.oceanSize * 0.5), 1);
        const waveFactor = 1 - (distanceFromCenter * 0.7);
        
        const slopeX = 
            Math.cos(x * 0.07 + time * this.waveSpeed) * this.waveHeight * 0.03 * waveFactor +
            Math.cos((x + z) * 0.04 + time * this.waveSpeed * 1.3) * this.waveHeight * 0.015 * waveFactor;
            
        const slopeZ = 
            Math.cos(z * 0.05 + time * this.waveSpeed * 0.9) * this.waveHeight * 0.03 * waveFactor +
            Math.cos((x + z) * 0.04 + time * this.waveSpeed * 1.3) * this.waveHeight * 0.015 * waveFactor;
            
        return { slopeX, slopeZ };
    }
}

export default Ocean; 