/**
 * 사용자 인터페이스 관리 클래스
 * - 화면 분할 오버레이
 * - 정보 표시 UI 요소
 */
class InterfaceManager {
    constructor() {
        // UI 요소 참조
        this.splitLine = null;
        this.mainViewLabel = null;
        this.eoirViewLabel = null;
        this.eoirStatus = null;
        this.controlGuide = null;
        this.moveGuide = null;
        
        // 내부 상태
        this.initialized = false;
    }
    
    /**
     * 분할선 오버레이 그리기
     * @param {boolean} splitScreenMode - 화면 분할 모드 여부
     */
    drawSplitLineOverlay(splitScreenMode) {
        // DOM 요소가 없으면 생성
        if (!this.splitLine) {
            this.splitLine = document.createElement('div');
            this.splitLine.id = 'split-line';
            this.splitLine.style.position = 'absolute';
            this.splitLine.style.top = '0';
            this.splitLine.style.width = '2px';
            this.splitLine.style.height = '100%';
            this.splitLine.style.backgroundColor = 'white';
            this.splitLine.style.zIndex = '1000';
            document.body.appendChild(this.splitLine);
        }
        
        // 위치 업데이트
        this.splitLine.style.left = (window.innerWidth / 2 - 1) + 'px';
        this.splitLine.style.display = splitScreenMode ? 'block' : 'none';
    }
    
