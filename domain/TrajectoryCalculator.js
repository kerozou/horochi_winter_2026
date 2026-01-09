import { GameConfig } from '../config/gameConfig.js';

/**
 * 軌道計算のユーティリティクラス
 */
export class TrajectoryCalculator {
    /**
     * 軌道を予測計算
     * @param {number} startX - 開始X座標
     * @param {number} startY - 開始Y座標
     * @param {number} velocityX - 初速度X
     * @param {number} velocityY - 初速度Y
     * @param {number} screenWidth - 画面幅
     * @param {number} screenHeight - 画面高さ
     * @returns {Array<{x: number, y: number}>} 軌道のポイント配列
     */
    static calculate(startX, startY, velocityX, velocityY, screenWidth, screenHeight) {
        const points = [];
        let x = startX;
        let y = startY;
        let currentVx = velocityX;
        let currentVy = velocityY;
        
        const config = GameConfig.trajectory;
        const gravity = GameConfig.physics.matter.gravity.y;
        
        for (let i = 0; i < config.maxSteps; i++) {
            points.push({ x, y });
            
            x += currentVx * config.stepSize;
            y += currentVy * config.stepSize;
            currentVy += gravity * config.stepSize;
            
            if (x > screenWidth || y > screenHeight || x < 0 || y < 0) {
                break;
            }
        }
        
        return points;
    }
    
    /**
     * 軌道をグラフィックスに描画
     * @param {Phaser.GameObjects.Graphics} graphics - グラフィックスオブジェクト
     * @param {Array<{x: number, y: number}>} points - 軌道のポイント配列
     */
    static draw(graphics, points) {
        if (!points || points.length === 0) return;
        
        graphics.clear();
        graphics.lineStyle(
            GameConfig.trajectory.lineWidth,
            GameConfig.trajectory.color,
            GameConfig.trajectory.alpha
        );
        
        graphics.moveTo(points[0].x, points[0].y);
        
        for (let i = 1; i < points.length; i++) {
            graphics.lineTo(points[i].x, points[i].y);
        }
        
        graphics.strokePath();
    }
}

