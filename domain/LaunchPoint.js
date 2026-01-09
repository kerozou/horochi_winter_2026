/**
 * 発射地点のドメインクラス
 */
export class LaunchPoint {
    constructor(x, y) {
        this.x = x;
        this.y = y;
    }
    
    /**
     * 発射地点から指定位置への角度を計算
     * @param {number} targetX - 目標X座標
     * @param {number} targetY - 目標Y座標
     * @returns {number} 角度（ラジアン）
     */
    calculateAngle(targetX, targetY) {
        return Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
    }
    
    /**
     * 発射地点から指定位置への距離を計算
     * @param {number} targetX - 目標X座標
     * @param {number} targetY - 目標Y座標
     * @returns {number} 距離
     */
    calculateDistance(targetX, targetY) {
        return Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
    }
    
    /**
     * 発射地点から指定位置への速度を計算
     * @param {number} targetX - 目標X座標
     * @param {number} targetY - 目標Y座標
     * @param {number} minSpeed - 最小速度
     * @param {number} maxSpeed - 最大速度
     * @param {number} speedMultiplier - 速度倍率
     * @returns {number} 速度
     */
    calculateSpeed(targetX, targetY, minSpeed, maxSpeed, speedMultiplier) {
        const distance = this.calculateDistance(targetX, targetY);
        return Phaser.Math.Clamp(distance / speedMultiplier, minSpeed, maxSpeed);
    }
}