    /**
     * 뷰 정보 표시
     * @param {number} activeShipIndex - 현재 활성화된 선박 인덱스
     * @param {boolean} useShipCamera - 선박 카메라 사용 여부
     * @param {boolean} splitScreenMode - 화면 분할 모드 여부
     * @param {Object} mainShip - 메인 선박 객체
     */
    drawViewInfo(activeShipIndex, useShipCamera, splitScreenMode, mainShip) {
        // 메인 뷰 라벨
        if (!this.mainViewLabel) {
            this.mainViewLabel = document.createElement('div');
            this.mainViewLabel.id = 'main-view-label';
            this.mainViewLabel.style.position = 'absolute';
            this.mainViewLabel.style.top = '10px';
            this.mainViewLabel.style.left = '10px';
            this.mainViewLabel.style.color = 'white';
            this.mainViewLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            this.mainViewLabel.style.padding = '5px';
            this.mainViewLabel.style.borderRadius = '3px';
            this.mainViewLabel.style.fontFamily = 'Arial, sans-serif';
            this.mainViewLabel.style.fontSize = '14px';
            this.mainViewLabel.style.zIndex = '1001';
            document.body.appendChild(this.mainViewLabel);
        }
        
        // EOIR 뷰 라벨을 미니맵 뷰 라벨로 변경
        if (!this.eoirViewLabel) {
            this.eoirViewLabel = document.createElement('div');
            this.eoirViewLabel.id = 'minimap-view-label';
            this.eoirViewLabel.style.position = 'absolute';
            this.eoirViewLabel.style.top = '10px';
            this.eoirViewLabel.style.color = 'white';
            this.eoirViewLabel.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            this.eoirViewLabel.style.padding = '5px';
            this.eoirViewLabel.style.borderRadius = '3px';
            this.eoirViewLabel.style.fontFamily = 'Arial, sans-serif';
            this.eoirViewLabel.style.fontSize = '14px';
            this.eoirViewLabel.style.zIndex = '1001';
            document.body.appendChild(this.eoirViewLabel);
        }
        
        // 위치와 내용 업데이트
        this.mainViewLabel.textContent = `드론 #${activeShipIndex + 1} ${useShipCamera ? '(1인칭 카메라)' : '(3인칭 카메라)'} - 화살표 키로 이동 | Ctrl+숫자로 드론 전환`;
        this.mainViewLabel.style.display = splitScreenMode ? 'block' : 'none';
        
        // 미니맵 라벨로 변경
        this.eoirViewLabel.textContent = `미니맵 - M키로 확대/축소 | O키로 EOIR 창 열기`;
        this.eoirViewLabel.style.left = (window.innerWidth / 2 + 10) + 'px';
        this.eoirViewLabel.style.display = splitScreenMode ? 'block' : 'none';
        
        // EOIR 카메라 상태 표시
        if (mainShip && mainShip.eoirCamera) {
            if (!this.eoirStatus) {
                this.eoirStatus = document.createElement('div');
                this.eoirStatus.id = 'eoir-status';
                this.eoirStatus.style.position = 'absolute';
                this.eoirStatus.style.bottom = '10px';
                this.eoirStatus.style.right = '10px';
                this.eoirStatus.style.color = 'white';
                this.eoirStatus.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                this.eoirStatus.style.padding = '5px';
                this.eoirStatus.style.borderRadius = '3px';
                this.eoirStatus.style.fontFamily = 'monospace';
                this.eoirStatus.style.fontSize = '12px';
                this.eoirStatus.style.zIndex = '1001';
                document.body.appendChild(this.eoirStatus);
            }
            
            // 컨트롤 가이드 생성
            if (!this.controlGuide) {
                this.controlGuide = document.createElement('div');
                this.controlGuide.id = 'control-guide';
                this.controlGuide.style.position = 'absolute';
                this.controlGuide.style.bottom = '10px';
                this.controlGuide.style.left = (window.innerWidth / 2 + 10) + 'px';
                this.controlGuide.style.color = 'white';
                this.controlGuide.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
                this.controlGuide.style.padding = '5px';
                this.controlGuide.style.borderRadius = '3px';
                this.controlGuide.style.fontFamily = 'monospace';
                this.controlGuide.style.fontSize = '12px';
                this.controlGuide.style.zIndex = '1001';
                document.body.appendChild(this.controlGuide);
            }
            
            const pan = Math.round(mainShip.eoirControls.currentRotation.pan * 180 / Math.PI);
            const tilt = Math.round(mainShip.eoirControls.currentRotation.tilt * 180 / Math.PI);
            const fov = Math.round(mainShip.eoirCamera.fov);
            const zoom = Math.round(60 / fov * 40); // 40x를 기준으로 계산
            
            this.eoirStatus.textContent = `EOIR 상태: 팬: ${pan}° 틸트: ${tilt}° 줌: ${zoom}x`;
            this.eoirStatus.style.display = splitScreenMode ? 'block' : 'none';
            
            this.controlGuide.innerHTML = `EOIR 제어: W/S - 틸트 상/하 | A/D - 팬 좌/우 | Q/E - 줌 인/아웃`;
            this.controlGuide.style.display = splitScreenMode ? 'block' : 'none';
        }
        
        // 이동 컨트롤 가이드
        if (!this.moveGuide) {
            this.moveGuide = document.createElement('div');
            this.moveGuide.id = 'move-guide';
            this.moveGuide.style.position = 'absolute';
            this.moveGuide.style.bottom = '10px';
            this.moveGuide.style.left = '10px';
            this.moveGuide.style.color = 'white';
            this.moveGuide.style.backgroundColor = 'rgba(0, 0, 0, 0.5)';
            this.moveGuide.style.padding = '5px';
            this.moveGuide.style.borderRadius = '3px';
            this.moveGuide.style.fontFamily = 'monospace';
            this.moveGuide.style.fontSize = '12px';
            this.moveGuide.style.zIndex = '1001';
            document.body.appendChild(this.moveGuide);
        }
        
        this.moveGuide.innerHTML = `조작: ↑/↓ - 전진/후진 | ←/→ - 좌/우회전 | C - 카메라 전환 | V - 화면분할 | Ctrl+1~5 - 드론 전환`;
        this.moveGuide.style.display = 'block';
    }

    // 미니맵 테두리 그리기 함수
    drawMinimapBorder(viewport) {
        // 미니맵 테두리 스타일 설정
        const ctx = this.ctx;
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.lineWidth = 2;
        
        // 테두리 그리기
        ctx.beginPath();
        ctx.rect(viewport.x, viewport.y, viewport.width, viewport.height);
        ctx.stroke();
        
        // 미니맵 제목 표시
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(viewport.x, viewport.y - 25, 80, 25);
        
        ctx.fillStyle = 'white';
        ctx.font = '14px Arial';
        ctx.fillText('미니맵', viewport.x + 10, viewport.y - 8);
        
        // 확대/축소 안내 표시
        ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
        ctx.fillRect(viewport.x + viewport.width - 120, viewport.y + viewport.height - 25, 120, 25);
        
        ctx.fillStyle = 'white';
        ctx.font = '12px Arial';
        ctx.fillText('M키: 확대/축소', viewport.x + viewport.width - 110, viewport.y + viewport.height - 8);
    }
}

// 싱글톤 인스턴스 생성 및 내보내기
const interfaceManager = new InterfaceManager();
export default interfaceManager; 