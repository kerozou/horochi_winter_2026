import { GameConfig } from '../config/gameConfig.js';
import { RocketEntity } from '../entities/RocketEntity.js';

/**
 * ロケットのドメインクラス
 * Phaserのスプライトと統合し、描画を担当
 */
export class Rocket {
    constructor(scene, x, y, rocketDesign = null) {
        this.scene = scene;
        this.rocketDesign = rocketDesign; // エディタからのデザインデータ
        this.sprite = null;
        
        // コックピット分離状態
        this.isCockpitSeparated = false;
        this.separationCount = 0; // 分離回数（0: 未分離, 1: 1回目（コックピット分離））
        this.separatedCockpitSprites = []; // 分離されたコックピットスプライト（物理オブジェクト）
        this.separatedRedParts = []; // 分離された赤パーツスプライト（物理オブジェクト）
        this.transformedCockpitRocket = null; // 変形後のコックピット+赤パーツロケット
        
        // エンティティを作成（状態管理）
        const zoom = GameConfig.cameraZoom || 0.33;
        const scale = 1 / zoom;
        
        // デザインデータがあればそれを使用、なければデフォルト
        let width, height;
        if (rocketDesign && rocketDesign.size) {
            width = rocketDesign.size.width * scale;
            height = rocketDesign.size.height * scale;
        } else {
            width = GameConfig.rocket.width * scale;
            height = GameConfig.rocket.height * scale;
        }
        
        this.entity = new RocketEntity(x, y, width, height);
        
        this.createSprite();
    }
    
    /**
     * エンティティの状態を取得（読み取り専用アクセス）
     */
    get isLaunched() {
        return this.entity.isLaunched;
    }
    
    /**
     * コックピットを持っているか確認
     */
    hasCockpit() {
        return this.cockpitSprites && this.cockpitSprites.length > 0;
    }
    
    /**
     * 分離されたコックピットの位置を取得
     * @returns {{x: number, y: number} | null}
     */
    getSeparatedCockpitPosition() {
        if (!this.isCockpitSeparated || this.separatedCockpitSprites.length === 0) {
            return null;
        }
        // 最初のコックピットの位置を返す
        const cockpit = this.separatedCockpitSprites[0];
        return {
            x: cockpit.x,
            y: cockpit.y
        };
    }
    
    /**
     * ロケットのスプライトを作成
     */
    createSprite() {
        const zoom = GameConfig.cameraZoom || 0.33;
        const scale = 1 / zoom;

        // エディタからパーツデータが渡されているかチェック
        if (this.rocketDesign && this.rocketDesign.parts && this.rocketDesign.parts.length > 0) {
            console.log('✨ Creating custom rocket with', this.rocketDesign.parts.length, 'parts');
            this.createSpriteFromParts(scale);
        } else {
            console.log('🚀 Creating default rocket');
            this.createDefaultSprite(scale);
        }
    }

