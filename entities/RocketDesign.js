import { RocketPart } from './RocketPart.js';

/**
 * ロケットの設計データ
 * エディタで作成したロケットの設計を保存
 */
export class RocketDesign {
    constructor() {
        // デフォルト設計
        this.name = 'My Rocket';
        this.parts = []; // パーツの配列
        this.colors = {
            body: 0xff6b6b,
            nose: 0xffd93d,
            window: 0x4ecdc4,
            wing: 0xff6b6b
        };
        this.size = {
            width: 40,
            height: 80
        };
        this.physics = {
            frictionAir: 0.01,
            density: 0.001,
            minSpeed: 5,
            maxSpeed: 30,
            speedMultiplier: 10
        };
    }
    
    /**
     * パーツを追加
     */
    addPart(part) {
        this.parts.push(part);
        this.updatePhysics();
    }
    
    /**
     * パーツを削除
     */
    removePart(partId) {
        this.parts = this.parts.filter(p => p.id !== partId);
        this.updatePhysics();
    }
    
    /**
     * パーツを取得
     */
    getPart(partId) {
        return this.parts.find(p => p.id === partId);
    }
    
    /**
     * すべてのパーツをクリア
     */
    clearParts() {
        this.parts = [];
        this.updatePhysics();
    }
    
    /**
     * 物理パラメータを更新（パーツの合計から計算）
     */
    updatePhysics() {
        if (this.parts.length === 0) {
            return;
        }
        
        // 総質量を計算
        const totalMass = this.parts.reduce((sum, part) => sum + part.mass, 0);
        
        // 平均空気抵抗を計算
        const avgDrag = this.parts.reduce((sum, part) => sum + part.drag, 0) / this.parts.length;
        
        // エンジンの推進力を計算（通常エンジン + レアエンジン全て）
        const engineTypes = ['engine', 'superengine', 'ultralightengine', 'microengine', 'dualengine'];
        const totalThrust = this.parts
            .filter(p => engineTypes.includes(p.type))
            .reduce((sum, part) => sum + part.thrust, 0);
        
        // 物理パラメータを更新
        this.physics.frictionAir = avgDrag;
        this.physics.density = totalMass / 1000;
        // 最大速度の上限を撤廃（エンジンの推力に応じて無制限に上昇）
        // レアエンジンの推力を活かすため、係数を10に増加
        this.physics.maxSpeed = 20 + totalThrust * 10; // 推力の影響を大幅に増加（5→10）
        
        // サイズを計算（バウンディングボックス）
        if (this.parts.length > 0) {
            const minX = Math.min(...this.parts.map(p => p.x - p.width / 2));
            const maxX = Math.max(...this.parts.map(p => p.x + p.width / 2));
            const minY = Math.min(...this.parts.map(p => p.y - p.height / 2));
            const maxY = Math.max(...this.parts.map(p => p.y + p.height / 2));
            
            this.size.width = maxX - minX;
            this.size.height = maxY - minY;
        }
    }
    
    /**
     * 全エンジンの推進力ベクトルを合成
     * @returns {{x: number, y: number, magnitude: number}} 合成推進力ベクトル
     */
    getTotalThrustVector() {
        const engines = this.parts.filter(p => p.type === 'engine');
        
        if (engines.length === 0) {
            return { x: 0, y: 0, magnitude: 0 };
        }
        
        // 各エンジンの推進力ベクトルを合成
        let totalX = 0;
        let totalY = 0;
        
        engines.forEach(engine => {
            const thrustVector = engine.getThrustVector();
            totalX += thrustVector.x;
            totalY += thrustVector.y;
        });
        
        const magnitude = Math.sqrt(totalX * totalX + totalY * totalY);
        
        return {
            x: totalX,
            y: totalY,
            magnitude: magnitude
        };
    }
    
