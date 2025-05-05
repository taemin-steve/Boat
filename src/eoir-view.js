// CDN으로부터 로드된 THREE를 사용
// import * as THREE from 'three'; 제거

const canvas = document.getElementById('eoirCanvas');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.outputColorSpace = THREE.SRGBColorSpace;  // ✅ 색감 복원 핵심
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0.1, 1000);
camera.position.z = 1;

// 메인 이미지 표시용 평면
const geometry = new THREE.PlaneGeometry(2, 2);
const material = new THREE.MeshBasicMaterial({
    transparent: true,
    depthTest: false
});
material.color = new THREE.Color(1, 1, 1);
const plane = new THREE.Mesh(geometry, material);
scene.add(plane);

// UI 요소를 위한 별도 씬과 카메라
const uiScene = new THREE.Scene();
const uiCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 10);

// UI 요소 생성 함수
function createUIElements() {
    // 십자선 생성
    const crosshairMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.7 });
    
    // 수평선
    const hLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.1, 0, 0),
        new THREE.Vector3(-0.02, 0, 0),
        new THREE.Vector3(0.02, 0, 0),
        new THREE.Vector3(0.1, 0, 0)
    ]);
    const hLine = new THREE.Line(hLineGeometry, crosshairMaterial);
    
    // 수직선
    const vLineGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0, -0.1, 0),
        new THREE.Vector3(0, -0.02, 0),
        new THREE.Vector3(0, 0.02, 0),
        new THREE.Vector3(0, 0.1, 0)
    ]);
    const vLine = new THREE.Line(vLineGeometry, crosshairMaterial);
    
    // 십자선 중앙 원
    const circleGeometry = new THREE.RingGeometry(0.01, 0.015, 32);
    const circle = new THREE.Mesh(circleGeometry, crosshairMaterial);
    
    uiScene.add(hLine);
    uiScene.add(vLine);
    uiScene.add(circle);
    
    // 모서리 마커 생성
    const cornerMarkerMaterial = new THREE.LineBasicMaterial({ color: 0x00FF00, transparent: true, opacity: 0.6 });
    
    // 좌상단 마커
    const tlMarkerGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.95, 0.95, 0),
        new THREE.Vector3(-0.95, 0.85, 0),
        new THREE.Vector3(-0.95, 0.95, 0),
        new THREE.Vector3(-0.85, 0.95, 0)
    ]);
    const tlMarker = new THREE.Line(tlMarkerGeometry, cornerMarkerMaterial);
    
    // 우상단 마커
    const trMarkerGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.95, 0.95, 0),
        new THREE.Vector3(0.95, 0.85, 0),
        new THREE.Vector3(0.95, 0.95, 0),
        new THREE.Vector3(0.85, 0.95, 0)
    ]);
    const trMarker = new THREE.Line(trMarkerGeometry, cornerMarkerMaterial);
    
    // 좌하단 마커
    const blMarkerGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.95, -0.95, 0),
        new THREE.Vector3(-0.95, -0.85, 0),
        new THREE.Vector3(-0.95, -0.95, 0),
        new THREE.Vector3(-0.85, -0.95, 0)
    ]);
    const blMarker = new THREE.Line(blMarkerGeometry, cornerMarkerMaterial);
    
    // 우하단 마커
    const brMarkerGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(0.95, -0.95, 0),
        new THREE.Vector3(0.95, -0.85, 0),
        new THREE.Vector3(0.95, -0.95, 0),
        new THREE.Vector3(0.85, -0.95, 0)
    ]);
    const brMarker = new THREE.Line(brMarkerGeometry, cornerMarkerMaterial);
    
    uiScene.add(tlMarker);
    uiScene.add(trMarker);
    uiScene.add(blMarker);
    uiScene.add(brMarker);
    
    // 드론 ID 텍스트 표시를 위한 캔버스 생성
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    ctx.fillStyle = '#00FF00';
    ctx.font = 'bold 24px Arial';
    ctx.fillText('드론 #1 EOIR', 10, 30);
    
    const droneIdTexture = new THREE.CanvasTexture(canvas);
    const droneIdMaterial = new THREE.SpriteMaterial({
        map: droneIdTexture,
        transparent: true
    });
    const droneIdSprite = new THREE.Sprite(droneIdMaterial);
    droneIdSprite.scale.set(0.5, 0.12, 1);
    droneIdSprite.position.set(-0.7, 0.9, 0);
    uiScene.add(droneIdSprite);
    
    // 경계 가이드라인
    const borderGeometry = new THREE.BufferGeometry().setFromPoints([
        new THREE.Vector3(-0.98, -0.98, 0),
        new THREE.Vector3(-0.98, 0.98, 0),
        new THREE.Vector3(0.98, 0.98, 0),
        new THREE.Vector3(0.98, -0.98, 0),
        new THREE.Vector3(-0.98, -0.98, 0)
    ]);
    const borderLine = new THREE.Line(borderGeometry, new THREE.LineBasicMaterial({ 
        color: 0x00FF00, 
        transparent: true, 
        opacity: 0.3 
    }));
    uiScene.add(borderLine);
    
    return {
        crosshair: { hLine, vLine, circle },
        corners: { tlMarker, trMarker, blMarker, brMarker },
        border: borderLine,
        droneIdSprite: droneIdSprite,
        droneIdCanvas: canvas
    };
}

