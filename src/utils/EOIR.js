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
                    <title>EOIR 카메라 뷰</title>
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
                            cursor: pointer;
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
            
            // 창이 열리면 즉시 포커스 이동
            eoirWindow.focus();
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
    // EOIR 창이 닫혀있거나, 선박이 없거나, EOIR 카메라가 없으면 무시
    if (!isEoirWindowOpen || !eoirWindow || eoirWindow.closed || !mainShip || !mainShip.eoirCamera) {
        return;
    }
    
    // 렌더러가 생성되어 있지 않으면 무시
    if (!eoirRenderer) {
        console.log('EOIR 렌더러가 초기화되지 않았습니다. 재시도합니다.');
        // 다음 프레임에서 다시 시도하도록 렌더러 재초기화
        setTimeout(() => {
            if (eoirWindow && !eoirWindow.closed) {
                const canvas = eoirWindow.document.querySelector('canvas');
                if (canvas) {
                    eoirRenderer = new THREE.WebGLRenderer({ 
                        canvas: canvas, 
                        antialias: true 
                    });
                    eoirRenderer.setSize(eoirWindow.innerWidth, eoirWindow.innerHeight);
                    eoirRenderer.outputColorSpace = THREE.SRGBColorSpace;
                }
            }
        }, 100);
        return;
    }
    
    try {
        // EOIR 카메라 설정 업데이트 (화면 크기에 맞게)
        if (mainShip.eoirCamera.aspect !== eoirWindow.innerWidth / eoirWindow.innerHeight) {
            mainShip.eoirCamera.aspect = eoirWindow.innerWidth / eoirWindow.innerHeight;
            mainShip.eoirCamera.updateProjectionMatrix();
        }
        
        // 현재 선택된 드론의 EOIR 카메라로 씬을 렌더링
        eoirRenderer.autoClear = true;
        eoirRenderer.render(world.scene, mainShip.eoirCamera);
        
        // 정보 요소 업데이트
        const infoElement = eoirWindow.document.getElementById('info');
        if (infoElement) {
            // EOIR 카메라 상태 정보
            let infoText = `드론 #${activeShipIndex + 1} EOIR - `;
            
            // 카메라 회전 각도 정보
            if (mainShip.eoirControls && mainShip.eoirControls.currentRotation) {
                const pan = Math.round(mainShip.eoirControls.currentRotation.pan * 180 / Math.PI);
                const tilt = Math.round(mainShip.eoirControls.currentRotation.tilt * 180 / Math.PI);
                infoText += `팬: ${pan}° 틸트: ${tilt}° `;
            }
            
            // 줌 정보
            if (mainShip.eoirCamera) {
                const fov = Math.round(mainShip.eoirCamera.fov);
                const zoom = Math.round(60 / fov * 40); // 40x를 기준으로 계산
                infoText += `줌: ${zoom}x - `;
            }
            
            // 시간 정보
            infoText += `${new Date().toLocaleTimeString()}`;
            
            // 정보 업데이트
            infoElement.textContent = infoText;
        }
    } catch (error) {
        console.error('EOIR 렌더링 중 오류 발생:', error);
        // 오류가 발생하면 렌더러 재초기화
        eoirRenderer = null;
    }
}

// EOIR 창이 열려있는지 확인하는 함수
export function isEoirOpen() {
    return isEoirWindowOpen && eoirWindow && !eoirWindow.closed;
} 