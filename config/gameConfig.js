/**
 * ゲーム設定
 */
export const GameConfig = {
    // 画面設定
    width: 1200,
    height: 800,
    backgroundColor: '#1a1a2e',
    cameraZoom: 0.33, // カメラのズーム（約3倍広く表示）
    
    // 物理エンジン設定
    physics: {
        default: 'matter',
        matter: {
            gravity: {
                y: 0.5,  // 重力加速度（下方向）
                x: 0
            },
            debug: false,  // trueにすると物理ボディが可視化される
            enableSleeping: false,
            // より詳細な物理演算設定
            runner: {
                isFixed: false,
                fps: 60
            }
        }
    },
    
    // 物理演算パラメータ
    physicsParams: {
        airDensity: 1.0,           // 空気密度（大きいほど抵抗が強い）
        stabilityFactor: 1.0,      // 空力安定性（大きいほど速度方向に向きやすい）
        torqueScale: 1.0,          // エンジントルクの強さ
        enableAerodynamics: true   // 空力効果を有効にするか
    },
    
    // ロケット設定
    rocket: {
        width: 40,
        height: 80,
        frictionAir: 0.01,
        density: 0.001,
        minSpeed: 5,
        maxSpeed: 30,
        speedMultiplier: 10
    },
    
    // 発射地点設定
    launchPoint: {
        x: 100,
        marginBottom: 50 // 画面下端からのマージン（左下に配置）
    },
    
    // 軌道予測設定
    trajectory: {
        color: 0x00ff00,
        lineWidth: 2,
        alpha: 0.5,
        maxSteps: 200,
        stepSize: 0.5
    },
    
    // UI設定
    ui: {
        launchMarkerColor: 0x00ff00,
        launchMarkerRadius: 10,
        instructionTextStyle: {
            fontSize: '16px',
            fill: '#ffffff',
            backgroundColor: '#000000',
            padding: { x: 10, y: 5 }
        }
    },
    
    // API設定
    api: {
        baseUrl: (typeof window !== 'undefined' && window.API_BASE_URL) || 'http://localhost:3000'
    }
};

