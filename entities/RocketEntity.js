/**
 * ロケットエンティティ
 * ロケットの状態とデータを管理する純粋なドメインモデル
 */
export class RocketEntity {
    constructor(x, y, width, height) {
        // 位置情報
        this.x = x;
        this.y = y;
        this.initialX = x;
        this.initialY = y;
        
        // サイズ情報
        this.width = width;
        this.height = height;
        
        // 物理情報
        this.velocityX = 0;
        this.velocityY = 0;
        this.angle = 0;
        
        // 状態
        this.isLaunched = false;
    }
    
    /**
     * ロケットを発射
     * @param {number} angle - 発射角度（ラジアン）
     * @param {number} speed - 発射速度
     */
    launch(angle, speed) {
        if (this.isLaunched) return;
        
        this.isLaunched = true;
        this.angle = angle;
        this.velocityX = Math.cos(angle) * speed;
        this.velocityY = Math.sin(angle) * speed;
    }
    
    /**
     * 位置を更新
     * @param {number} x - 新しいX座標
     * @param {number} y - 新しいY座標
     */
    updatePosition(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * 速度を更新
     * @param {number} velocityX - X方向の速度
     * @param {number} velocityY - Y方向の速度
     */
    updateVelocity(velocityX, velocityY) {
        this.velocityX = velocityX;
        this.velocityY = velocityY;
        
        // 速度ベクトルから角度を計算
        if (velocityX !== 0 || velocityY !== 0) {
            this.angle = Math.atan2(velocityY, velocityX);
        }
    }
    
    /**
     * リセット（初期状態に戻す）
     */
    reset() {
        this.x = this.initialX;
        this.y = this.initialY;
        this.velocityX = 0;
        this.velocityY = 0;
        this.angle = 0;
        this.isLaunched = false;
    }
    
    /**
     * 画面外に出たかチェック
     * @param {number} worldWidth - ワールドの幅
     * @param {number} worldHeight - ワールドの高さ
     * @param {number} margin - マージン
     * @returns {boolean} 画面外かどうか
     */
    isOutOfBounds(worldWidth, worldHeight, margin = 100) {
        return this.x > worldWidth + margin || 
               this.y > worldHeight + margin ||
               this.x < -margin;
    }
    
    /**
     * エンティティの状態を取得
     * @returns {Object} 状態オブジェクト
     */
    getState() {
        return {
            x: this.x,
            y: this.y,
            velocityX: this.velocityX,
            velocityY: this.velocityY,
            angle: this.angle,
            isLaunched: this.isLaunched
        };
    }
    
    /**
     * エンティティの情報を文字列で取得
     * @returns {string} エンティティの情報
     */
    toString() {
        return `Rocket[x=${this.x.toFixed(1)}, y=${this.y.toFixed(1)}, ` +
               `vx=${this.velocityX.toFixed(2)}, vy=${this.velocityY.toFixed(2)}, ` +
               `launched=${this.isLaunched}]`;
    }
}

