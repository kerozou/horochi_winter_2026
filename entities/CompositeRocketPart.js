import { 
    NosePart, BodyPart, WingPart, EnginePart, FuelTankPart, CockpitPart,
    SuperEnginePart, UltraLightEnginePart, WeightPart, UltraLightNosePart,
    ReinforcedBodyPart, MegaFuelTankPart, LargeWingPart, MicroEnginePart,
    DualEnginePart, StabilizerPart
} from './RocketPart.js';

/**
 * 複合ロケットパーツ（テトリミノ風）
 * 複数の基本パーツを組み合わせた事前定義パーツ
 */
export class CompositeRocketPart {
    constructor(name, description, parts, icon) {
        this.name = name;
        this.description = description;
        this.parts = parts; // [{type, offsetX, offsetY, side?, angle?}]
        this.icon = icon;
        this.originalIcon = icon; // 元のアイコンを保存
        this.color = 0xffffff; // 表示色
        this.rotationCount = 0; // 回転回数（0-3）
    }
    
    /**
     * パーツを90度右回転（時計回り）
     */
    rotate() {
        this.parts = this.parts.map(part => {
            // 座標を90度右回転: (x, y) → (y, -x)
            const newOffsetX = part.offsetY;
            const newOffsetY = -part.offsetX;
            
            // エンジンの角度も回転
            let newAngle = part.angle;
            if (newAngle !== undefined) {
                newAngle = (part.angle + Math.PI / 2) % (Math.PI * 2);
            }
            
            // 翼の左右も反転
            let newSide = part.side;
            if (part.type === 'wing' || part.type === 'largewing') {
                newSide = part.side === 'left' ? 'right' : 'left';
            }
            
            return {
                ...part,
                offsetX: newOffsetX,
                offsetY: newOffsetY,
                angle: newAngle,
                side: newSide
            };
        });
        
        // 回転回数をカウント（0-3）
        this.rotationCount = (this.rotationCount + 1) % 4;
        
        // アイコンに回転インジケーターを追加
        const rotationIndicators = ['', '↻', '↻↻', '↻↻↻'];
        this.icon = this.originalIcon + (this.rotationCount > 0 ? ` ${rotationIndicators[this.rotationCount]}` : '');
        
        console.log(`✅ Rotated ${this.name} (rotation: ${this.rotationCount * 90}°)`);
    }
    
    /**
     * 複合パーツを指定位置に実体化する
     * @param {number} x - 中心X座標
     * @param {number} y - 中心Y座標
     * @returns {{groupId: string, parts: Array, centerX: number, centerY: number}} グループ情報と生成されたパーツ
     */
    instantiate(x, y) {
        const instances = [];
        const groupId = 'composite_' + Math.random().toString(36).substr(2, 9); // 複合パーツのグループID
        
        this.parts.forEach(partDef => {
            let part;
            
            // パーツタイプに応じて生成
            switch (partDef.type) {
                case 'nose':
                    part = new NosePart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                case 'body':
                    part = new BodyPart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                case 'wing':
                    part = new WingPart(x + partDef.offsetX, y + partDef.offsetY, partDef.side || 'left');
                    break;
                case 'engine':
                    part = new EnginePart(x + partDef.offsetX, y + partDef.offsetY);
                    if (partDef.angle !== undefined) {
                        part.angle = partDef.angle;
                    }
                    break;
                case 'fueltank':
                    part = new FuelTankPart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                case 'cockpit':
                    part = new CockpitPart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                // レアパーツ
                case 'superengine':
                    part = new SuperEnginePart(x + partDef.offsetX, y + partDef.offsetY);
                    if (partDef.angle !== undefined) {
                        part.angle = partDef.angle;
                    }
                    break;
                case 'ultralightengine':
                    part = new UltraLightEnginePart(x + partDef.offsetX, y + partDef.offsetY);
                    if (partDef.angle !== undefined) {
                        part.angle = partDef.angle;
                    }
                    break;
                case 'microengine':
                    part = new MicroEnginePart(x + partDef.offsetX, y + partDef.offsetY);
                    if (partDef.angle !== undefined) {
                        part.angle = partDef.angle;
                    }
                    break;
                case 'dualengine':
                    part = new DualEnginePart(x + partDef.offsetX, y + partDef.offsetY);
                    if (partDef.angle !== undefined) {
                        part.angle = partDef.angle;
                    }
                    break;
                case 'weight':
                    part = new WeightPart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                case 'ultralightnose':
                    part = new UltraLightNosePart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                case 'reinforcedbody':
                    part = new ReinforcedBodyPart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                case 'megafueltank':
                    part = new MegaFuelTankPart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                case 'largewing':
                    part = new LargeWingPart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                case 'stabilizer':
                    part = new StabilizerPart(x + partDef.offsetX, y + partDef.offsetY);
                    break;
                default:
                    console.warn('Unknown part type in composite:', partDef.type);
            }
            
            if (part) {
                part.compositeGroupId = groupId; // グループIDを設定
                instances.push(part);
            }
        });
        
        return {
            groupId: groupId,
            parts: instances,
            centerX: x,
            centerY: y,
            compositeName: this.name // 複合パーツの名前も保存
        };
    }
    
