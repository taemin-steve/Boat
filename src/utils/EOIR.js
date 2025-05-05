import * as THREE from 'three';

// EOIR 관련 변수
let eoirWindow = null;
let isEoirWindowOpen = false;
let eoirRenderer = null;
let eoirRenderTarget = null;

/**
 * EOIR 창을 열거나 닫는 함수
 */
export function toggleEoirWindow() {
    if (isEoirWindowOpen && eoirWindow && !eoirWindow.closed) {
        eoirWindow.close();
        isEoirWindowOpen = false;
        eoirRenderer = null;
        eoirRenderTarget = null;
        console.log('EOIR 창 닫기');
    } else {
        // 새 창 열기
        eoirWindow = window.open('', 'EOIR View', 'width=800,height=600,resizable=yes');
        if (eoirWindow) {
            // HTML 설정
            eoirWindow.document.write(`
                <!DOCTYPE html>
                <html>
                <head>
                    <script src="https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js"></script>
                    <style>
                        body { margin: 0; overflow: hidden; background-color: #000; }
                        canvas { display: block; width: 100%; height: 100%; }
                        #info { position: absolute; top: 10px; left: 10px; color: #00FF00; font-family: monospace; z-index: 100; font-size: 14px; }
                        #crosshair { 
                            position: absolute; 
                            top: 50%; 
                            left: 50%; 
                            transform: translate(-50%, -50%); 
                            color: #00FF00; 
                            opacity: 0.7; 
                            font-size: 20px; 
                            z-index: 100;
                        }
                        .corner-marker {
                            position: absolute;
                            width: 30px;
                            height: 30px;
                            border: 2px solid #00FF00;
                            opacity: 0.6;
                            z-index: 100;
                        }
                        #top-left { top: 10px; left: 10px; border-right: none; border-bottom: none; }
                        #top-right { top: 10px; right: 10px; border-left: none; border-bottom: none; }
                        #bottom-left { bottom: 10px; left: 10px; border-right: none; border-top: none; }
                        #bottom-right { bottom: 10px; right: 10px; border-left: none; border-top: none; }
                        #scanlines {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            overflow: hidden;
                            pointer-events: none;
                            z-index: 50;
                        }
                        #scanlines:before {
                            content: "";
                            position: absolute;
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(
                                to bottom,
                                rgba(18, 196, 18, 0) 50%,
                                rgba(18, 196, 18, 0.25) 51%
                            );
                            background-size: 100% 4px;
                            pointer-events: none;
                            animation: scanlines 0.5s linear infinite;
                        }
                        @keyframes scanlines {
                            from { transform: translateY(0); }
                            to { transform: translateY(4px); }
                        }
                        #mode { 
                            position: absolute; 
                            top: 10px; 
                            right: 10px; 
                            color: #00FF00; 
                            font-family: monospace; 
                            z-index: 100;
                            font-size: 14px;
                        }
                        #thermal-overlay {
                            position: absolute;
                            top: 0;
                            left: 0;
                            width: 100%;
                            height: 100%;
                            background: linear-gradient(to right,
                                rgba(0, 0, 139, 0.3), /* 파란색 계열 - 낮은 온도 */
                                rgba(0, 128, 0, 0.1), /* 초록색 계열 - 중간 온도 */
                                rgba(255, 0, 0, 0.3) /* 빨간색 계열 - 높은 온도 */
                            );
                            mix-blend-mode: multiply;
                            pointer-events: none;
                            z-index: 40;
                            opacity: 0.6;
                        }
                    </style>
                </head>
                <body>
                    <div id="info">드론 EOIR 카메라</div>
                    <div id="crosshair">+</div>
                    <div class="corner-marker" id="top-left"></div>
                    <div class="corner-marker" id="top-right"></div>
                    <div class="corner-marker" id="bottom-left"></div>
                    <div class="corner-marker" id="bottom-right"></div>
                    <div id="thermal-overlay"></div>
                    <div id="mode">THERMAL</div>
                </body>
                </html>
            `);
            
            // 캔버스 생성
            const newCanvas = document.createElement('canvas');
            eoirWindow.document.body.insertBefore(newCanvas, eoirWindow.document.body.firstChild);
            
            // 렌더러 생성
            eoirRenderer = new THREE.WebGLRenderer({ 
                canvas: newCanvas, 
                antialias: true 
            });
            eoirRenderer.setSize(eoirWindow.innerWidth, eoirWindow.innerHeight);
            eoirRenderer.outputColorSpace = THREE.SRGBColorSpace;
            
            // 효과 전환 이벤트 리스너 추가
            const modeElement = eoirWindow.document.getElementById('mode');
            const thermalOverlay = eoirWindow.document.getElementById('thermal-overlay');
            
            if (modeElement && thermalOverlay) {
                modeElement.addEventListener('click', function() {
                    if (this.textContent === 'THERMAL') {
                        this.textContent = 'NIGHT VISION';
                        thermalOverlay.style.background = 'linear-gradient(to right, rgba(0, 255, 0, 0.3), rgba(0, 255, 0, 0.3))';
                        this.style.color = '#00FF00';
                    } else {
                        this.textContent = 'THERMAL';
                        thermalOverlay.style.background = 'linear-gradient(to right, rgba(0, 0, 139, 0.3), rgba(0, 128, 0, 0.1), rgba(255, 0, 0, 0.3))';
                        this.style.color = '#00FF00';
                    }
                });
            }
            
            // 창이 닫힐 때 상태 업데이트
            eoirWindow.addEventListener('beforeunload', () => {
                isEoirWindowOpen = false;
                eoirRenderer = null;
                eoirRenderTarget = null;
                console.log('EOIR 창이 닫혔습니다');
            });
            
            // 창 크기 변경 시 렌더러 크기 업데이트
            eoirWindow.addEventListener('resize', () => {
                if (eoirRenderer) {
                    eoirRenderer.setSize(eoirWindow.innerWidth, eoirWindow.innerHeight);
                }
            });
            
            isEoirWindowOpen = true;
            console.log('EOIR 창 열기');
        } else {
            console.error('EOIR 창을 열 수 없습니다. 팝업 차단을 확인하세요.');
        }
    }
}