// 스캔라인 효과 생성
function createScanLines() {
    const scanlineCount = 50;
    const scanlineOpacity = 0.15;
    const scanlineMaterial = new THREE.LineBasicMaterial({ 
        color: 0x00FF00, 
        transparent: true, 
        opacity: scanlineOpacity 
    });
    
    const scanlines = [];
    for (let i = 0; i < scanlineCount; i++) {
        const y = -1 + (i / scanlineCount) * 2;
        const scanlineGeometry = new THREE.BufferGeometry().setFromPoints([
            new THREE.Vector3(-1, y, 0),
            new THREE.Vector3(1, y, 0)
        ]);
        const scanline = new THREE.Line(scanlineGeometry, scanlineMaterial);
        uiScene.add(scanline);
        scanlines.push(scanline);
    }
    
    return scanlines;
}

let destroyedOverlay;
let overlayScene;
let overlayCamera;
let currentTexturePromise = null;
let uiElements;
let scanlines;
let time = 0;

function createDestroyedTexture() {
    const canvas = document.createElement('canvas');
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext('2d');

    // 검은 배경에 빨간 X 그리기
    ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'red';
    ctx.lineWidth = 20;
    ctx.beginPath();
    ctx.moveTo(50, 50);
    ctx.lineTo(canvas.width - 50, canvas.height - 50);
    ctx.moveTo(canvas.width - 50, 50);
    ctx.lineTo(50, canvas.height - 50);
    ctx.stroke();

    return new THREE.CanvasTexture(canvas);
}

function init() {
    // 오버레이 씬과 카메라 설정
    overlayScene = new THREE.Scene();
    overlayCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    
    // 파괴 오버레이 생성
    const destroyedTexture = createDestroyedTexture();
    const overlayGeometry = new THREE.PlaneGeometry(2, 2);
    const overlayMaterial = new THREE.MeshBasicMaterial({
        map: destroyedTexture,
        transparent: true,
        depthTest: false
    });
    destroyedOverlay = new THREE.Mesh(overlayGeometry, overlayMaterial);
    overlayScene.add(destroyedOverlay);
    destroyedOverlay.visible = false;
    
    // UI 요소 생성
    uiElements = createUIElements();
    scanlines = createScanLines();
}

// 초기화 함수 호출
init();

// 텍스처 로더 생성
const textureLoader = new THREE.TextureLoader();

// 텍스처 로딩을 Promise로 래핑
function loadTextureAsync(imageData) {
    return new Promise((resolve, reject) => {
        const texture = textureLoader.load(
            imageData,
            (texture) => {
                texture.flipY = false;  // ⬅️ 상하 반전 방지
                texture.colorSpace = THREE.SRGBColorSpace;
                material.toneMapped = false; 
                resolve(texture);
            },
            undefined,
            (error) => reject(error)
        );
    });
}

// 스캔라인 애니메이션 업데이트
function updateScanlines() {
    if (!scanlines) return;
    
    const speed = 0.01;
    time += speed;
    
    // 모든 스캔라인에 애니메이션 적용
    scanlines.forEach((line, index) => {
        // 시간에 따라 불규칙하게 깜박이는 효과
        const flicker = Math.sin(time * 10 + index * 0.1) * 0.05 + 0.1;
        line.material.opacity = Math.max(0.05, Math.min(0.2, flicker));
    });
}

// 십자선 깜박임 효과
function updateCrosshair() {
    if (!uiElements || !uiElements.crosshair) return;
    
    const { hLine, vLine, circle } = uiElements.crosshair;
    const flicker = Math.sin(time * 3) * 0.1 + 0.6;
    
    hLine.material.opacity = flicker;
    vLine.material.opacity = flicker;
    circle.material.opacity = flicker;
}

window.addEventListener('message', async (event) => {
    if (event.data.type === 'eoirFrame') {
        try {
            // 이전 텍스처 로딩이 진행 중이면 취소
            if (currentTexturePromise) {
                return;
            }

            currentTexturePromise = loadTextureAsync(event.data.imageData);
            const texture = await currentTexturePromise;
            
            material.map = texture;
            material.needsUpdate = true;
            
            currentTexturePromise = null;
            
            // 파괴 상태에 따라 오버레이 표시/숨김
            destroyedOverlay.visible = event.data.isDestroyed;
            
            // 드론 ID 업데이트
            if (event.data.droneId !== undefined && uiElements && uiElements.droneIdCanvas && uiElements.droneIdSprite) {
                const ctx = uiElements.droneIdCanvas.getContext('2d');
                ctx.clearRect(0, 0, uiElements.droneIdCanvas.width, uiElements.droneIdCanvas.height);
                ctx.fillStyle = '#00FF00';
                ctx.font = 'bold 24px Arial';
                ctx.fillText(`드론 #${event.data.droneId} EOIR`, 10, 30);
                
                // 텍스처 업데이트
                if (uiElements.droneIdSprite.material && uiElements.droneIdSprite.material.map) {
                    uiElements.droneIdSprite.material.map.needsUpdate = true;
                }
            }
        } catch (error) {
            console.error('텍스처 로딩 실패:', error);
            currentTexturePromise = null;
        }
    }
});

function animate() {
    requestAnimationFrame(animate);
    
    // EOIR 이미지 렌더링
    renderer.render(scene, camera);
    
    // UI 요소 업데이트
    updateScanlines();
    updateCrosshair();
    
    // UI 요소 렌더링
    renderer.autoClear = false;  // 이전 렌더링 결과를 지우지 않음
    renderer.render(uiScene, uiCamera);
    
    // 오버레이가 보이는 경우에만 렌더링
    if (destroyedOverlay && destroyedOverlay.visible) {
        renderer.render(overlayScene, overlayCamera);
    }
    
    renderer.autoClear = true;  // 다음 프레임에 대해 원래 상태로 복원
}
animate();

window.addEventListener('resize', () => {
    renderer.setSize(window.innerWidth, window.innerHeight);
}); 