    /**
     * 複合パーツの境界ボックスを取得
     * @returns {{minX, maxX, minY, maxY, width, height}}
     */
    getBounds() {
        if (this.parts.length === 0) {
            return { minX: 0, maxX: 0, minY: 0, maxY: 0, width: 0, height: 0 };
        }
        
        let minX = Infinity, maxX = -Infinity;
        let minY = Infinity, maxY = -Infinity;
        
        this.parts.forEach(partDef => {
            // パーツのサイズを考慮（簡略化）
            const size = 40; // 基本サイズ
            minX = Math.min(minX, partDef.offsetX - size / 2);
            maxX = Math.max(maxX, partDef.offsetX + size / 2);
            minY = Math.min(minY, partDef.offsetY - size / 2);
            maxY = Math.max(maxY, partDef.offsetY + size / 2);
        });
        
        return {
            minX, maxX, minY, maxY,
            width: maxX - minX,
            height: maxY - minY
        };
    }
}

/**
 * 複合パーツのテンプレート集
 */
export const COMPOSITE_PART_TEMPLATES = [
    // I字型: 縦3連ボディ
    new CompositeRocketPart(
        'I型ボディ',
        '3連結ボディ',
        [
            { type: 'body', offsetX: 0, offsetY: -50 },
            { type: 'body', offsetX: 0, offsetY: 0 },
            { type: 'body', offsetX: 0, offsetY: 50 }
        ],
        '█\n█\n█'
    ),
    
    // L字型: ノーズ + ボディ2個
    new CompositeRocketPart(
        'L型ロケット',
        'ノーズ+ボディ',
        [
            { type: 'nose', offsetX: 0, offsetY: -50 },
            { type: 'body', offsetX: 0, offsetY: 0 },
            { type: 'body', offsetX: 0, offsetY: 50 }
        ],
        '▲\n█\n█'
    ),
    
    // T字型: ボディ + 翼左右
    new CompositeRocketPart(
        'T型安定翼',
        'ボディ+翼',
        [
            { type: 'body', offsetX: 0, offsetY: 0 },
            { type: 'wing', offsetX: -40, offsetY: 0, side: 'left' },
            { type: 'wing', offsetX: 40, offsetY: 0, side: 'right' }
        ],
        '◄█►'
    ),
    
    // エンジン2連
    new CompositeRocketPart(
        'ツインエンジン',
        '2連エンジン',
        [
            { type: 'engine', offsetX: -25, offsetY: 0, angle: Math.PI / 2 },
            { type: 'engine', offsetX: 25, offsetY: 0, angle: Math.PI / 2 }
        ],
        '▼ ▼'
    ),
    
    // ノーズ + ボディ + エンジン
    new CompositeRocketPart(
        '基本ロケット',
        '完全な小型ロケット',
        [
            { type: 'nose', offsetX: 0, offsetY: -50 },
            { type: 'body', offsetX: 0, offsetY: 0 },
            { type: 'engine', offsetX: 0, offsetY: 50, angle: Math.PI / 2 }
        ],
        '▲\n█\n▼'
    ),
    
    // 燃料タンク + ボディ
    new CompositeRocketPart(
        '燃料ユニット',
        '燃料タンク+ボディ',
        [
            { type: 'fueltank', offsetX: 0, offsetY: -30 },
            { type: 'body', offsetX: 0, offsetY: 30 }
        ],
        '■\n█'
    ),
    
    // エンジンクラスター（3連横）
    new CompositeRocketPart(
        'エンジンクラスター',
        '3連エンジン',
        [
            { type: 'engine', offsetX: -40, offsetY: 0, angle: Math.PI / 2 },
            { type: 'engine', offsetX: 0, offsetY: 0, angle: Math.PI / 2 },
            { type: 'engine', offsetX: 40, offsetY: 0, angle: Math.PI / 2 }
        ],
        '▼▼▼'
    ),
    
    // ノーズ + 翼
    new CompositeRocketPart(
        'ノーズ翼ユニット',
        'ノーズ+安定翼',
        [
            { type: 'nose', offsetX: 0, offsetY: -25 },
            { type: 'wing', offsetX: -35, offsetY: 25, side: 'left' },
            { type: 'wing', offsetX: 35, offsetY: 25, side: 'right' }
        ],
        ' ▲\n◄►'
    ),
    
    // ボディ + 燃料タンク + エンジン
    new CompositeRocketPart(
        'パワーユニット',
        '燃料+エンジン',
        [
            { type: 'body', offsetX: 0, offsetY: -45 },
            { type: 'fueltank', offsetX: 0, offsetY: 0 },
            { type: 'engine', offsetX: 0, offsetY: 50, angle: Math.PI / 2 }
        ],
        '█\n■\n▼'
    ),
    
    // サイドエンジン付きボディ
    new CompositeRocketPart(
        'スラスターユニット',
        'ボディ+横エンジン',
        [
            { type: 'body', offsetX: 0, offsetY: 0 },
            { type: 'engine', offsetX: -40, offsetY: 0, angle: Math.PI },
            { type: 'engine', offsetX: 40, offsetY: 0, angle: 0 }
        ],
        '►█◄'
    ),
    
    // 縦長4連ボディ
    new CompositeRocketPart(
        'ロングボディ',
        '4連結ボディ',
        [
            { type: 'body', offsetX: 0, offsetY: -60 },
            { type: 'body', offsetX: 0, offsetY: -20 },
            { type: 'body', offsetX: 0, offsetY: 20 },
            { type: 'body', offsetX: 0, offsetY: 60 }
        ],
        '█\n█\n█\n█'
    ),
    
    // 翼付きエンジン
    new CompositeRocketPart(
        '安定エンジン',
        'エンジン+翼',
        [
            { type: 'engine', offsetX: 0, offsetY: 0, angle: Math.PI / 2 },
            { type: 'wing', offsetX: -35, offsetY: -20, side: 'left' },
            { type: 'wing', offsetX: 35, offsetY: -20, side: 'right' }
        ],
        ' ◄►\n ▼'
    )
];

