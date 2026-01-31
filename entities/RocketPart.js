/**
 * ロケットパーツの基本クラス
 */
export class RocketPart {
    constructor(type, x = 0, y = 0) {
        this.id = Math.random().toString(36).substr(2, 9); // 一意のID
        this.type = type; // 'nose', 'body', 'wing', 'engine'
        this.x = x;
        this.y = y;
        this.width = 40;
        this.height = 40;
        this.color = 0xff6b6b;
        this.mass = 1;
        this.thrust = 0; // 推進力（エンジンのみ）
        this.drag = 0.01; // 空気抵抗
        this.angle = 0; // 向き（ラジアン）0=右、π/2=下、π=左、3π/2=上
        this.compositeGroupId = null; // 複合パーツのグループID（複合パーツに属する場合のみ）
    }
    
    /**
     * パーツをJSON形式で取得
     */
    toJSON() {
        return {
            id: this.id,
            type: this.type,
            x: this.x,
            y: this.y,
            width: this.width,
            height: this.height,
            color: this.color,
            mass: this.mass,
            thrust: this.thrust,
            drag: this.drag,
            angle: this.angle,
            compositeGroupId: this.compositeGroupId
        };
    }
}

/**
 * ノーズコーン（先端）
 */
export class NosePart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('nose', x, y);
        this.width = 40;
        this.height = 30;
        this.color = 0xffd93d;
        this.mass = 0.5;
        this.drag = 0.005; // 空気抵抗が少ない
    }
}

/**
 * ボディ（本体）
 */
export class BodyPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('body', x, y);
        this.width = 40;
        this.height = 50;
        this.color = 0xff6b6b;
        this.mass = 2;
        this.drag = 0.01;
    }
}

/**
 * ウィング（翼）
 */
export class WingPart extends RocketPart {
    constructor(x = 0, y = 0, side = 'left') {
        super('wing', x, y);
        this.side = side; // 'left' or 'right'
        this.width = 30;
        this.height = 40;
        this.color = 0x4ecdc4;
        this.mass = 0.8;
        this.drag = 0.015;
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            side: this.side
        };
    }
}

/**
 * エンジン
 */
export class EnginePart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('engine', x, y);
        this.width = 40;
        this.height = 35;
        this.color = 0xe74c3c;
        this.mass = 1.5;
        this.thrust = 10; // 推進力
        this.drag = 0.01;
        this.angle = Math.PI / 2; // デフォルトは下向き噴射（推進力は上向き）
    }
    
    /**
     * エンジンの推進力ベクトルを取得（噴射方向の逆）
     * @returns {{x: number, y: number}} 推進力ベクトル
     */
    getThrustVector() {
        // 噴射方向の逆向きに推進力が働く
        const thrustAngle = this.angle + Math.PI; // 180度反転
        return {
            x: Math.cos(thrustAngle) * this.thrust,
            y: Math.sin(thrustAngle) * this.thrust
        };
    }
}

/**
 * 燃料タンク
 */
export class FuelTankPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('fueltank', x, y);
        this.width = 40;
        this.height = 60;
        this.color = 0x95a5a6;
        this.mass = 3;
        this.fuel = 100; // 燃料量
        this.drag = 0.01;
    }

    toJSON() {
        return {
            ...super.toJSON(),
            fuel: this.fuel
        };
    }
}

/**
 * コックピット（画像パーツ）
 */
export class CockpitPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('cockpit', x, y);
        this.width = 50;
        this.height = 50;
        this.color = 0xffffff; // コックピットは画像を使うので色は使わない
        this.mass = 1.5;
        this.drag = 0.008; // 比較的低抵抗
        this.imageKey = 'horochi'; // 画像のキー
        this.imagePath = 'resources/horochi.png'; // 画像のパス
    }

    toJSON() {
        return {
            ...super.toJSON(),
            imageKey: this.imageKey,
            imagePath: this.imagePath
        };
    }
}

/**
 * JSONからパーツを作成（タイプに応じた適切なクラスのインスタンスを返す）
 * すべてのパーツクラスの定義後に追加
 */