    /**
     * パーツからロケットスプライトを作成
     */
    createSpriteFromParts(scale) {
        const parts = this.rocketDesign.parts;
        
        // エディタ座標からゲーム座標への変換（90度回転）
        // エディタの上方向（北） → ゲームの右方向（東、発射方向）
        const transformedParts = parts.map(p => ({
            ...p,
            // 座標変換: エディタ(x, y) → ゲーム(-y, x)
            // エディタの上（y < 0） → ゲームの右（x > 0）
            gameX: -p.y,
            gameY: p.x,
            // 幅と高さを入れ替え
            gameWidth: p.height,
            gameHeight: p.width,
            // エンジンの角度も変換（時計回りに90度回転）
            gameAngle: p.angle !== undefined ? p.angle + Math.PI / 2 : 0
        }));
        
        // すべてのパーツの境界を計算（変換後の座標で）
        const minX = Math.min(...transformedParts.map(p => p.gameX - p.gameWidth / 2));
        const maxX = Math.max(...transformedParts.map(p => p.gameX + p.gameWidth / 2));
        const minY = Math.min(...transformedParts.map(p => p.gameY - p.gameHeight / 2));
        const maxY = Math.max(...transformedParts.map(p => p.gameY + p.gameHeight / 2));
        
        const width = (maxX - minX) * scale;
        const height = (maxY - minY) * scale;
        const offsetX = (minX + maxX) / 2;
        const offsetY = (minY + maxY) / 2;
        
        // テクスチャを生成
        const rocketGraphics = this.scene.add.graphics();
        
        transformedParts.forEach(part => {
            // 変換後の座標を使用
            const px = (part.gameX - offsetX) * scale + width / 2;
            const py = (part.gameY - offsetY) * scale + height / 2;
            const pw = part.gameWidth * scale;
            const ph = part.gameHeight * scale;
            
            rocketGraphics.fillStyle(part.color);
            
            switch (part.type) {
                case 'nose':
                    // 座標変換により、エディタの上向き → ゲームの右向き
                    // 右向きの三角形を描画
                    rocketGraphics.fillTriangle(
                        px + pw / 2, py,           // 右端（先端）
                        px - pw / 2, py - ph / 2,  // 左上
                        px - pw / 2, py + ph / 2   // 左下
                    );
                    break;
                case 'body':
                case 'fueltank':
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    break;
                case 'wing':
                    // 座標変換により、エディタの左右 → ゲームの上下
                    if (part.side === 'left') {
                        // エディタの左翼 → ゲームの上翼
                        rocketGraphics.fillTriangle(
                            px, py - ph,           // 上端
                            px - pw / 2, py,       // 中央左
                            px + pw / 2, py        // 中央右
                        );
                    } else {
                        // エディタの右翼 → ゲームの下翼
                        rocketGraphics.fillTriangle(
                            px, py + ph,           // 下端
                            px - pw / 2, py,       // 中央左
                            px + pw / 2, py        // 中央右
                        );
                    }
                    break;
                case 'engine':
                    // エンジン本体
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    
                    // 噴射口と推進方向の矢印（エディタの向きを保持）
                    // エディタ座標系での元の寸法を考慮
                    const engineAngle = part.gameAngle;
                    
                    // 座標変換により、元の高さ方向が現在の幅方向になる
                    // エンジンの噴射口は元の高さ方向なので、変換後は幅方向
                    const nozzleDistance = pw / 2; // 元の高さ(part.height) → 変換後の幅(pw)
                    const nozzleWidth = ph / 2;    // 元の幅(part.width) → 変換後の高さ(ph)
                    
                    // 噴射方向（炎）
                    rocketGraphics.fillStyle(0xf39c12);
                    const flameLength = 15 * scale;
                    const flameCx = px + Math.cos(engineAngle) * nozzleDistance;
                    const flameCy = py + Math.sin(engineAngle) * nozzleDistance;
                    const flameEndX = flameCx + Math.cos(engineAngle) * flameLength;
                    const flameEndY = flameCy + Math.sin(engineAngle) * flameLength;
                    const flameLeft1X = flameCx + Math.cos(engineAngle - Math.PI / 2) * nozzleWidth / 3;
                    const flameLeft1Y = flameCy + Math.sin(engineAngle - Math.PI / 2) * nozzleWidth / 3;
                    const flameRight1X = flameCx + Math.cos(engineAngle + Math.PI / 2) * nozzleWidth / 3;
                    const flameRight1Y = flameCy + Math.sin(engineAngle + Math.PI / 2) * nozzleWidth / 3;
                    rocketGraphics.fillTriangle(flameEndX, flameEndY, flameLeft1X, flameLeft1Y, flameRight1X, flameRight1Y);
                    
                    // 推進方向の矢印（噴射の逆）
                    rocketGraphics.fillStyle(0xffff00);
                    const thrustAngle = engineAngle + Math.PI;
                    const arrowCx = px + Math.cos(thrustAngle) * nozzleDistance / 2;
                    const arrowCy = py + Math.sin(thrustAngle) * nozzleDistance / 2;
                    const arrowEndX = arrowCx + Math.cos(thrustAngle) * 10 * scale;
                    const arrowEndY = arrowCy + Math.sin(thrustAngle) * 10 * scale;
                    const arrowLeft2X = arrowCx + Math.cos(thrustAngle - Math.PI * 0.75) * nozzleWidth / 4;
                    const arrowLeft2Y = arrowCy + Math.sin(thrustAngle - Math.PI * 0.75) * nozzleWidth / 4;
                    const arrowRight2X = arrowCx + Math.cos(thrustAngle + Math.PI * 0.75) * nozzleWidth / 4;
                    const arrowRight2Y = arrowCy + Math.sin(thrustAngle + Math.PI * 0.75) * nozzleWidth / 4;
                    rocketGraphics.fillTriangle(arrowEndX, arrowEndY, arrowLeft2X, arrowLeft2Y, arrowRight2X, arrowRight2Y);
                    
                    rocketGraphics.fillStyle(part.color);
                    break;
                // レアパーツ（エンジン系）
                case 'superengine':
                case 'ultralightengine':
                case 'microengine':
                case 'dualengine':
                    // エンジン本体
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    
                    const rareEngineAngle = part.gameAngle;
                    const rareNozzleDistance = pw / 2;
                    const rareNozzleWidth = ph / 2;
                    
                    // 噴射方向（炎）
                    if (part.type === 'superengine') {
                        // 超強力エンジン - 2つの噴射口
                        rocketGraphics.fillStyle(0xff4500);
                        const flameLength1 = 18 * scale;
                        for (let offset of [-0.25, 0.25]) {
                            const flameCx1 = px + Math.cos(rareEngineAngle) * rareNozzleDistance + Math.cos(rareEngineAngle + Math.PI / 2) * rareNozzleWidth * offset;
                            const flameCy1 = py + Math.sin(rareEngineAngle) * rareNozzleDistance + Math.sin(rareEngineAngle + Math.PI / 2) * rareNozzleWidth * offset;
                            const flameEndX1 = flameCx1 + Math.cos(rareEngineAngle) * flameLength1;
                            const flameEndY1 = flameCy1 + Math.sin(rareEngineAngle) * flameLength1;
                            const flameLeft1 = flameCx1 + Math.cos(rareEngineAngle - Math.PI / 2) * rareNozzleWidth / 6;
                            const flameTop1 = flameCy1 + Math.sin(rareEngineAngle - Math.PI / 2) * rareNozzleWidth / 6;
                            const flameRight1 = flameCx1 + Math.cos(rareEngineAngle + Math.PI / 2) * rareNozzleWidth / 6;
                            const flameBottom1 = flameCy1 + Math.sin(rareEngineAngle + Math.PI / 2) * rareNozzleWidth / 6;
                            rocketGraphics.fillTriangle(flameEndX1, flameEndY1, flameLeft1, flameTop1, flameRight1, flameBottom1);
                        }
                    } else if (part.type === 'dualengine') {
                        // 複合エンジン - 2つのノズル（紫色）
                        rocketGraphics.fillStyle(0x9b59b6);
                        const flameLength2 = 15 * scale;
                        for (let offset of [-0.33, 0.33]) {
                            const flameCx2 = px + Math.cos(rareEngineAngle) * rareNozzleDistance + Math.cos(rareEngineAngle + Math.PI / 2) * rareNozzleWidth * offset;
                            const flameCy2 = py + Math.sin(rareEngineAngle) * rareNozzleDistance + Math.sin(rareEngineAngle + Math.PI / 2) * rareNozzleWidth * offset;
                            const flameEndX2 = flameCx2 + Math.cos(rareEngineAngle) * flameLength2;
                            const flameEndY2 = flameCy2 + Math.sin(rareEngineAngle) * flameLength2;
                            const flameLeft2 = flameCx2 + Math.cos(rareEngineAngle - Math.PI / 2) * rareNozzleWidth / 6;
                            const flameTop2 = flameCy2 + Math.sin(rareEngineAngle - Math.PI / 2) * rareNozzleWidth / 6;
                            const flameRight2 = flameCx2 + Math.cos(rareEngineAngle + Math.PI / 2) * rareNozzleWidth / 6;
                            const flameBottom2 = flameCy2 + Math.sin(rareEngineAngle + Math.PI / 2) * rareNozzleWidth / 6;
                            rocketGraphics.fillTriangle(flameEndX2, flameEndY2, flameLeft2, flameTop2, flameRight2, flameBottom2);
                        }
                    } else {
                        // 通常の単一噴射口
                        const flameColor = part.type === 'ultralightengine' ? 0x00ffff : part.type === 'microengine' ? 0xff6b6b : 0xf39c12;
                        rocketGraphics.fillStyle(flameColor);
                        const flameLength3 = (part.type === 'microengine' ? 8 : 12) * scale;
                        const flameCx3 = px + Math.cos(rareEngineAngle) * rareNozzleDistance;
                        const flameCy3 = py + Math.sin(rareEngineAngle) * rareNozzleDistance;
                        const flameEndX3 = flameCx3 + Math.cos(rareEngineAngle) * flameLength3;
                        const flameEndY3 = flameCy3 + Math.sin(rareEngineAngle) * flameLength3;
                        const flameLeft3 = flameCx3 + Math.cos(rareEngineAngle - Math.PI / 2) * rareNozzleWidth / 3;
                        const flameTop3 = flameCy3 + Math.sin(rareEngineAngle - Math.PI / 2) * rareNozzleWidth / 3;
                        const flameRight3 = flameCx3 + Math.cos(rareEngineAngle + Math.PI / 2) * rareNozzleWidth / 3;
                        const flameBottom3 = flameCy3 + Math.sin(rareEngineAngle + Math.PI / 2) * rareNozzleWidth / 3;
                        rocketGraphics.fillTriangle(flameEndX3, flameEndY3, flameLeft3, flameTop3, flameRight3, flameBottom3);
                    }
                    
                    rocketGraphics.fillStyle(part.color);
                    break;
                case 'weight':
                    // おもり - クロスハッチング模様
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    rocketGraphics.lineStyle(2 * scale, 0x1a1a1a, 0.5);
                    for (let i = 0; i < 5; i++) {
                        const offsetX = (i / 4) * pw - pw / 2;
                        rocketGraphics.lineBetween(px + offsetX, py - ph / 2, px + offsetX + ph, py + ph / 2);
                    }
                    rocketGraphics.fillStyle(part.color);
                    break;
                case 'ultralightnose':
                    // 超軽量ノーズ - 鋭い三角形 + 光沢
                    rocketGraphics.fillTriangle(
                        px + pw / 2, py,           // 右先端
                        px - pw / 2, py - ph / 2,  // 左上
                        px - pw / 2, py + ph / 2   // 左下
                    );
                    rocketGraphics.fillStyle(0xffd700, 0.3);
                    rocketGraphics.fillTriangle(
                        px + pw / 4, py,
                        px - pw / 2, py - ph / 4,
                        px - pw / 2, py + ph / 4
                    );
                    rocketGraphics.fillStyle(part.color);
                    break;
                case 'reinforcedbody':
                    // 強化ボディ - リベット模様
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    rocketGraphics.fillStyle(0x5a6266);
                    const rivetCount = Math.floor(ph / (15 * scale));
                    for (let i = 0; i < rivetCount; i++) {
                        const rivetY = py - ph / 2 + (i + 1) * (ph / (rivetCount + 1));
                        rocketGraphics.fillCircle(px - pw / 2 + 8 * scale, rivetY, 2 * scale);
                        rocketGraphics.fillCircle(px + pw / 2 - 8 * scale, rivetY, 2 * scale);
                    }
                    rocketGraphics.fillStyle(part.color);
                    break;
                case 'megafueltank':
                    // 巨大燃料タンク - ストライプ模様
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    rocketGraphics.fillStyle(0x1abc9c);
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, 10 * scale);
                    rocketGraphics.fillRect(px - pw / 2, py + ph / 2 - 10 * scale, pw, 10 * scale);
                    rocketGraphics.fillStyle(part.color);
                    break;
                case 'largewing':
                    // 大型ウィング - 大きい三角形（両側）
                    rocketGraphics.fillTriangle(
                        px - pw / 2, py,           // 左端
                        px + pw / 2, py,           // 右端
                        px, py - ph / 2            // 上
                    );
                    rocketGraphics.fillTriangle(
                        px - pw / 2, py,           // 左端
                        px + pw / 2, py,           // 右端
                        px, py + ph / 2            // 下
                    );
                    rocketGraphics.lineStyle(3 * scale, 0xff8c00, 0.7);
                    rocketGraphics.strokeTriangle(px - pw / 2, py, px + pw / 2, py, px, py - ph / 2);
                    rocketGraphics.fillStyle(part.color);
                    break;
                case 'stabilizer':
                    // 安定化装置 - フィン模様
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    rocketGraphics.fillStyle(0x3498db);
                    rocketGraphics.fillTriangle(
                        px - pw / 2, py - ph / 2,
                        px - pw / 2 + 15 * scale, py,
                        px - pw / 2, py + ph / 2
                    );
                    rocketGraphics.fillTriangle(
                        px + pw / 2, py - ph / 2,
                        px + pw / 2 - 15 * scale, py,
                        px + pw / 2, py + ph / 2
                    );
                    rocketGraphics.fillStyle(part.color);
                    break;
                case 'cockpit':
                    // コックピットは画像を描画（背景色を追加）
                    rocketGraphics.fillStyle(0x2c3e50);
                    rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    
                    // 金色の枠線
                    rocketGraphics.lineStyle(2 * scale, 0xffd93d, 0.8);
                    rocketGraphics.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
                    
                    // 画像はテクスチャ生成後にスプライトとして追加する必要があるため
                    // ここでは位置情報を保存しておく
                    if (!this.cockpitPositions) {
                        this.cockpitPositions = [];
                    }
                    this.cockpitPositions.push({
                        x: px,
                        y: py,
                        width: pw,
                        height: ph,
                        imageKey: part.imageKey || 'horochi'
                    });
                    break;
                // 赤パーツ
                case 'redengine':
                case 'redbody':
                case 'rednose':
                    // 赤パーツの描画
                    if (part.type === 'redengine') {
                        rocketGraphics.fillCircle(px, py, pw / 2);
                        rocketGraphics.fillStyle(0xff4500);
                        rocketGraphics.fillTriangle(px, py + pw / 2, px - pw / 4, py + pw / 2 + 20 * scale, px + pw / 4, py + pw / 2 + 20 * scale);
                    } else if (part.type === 'redbody') {
                        rocketGraphics.fillRect(px - pw / 2, py - ph / 2, pw, ph);
                    } else if (part.type === 'rednose') {
                        rocketGraphics.fillTriangle(px + pw / 2, py, px - pw / 2, py - ph / 2, px - pw / 2, py + ph / 2);
                        rocketGraphics.fillStyle(0xff4500);
                        rocketGraphics.fillTriangle(px + pw / 2 + 10 * scale, py, px + pw / 4, py - ph / 4, px + pw / 4, py + ph / 4);
                    }
                    rocketGraphics.lineStyle(3 * scale, 0xe74c3c);
                    if (part.type === 'redengine') {
                        rocketGraphics.strokeCircle(px, py, pw / 2);
                    } else if (part.type === 'redbody') {
                        rocketGraphics.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
                    } else if (part.type === 'rednose') {
                        rocketGraphics.strokeTriangle(px + pw / 2, py, px - pw / 2, py - ph / 2, px - pw / 2, py + ph / 2);
                    }
                    
                    // 赤パーツの位置情報を保存（元のパーツ情報も含める）
                    if (!this.redPartPositions) {
                        this.redPartPositions = [];
                    }
                    this.redPartPositions.push({
                        x: px,
                        y: py,
                        width: pw,
                        height: ph,
                        type: part.type,
                        color: part.color,
                        originalPart: part // 元のパーツ情報を保存
                    });
                    rocketGraphics.fillStyle(part.color);
                    break;
            }
            
            // 枠線（コックピットと赤パーツ以外）
            if (part.type !== 'cockpit' && part.type !== 'redengine' && part.type !== 'redbody' && part.type !== 'rednose') {
                rocketGraphics.lineStyle(2 * scale, 0xffffff, 0.8);
                rocketGraphics.strokeRect(px - pw / 2, py - ph / 2, pw, ph);
            }
        });
        