/**
 * レア複合パーツテンプレート（トロフィー解放で利用可能）
 */
export const RARE_COMPOSITE_PART_TEMPLATES = [
    new CompositeRocketPart(
        '超推進ユニット',
        '超強力エンジン+燃料タンク',
        [
            { type: 'superengine', offsetX: 0, offsetY: 0 },
            { type: 'body', offsetX: 0, offsetY: -40 }
        ],
        '🔥🔥'
    ),
    new CompositeRocketPart(
        '軽量高速機',
        '超軽量エンジン×2+超軽量ノーズ',
        [
            { type: 'ultralightnose', offsetX: 0, offsetY: -40 },
            { type: 'ultralightengine', offsetX: -25, offsetY: 15 },
            { type: 'ultralightengine', offsetX: 25, offsetY: 15 }
        ],
        '⚡⚡'
    ),
    new CompositeRocketPart(
        'バランス調整機',
        'おもり+ボディ',
        [
            { type: 'weight', offsetX: 0, offsetY: 0 },
            { type: 'body', offsetX: 0, offsetY: -40 }
        ],
        '⚖️'
    ),
    new CompositeRocketPart(
        '安定飛行ユニット',
        '安定化装置+大型ウィング',
        [
            { type: 'stabilizer', offsetX: 0, offsetY: 0 },
            { type: 'largewing', offsetX: 0, offsetY: 20, side: 'left' }
        ],
        '🛡️'
    ),
    new CompositeRocketPart(
        'ツインターボ',
        '複合エンジン+燃料タンク',
        [
            { type: 'dualengine', offsetX: 0, offsetY: 0 },
            { type: 'megafueltank', offsetX: 0, offsetY: -60 }
        ],
        '💪'
    ),
    new CompositeRocketPart(
        'メガタンク機',
        '巨大燃料タンク+強化ボディ',
        [
            { type: 'megafueltank', offsetX: 0, offsetY: 0 },
            { type: 'reinforcedbody', offsetX: 0, offsetY: -80 }
        ],
        '⛽⛽'
    ),
    new CompositeRocketPart(
        'マイクロクラスター',
        '超小型エンジン×3',
        [
            { type: 'microengine', offsetX: 0, offsetY: 0 },
            { type: 'microengine', offsetX: -25, offsetY: 0 },
            { type: 'microengine', offsetX: 25, offsetY: 0 }
        ],
        '🔬'
    ),
    new CompositeRocketPart(
        'ヘビーデューティ',
        'おもり+強化ボディ+超強力エンジン',
        [
            { type: 'weight', offsetX: 0, offsetY: -40 },
            { type: 'reinforcedbody', offsetX: 0, offsetY: 0 },
            { type: 'superengine', offsetX: 0, offsetY: 60 }
        ],
        '💎'
    ),
    new CompositeRocketPart(
        '究極安定機',
        '超軽量ノーズ+安定化装置+大型ウィング',
        [
            { type: 'ultralightnose', offsetX: 0, offsetY: -40 },
            { type: 'stabilizer', offsetX: 0, offsetY: 0 },
            { type: 'largewing', offsetX: 0, offsetY: 20, side: 'left' }
        ],
        '🌟'
    ),
    new CompositeRocketPart(
        'ハイブリッドロケット',
        '超強力エンジン+超軽量エンジン+巨大燃料タンク',
        [
            { type: 'superengine', offsetX: -30, offsetY: 40 },
            { type: 'ultralightengine', offsetX: 30, offsetY: 40 },
            { type: 'megafueltank', offsetX: 0, offsetY: -30 }
        ],
        '👑'
    )
];