RocketPart.fromJSON = function(json) {
    let part;
    
    // タイプに応じて適切なサブクラスのインスタンスを作成
    switch (json.type) {
        case 'nose':
            part = new NosePart(json.x, json.y);
            break;
        case 'body':
            part = new BodyPart(json.x, json.y);
            break;
        case 'wing':
            part = new WingPart(json.x, json.y, json.side || 'left');
            break;
        case 'engine':
            part = new EnginePart(json.x, json.y);
            break;
            case 'fueltank':
                part = new FuelTankPart(json.x, json.y);
                break;
            case 'cockpit':
                part = new CockpitPart(json.x, json.y);
                break;
            // レアパーツ
            case 'superengine':
                part = new SuperEnginePart(json.x, json.y);
                break;
            case 'ultralightengine':
                part = new UltraLightEnginePart(json.x, json.y);
                break;
            case 'weight':
                part = new WeightPart(json.x, json.y);
                break;
            case 'ultralightnose':
                part = new UltraLightNosePart(json.x, json.y);
                break;
            case 'reinforcedbody':
                part = new ReinforcedBodyPart(json.x, json.y);
                break;
            case 'megafueltank':
                part = new MegaFuelTankPart(json.x, json.y);
                break;
            case 'largewing':
                part = new LargeWingPart(json.x, json.y);
                break;
            case 'microengine':
                part = new MicroEnginePart(json.x, json.y);
                break;
            case 'dualengine':
                part = new DualEnginePart(json.x, json.y);
                break;
            case 'stabilizer':
                part = new StabilizerPart(json.x, json.y);
                break;
            default:
                part = new RocketPart(json.type, json.x, json.y);
        }
    
    // 共通プロパティを設定
    part.id = json.id;
    part.width = json.width !== undefined ? json.width : part.width;
    part.height = json.height !== undefined ? json.height : part.height;
    part.color = json.color !== undefined ? json.color : part.color;
    part.mass = json.mass !== undefined ? json.mass : part.mass;
    part.thrust = json.thrust !== undefined ? json.thrust : part.thrust;
    part.drag = json.drag !== undefined ? json.drag : part.drag;
    part.angle = json.angle !== undefined ? json.angle : (part.angle !== undefined ? part.angle : 0);
    part.compositeGroupId = json.compositeGroupId || null;
    
    // 燃料タンク固有のプロパティ
    if (json.type === 'fueltank' && json.fuel !== undefined) {
        part.fuel = json.fuel;
    }
    
    // レアパーツのフラグ
    if (json.isRare !== undefined) {
        part.isRare = json.isRare;
    }
    
    return part;
};

// ========================================
// レアパーツ（トロフィー解放で追加）
// ========================================

/**
 * 超強力エンジン（レア）
 */
export class SuperEnginePart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('superengine', x, y);
        this.width = 50;
        this.height = 45;
        this.color = 0xff0000;
        this.mass = 2.5;
        this.thrust = 80; // 通常の8倍！超強力
        this.drag = 0.015;
        this.angle = Math.PI / 2;
        this.isRare = true;
    }
    
    getThrustVector() {
        const thrustAngle = this.angle + Math.PI;
        return {
            x: Math.cos(thrustAngle) * this.thrust,
            y: Math.sin(thrustAngle) * this.thrust
        };
    }
}

/**
 * 超軽量エンジン（レア）
 */
export class UltraLightEnginePart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('ultralightengine', x, y);
        this.width = 30;
        this.height = 25;
        this.color = 0x00ffff;
        this.mass = 0.3; // さらに軽量化
        this.thrust = 35; // 通常の3.5倍、軽量で高出力
        this.drag = 0.003; // 空気抵抗も削減
        this.angle = Math.PI / 2;
        this.isRare = true;
    }
    
    getThrustVector() {
        const thrustAngle = this.angle + Math.PI;
        return {
            x: Math.cos(thrustAngle) * this.thrust,
            y: Math.sin(thrustAngle) * this.thrust
        };
    }
}

/**
 * おもり（レア）- 質量を増やすためのパーツ
 */
export class WeightPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('weight', x, y);
        this.width = 40;
        this.height = 40;
        this.color = 0x34495e;
        this.mass = 30; // 非常に重い（3倍に増加）
        this.drag = 0.03;
        this.isRare = true;
    }
}

/**
 * 超軽量ノーズ（レア）
 */
export class UltraLightNosePart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('ultralightnose', x, y);
        this.width = 30;
        this.height = 40;
        this.color = 0xf39c12;
        this.mass = 0.3;
        this.drag = 0.002; // 超低抵抗
        this.stability = 0.8;
        this.isRare = true;
    }
}

/**
 * 強化ボディ（レア）- 頑丈で重い
 */
export class ReinforcedBodyPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('reinforcedbody', x, y);
        this.width = 50;
        this.height = 60;
        this.color = 0x7f8c8d;
        this.mass = 3.5;
        this.drag = 0.015;
        this.isRare = true;
    }
}

/**
 * 巨大燃料タンク（レア）
 */