/**
 * EOIR 이미지를 새 창에 직접 렌더링하는 함수
 * @param {Object} world - 월드 객체
 * @param {Object} mainShip - 현재 선택된 선박
 * @param {number} activeShipIndex - 현재 선택된 선박 인덱스
 */
export function captureAndSendEoirFrame(world, mainShip, activeShipIndex) {
    if (!isEoirWindowOpen || !eoirWindow || eoirWindow.closed || !mainShip || !mainShip.eoirCamera) {
        return;
    }
    
    // 렌더러가 생성되어 있지 않으면 무시
    if (!eoirRenderer) {
        return;
    }
    
    // 현재 드론 카메라의 설정을 복사
    mainShip.eoirCamera.updateProjectionMatrix();
    
    // 현재 선택된 드론의 EOIR 카메라로 씬을 렌더링 (셰이더 효과 적용)
    eoirRenderer.autoClear = true;
    eoirRenderer.render(world.scene, mainShip.eoirCamera);
    
    // 정보 요소 업데이트
    const infoElement = eoirWindow.document.getElementById('info');
    if (infoElement) {
        const pan = Math.round(mainShip.eoirControls.currentRotation.pan * 180 / Math.PI);
        const tilt = Math.round(mainShip.eoirControls.currentRotation.tilt * 180 / Math.PI);
        const fov = Math.round(mainShip.eoirCamera.fov);
        const zoom = Math.round(60 / fov * 40); // 40x를 기준으로 계산
        
        infoElement.textContent = `드론 #${activeShipIndex + 1} EOIR - 팬: ${pan}° 틸트: ${tilt}° 줌: ${zoom}x - ${new Date().toLocaleTimeString()}`;
    }
}

// EOIR 창이 열려있는지 확인하는 함수
export function isEoirOpen() {
    return isEoirWindowOpen && eoirWindow && !eoirWindow.closed;
} 