/**
 * 違法複合パーツテンプレート（高難易度トロフィー解放で利用可能）
 * 紫色の枠で表示される
 */
export const ILLEGAL_COMPOSITE_PART_TEMPLATES = [
    // 1. 超強力エンジン×4
    new CompositeRocketPart(
        'クワッドスラスター',
        '超強力エンジン×4 違法改造',
        [
            { type: 'superengine', offsetX: -40, offsetY: 0, angle: Math.PI / 2 },
            { type: 'superengine', offsetX: 40, offsetY: 0, angle: Math.PI / 2 },
            { type: 'superengine', offsetX: 0, offsetY: -40, angle: Math.PI / 2 },
            { type: 'superengine', offsetX: 0, offsetY: 40, angle: Math.PI / 2 }
        ],
        '🔥\n🔥🔥\n🔥'
    ),
    
    // 2. 超軽量エンジン×6
    new CompositeRocketPart(
        'ヘキサブースター',
        '超軽量エンジン×6 違法改造',
        [
            { type: 'ultralightengine', offsetX: -50, offsetY: -30 },
            { type: 'ultralightengine', offsetX: 0, offsetY: -30 },
            { type: 'ultralightengine', offsetX: 50, offsetY: -30 },
            { type: 'ultralightengine', offsetX: -50, offsetY: 30 },
            { type: 'ultralightengine', offsetX: 0, offsetY: 30 },
            { type: 'ultralightengine', offsetX: 50, offsetY: 30 }
        ],
        '⚡⚡⚡\n⚡⚡⚡'
    ),
    
    // 3. 複合エンジン×3
    new CompositeRocketPart(
        'トリプルデュアル',
        '複合エンジン×3 違法改造',
        [
            { type: 'dualengine', offsetX: -50, offsetY: 0 },
            { type: 'dualengine', offsetX: 0, offsetY: 0 },
            { type: 'dualengine', offsetX: 50, offsetY: 0 }
        ],
        '💪💪💪'
    ),
    
    // 4. 超強力+おもり×2
    new CompositeRocketPart(
        'ヘビーストライカー',
        '超強力エンジン+おもり×2 違法改造',
        [
            { type: 'superengine', offsetX: 0, offsetY: 40, angle: Math.PI / 2 },
            { type: 'weight', offsetX: -40, offsetY: -20 },
            { type: 'weight', offsetX: 40, offsetY: -20 }
        ],
        '💎\n🔥\n💎'
    ),
    
    // 5. 巨大燃料タンク×2
    new CompositeRocketPart(
        'デュアルメガタンク',
        '巨大燃料タンク×2 違法改造',
        [
            { type: 'megafueltank', offsetX: -30, offsetY: 0 },
            { type: 'megafueltank', offsetX: 30, offsetY: 0 }
        ],
        '⛽⛽'
    ),
    
    // 6. 超強力+超軽量+複合エンジン
    new CompositeRocketPart(
        'ハイブリッドトリプル',
        '超強力+超軽量+複合エンジン 違法改造',
        [
            { type: 'superengine', offsetX: -40, offsetY: 0, angle: Math.PI / 2 },
            { type: 'ultralightengine', offsetX: 0, offsetY: 0, angle: Math.PI / 2 },
            { type: 'dualengine', offsetX: 40, offsetY: 0, angle: Math.PI / 2 }
        ],
        '🔥⚡💪'
    ),
    
    // 7. 超強力×2+巨大燃料タンク
    new CompositeRocketPart(
        'メガスラスター',
        '超強力エンジン×2+巨大燃料タンク 違法改造',
        [
            { type: 'superengine', offsetX: -30, offsetY: 40, angle: Math.PI / 2 },
            { type: 'superengine', offsetX: 30, offsetY: 40, angle: Math.PI / 2 },
            { type: 'megafueltank', offsetX: 0, offsetY: -40 }
        ],
        '⛽\n🔥🔥'
    ),
    
    // 8. 究極の違法パーツ
    new CompositeRocketPart(
        'アルティメット',
        '超強力×2+超軽量×2+複合×2 最強違法改造',
        [
            { type: 'superengine', offsetX: -50, offsetY: -30, angle: Math.PI / 2 },
            { type: 'superengine', offsetX: 50, offsetY: -30, angle: Math.PI / 2 },
            { type: 'ultralightengine', offsetX: -50, offsetY: 30, angle: Math.PI / 2 },
            { type: 'ultralightengine', offsetX: 50, offsetY: 30, angle: Math.PI / 2 },
            { type: 'dualengine', offsetX: 0, offsetY: -30, angle: Math.PI / 2 },
            { type: 'dualengine', offsetX: 0, offsetY: 30, angle: Math.PI / 2 }
        ],
        '🔥🔥\n💪💪\n⚡⚡'
    )
];