export class MegaFuelTankPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('megafueltank', x, y);
        this.width = 50;
        this.height = 80;
        this.color = 0x16a085;
        this.mass = 5;
        this.fuel = 500; // 通常の5倍
        this.drag = 0.02;
        this.isRare = true;
    }
    
    toJSON() {
        return {
            ...super.toJSON(),
            fuel: this.fuel
        };
    }
}

/**
 * 大型ウィング（レア）- 安定性抜群
 */
export class LargeWingPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('largewing', x, y);
        this.width = 80;
        this.height = 15;
        this.color = 0xe67e22;
        this.mass = 1.5;
        this.drag = 0.015;
        this.stability = 0.9; // 超高安定性
        this.isRare = true;
    }
}

/**
 * 超小型エンジン（レア）- 小さいが高効率
 */
export class MicroEnginePart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('microengine', x, y);
        this.width = 20;
        this.height = 20;
        this.color = 0xc0392b;
        this.mass = 0.2; // 超軽量
        this.thrust = 20; // 通常の2倍、サイズの割に強力
        this.drag = 0.003; // 小型で抵抗少ない
        this.angle = Math.PI / 2;
        this.isRare = true;
    }
    
    getThrustVector() {
        const thrustAngle = this.angle + Math.PI;
        return {
            x: Math.cos(thrustAngle) * this.thrust,
            y: Math.sin(thrustAngle) * this.thrust
        };
    }
}

/**
 * 複合エンジン（レア）- 2つのノズル
 */
export class DualEnginePart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('dualengine', x, y);
        this.width = 70;
        this.height = 40;
        this.color = 0x8e44ad;
        this.mass = 3.0;
        this.thrust = 60; // 通常の6倍、デュアルノズルの威力
        this.drag = 0.018;
        this.angle = Math.PI / 2;
        this.isRare = true;
    }
    
    getThrustVector() {
        const thrustAngle = this.angle + Math.PI;
        return {
            x: Math.cos(thrustAngle) * this.thrust,
            y: Math.sin(thrustAngle) * this.thrust
        };
    }
}

/**
 * 安定化装置（レア）- 回転を抑制
 */
export class StabilizerPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('stabilizer', x, y);
        this.width = 60;
        this.height = 20;
        this.color = 0x2980b9;
        this.mass = 1;
        this.drag = 0.01;
        this.stability = 1.5; // 非常に高い安定性
        this.isRare = true;
    }
}

/**
 * 赤パーツ1: 超高出力エンジン（赤）- 1個のみ使用可能
 */
export class RedEnginePart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('redengine', x, y);
        this.width = 50;
        this.height = 50;
        this.color = 0xe74c3c; // 赤色
        this.mass = 50; // 非常に重い
        this.thrust = 5000; // 超高出力
        this.drag = 0.05;
        this.angle = Math.PI / 2; // 下向き
        this.isRedPart = true; // 赤パーツフラグ
        this.maxCount = 1; // 1個のみ使用可能
    }
}

/**
 * 赤パーツ2: 超重量ボディ（赤）- 1個のみ使用可能
 */
export class RedBodyPart extends RocketPart {
    constructor(x = 0, y = 0) {
        super('redbody', x, y);
        this.width = 60;
        this.height = 60;
        this.color = 0xc0392b; // 濃い赤色
        this.mass = 100; // 超重量
        this.drag = 0.08;
        this.isRedPart = true; // 赤パーツフラグ
        this.maxCount = 1; // 1個のみ使用可能
    }
}

/**
 * エンジン改造パーツ（テトリミノ）の基底クラス
 */
export class TetrominoPart extends RocketPart {
    constructor(type, x = 0, y = 0) {
        super(type, x, y);
        this.blocks = []; // グリッド上の相対位置 [{x: 0, y: 0}, ...]
        this.color = 0x3498db; // 青色
        this.mass = 5; // 基本質量
        this.thrust = 100; // 基本推力
        this.drag = 0.01;
        this.angle = Math.PI / 2; // 下向き
        this.isTetromino = true;
        this.rotation = 0; // 回転状態（0, 1, 2, 3）
    }
    
    /**
     * テトリミノを回転（90度）
     */
    rotate() {
        this.rotation = (this.rotation + 1) % 4;
        // 回転後のブロック位置を計算
        this.blocks = this.getRotatedBlocks();
    }
    
    /**
     * 回転後のブロック位置を取得
     */
    getRotatedBlocks() {
        // 各テトリミノでオーバーライド
        return this.blocks;
    }
}

/**
 * I型テトリミノ（縦4マス）
 */
