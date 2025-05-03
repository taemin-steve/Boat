/**
 * 배의 이동 전략을 위한 인터페이스 (Strategy 패턴)
 */
class MovementStrategy {
    constructor() {
        if (this.constructor === MovementStrategy) {
            throw new Error('MovementStrategy는 추상 클래스입니다. 직접 인스턴스화할 수 없습니다.');
        }
    }
    
    /**
     * 배를 이동시키는 메서드
     * @param {Ship} ship - 이동시킬 선박 객체
     * @param {number} time - 현재 시간
     */
    move(ship, time) {
        throw new Error('move() 메서드는 자식 클래스에서 구현해야 합니다.');
    }
}

export default MovementStrategy; 