/**
 * トロフィーIDと通常パーツのマッピング
 * 特定のトロフィーを解除すると対応する通常パーツが解放される
 */
export const TROPHY_TO_NORMAL_PART_MAP = {
    'trophy_60': 0,   // 初フライト（中心） → I型ボディ
    'trophy_1': 1,    // 10回プレイ → L型ロケット
    'trophy_2': 2,    // 15回プレイ → T型安定翼
    'trophy_3': 3,    // 20回プレイ → ツインエンジン
    'trophy_4': 4,    // 25回プレイ → 基本ロケット
    'trophy_5': 5,    // 30回プレイ → 燃料ユニット
    'trophy_12': 6,   // 安定飛行1000m → エンジンクラスター
    'trophy_13': 7,   // 安定飛行1500m → ノーズ翼ユニット
    'trophy_14': 8,   // 安定飛行2000m → パワーユニット
    'trophy_15': 9,   // 安定飛行2500m → スラスターユニット
    'trophy_16': 10,  // 安定飛行3000m → ロングボディ
    'trophy_17': 11,  // 安定飛行3500m → 安定エンジン
};

/**
 * トロフィーIDとレアパーツのマッピング
 * 特定のトロフィーを解除すると対応するレアパーツが解放される
 */
export const TROPHY_TO_RARE_PART_MAP = {
    'trophy_0': 0,    // 5回プレイ → 超推進ユニット
    'trophy_11': 1,   // 安定飛行500m → 軽量高速機
    'trophy_22': 2,   // エンジン6個以下で400m → バランス調整機
    'trophy_33': 3,   // ノーズなしで300m → 安定飛行ユニット
    'trophy_44': 4,   // ソフトランディング200m → ツインターボ
    'trophy_66': 5,   // 50kg以下で250m → メガタンク機
    'trophy_77': 6,   // 高度100m → マイクロクラスター
    'trophy_88': 7,   // 燃料タンク0個で300m → ヘビーデューティ
    'trophy_99': 8,   // ボディ10個以下で200m → 究極安定機
    'trophy_110': 9   // マスター500m → ハイブリッドロケット
};