        // 既存のテクスチャがあれば削除（古いロケットのテクスチャを削除）
        const textureKey = 'rocketSpriteFromParts';
        if (this.scene.textures.exists(textureKey)) {
            console.log('Removing old rocket texture:', textureKey);
            this.scene.textures.remove(textureKey);
        }
        
        rocketGraphics.generateTexture(textureKey, width, height);
        rocketGraphics.destroy();
        
        // 物理パラメータを設計データから取得
        const frictionAir = this.rocketDesign.physics.frictionAir || GameConfig.rocket.frictionAir;
        const density = this.rocketDesign.physics.density || GameConfig.rocket.density;
        
        this.sprite = this.scene.matter.add.sprite(
            this.entity.x,
            this.entity.y,
            'rocketSpriteFromParts',
            null,
            {
                shape: {
                    type: 'rectangle',
                    width: width,
                    height: height
                },
                frictionAir: frictionAir,
                density: density
            }
        );

        // テクスチャは座標変換により既に右向き（発射方向）になっている
        // 初期角度は0（右向き）
        this.sprite.setRotation(0);

        this.sprite.setVisible(false);
        this.sprite.setStatic(true);
        
        // コックピット画像を追加
        if (this.cockpitPositions && this.cockpitPositions.length > 0) {
            this.cockpitSprites = [];
            this.cockpitPositions.forEach(cockpitPos => {
                // テクスチャの中心を基準とした相対位置
                const relX = cockpitPos.x - width / 2;
                const relY = cockpitPos.y - height / 2;
                
                const cockpitSprite = this.scene.add.sprite(
                    this.entity.x + relX,
                    this.entity.y + relY,
                    cockpitPos.imageKey
                );
                cockpitSprite.setDisplaySize(cockpitPos.width, cockpitPos.height);
                
                // エディタの上向き（北）がゲームの右向き（東）になるように+90度回転
                cockpitSprite.setRotation(Math.PI / 2);
                
                cockpitSprite.setVisible(false);
                
                this.cockpitSprites.push(cockpitSprite);
            });
        }
    }

    /**
     * デフォルトのロケットスプライトを作成
     */
    createDefaultSprite(scale) {
        const width = GameConfig.rocket.width * scale;
        const height = GameConfig.rocket.height * scale;

        const rocketGraphics = this.scene.add.graphics();

        // ロケット本体（赤色）
        rocketGraphics.fillStyle(0xff6b6b);
        rocketGraphics.fillRect(width * 0.25, height * 0.25, width * 0.5, height * 0.75);

        // ロケット先端（黄色の三角形）
        rocketGraphics.fillStyle(0xffd93d);
        rocketGraphics.fillTriangle(width * 0.5, 0, 0, height * 0.25, width, height * 0.25);

        // ロケットの窓（青色）
        rocketGraphics.fillStyle(0x4ecdc4);
        rocketGraphics.fillCircle(width * 0.5, height * 0.5, width * 0.125);

        // ロケットの翼（左右）
        rocketGraphics.fillStyle(0xff6b6b);
        rocketGraphics.fillTriangle(width * 0.25, height * 0.875, 0, height, width * 0.25, height);
        rocketGraphics.fillTriangle(width * 0.75, height * 0.875, width, height, width * 0.75, height);

        // 既存のテクスチャがあれば削除
        const textureKey = 'rocketSprite';
        if (this.scene.textures.exists(textureKey)) {
            console.log('Removing old default rocket texture:', textureKey);
            this.scene.textures.remove(textureKey);
        }

        rocketGraphics.generateTexture(textureKey, width, height);
        rocketGraphics.destroy();

        this.sprite = this.scene.matter.add.sprite(
            this.entity.x,
            this.entity.y,
            'rocketSprite',
            null,
            {
                shape: {
                    type: 'rectangle',
                    width: width,
                    height: height
                },
                frictionAir: GameConfig.rocket.frictionAir,
                density: GameConfig.rocket.density
            }
        );

        // デフォルトロケットは縦向きなので90度回転して右向き（発射方向）にする
        this.sprite.setRotation(Math.PI / 2);

        this.sprite.setVisible(false);
        this.sprite.setStatic(true);
    }
    
    /**
     * ロケットを発射
     * @param {number} angle - 発射角度（ラジアン）
     * @param {number} speed - 発射速度
     */
    launch(angle, speed) {
        if (this.entity.isLaunched) return;
        
        // 基本の速度ベクトル
        let velocityX = Math.cos(angle) * speed;
        let velocityY = Math.sin(angle) * speed;
        
        // エンジンの推進力ベクトルを加算（通常エンジン + レアエンジン）
        if (this.rocketDesign && this.rocketDesign.parts) {
            const engineTypes = ['engine', 'superengine', 'ultralightengine', 'microengine', 'dualengine'];
            const engines = this.rocketDesign.parts.filter(p => engineTypes.includes(p.type));
            
            if (engines.length > 0) {
                // 各エンジンの推進力を合成
                let thrustX = 0;
                let thrustY = 0;
                
                engines.forEach(engine => {
                    const thrustVector = engine.getThrustVector();
                    // エディタ座標系からゲーム座標系に変換（90度回転）
                    // editor(x, y) → game(-y, x)
                    const gameThrustX = -thrustVector.y;
                    const gameThrustY = thrustVector.x;
                    thrustX += gameThrustX;
                    thrustY += gameThrustY;
                });
                
                // 推進力を速度に加算（スケーリング調整）
                const thrustScale = 0.5; // 推進力の影響度を調整
                velocityX += thrustX * thrustScale;
                velocityY += thrustY * thrustScale;
                
                console.log('Engine thrust applied:', {
                    thrustX: thrustX.toFixed(2),
                    thrustY: thrustY.toFixed(2),
                    finalVelocityX: velocityX.toFixed(2),
                    finalVelocityY: velocityY.toFixed(2)
                });
            }
        }
        
        // エンティティの状態を更新
        this.entity.launch(angle, speed);
        this.entity.velocityX = velocityX;
        this.entity.velocityY = velocityY;
        
        // 実際の速度ベクトルから角度を再計算
        const actualAngle = Math.atan2(velocityY, velocityX);
        this.entity.angle = actualAngle;
        
        // スプライトの表示と物理を更新
        this.sprite.setVisible(true);
        this.sprite.setStatic(false);
        this.sprite.setVelocity(velocityX, velocityY);
        this.sprite.setRotation(actualAngle);
        
        // コックピットスプライトも表示
        if (this.cockpitSprites) {
            this.cockpitSprites.forEach(cockpitSprite => {
                cockpitSprite.setVisible(true);
            });
        }
    }
    
    /**
     * ロケットをリセット
     */
    reset() {
        // エンティティの状態をリセット
        this.entity.reset();
        
        // スプライトをリセット
        this.sprite.setPosition(this.entity.x, this.entity.y);
        this.sprite.setVelocity(0, 0);
        this.sprite.setAngularVelocity(0);
        
        // 初期角度に戻す（カスタムロケットは0度、デフォルトは90度）
        if (this.rocketDesign && this.rocketDesign.parts && this.rocketDesign.parts.length > 0) {
            this.sprite.setRotation(0); // カスタムロケットは右向き（0度）
        } else {
            this.sprite.setRotation(Math.PI / 2); // デフォルトロケットは90度回転
        }
        
        this.sprite.setStatic(true);
        this.sprite.setVisible(false);
        
        // コックピットスプライトも非表示にしてリセット
        if (this.cockpitSprites) {
            this.cockpitSprites.forEach((cockpitSprite, index) => {
                if (this.cockpitPositions && this.cockpitPositions[index]) {
                    const cockpitPos = this.cockpitPositions[index];
                    const relX = cockpitPos.x - (this.rocketDesign ? (this.rocketDesign.size.height / GameConfig.cameraZoom) : (GameConfig.rocket.width / GameConfig.cameraZoom)) / 2;
                    const relY = cockpitPos.y - (this.rocketDesign ? (this.rocketDesign.size.width / GameConfig.cameraZoom) : (GameConfig.rocket.height / GameConfig.cameraZoom)) / 2;
                    
                    cockpitSprite.setPosition(this.entity.x + relX, this.entity.y + relY);
                    // エディタの上向き（北）がゲームの右向き（東）になるように+90度回転
                    cockpitSprite.setRotation(Math.PI / 2);
                }
                cockpitSprite.setVisible(false);
            });
        }
        
        // 分離されたコックピットを破棄
        if (this.separatedCockpitSprites && this.separatedCockpitSprites.length > 0) {
            this.separatedCockpitSprites.forEach(sprite => {
                if (sprite && sprite.active) {
                    sprite.destroy();
                }
            });
            this.separatedCockpitSprites = [];
        }
        
        // 分離状態をリセット
        this.isCockpitSeparated = false;
    }
    
    /**
     * ロケットの物理演算を更新（空気抵抗、トルク、モーメントを適用）
     */
    updatePhysics() {
        if (!this.entity.isLaunched || !this.sprite || !this.sprite.body) return;
        
        const body = this.sprite.body;
        const velocity = body.velocity;
        
        // 位置と速度を更新
        this.entity.updatePosition(this.sprite.x, this.sprite.y);
        this.entity.updateVelocity(velocity.x, velocity.y);
        
        // 空力効果が有効な場合のみ適用
        if (GameConfig.physicsParams.enableAerodynamics) {
            // 空気抵抗を適用（速度の2乗に比例）
            this.applyAirResistance();
            
            // 角度を更新（空力的に安定化 - 速度方向に向こうとする）
            this.applyAerodynamicStability();
        }
        
        // エンジンによるトルクを適用（ロケットデザインがある場合）
        if (this.rocketDesign && this.rocketDesign.parts && this.rocketDesign.parts.length > 0) {
            this.applyEngineTorque();
        }
        
        // コックピットスプライトの位置と回転を更新
        this.updateCockpitSprites();
    }
    
    /**
     * コックピットスプライトの位置と回転を更新
     */
    updateCockpitSprites() {
        if (!this.cockpitSprites || !this.cockpitPositions) return;
        
        const rocketX = this.sprite.x;
        const rocketY = this.sprite.y;
        const rocketRotation = this.sprite.rotation;
        
        this.cockpitSprites.forEach((cockpitSprite, index) => {
            if (this.cockpitPositions[index]) {
                const cockpitPos = this.cockpitPositions[index];
                
                // テクスチャのサイズを取得
                const zoom = GameConfig.cameraZoom || 0.33;
                const scale = 1 / zoom;
                const width = this.rocketDesign ? (this.rocketDesign.size.height * scale) : (GameConfig.rocket.width * scale);
                const height = this.rocketDesign ? (this.rocketDesign.size.width * scale) : (GameConfig.rocket.height * scale);
                
                // テクスチャの中心からの相対位置
                const relX = cockpitPos.x - width / 2;
                const relY = cockpitPos.y - height / 2;
                
                // ロケットの回転を考慮した位置を計算
                const cos = Math.cos(rocketRotation);
                const sin = Math.sin(rocketRotation);
                const rotatedX = relX * cos - relY * sin;
                const rotatedY = relX * sin + relY * cos;
                
                // コックピットスプライトの位置と回転を更新
                // エディタの上向き（北）がゲームの右向き（東）になるように+90度 + ロケットの回転
                cockpitSprite.setPosition(rocketX + rotatedX, rocketY + rotatedY);
                cockpitSprite.setRotation(rocketRotation + Math.PI / 2);
            }
        });
    }
    
    /**
     * 空気抵抗を適用（速度の2乗に比例する抵抗）
     */
    applyAirResistance() {
        const body = this.sprite.body;
        const velocity = body.velocity;
        
        // 速度の大きさ
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed < 0.1) return; // 速度が小さい場合はスキップ
        
        // 空気抵抗係数（ロケットの形状による）
        let dragCoefficient = 0.002 * GameConfig.physicsParams.airDensity; // 空気密度を考慮
        
        if (this.rocketDesign && this.rocketDesign.parts) {
            // ノーズがあると空気抵抗が減る
            const hasNose = this.rocketDesign.parts.some(p => p.type === 'nose');
            if (hasNose) {
                dragCoefficient *= 0.7; // 30%減少
            }
            
            // 翼があると空気抵抗が増える
            const wingCount = this.rocketDesign.parts.filter(p => p.type === 'wing').length;
            dragCoefficient *= (1 + wingCount * 0.15); // 翼1つにつき15%増加
            
            // 燃料タンクがあると空気抵抗が増える（重くて大きい）
            const fuelTankCount = this.rocketDesign.parts.filter(p => p.type === 'fueltank').length;
            dragCoefficient *= (1 + fuelTankCount * 0.1);
        }
        
        // 抵抗力 = -0.5 * ρ * v² * Cd * A (簡略化)
        const dragForce = dragCoefficient * speed * speed;
        
        // 速度方向の逆向きに抵抗力を適用
        const dragX = -(velocity.x / speed) * dragForce;
        const dragY = -(velocity.y / speed) * dragForce;
        
        body.force.x += dragX;
        body.force.y += dragY;
    }
    
    /**
     * エンジンによるトルクを適用
     */
    applyEngineTorque() {
        if (!this.rocketDesign) return;
        
        const body = this.sprite.body;
        const torque = this.rocketDesign.getTorque();
        
        // 慣性モーメントを取得
        const momentOfInertia = this.rocketDesign.getMomentOfInertia();
        
        // トルクを適用（τ = I * α より α = τ / I）
        // Matter.jsのトルク単位に調整
        const torqueScale = 0.00001 * GameConfig.physicsParams.torqueScale;
        body.torque += torque * torqueScale;
        
        // 慣性モーメントを設定（大きいほど回転しにくい）
        if (momentOfInertia > 0) {
            body.inertia = momentOfInertia * 0.01; // スケール調整
        }
    }
    
    /**
     * 空力的安定性を適用（ロケットが速度方向に向こうとする）
     */
    applyAerodynamicStability() {
        const body = this.sprite.body;
        const velocity = body.velocity;
        
        // 速度の大きさ
        const speed = Math.sqrt(velocity.x * velocity.x + velocity.y * velocity.y);
        
        if (speed < 1) return; // 速度が小さい場合はスキップ
        
        // 速度方向の角度
        const velocityAngle = Math.atan2(velocity.y, velocity.x);
        
        // 現在のロケットの角度
        const currentAngle = body.angle;
        
        // 角度差を計算（-π ~ π の範囲に正規化）
        let angleDiff = velocityAngle - currentAngle;
        while (angleDiff > Math.PI) angleDiff -= Math.PI * 2;
        while (angleDiff < -Math.PI) angleDiff += Math.PI * 2;
        
        // 安定化トルク（速度が速いほど強く働く）
        let stabilityCoefficient = 0.00002 * GameConfig.physicsParams.stabilityFactor;
        
        if (this.rocketDesign && this.rocketDesign.parts) {
            // 翼があると安定性が大幅に向上
            const wingCount = this.rocketDesign.parts.filter(p => p.type === 'wing').length;
            stabilityCoefficient *= (1 + wingCount * 0.8);
            
            // ノーズがあると安定性が向上
            const hasNose = this.rocketDesign.parts.some(p => p.type === 'nose');
            if (hasNose) {
                stabilityCoefficient *= 1.5;
            }
            
            // 重心が後ろにあるほど安定（静的安定性）
            const centerOfMass = this.rocketDesign.getCenterOfMass();
            const nose = this.rocketDesign.parts.find(p => p.type === 'nose');
            if (nose) {
                // ノーズの座標をゲーム座標系に変換: (x, y) → (-y, x)
                const gameNoseX = -nose.y;
                const gameNoseY = nose.x;
                
                // ゲーム座標系では、発射方向（右）がX軸正
                // ノーズが前方、重心が後方にあると安定
                const stability = (centerOfMass.x - gameNoseX) / 100;
                stabilityCoefficient *= (1 + Math.max(0, stability));
            }
        }
        
        const stabilizingTorque = angleDiff * speed * stabilityCoefficient;
        body.torque += stabilizingTorque;
    }
    
    /**
     * ロケットの角度を速度ベクトルに合わせて更新（後方互換性のため残す）
     */
    updateRotation() {
        // 新しいupdatePhysics()を呼び出す
        this.updatePhysics();
    }
    
    /**
     * 画面外に出たかチェック
     * @param {number} screenWidth - 画面幅
     * @param {number} screenHeight - 画面高さ
     * @returns {boolean} 画面外かどうか
     */
    isOutOfBounds(screenWidth, screenHeight) {
        if (!this.sprite) return false;
        
        // エンティティの位置を更新してからチェック
        this.entity.updatePosition(this.sprite.x, this.sprite.y);
        return this.entity.isOutOfBounds(screenWidth, screenHeight);
    }
    
    /**
     * ロケットの現在位置を取得
     * @returns {{x: number, y: number}} 位置
     */
    getPosition() {
        if (!this.sprite) {
            return { x: this.entity.x, y: this.entity.y };
        }
        return { x: this.sprite.x, y: this.sprite.y };
    }
    
    /**
     * ロケットの現在速度を取得
     * @returns {{x: number, y: number}} 速度
     */
    getVelocity() {
        return { 
            x: this.entity.velocityX, 
            y: this.entity.velocityY 
        };
    }
    
    /**
     * ロケットのエンティティを取得
     * @returns {RocketEntity} ロケットエンティティ
     */
    getEntity() {
        return this.entity;
    }
    
    /**
     * コックピットを分離する（運動量保存を考慮）
     * @param {number} charge - 分離ゲージ（0-100）
     */
    separateCockpit(charge, thrustMultiplier = 1.0) {
        // 1回分離後は分離できない
        if (this.separationCount >= 1 || !this.cockpitSprites || this.cockpitSprites.length === 0) {
            return;
        }
        
        console.log('Separating cockpit with charge:', charge, 'thrust multiplier:', thrustMultiplier, 'Separation count:', this.separationCount + 1);
        
        // 現在のロケットの速度と位置を取得
        const rocketVelocity = this.sprite.body.velocity;
        const rocketX = this.sprite.x;
        const rocketY = this.sprite.y;
        const rocketRotation = this.sprite.rotation;
        
        // ロケットとコックピットの質量を取得
        const rocketMass = this.sprite.body.mass; // ロケット全体の質量
        
        // コックピットの質量を計算
        let cockpitMass = 0;
        if (this.rocketDesign && this.rocketDesign.parts) {
            const cockpitParts = this.rocketDesign.parts.filter(p => p.type === 'cockpit');
            cockpitMass = cockpitParts.reduce((sum, part) => sum + part.mass, 0);
        }
        
        // コックピットがない場合はデフォルト値
        if (cockpitMass === 0) {
            cockpitMass = 1.5; // CockpitPartのデフォルト質量
        }
        
        // 1回目の分離時は赤パーツの質量も含める
        let redPartsMass = 0;
        let redParts = [];
        if (this.separationCount === 0 && this.rocketDesign && this.rocketDesign.parts) {
            redParts = this.rocketDesign.parts.filter(p => 
                p.type === 'redengine' || p.type === 'redbody' || p.type === 'rednose'
            );
            redPartsMass = redParts.reduce((sum, part) => sum + part.mass, 0);
        }
        
        // 分離される質量（コックピット + 赤パーツ（1回目の場合））
        const separatedMass = cockpitMass + redPartsMass;
        
        // ロケット本体の質量（コックピットと赤パーツを除く）
        const rocketBodyMass = rocketMass - separatedMass;
        
        // チャージ量に応じた分離速度を計算（30-100の範囲を1-3 m/sに変換）
        // 元の速度に加えるわずかな分離速度
        const separationSpeed = 1 + ((charge - 30) / 70) * 2;
        
        console.log('Masses - Rocket:', rocketBodyMass, 'Cockpit:', cockpitMass, 'Total:', rocketMass);
        console.log('Separation speed:', separationSpeed);
        
        // 分離方向を事前に計算（ロケットの進行方向の垂直方向＝上方向）
        const separationAngle = rocketRotation - Math.PI / 2;
        const separationDirX = Math.cos(separationAngle);
        const separationDirY = Math.sin(separationAngle);
        
        // コックピットを物理オブジェクトとして分離
        this.cockpitSprites.forEach((cockpitSprite, index) => {
            if (this.cockpitPositions && this.cockpitPositions[index]) {
                const cockpitPos = this.cockpitPositions[index];
                
                // テクスチャのサイズを取得
                const zoom = GameConfig.cameraZoom || 0.33;
                const scale = 1 / zoom;
                const width = this.rocketDesign ? (this.rocketDesign.size.height * scale) : (GameConfig.rocket.width * scale);
                const height = this.rocketDesign ? (this.rocketDesign.size.width * scale) : (GameConfig.rocket.height * scale);
                
                // テクスチャの中心からの相対位置
                const relX = cockpitPos.x - width / 2;
                const relY = cockpitPos.y - height / 2;
                
                // ロケットの回転を考慮した位置を計算
                const cos = Math.cos(rocketRotation);
                const sin = Math.sin(rocketRotation);
                const rotatedX = relX * cos - relY * sin;
                const rotatedY = relX * sin + relY * cos;
                
                const cockpitWorldX = rocketX + rotatedX;
                const cockpitWorldY = rocketY + rotatedY;
                
                // 元のスプライトを非表示
                cockpitSprite.setVisible(false);
                
                // 新しい物理オブジェクトとしてコックピットを作成
                const separatedCockpit = this.scene.matter.add.sprite(
                    cockpitWorldX,
                    cockpitWorldY,
                    cockpitPos.imageKey,
                    null,
                    {
                        shape: {
                            type: 'rectangle',
                            width: cockpitPos.width,
                            height: cockpitPos.height
                        },
                        frictionAir: 0.008,
                        density: 0.001
                    }
                );
                
                separatedCockpit.setDisplaySize(cockpitPos.width, cockpitPos.height);
                separatedCockpit.setRotation(rocketRotation + Math.PI / 2);
                separatedCockpit.setVisible(true);
                
                // 遠心力（慣性）による接線方向の速度を計算
                // ロケットが回転している場合、その回転による接線速度を加える
                const rocketAngularVelocity = this.sprite.body.angularVelocity; // rad/s
                
                // コックピットのロケット中心からの相対位置ベクトル
                const cockpitRelativeX = rotatedX; // ロケット中心からの相対X
                const cockpitRelativeY = rotatedY; // ロケット中心からの相対Y
                
                // 回転による接線速度ベクトル（v = ω × r）
                // 2Dの場合: v_tangential = (-ω * ry, ω * rx)
                const tangentialVelocityX = -rocketAngularVelocity * cockpitRelativeY;
                const tangentialVelocityY = rocketAngularVelocity * cockpitRelativeX;
                
                // コックピットの速度 = ロケットの並進速度 + 接線速度（遠心力効果）
                let cockpitVelocityX = rocketVelocity.x + tangentialVelocityX;
                let cockpitVelocityY = rocketVelocity.y + tangentialVelocityY;
                
                // 推進力倍率を適用（分離方向に推進力を加える）
                // 分離方向（上方向）に推進力を適用
                const thrustForce = 5.0 * thrustMultiplier; // 基本推進力5.0に倍率を適用
                cockpitVelocityX += separationDirX * thrustForce;
                cockpitVelocityY += separationDirY * thrustForce;
                
                separatedCockpit.setVelocity(cockpitVelocityX, cockpitVelocityY);
                
                // ロケットの角速度を継承
                separatedCockpit.setAngularVelocity(rocketAngularVelocity * 0.5);
                
                this.separatedCockpitSprites.push(separatedCockpit);
                
                console.log('Cockpit separated at:', cockpitWorldX, cockpitWorldY);
                console.log('Rocket angular velocity:', rocketAngularVelocity.toFixed(3), 'rad/s');
                console.log('Tangential velocity:', tangentialVelocityX.toFixed(2), tangentialVelocityY.toFixed(2));
                console.log('Cockpit final velocity:', cockpitVelocityX.toFixed(2), cockpitVelocityY.toFixed(2));
            }
        });
        
        // 1回目の分離時は赤パーツも一緒に分離
        if (this.separationCount === 0 && redParts.length > 0 && this.redPartPositions) {
            const zoom = GameConfig.cameraZoom || 0.33;
            const scale = 1 / zoom;
            const width = this.rocketDesign ? (this.rocketDesign.size.height * scale) : (GameConfig.rocket.width * scale);
            const height = this.rocketDesign ? (this.rocketDesign.size.width * scale) : (GameConfig.rocket.height * scale);
            
            const rocketAngularVelocity = this.sprite.body.angularVelocity;
            
            // 赤パーツの位置情報を使用して分離
            this.redPartPositions.forEach((redPartPos, index) => {
                const redPart = redParts.find(p => p.type === redPartPos.type);
                if (redPart) {
                    // テクスチャの中心からの相対位置
                    const relX = redPartPos.x - width / 2;
                    const relY = redPartPos.y - height / 2;
                    
                    // ロケットの回転を考慮した位置を計算
                    const cos = Math.cos(rocketRotation);
                    const sin = Math.sin(rocketRotation);
                    const rotatedX = relX * cos - relY * sin;
                    const rotatedY = relX * sin + relY * cos;
                    
                    const redPartWorldX = rocketX + rotatedX;
                    const redPartWorldY = rocketY + rotatedY;
                    
                    // 赤パーツの物理オブジェクトを作成
                    const separatedRedPart = this.scene.matter.add.sprite(
                        redPartWorldX,
                        redPartWorldY,
                        null,
                        null,
                        {
                            shape: {
                                type: redPart.type === 'redengine' ? 'circle' : 'rectangle',
                                radius: redPartPos.width / 2,
                                width: redPartPos.width,
                                height: redPartPos.height
                            },
                            frictionAir: 0.008,
                            density: 0.001
                        }
                    );
                    
                    // 赤パーツのグラフィックスを描画
                    const redPartGraphics = this.scene.add.graphics();
                    redPartGraphics.fillStyle(redPart.color);
                    if (redPart.type === 'redengine') {
                        redPartGraphics.fillCircle(0, 0, redPartPos.width / 2);
                        redPartGraphics.fillStyle(0xff4500);
                        redPartGraphics.fillTriangle(0, redPartPos.width / 2, -redPartPos.width / 4, redPartPos.width / 2 + 20, redPartPos.width / 4, redPartPos.width / 2 + 20);
                    } else if (redPart.type === 'redbody') {
                        redPartGraphics.fillRect(-redPartPos.width / 2, -redPartPos.height / 2, redPartPos.width, redPartPos.height);
                    } else if (redPart.type === 'rednose') {
                        redPartGraphics.fillTriangle(0, -redPartPos.height / 2, -redPartPos.width / 2, redPartPos.height / 2, redPartPos.width / 2, redPartPos.height / 2);
                        redPartGraphics.fillStyle(0xff4500);
                        redPartGraphics.fillTriangle(0, -redPartPos.height / 2 - 10, -redPartPos.width / 4, -redPartPos.height / 2, redPartPos.width / 4, -redPartPos.height / 2);
                    }
                    redPartGraphics.lineStyle(3, 0xe74c3c);
                    if (redPart.type === 'redengine') {
                        redPartGraphics.strokeCircle(0, 0, redPartPos.width / 2);
                    } else if (redPart.type === 'redbody') {
                        redPartGraphics.strokeRect(-redPartPos.width / 2, -redPartPos.height / 2, redPartPos.width, redPartPos.height);
                    } else if (redPart.type === 'rednose') {
                        redPartGraphics.strokeTriangle(0, -redPartPos.height / 2, -redPartPos.width / 2, redPartPos.height / 2, redPartPos.width / 2, redPartPos.height / 2);
                    }
                    
                    const textureKey = `redPart_${redPart.type}_${index}`;
                    redPartGraphics.generateTexture(textureKey, redPartPos.width, redPartPos.height);
                    redPartGraphics.destroy();
                    
                    separatedRedPart.setTexture(textureKey);
                    separatedRedPart.setDisplaySize(redPartPos.width, redPartPos.height);
                    separatedRedPart.setRotation(rocketRotation);
                    separatedRedPart.setVisible(true);
                    
                    // 速度を計算（コックピットと同じロジック）
                    const redPartRelativeX = rotatedX;
                    const redPartRelativeY = rotatedY;
                    const tangentialVelocityX = -rocketAngularVelocity * redPartRelativeY;
                    const tangentialVelocityY = rocketAngularVelocity * redPartRelativeX;
                    const redPartVelocityX = rocketVelocity.x + tangentialVelocityX;
                    const redPartVelocityY = rocketVelocity.y + tangentialVelocityY;
                    
                    separatedRedPart.setVelocity(redPartVelocityX, redPartVelocityY);
                    separatedRedPart.setAngularVelocity(rocketAngularVelocity * 0.5);
                    
                    this.separatedRedParts.push(separatedRedPart);
                    
                    console.log('Red part separated:', redPart.type, 'at:', redPartWorldX, redPartWorldY);
                }
            });
            
            // コックピットと赤パーツを結合して新しいロケットに変形（少し遅延させて実行）
            if (this.separatedCockpitSprites.length > 0 && this.separatedRedParts.length > 0) {
                this.scene.time.delayedCall(100, () => {
                    this.transformCockpitToRocket();
                });
            }
        }
        
        // ロケット本体に分離方向の逆向きに力を加える
        // チャージ量に応じた分離速度をロケット本体の速度変化として適用
        const rocketVelocityChangeX = -(separationDirX * separationSpeed) * (separatedMass / rocketBodyMass);
        const rocketVelocityChangeY = -(separationDirY * separationSpeed) * (separatedMass / rocketBodyMass);
        
        // ロケットの新しい速度（コックピット分離の反作用）
        const newRocketVelocityX = rocketVelocity.x + rocketVelocityChangeX;
        const newRocketVelocityY = rocketVelocity.y + rocketVelocityChangeY;
        
        // 速度を直接設定
        this.sprite.setVelocity(newRocketVelocityX, newRocketVelocityY);
        
        console.log('Rocket velocity change (recoil):', rocketVelocityChangeX.toFixed(2), rocketVelocityChangeY.toFixed(2));
        console.log('Rocket velocity after separation:', newRocketVelocityX.toFixed(2), newRocketVelocityY.toFixed(2));
        
        // 運動量の検証（デバッグ用）
        if (this.separatedCockpitSprites.length > 0) {
            const initialMomentumX = rocketMass * rocketVelocity.x;
            const initialMomentumY = rocketMass * rocketVelocity.y;
            const finalMomentumX = rocketBodyMass * newRocketVelocityX + separatedMass * rocketVelocity.x;
            const finalMomentumY = rocketBodyMass * newRocketVelocityY + separatedMass * rocketVelocity.y;
            
            console.log('Separation summary:');
            console.log('- Separated parts keep original velocity');
            console.log('- Rocket body gets recoil');
            console.log('Initial momentum:', initialMomentumX.toFixed(2), initialMomentumY.toFixed(2));
            console.log('Final momentum:', finalMomentumX.toFixed(2), finalMomentumY.toFixed(2));
            console.log('Difference:', (finalMomentumX - initialMomentumX).toFixed(2), (finalMomentumY - initialMomentumY).toFixed(2));
        }
        
        this.separationCount++;
        this.isCockpitSeparated = true;
    }
    
    /**
     * コックピットと赤パーツを結合して新しいロケットに変形
     */
    transformCockpitToRocket() {
        if (this.separatedCockpitSprites.length === 0 || this.separatedRedParts.length === 0) {
            return;
        }
        
        const cockpitSprite = this.separatedCockpitSprites[0];
        const cockpitX = cockpitSprite.x;
        const cockpitY = cockpitSprite.y;
        const cockpitVelocity = cockpitSprite.body.velocity;
        const cockpitAngularVelocity = cockpitSprite.body.angularVelocity;
        
        // コックピットと赤パーツの位置を計算
        const redPartsPositions = this.separatedRedParts.map(redPart => ({
            x: redPart.x - cockpitX,
            y: redPart.y - cockpitY,
            sprite: redPart
        }));
        
        // コックピットを中心にした新しいロケットのサイズを計算
        const zoom = GameConfig.cameraZoom || 0.33;
        const scale = 1 / zoom;
        
        // コックピットパーツを取得
        const cockpitPart = this.rocketDesign.parts.find(p => p.type === 'cockpit');
        
        // 赤パーツとコックピットの境界を計算
        const redParts = this.rocketDesign.parts.filter(p => 
            p.type === 'redengine' || p.type === 'redbody' || p.type === 'rednose'
        );
        
        let minX = 0, maxX = 0, minY = 0, maxY = 0;
        
        // コックピットの位置（中心）
        if (cockpitPart) {
            const cockpitGameX = -cockpitPart.y;
            const cockpitGameY = cockpitPart.x;
            minX = maxX = cockpitGameX;
            minY = maxY = cockpitGameY;
        }
        
        // 赤パーツの位置を計算
        redParts.forEach(redPart => {
            const partGameX = -redPart.y;
            const partGameY = redPart.x;
            const redPartPos = this.redPartPositions.find(pos => pos.type === redPart.type);
            if (redPartPos) {
                const halfWidth = redPartPos.width / (2 * scale);
                const halfHeight = redPartPos.height / (2 * scale);
                minX = Math.min(minX, partGameX - halfWidth);
                maxX = Math.max(maxX, partGameX + halfWidth);
                minY = Math.min(minY, partGameY - halfHeight);
                maxY = Math.max(maxY, partGameY + halfHeight);
            }
        });
        
        const baseWidth = (maxX - minX) * scale + 100;
        const baseHeight = (maxY - minY) * scale + 100;
        const offsetX = (minX + maxX) / 2;
        const offsetY = (minY + maxY) / 2;
        
        // 新しいロケットのテクスチャを生成
        const rocketGraphics = this.scene.add.graphics();
        
        // コックピットを描画（中心）
        const cockpitPos = this.cockpitPositions[0];
        if (cockpitPos && cockpitPart) {
            const cockpitGameX = -cockpitPart.y;
            const cockpitGameY = cockpitPart.x;
            const cockpitRelX = (cockpitGameX - offsetX) * scale + baseWidth / 2;
            const cockpitRelY = (cockpitGameY - offsetY) * scale + baseHeight / 2;
            
            rocketGraphics.fillStyle(0x2c3e50);
            rocketGraphics.fillRect(cockpitRelX - cockpitPos.width / 2, cockpitRelY - cockpitPos.height / 2, cockpitPos.width, cockpitPos.height);
            rocketGraphics.lineStyle(2 * scale, 0xffd93d, 0.8);
            rocketGraphics.strokeRect(cockpitRelX - cockpitPos.width / 2, cockpitRelY - cockpitPos.height / 2, cockpitPos.width, cockpitPos.height);
        }
        
        // 赤パーツを描画（コックピットの周りに配置）
        // コックピットを中心に、赤パーツを適切な位置に配置
        // redPartsは既に1207行目で定義されているので、再定義しない
        
        redParts.forEach((redPart, index) => {
            const redPartPos = this.redPartPositions.find(pos => pos.type === redPart.type);
            
            if (redPartPos) {
                // コックピットを中心とした相対位置を計算
                // エディタ座標からゲーム座標への変換
                const partGameX = -redPart.y;
                const partGameY = redPart.x;
                
                // テクスチャ内の相対位置（オフセットを考慮）
                const relX = (partGameX - offsetX) * scale + baseWidth / 2;
                const relY = (partGameY - offsetY) * scale + baseHeight / 2;
                
                rocketGraphics.fillStyle(redPartPos.color);
                if (redPartPos.type === 'redengine') {
                    rocketGraphics.fillCircle(relX, relY, redPartPos.width / 2);
                    rocketGraphics.fillStyle(0xff4500);
                    rocketGraphics.fillTriangle(relX, relY + redPartPos.width / 2, relX - redPartPos.width / 4, relY + redPartPos.width / 2 + 20, relX + redPartPos.width / 4, relY + redPartPos.width / 2 + 20);
                } else if (redPartPos.type === 'redbody') {
                    rocketGraphics.fillRect(relX - redPartPos.width / 2, relY - redPartPos.height / 2, redPartPos.width, redPartPos.height);
                } else if (redPartPos.type === 'rednose') {
                    rocketGraphics.fillTriangle(relX, relY - redPartPos.height / 2, relX - redPartPos.width / 2, relY + redPartPos.height / 2, relX + redPartPos.width / 2, relY + redPartPos.height / 2);
                    rocketGraphics.fillStyle(0xff4500);
                    rocketGraphics.fillTriangle(relX, relY - redPartPos.height / 2 - 10, relX - redPartPos.width / 4, relY - redPartPos.height / 2, relX + redPartPos.width / 4, relY - redPartPos.height / 2);
                }
                rocketGraphics.lineStyle(3 * scale, 0xe74c3c);
                if (redPartPos.type === 'redengine') {
                    rocketGraphics.strokeCircle(relX, relY, redPartPos.width / 2);
                } else if (redPartPos.type === 'redbody') {
                    rocketGraphics.strokeRect(relX - redPartPos.width / 2, relY - redPartPos.height / 2, redPartPos.width, redPartPos.height);
                } else if (redPartPos.type === 'rednose') {
                    rocketGraphics.strokeTriangle(relX, relY - redPartPos.height / 2, relX - redPartPos.width / 2, relY + redPartPos.height / 2, relX + redPartPos.width / 2, relY + redPartPos.height / 2);
                }
            }
        });
        
        // テクスチャを生成
        const textureKey = 'transformedCockpitRocket';
        if (this.scene.textures.exists(textureKey)) {
            this.scene.textures.remove(textureKey);
        }
        rocketGraphics.generateTexture(textureKey, baseWidth, baseHeight);
        rocketGraphics.destroy();
        
        // 既存のコックピットと赤パーツのスプライトを非表示
        cockpitSprite.setVisible(false);
        this.separatedRedParts.forEach(redPart => {
            redPart.setVisible(false);
        });
        
        // 新しいロケットスプライトを作成
        const transformedRocket = this.scene.matter.add.sprite(
            cockpitX,
            cockpitY,
            textureKey,
            null,
            {
                shape: {
                    type: 'rectangle',
                    width: baseWidth,
                    height: baseHeight
                },
                frictionAir: 0.008,
                density: 0.001
            }
        );
        
        transformedRocket.setDisplaySize(baseWidth, baseHeight);
        transformedRocket.setRotation(cockpitSprite.rotation);
        transformedRocket.setVelocity(cockpitVelocity.x, cockpitVelocity.y);
        transformedRocket.setAngularVelocity(cockpitAngularVelocity);
        transformedRocket.setVisible(true);
        
        // 変形後のロケットを保存
        this.transformedCockpitRocket = transformedRocket;
        
        // 分離されたコックピットスプライトを更新（変形後のロケットを参照）
        this.separatedCockpitSprites[0] = transformedRocket;
        
        console.log('Cockpit transformed to rocket with red parts at:', cockpitX, cockpitY);
    }
}