export class ITetromino extends TetrominoPart {
    constructor(x = 0, y = 0) {
        super('tetromino_i', x, y);
        this.blocks = [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}];
        this.color = 0x00ffff; // シアン
        this.mass = 4;
        this.thrust = 400;
        this.name = 'I型エンジン';
    }
    
    getRotatedBlocks() {
        if (this.rotation % 2 === 0) {
            return [{x: 0, y: 0}, {x: 0, y: 1}, {x: 0, y: 2}, {x: 0, y: 3}];
        } else {
            return [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 3, y: 0}];
        }
    }
}

/**
 * O型テトリミノ（2×2の正方形）
 */
export class OTetromino extends TetrominoPart {
    constructor(x = 0, y = 0) {
        super('tetromino_o', x, y);
        this.blocks = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}];
        this.color = 0xffff00; // 黄色
        this.mass = 4;
        this.thrust = 300;
        this.name = 'O型エンジン';
    }
    
    getRotatedBlocks() {
        // O型は回転しても同じ
        return this.blocks;
    }
}

/**
 * T型テトリミノ
 */
export class TTetromino extends TetrominoPart {
    constructor(x = 0, y = 0) {
        super('tetromino_t', x, y);
        this.blocks = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 1, y: 1}];
        this.color = 0x9b59b6; // 紫色
        this.mass = 4;
        this.thrust = 350;
        this.name = 'T型エンジン';
    }
    
    getRotatedBlocks() {
        const base = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 2, y: 0}, {x: 1, y: 1}];
        const rotations = [
            base,
            [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 1, y: 2}],
            [{x: 1, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}],
            [{x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 2}, {x: 1, y: 2}]
        ];
        return rotations[this.rotation];
    }
}

/**
 * S型テトリミノ
 */
export class STetromino extends TetrominoPart {
    constructor(x = 0, y = 0) {
        super('tetromino_s', x, y);
        this.blocks = [{x: 1, y: 0}, {x: 2, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}];
        this.color = 0x2ecc71; // 緑色
        this.mass = 4;
        this.thrust = 350;
        this.name = 'S型エンジン';
    }
    
    getRotatedBlocks() {
        const base = [{x: 1, y: 0}, {x: 2, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}];
        const rotations = [
            base,
            [{x: 1, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 2, y: 2}],
            base,
            [{x: 1, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 2, y: 2}]
        ];
        return rotations[this.rotation];
    }
}

/**
 * Z型テトリミノ
 */
export class ZTetromino extends TetrominoPart {
    constructor(x = 0, y = 0) {
        super('tetromino_z', x, y);
        this.blocks = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}];
        this.color = 0xe74c3c; // 赤色
        this.mass = 4;
        this.thrust = 350;
        this.name = 'Z型エンジン';
    }
    
    getRotatedBlocks() {
        const base = [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}];
        const rotations = [
            base,
            [{x: 2, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 1, y: 2}],
            base,
            [{x: 2, y: 0}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 1, y: 2}]
        ];
        return rotations[this.rotation];
    }
}

/**
 * J型テトリミノ
 */
export class JTetromino extends TetrominoPart {
    constructor(x = 0, y = 0) {
        super('tetromino_j', x, y);
        this.blocks = [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}];
        this.color = 0x3498db; // 青色
        this.mass = 4;
        this.thrust = 350;
        this.name = 'J型エンジン';
    }
    
    getRotatedBlocks() {
        const base = [{x: 0, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}];
        const rotations = [
            base,
            [{x: 1, y: 0}, {x: 2, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}],
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 2, y: 2}],
            [{x: 1, y: 0}, {x: 1, y: 1}, {x: 0, y: 2}, {x: 1, y: 2}]
        ];
        return rotations[this.rotation];
    }
}

/**
 * L型テトリミノ
 */
export class LTetromino extends TetrominoPart {
    constructor(x = 0, y = 0) {
        super('tetromino_l', x, y);
        this.blocks = [{x: 2, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}];
        this.color = 0xf39c12; // オレンジ
        this.mass = 4;
        this.thrust = 350;
        this.name = 'L型エンジン';
    }
    
    getRotatedBlocks() {
        const base = [{x: 2, y: 0}, {x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}];
        const rotations = [
            base,
            [{x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}, {x: 2, y: 2}],
            [{x: 0, y: 1}, {x: 1, y: 1}, {x: 2, y: 1}, {x: 0, y: 2}],
            [{x: 0, y: 0}, {x: 1, y: 0}, {x: 1, y: 1}, {x: 1, y: 2}]
        ];
        return rotations[this.rotation];
    }
}