/**
 * トロフィーIDと違法パーツのマッピング（高難易度）
 * 特定の高難易度トロフィーを解除すると対応する違法パーツが解放される
 */
export const TROPHY_TO_ILLEGAL_PART_MAP = {
    'trophy_100': 0,  // マスター1000m → クワッドスラスター
    'trophy_101': 1,  // マスター1500m → ヘキサブースター
    'trophy_102': 2,  // マスター2000m → トリプルデュアル
    'trophy_103': 3,  // マスター2500m → ヘビーストライカー
    'trophy_104': 4,  // マスター3000m → デュアルメガタンク
    'trophy_105': 5,  // マスター3500m → ハイブリッドトリプル
    'trophy_106': 6,  // マスター4000m → メガスラスター
    'trophy_107': 7   // マスター5000m → アルティメット
};

/**
 * 固定のコックピット複合パーツ
 */
export const COCKPIT_COMPOSITE_PART = new CompositeRocketPart(
    'コックピット',
    'ホロチのコックピット',
    [
        { type: 'cockpit', offsetX: 0, offsetY: 0 }
    ],
    '🚀'
);

/**
 * 解放済みトロフィーに基づいて複合パーツを取得
 * @param {Array<string>} unlockedTrophies - 解放済みトロフィーIDの配列
 * @returns {Array<CompositeRocketPart>} 解放済みパーツ（最初がコックピット）
 */
export function getUnlockedCompositeParts(unlockedTrophies = []) {
    // 常にコックピットを最初に配置
    const unlocked = [COCKPIT_COMPOSITE_PART];
    
    // 解放済み通常パーツを取得
    const unlockedNormalParts = [];
    unlockedTrophies.forEach(trophyId => {
        if (TROPHY_TO_NORMAL_PART_MAP[trophyId] !== undefined) {
            const normalIndex = TROPHY_TO_NORMAL_PART_MAP[trophyId];
            if (COMPOSITE_PART_TEMPLATES[normalIndex]) {
                unlockedNormalParts.push(COMPOSITE_PART_TEMPLATES[normalIndex]);
            }
        }
    });
    
    // 解放済みレアパーツを取得
    const unlockedRareParts = [];
    unlockedTrophies.forEach(trophyId => {
        if (TROPHY_TO_RARE_PART_MAP[trophyId] !== undefined) {
            const rareIndex = TROPHY_TO_RARE_PART_MAP[trophyId];
            if (RARE_COMPOSITE_PART_TEMPLATES[rareIndex]) {
                unlockedRareParts.push(RARE_COMPOSITE_PART_TEMPLATES[rareIndex]);
            }
        }
    });
    
    // 解放済み違法パーツを取得
    const unlockedIllegalParts = [];
    unlockedTrophies.forEach(trophyId => {
        if (TROPHY_TO_ILLEGAL_PART_MAP[trophyId] !== undefined) {
            const illegalIndex = TROPHY_TO_ILLEGAL_PART_MAP[trophyId];
            if (ILLEGAL_COMPOSITE_PART_TEMPLATES[illegalIndex]) {
                unlockedIllegalParts.push(ILLEGAL_COMPOSITE_PART_TEMPLATES[illegalIndex]);
            }
        }
    });
    
    console.log(`Unlocked normal parts: ${unlockedNormalParts.length}`);
    console.log(`Unlocked rare parts: ${unlockedRareParts.length}`);
    console.log(`Unlocked illegal parts: ${unlockedIllegalParts.length}`);
    
    // 通常パーツ、レアパーツ、違法パーツを結合
    unlocked.push(...unlockedNormalParts, ...unlockedRareParts, ...unlockedIllegalParts);
    
    return unlocked;
}

/**
 * ランダムに複合パーツを選択（コックピット含む + 解放済みレアパーツ）
 * @deprecated getUnlockedCompositePartsを使用してください
 */
export function selectRandomCompositeParts(count, unlockedTrophies = []) {
    const unlocked = getUnlockedCompositeParts(unlockedTrophies);
    
    // 残りをランダムに選択（最大count個）
    if (unlocked.length > count) {
        const shuffled = [...unlocked.slice(1)].sort(() => Math.random() - 0.5);
        return [unlocked[0], ...shuffled.slice(0, count - 1)];
    }
    
    return unlocked;
}