    /**
     * 推進力の方向を取得（ラジアン）
     * @returns {number} 推進力の向き（エンジンがない場合は0）
     */
    getThrustAngle() {
        const thrust = this.getTotalThrustVector();
        if (thrust.magnitude === 0) {
            return 0;
        }
        return Math.atan2(thrust.y, thrust.x);
    }
    
    /**
     * ロケットの重心を計算（ゲーム座標系）
     * @returns {{x: number, y: number}} 重心座標（ゲーム座標系）
     */
    getCenterOfMass() {
        if (this.parts.length === 0) {
            return { x: 0, y: 0 };
        }
        
        let totalMass = 0;
        let weightedX = 0;
        let weightedY = 0;
        
        this.parts.forEach(part => {
            // エディタ座標をゲーム座標に変換: (x, y) → (-y, x)
            // エディタの北（上） → ゲームの東（右、発射方向）
            const gameX = -part.y;
            const gameY = part.x;
            
            totalMass += part.mass;
            weightedX += gameX * part.mass;
            weightedY += gameY * part.mass;
        });
        
        return {
            x: weightedX / totalMass,
            y: weightedY / totalMass
        };
    }
    
    /**
     * ロケットの慣性モーメントを計算（重心周りの回転抵抗、ゲーム座標系）
     * @returns {number} 慣性モーメント
     */
    getMomentOfInertia() {
        if (this.parts.length === 0) {
            return 1;
        }
        
        const centerOfMass = this.getCenterOfMass();
        let inertia = 0;
        
        // 各パーツの重心からの距離と質量から慣性モーメントを計算
        this.parts.forEach(part => {
            // エディタ座標をゲーム座標に変換: (x, y) → (-y, x)
            const gameX = -part.y;
            const gameY = part.x;
            
            const dx = gameX - centerOfMass.x;
            const dy = gameY - centerOfMass.y;
            const distanceSquared = dx * dx + dy * dy;
            
            // パーツ自体の慣性モーメント + 平行軸の定理
            // 座標変換により幅と高さが入れ替わる
            const gameWidth = part.height;
            const gameHeight = part.width;
            const partInertia = (gameWidth * gameWidth + gameHeight * gameHeight) * part.mass / 12;
            inertia += partInertia + part.mass * distanceSquared;
        });
        
        return inertia;
    }
    
    /**
     * エンジンによるトルクを計算（重心周りの回転力、ゲーム座標系）
     * @returns {number} トルク
     */
    getTorque() {
        const centerOfMass = this.getCenterOfMass();
        let totalTorque = 0;
        
        const engines = this.parts.filter(p => p.type === 'engine');
        
        engines.forEach(engine => {
            const thrustVector = engine.getThrustVector();
            
            // エディタ座標をゲーム座標に変換: (x, y) → (-y, x)
            const gameEngineX = -engine.y;
            const gameEngineY = engine.x;
            const gameThrustX = -thrustVector.y;
            const gameThrustY = thrustVector.x;
            
            // エンジン位置から重心へのベクトル（ゲーム座標系）
            const rx = gameEngineX - centerOfMass.x;
            const ry = gameEngineY - centerOfMass.y;
            
            // 外積でトルクを計算: τ = r × F
            const torque = rx * gameThrustY - ry * gameThrustX;
            totalTorque += torque;
        });
        
        return totalTorque;
    }
    
    /**
     * 設計データをJSON形式で取得
     */
    toJSON() {
        return {
            name: this.name,
            parts: this.parts.map(p => p.toJSON()),
            colors: this.colors,
            size: this.size,
            physics: this.physics
        };
    }
    
    /**
     * JSONから設計データを読み込み
     */
    static fromJSON(json) {
        const design = new RocketDesign();
        design.name = json.name || design.name;
        design.parts = (json.parts || []).map(p => RocketPart.fromJSON(p));
        design.colors = { ...design.colors, ...json.colors };
        design.size = { ...design.size, ...json.size };
        design.physics = { ...design.physics, ...json.physics };
        return design;
    }
}

