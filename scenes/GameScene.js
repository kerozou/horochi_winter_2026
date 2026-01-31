import { Rocket } from '../domain/Rocket.js';
import { LaunchPoint } from '../domain/LaunchPoint.js';
import { TrajectoryCalculator } from '../domain/TrajectoryCalculator.js';
import { GameConfig } from '../config/gameConfig.js';
import { RocketDesign } from '../entities/RocketDesign.js';
import { getApiClient } from '../utils/apiClient.js';

/**
 * メインゲームシーン
 */
export class GameScene extends Phaser.Scene {
    constructor() {
        super({ key: 'GameScene' });
    }
    
    /**
     * シーン初期化
     * @param {Object} data - 前のシーンから渡されたデータ
     */
    init(data) {
        // ロケット設計データを受け取る（JSONの場合はRocketDesignオブジェクトに変換）
        if (data.rocketDesign) {
            // JSONオブジェクトからRocketDesignインスタンスに変換
            this.rocketDesign = RocketDesign.fromJSON(data.rocketDesign);
            console.log('GameScene initialized with custom design:', this.rocketDesign);
            console.log('Parts count:', this.rocketDesign.parts.length);
        } else {
            this.rocketDesign = null;
            console.log('GameScene initialized with default rocket');
        }
        
        // ランクマッチモードかどうか
        this.isRankMatch = data.isRankMatch || false;
        this.rankMatchDate = data.dateString || null;
        
        // アイリスアウト関連フラグをリセット
        this.enableIrisOutEffect = false; // falseにするとアイリスアウト演出を無効化
        this.isIrisOutStarted = false;
        this.isIrisOutComplete = false;
        this.irisGraphics = null;
        this.irisAnimData = null;
        this.irisMaxRadius = null;
        this.irisCockpitSprite = null;
        
        // トロフィーチェック用の統計データを初期化
        this.gameStats = {
            maxRotation: 0,        // 最大回転量（絶対値）
            maxAltitude: 0,        // 最高高度
            maxSpeed: 0,           // 最高速度
            partsCounts: {         // パーツ数
                engine: 0,
                nose: 0,
                wing: 0,
                fuelTank: 0,
                body: 0,
                cockpit: 0,
                total: 0
            },
            totalMass: 0           // 総質量
        };
        
        // パーツ数をカウント
        if (this.rocketDesign && this.rocketDesign.parts) {
            this.rocketDesign.parts.forEach(part => {
                if (part.type === 'engine') this.gameStats.partsCounts.engine++;
                else if (part.type === 'nose') this.gameStats.partsCounts.nose++;
                else if (part.type === 'wing') this.gameStats.partsCounts.wing++;
                else if (part.type === 'fuelTank') this.gameStats.partsCounts.fuelTank++;
                else if (part.type === 'body') this.gameStats.partsCounts.body++;
                else if (part.type === 'cockpit') this.gameStats.partsCounts.cockpit++;
                
                this.gameStats.totalMass += part.mass || 0;
            });
            this.gameStats.partsCounts.total = this.rocketDesign.parts.length;
        }
        
        console.log('Game stats initialized:', this.gameStats);
    }
    
    preload() {
        // コックピット画像を読み込む
        if (!this.textures.exists('horochi')) {
            this.load.image('horochi', 'resources/horochi.png');
        }
        
        // 背景画像を読み込む（6種類）
        for (let i = 1; i <= 6; i++) {
            const texKey = `bg_${i}`;
            if (!this.textures.exists(texKey)) {
                this.load.image(texKey, `resources/bg_${i}.png`);
            }
        }
        
        // BGMを読み込む（ゲーム用BGM）
        if (!this.cache.audio.exists('gameBGM')) {
            this.load.audio('gameBGM', 'resources/maou_bgm_neorock68.ogg');
        }
        
        // ボタンクリック時の効果音を読み込む
        if (!this.cache.audio.exists('deci')) {
            this.load.audio('deci', 'resources/deci.mp3');
        }
        
        // 着陸時の効果音を読み込む
        if (!this.cache.audio.exists('end')) {
            this.load.audio('end', 'resources/end.mp3');
        }
        
        // コックピット分離時の効果音を読み込む
        if (!this.cache.audio.exists('bomb')) {
            this.load.audio('bomb', 'resources/bomb.mp3');
        }
        
        // コックピット分離時の効果音（2つ目）を読み込む
        if (!this.cache.audio.exists('uo')) {
            this.load.audio('uo', 'resources/uo.wav');
        }
        
        // 着陸時の効果音（2つ目）を読み込む
        if (!this.cache.audio.exists('oe')) {
            this.load.audio('oe', 'resources/oe.wav');
        }
        
        // スモーク画像をスプライトシートとして読み込む（5×3グリッド、12フレーム使用）
        // 画像を先に読み込んでサイズを取得してからスプライトシートとして読み込む
        if (!this.textures.exists('smoke') && !this.textures.exists('smokeTemp')) {
            this.load.image('smokeTemp', 'resources/smoke.png');
        }
        
        // リザルト表示用の画像を読み込む
        if (!this.textures.exists('iei')) {
            this.load.image('iei', 'resources/iei.png');
        }
        
        // 新記録時の画像を読み込む
        if (!this.textures.exists('horonbia')) {
            this.load.image('horonbia', 'resources/horonbia.jpg');
        }
        
        // リザルト画面用の画像を読み込む
        if (!this.textures.exists('hororo_keirei')) {
            this.load.image('hororo_keirei', 'resources/hororo_keirei.png');
        }
        if (!this.textures.exists('eru_back')) {
            this.load.image('eru_back', 'resources/eru_back.png');
        }
        if (!this.textures.exists('hirameki_back')) {
            this.load.image('hirameki_back', 'resources/hirameki_back.png');
        }
        if (!this.textures.exists('binba_back')) {
            this.load.image('binba_back', 'resources/binba_back.png');
        }
        if (!this.textures.exists('bg_black')) {
            this.load.image('bg_black', 'resources/bg_black.png');
        }
        if (!this.textures.exists('kirakira')) {
            this.load.image('kirakira', 'resources/kirakira.png');
        }
        if (!this.cache.json.exists('shibou')) {
            this.load.json('shibou', 'resources/shibou.json');
        }
    }
    
    create() {
        try {
            console.log('GameScene: create() called');
            
            // スモークスプライトシートを読み込む（画像サイズを取得してから）
            if (this.textures.exists('smokeTemp') && !this.textures.exists('smoke')) {
                const texture = this.textures.get('smokeTemp');
                const imageWidth = texture.source[0].width;
                const imageHeight = texture.source[0].height;
                const frameWidth = imageWidth / 5;
                const frameHeight = imageHeight / 3;
                
                // 一時画像を削除
                this.textures.remove('smokeTemp');
                
                // スプライトシートとして読み込み
                this.load.spritesheet('smoke', 'resources/smoke.png', {
                    frameWidth: frameWidth,
                    frameHeight: frameHeight
                });
                
                // 読み込み完了を待つ
                this.load.once('complete', () => {
                    console.log('Smoke spritesheet loaded successfully');
                });
                this.load.start();
            }
            
            // kirakira.pngをスプライトシートとして定義（縦26×横5、131フレーム）
            if (this.textures.exists('kirakira') && !this.textures.exists('kirakira_sheet')) {
                const texture = this.textures.get('kirakira');
                const imageWidth = texture.source[0].width;
                const imageHeight = texture.source[0].height;
                const frameWidth = imageWidth / 5; // 横5列
                const frameHeight = imageHeight / 26; // 縦26行
                
                // 一時画像を削除
                this.textures.remove('kirakira');
                
                // スプライトシートとして読み込み
                this.load.spritesheet('kirakira_sheet', 'resources/kirakira.png', {
                    frameWidth: frameWidth,
                    frameHeight: frameHeight
                });
                
                // 読み込み完了を待つ
                this.load.once('complete', () => {
                    console.log('Kirakira spritesheet loaded successfully');
                    // アニメーションを定義（130フレーム）
                    if (!this.anims.exists('kirakira_anim')) {
                        this.anims.create({
                            key: 'kirakira_anim',
                            frames: this.anims.generateFrameNumbers('kirakira_sheet', { start: 0, end: 127 }), // 0-130で131フレーム
                            frameRate: 32, // フレームレート（必要に応じて調整）
                            repeat: -1 // 無限ループ
                        });
                    }
                });
                this.load.start();
            } else if (this.textures.exists('kirakira_sheet') && !this.anims.exists('kirakira_anim')) {
                // スプライトシートが既に存在する場合はアニメーションのみ定義
                this.anims.create({
                    key: 'kirakira_anim',
                    frames: this.anims.generateFrameNumbers('kirakira_sheet', { start: 0, end: 127 }), // 0-130で131フレーム
                    frameRate: 32, // フレームレート（必要に応じて調整）
                    repeat: -1 // 無限ループ
                });
            }
            
            // プロパティを初期化
            this.statusText = null;
            this.rocket = null;
            this.launchPoint = null;
            this.trajectoryGraphics = null;
            this.separationCharge = 0;
            this.isCharging = false;
            this.wasAt100Percent = false; // 前のフレームで100%だったかどうか
            this.justReached100Percent = false; // このフレームで100%に達したかどうか
            this.separationGauge = null;
            this.separationGaugeBg = null;
            this.separationText = null;
            this.separationPowerText = null; // 出力強度表示テキスト
            this.justmeetVideoElement = null; // justmeet.mp4動画要素
            this.isJustmeetPlaying = false; // justmeet動画が再生中かどうか
            this.isCameraFollowing = false;
            this.cameraFollowThreshold = null;
            this.ground = null; // 地面
            this.isGameOver = false; // ゲーム終了フラグ
            this.speedometer = null; // スピードメーター
            this.speedometerText = null; // 速度テキスト
            this.speedometerNeedle = null; // メーターの針
            this.distanceText = null; // 飛距離テキスト
            this.cockpitSeparationTime = null; // コックピット分離時刻
            this.backgroundImages = []; // 背景画像の配列
            this.backgroundInfo = null; // 背景情報
            this.bgm = null; // BGM
            this.uoSound = null; // uo.wavの再生中の音声オブジェクト
            this.oeSound = null; // oe.wavの再生中の音声オブジェクト
            
            // グラフィックスオブジェクトを作成（軌道線用）
            this.trajectoryGraphics = this.add.graphics();
            
            // カメラのズームを先に設定（画面を広く見せる）
            if (GameConfig.cameraZoom && GameConfig.cameraZoom > 0) {
                this.cameras.main.setZoom(GameConfig.cameraZoom);
                console.log('Camera zoom set to:', GameConfig.cameraZoom);
            } else {
                console.warn('Invalid camera zoom, using default 1.0');
                this.cameras.main.setZoom(1.0);
            }
            
            // 発射地点を設定（画面左下に配置）
            // ズームを考慮したワールド座標で計算
            const launchPointX = GameConfig.launchPoint.x;
            const launchPointY = this.cameras.main.height - GameConfig.launchPoint.marginBottom;
            this.launchPoint = new LaunchPoint(
                launchPointX,
                launchPointY
            );
            console.log('Launch point created at:', this.launchPoint.x, this.launchPoint.y);
            
            // 背景を作成（launchPoint作成後に実行）
            this.createBackground();
            
                // カメラを左下寄りに配置（発射地点が画面左下に見えるように）
                // カメラの中心を発射地点より右上に配置
                const cameraX = this.launchPoint.x + (this.cameras.main.width / GameConfig.cameraZoom) / 2;
                const cameraY = this.launchPoint.y - (this.cameras.main.height / GameConfig.cameraZoom) / 2;
                this.cameras.main.centerOn(cameraX, cameraY);
                console.log('Camera centered at:', cameraX, cameraY);
                
                // カメラ追従開始の閾値を設定（画面中央のX座標）
                this.cameraFollowThreshold = cameraX;
            
            // 発射地点のマーカーを表示（ズームを考慮してサイズを調整）
            const markerRadius = GameConfig.ui.launchMarkerRadius / GameConfig.cameraZoom;
            const launchMarker = this.add.circle(
                this.launchPoint.x,
                this.launchPoint.y,
                markerRadius,
                GameConfig.ui.launchMarkerColor
            );
            launchMarker.setStrokeStyle(2 / GameConfig.cameraZoom, 0xffffff);
            launchMarker.setScrollFactor(1); // ワールド座標に固定
            
            // ロケットを作成（エディタからのデザインデータを渡す）
            this.rocket = new Rocket(
                this,
                this.launchPoint.x,
                this.launchPoint.y,
                this.rocketDesign
            );
            console.log('Rocket created successfully with design:', this.rocketDesign);
            
            // 入力イベントを設定
            this.setupInput();
            
            // UIを設定
            this.setupUI();
            
            // タイトルに戻るボタンを追加
            this.createBackButton();
            
            // コックピット分離UIを作成
            this.createSeparationUI();
            
            // // 重力を有効化
            // if (this.matter && this.matter.world) {
            //     // Matter.jsの重力を設定（下方向に重力を適用）
            //     this.matter.world.setGravity(0, 1); // x: 0, y: 1（下方向）
            //     console.log('Gravity enabled: y = 1');
            // }
            
            // 地面を作成
            this.createGround();
            
            // スピードメーターを作成
            this.createSpeedometer();
            
            // BGMを再生
            this.playBGM();
            
            // フェードイン効果（黒から徐々に透明に）
            this.cameras.main.fadeIn(800, 0, 0, 0);
            
            console.log('GameScene: initialization complete');
        } catch (error) {
            console.error('Error in GameScene.create():', error);
            console.error('Error stack:', error.stack);
            throw error;
        }
    }
    
    /**
     * 入力イベントを設定
     */
    setupInput() {
        // マウスクリック/タッチでロケットを発射 or チャージ開始
        this.input.on('pointerdown', (pointer) => {
            console.log('Pointer down at:', pointer.x, pointer.y);
            if (this.rocket && !this.rocket.isLaunched) {
                this.launchRocket(pointer);
            } else if (this.rocket && this.rocket.isLaunched && this.rocket.separationCount < 1) {
                // ロケット発射後はチャージ開始（1回のみ分離可能）
                this.isCharging = true;
                this.separationCharge = 0;
                this.wasAt100Percent = false; // チャージ開始時にリセット
                this.justReached100Percent = false; // チャージ開始時にリセット
            }
        });
        
        // マウスを離したときにコックピット分離
        this.input.on('pointerup', (pointer) => {
            if (this.isCharging && this.rocket && this.rocket.isLaunched) {
                this.separateCockpit();
                this.isCharging = false;
            }
        });

        // キーボード入力は無効化（リトライとエディタへの遷移を削除）

        // マウス移動でも軌道を予測表示
        this.input.on('pointermove', (pointer) => {
            if (this.rocket && !this.rocket.isLaunched) {
                this.updateTrajectoryPreview();
            }
        });
    }
    
    /**
     * UIを設定
     */
    setupUI() {
        // 操作説明テキスト（画面上部中央）
        this.instructionsText = this.add.text(
            this.cameras.main.width / 2 - 500,
            -500,
            'クリックまたはタップでロケットを発射',
            {
                fontSize: '60px',
                fill: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 20, y: 10 },
                fontStyle: 'bold'
            }
        );
        this.instructionsText.setOrigin(0.5, 0); // 中央揃え
        this.instructionsText.setDepth(100);
        this.instructionsText.setScrollFactor(0); // UIを固定
        
        // ゲーム状態表示（画面右上）- 非表示
        // const statusText = this.add.text(
        //     this.cameras.main.width + 700,
        //     -500,
        //     '準備完了',
        //     {
        //         fontSize: '60px',
        //         fill: '#00ff00',
        //         backgroundColor: 'rgba(0, 0, 0, 0.7)',
        //         padding: { x: 15, y: 8 },
        //         fontStyle: 'bold'
        //     }
        // );
        // statusText.setOrigin(1, 0); // 右揃え
        // statusText.setDepth(100);
        // statusText.setScrollFactor(0);
        
        // 状態テキストをクラス変数として保存
        this.statusText = null;
        
        // 飛行中用の再発射ボタン（右上）
        const screenWidth = this.cameras.main.width;
        const retryButtonX = screenWidth + 850;
        const retryButtonY = -600;
        
        this.inFlightRetryButton = this.add.container(retryButtonX, retryButtonY);
        const retryBg = this.add.rectangle(0, 0, 300, 70, 0x4ecdc4);
        retryBg.setStrokeStyle(2, 0xffffff);
        const retryText = this.add.text(0, 0, '再発射', {
            fontSize: '40px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        retryText.setOrigin(0.5);
        this.inFlightRetryButton.add([retryBg, retryText]);
        this.inFlightRetryButton.setSize(300, 70);
        this.inFlightRetryButton.setInteractive({ useHandCursor: true });
        this.inFlightRetryButton.setScrollFactor(0); // スクリーン座標に固定
        this.inFlightRetryButton.setDepth(100);
        this.inFlightRetryButton.setVisible(false); // 初期状態では非表示
        
        // 再発射ボタンのホバー効果
        this.inFlightRetryButton.on('pointerover', () => {
            retryBg.setFillStyle(0x3ab5dd);
        });
        this.inFlightRetryButton.on('pointerout', () => {
            retryBg.setFillStyle(0x4ecdc4);
        });
        
        // 再発射ボタンのクリックイベント
        this.inFlightRetryButton.on('pointerdown', () => {
            // deci.mp3を音量50%で再生
            if (this.cache.audio.exists('deci')) {
                this.sound.play('deci', {
                    volume: 0.5
                });
            }
            
            // アイリスアウトトランジションを開始
            this.startRetryIrisOutTransition();
        });
        
            //     // 設計情報を表示（エディタから来た場合）
            // if (this.rocketDesign) {
            //     const designInfo = this.add.text(
            //         20,
            //         this.cameras.main.height - 150,
            //         `ロケット: ${this.rocketDesign.name}\n最大速度: ${this.rocketDesign.physics.maxSpeed}`,
            //         {
            //             fontSize: '48px',
            //             fill: '#00ff00',
            //             backgroundColor: 'rgba(0, 0, 0, 0.7)',
            //             padding: { x: 20, y: 10 }
            //         }
            //     );
            //     designInfo.setDepth(100);
            //     designInfo.setScrollFactor(0);
            // }
    }
    
    /**
     * コックピット分離UIを作成
     */
    createSeparationUI() {
        const uiX = this.cameras.main.width +350;
        const uiY = this.cameras.main.height +200;
        
        // 説明テキスト
        this.separationText = this.add.text(
            uiX,
            uiY-100,
            '長押しでコックピット分離',
            {
                fontSize: '50px',
                fill: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 10, y: 5 }
            }
        );
        this.separationText.setOrigin(0.5);
        this.separationText.setDepth(100);
        this.separationText.setScrollFactor(0);
        this.separationText.setVisible(false);
        
        // ゲージ背景（長さを2倍: 400 → 800）
        this.separationGaugeBg = this.add.rectangle(
            uiX,
            uiY,
            800,
            60,
            0x333333
        );
        this.separationGaugeBg.setStrokeStyle(5, 0xffffff);
        this.separationGaugeBg.setDepth(100);
        this.separationGaugeBg.setScrollFactor(0);
        this.separationGaugeBg.setVisible(false);
        
        // ゲージ本体（初期位置を2倍に調整: uiX - 200 → uiX - 400）
        this.separationGauge = this.add.rectangle(
            uiX - 400,
            uiY,
            0,
            52,
            0xff6b6b
        );
        this.separationGauge.setOrigin(0, 0.5);
        this.separationGauge.setDepth(101);
        this.separationGauge.setScrollFactor(0);
        this.separationGauge.setVisible(false);
        
        // 出力強度表示テキスト
        this.separationPowerText = this.add.text(
            uiX,
            uiY + 65,
            '出力強度: 0%',
            {
                fontSize: '56px',
                fill: '#ffffff',
                fontStyle: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 10, y: 5 }
            }
        );
        this.separationPowerText.setOrigin(0.5);
        this.separationPowerText.setDepth(102);
        this.separationPowerText.setScrollFactor(0);
        this.separationPowerText.setVisible(false);
    }
    
    /**
     * コックピット分離ゲージを更新
     */
    updateSeparationGauge() {
        if (this.isCharging && this.rocket && this.rocket.isLaunched && this.rocket.separationCount < 1) {
            // ゲージを増加（1フレームあたり2%の速度）
            const previousCharge = this.separationCharge;
            this.separationCharge = Math.min(100, this.separationCharge + 2);
            
            // ゲージUIを更新（800ピクセル幅：2倍の長さ）
            if (this.separationGauge) {
                this.separationGauge.width = (this.separationCharge / 100) * 800;
                
                // 100%に達した瞬間（前のフレームが98~99%で、現在が100%）のみ緑色
                // それ以外（100%のまま1フレーム経過した後など）は赤色
                if (this.separationCharge >= 98 && previousCharge < 100) {
                    // 100%に達した瞬間：緑色
                    this.separationGauge.setFillStyle(0x00ff00); // 緑色
                    this.justReached100Percent = true; // このフレームで100%に達した
                    this.wasAt100Percent = true; // 次のフレームで赤に戻すためのフラグ
                } else {
                    // 100%に達した後、または100%未満：赤色
                    this.separationGauge.setFillStyle(0xff6b6b); // 赤色
                    this.justReached100Percent = false; // 100%に達した瞬間ではない
                    if (this.separationCharge >= 100) {
                        this.wasAt100Percent = true; // 100%のまま継続
                    } else {
                        this.wasAt100Percent = false; // 100%未満に戻った
                    }
                }
            }
            
            // 出力強度テキストを更新
            if (this.separationPowerText) {
                this.separationPowerText.setText(`出力強度: ${Math.round(this.separationCharge)}%`);
            }
        }
    }
    
    /**
     * コックピット分離処理
     */
    separateCockpit() {
        if (!this.rocket || !this.rocket.isLaunched) {
            return;
        }
        
        // 1回分離後は分離できない
        if (this.rocket.separationCount >= 1) {
            return;
        }
        
        // ゲージが一定以上溜まっている場合のみ分離
        if (this.separationCharge >= 30) {
            console.log('Separating cockpit with charge:', this.separationCharge, 'Separation count:', this.rocket.separationCount);
            
            // 推進力倍率を計算
            // 基本推進力 = 出力強度 + 100%
            let thrustMultiplier = (this.separationCharge / 100) + 1.0;
            
            // 100%に達した瞬間（このフレームで100%に達した）のみ追加で100%の推進力を得る
            // 100%のまま1フレーム経過した後は追加推進力なし
            const isPerfectSeparation = this.justReached100Percent;
            if (isPerfectSeparation) {
                thrustMultiplier += 1;
            }
            
            console.log('Thrust multiplier:', thrustMultiplier, 'Charge:', this.separationCharge);
            
            // ロケットのコックピットを分離（推進力倍率を渡す）
            this.rocket.separateCockpit(this.separationCharge, thrustMultiplier);
            
            // 分離結果を画面下部に表示
            const colorText = isPerfectSeparation ? '緑' : '赤';
            const colorValue = isPerfectSeparation ? '#00ff00' : '#ff0000';
            this.separationResultText = this.add.text(
                this.cameras.main.width / 2 + 1400,
                this.cameras.main.height + 750,
                `出力: ${Math.floor(this.separationCharge)}%  判定: ${colorText}`,
                {
                    fontSize: '64px',
                    fill: colorValue,
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 4
                }
            );
            this.separationResultText.setOrigin(0.5);
            this.separationResultText.setScrollFactor(0);
            this.separationResultText.setDepth(100);
            
            // 緑のゲージ（100%到達）で分離成功した場合、cutin.mp4を再生
            if (isPerfectSeparation) {
                this.playJustmeetVideo();
            }
            
            // ゲージをリセット
            this.separationCharge = 0;
            this.wasAt100Percent = false; // リセット
            this.justReached100Percent = false; // リセット
            
            // UIを削除（非表示ではなく完全に削除）
            if (this.separationText) {
                this.separationText.destroy();
                this.separationText = null;
            }
            if (this.separationGaugeBg) {
                this.separationGaugeBg.destroy();
                this.separationGaugeBg = null;
            }
            if (this.separationGauge) {
                this.separationGauge.destroy();
                this.separationGauge = null;
            }
            if (this.separationPowerText) {
                this.separationPowerText.destroy();
                this.separationPowerText = null;
            }
            
            // 状態テキストを更新
            if (this.statusText) {
                this.statusText.setText('コックピット分離！追跡中...');
                this.statusText.setStyle({ fill: '#00ffff' });
            }
            
            console.log('Camera now following separated cockpit');
            
            // コックピット分離時刻を記録
            this.cockpitSeparationTime = this.time.now;
            
            // コックピット分離後に重力を1に設定
            if (this.matter && this.matter.world) {
                this.matter.world.setGravity(0, 1); // x: 0, y: 1（下方向）
                console.log('Gravity set to 1 after cockpit separation');
            }
            
            // コックピット分離時の効果音を再生
            this.playSeparationSound();
            
            // コックピットの中心にスモークアニメーションを表示
            this.createSmokeAnimation();
        } else {
            console.log('Not enough charge to separate cockpit:', this.separationCharge);
        }
    }
    
    /**
     * justmeet.mp4を再生（緑のゲージで分離成功時）
     */
    playJustmeetVideo() {
        // 既に再生中の場合は何もしない
        if (this.isJustmeetPlaying) {
            return;
        }
        
        this.isJustmeetPlaying = true;
        
        // ゲームを一時停止
        if (this.matter && this.matter.world) {
            this.matter.world.pause();
        }
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        
        // 動画要素を作成（全画面）
        const gameContainer = document.getElementById('game-container');
        if (!gameContainer) {
            console.error('game-container not found');
            this.resumeGameAfterJustmeet();
            return;
        }
        
        const video = document.createElement('video');
        video.src = 'resources/cutin.mp4';
        video.autoplay = true;
        video.loop = false;
        video.muted = false;
        video.volume = 1.0;
        video.controls = false;
        video.playsInline = true;
        video.style.position = 'absolute';
        video.style.pointerEvents = 'auto'; // クリック可能にする
        video.style.zIndex = '1000'; // 高いz-index
        video.style.opacity = '0';
        video.style.visibility = 'hidden';
        video.style.transition = 'opacity 0.5s ease-out';
        
        // 動画の位置とサイズを設定（全画面）
        const updateVideoPosition = () => {
            const game = this.game;
            if (game && game.scale && game.canvas) {
                const scaleX = game.scale.displaySize.width / game.scale.gameSize.width;
                const scaleY = game.scale.displaySize.height / game.scale.gameSize.height;
                
                const canvasRect = game.canvas.getBoundingClientRect();
                const containerRect = gameContainer.getBoundingClientRect();
                
                const canvasOffsetX = canvasRect.left - containerRect.left;
                const canvasOffsetY = canvasRect.top - containerRect.top;
                
                // 全画面表示
                video.style.left = (canvasOffsetX) + 'px';
                video.style.top = (canvasOffsetY) + 'px';
                video.style.width = (screenWidth * scaleX) + 'px';
                video.style.height = (screenHeight * scaleY) + 'px';
                
                requestAnimationFrame(() => {
                    video.style.visibility = 'visible';
                    requestAnimationFrame(() => {
                        video.style.opacity = '1';
                    });
                });
            } else {
                video.style.left = '0px';
                video.style.top = '0px';
                video.style.width = screenWidth + 'px';
                video.style.height = screenHeight + 'px';
                
                requestAnimationFrame(() => {
                    video.style.visibility = 'visible';
                    requestAnimationFrame(() => {
                        video.style.opacity = '1';
                    });
                });
            }
        };
        
        gameContainer.appendChild(video);
        this.justmeetVideoElement = video;
        
        // リサイズイベントに対応
        const resizeHandler = () => updateVideoPosition();
        window.addEventListener('resize', resizeHandler);
        video._resizeHandler = resizeHandler;
        
        // 位置を更新
        setTimeout(updateVideoPosition, 100);
        
        // 動画の読み込み完了後に再生
        video.addEventListener('loadeddata', () => {
            video.play().catch(e => {
                console.error('Error playing justmeet video:', e);
            });
        });
        
        // クリックイベント
        const handleClick = () => {
            // フェードアウトして削除
            video.style.transition = 'opacity 0.5s ease-out';
            video.style.opacity = '0';
            
            setTimeout(() => {
                this.removeJustmeetVideo();
                this.resumeGameAfterJustmeet();
            }, 500);
        };
        
        video.addEventListener('click', handleClick);
        
        // 動画終了時も自動的に削除（念のため）
        video.addEventListener('ended', () => {
            if (this.isJustmeetPlaying) {
                handleClick();
            }
        });
    }
    
    /**
     * justmeet動画を削除
     */
    removeJustmeetVideo() {
        if (this.justmeetVideoElement) {
            // リサイズリスナーを削除
            if (this.justmeetVideoElement._resizeHandler) {
                window.removeEventListener('resize', this.justmeetVideoElement._resizeHandler);
            }
            
            // 動画を停止して削除
            this.justmeetVideoElement.pause();
            this.justmeetVideoElement.src = '';
            this.justmeetVideoElement.load();
            
            if (this.justmeetVideoElement.parentNode) {
                this.justmeetVideoElement.parentNode.removeChild(this.justmeetVideoElement);
            }
            
            this.justmeetVideoElement = null;
        }
        
        this.isJustmeetPlaying = false;
    }
    
    /**
     * justmeet動画再生後にゲームを再開
     */
    resumeGameAfterJustmeet() {
        // ゲームを再開
        if (this.matter && this.matter.world) {
            this.matter.world.resume();
        }
        
        this.isJustmeetPlaying = false;
    }
    
    /**
     * コックピット分離時の効果音を再生
     */
    playSeparationSound() {
        if (this.cache.audio.exists('bomb')) {
            this.sound.play('bomb', { volume: 0.3 });
        }
        if (this.cache.audio.exists('uo')) {
            // 再生中の音声オブジェクトを保存（中断用）
            this.uoSound = this.sound.play('uo', { volume: 0.2 });
        }
    }
    
    /**
     * コックピット分離時のスモークアニメーションを作成
     */
    createSmokeAnimation() {
        // 少し遅延させて、コックピットが分離された後に実行
        this.time.delayedCall(50, () => {
            if (!this.rocket || !this.rocket.isCockpitSeparated || this.rocket.separatedCockpitSprites.length === 0) {
                return;
            }
            
            // コックピットの中心位置を取得
            const cockpitSprite = this.rocket.separatedCockpitSprites[0];
            const cockpitX = cockpitSprite.x;
            const cockpitY = cockpitSprite.y;
            
            // スモークスプライトシートが読み込まれているか確認
            if (!this.textures.exists('smoke')) {
                console.warn('Smoke spritesheet not loaded yet');
                return;
            }
            
            // スモークアニメーションがまだ作成されていない場合は作成
            if (!this.anims.exists('smokeAnimation')) {
                const gridCols = 5;
                const gridRows = 3;
                const maxFrames = 12;
                
                // 左上から右下に向かってフレーム番号を生成
                const frameNumbers = [];
                for (let row = 0; row < gridRows; row++) {
                    for (let col = 0; col < gridCols; col++) {
                        const frameIndex = row * gridCols + col;
                        if (frameIndex < maxFrames) {
                            frameNumbers.push(frameIndex);
                        }
                    }
                }
                
                // アニメーションを作成
                this.anims.create({
                    key: 'smokeAnimation',
                    frames: frameNumbers.map(frameNum => ({
                        key: 'smoke',
                        frame: frameNum
                    })),
                    frameRate: 12, // 12fps
                    repeat: 0 // 1回だけ再生
                });
                
                console.log('Smoke animation created with', frameNumbers.length, 'frames');
            }
            
            // スモークスプライトを作成
            const smoke = this.add.sprite(cockpitX, cockpitY, 'smoke');
            smoke.setOrigin(0.5);
            smoke.setDepth(200); // コックピットより上に表示
            
            // アニメーションを再生
            smoke.play('smokeAnimation');
            
            // アニメーション終了時にスプライトを削除
            smoke.once('animationcomplete', () => {
                smoke.destroy();
            });
        });
    }
    
    /**
     * タイトルに戻るボタンを作成
     */
    createBackButton() {
        // ランクマッチモードの場合はRankMatchSceneに戻る
        if (this.isRankMatch) {
            const backButton = this.add.text(
                -1000,
                -700,
                '◀ ランクマッチへ',
                {
                    fontSize: '50px',
                    fill: '#ffffff',
                    backgroundColor: 'rgba(231, 76, 60, 0.8)',
                    padding: { x: 30, y: 15 },
                    fontStyle: 'bold'
                }
            );
            backButton.setDepth(100);
            backButton.setScrollFactor(0);
            backButton.setInteractive({ useHandCursor: true });
            
            backButton.on('pointerover', () => {
                backButton.setStyle({ backgroundColor: 'rgba(192, 57, 43, 0.9)' });
            });
            
            backButton.on('pointerout', () => {
                backButton.setStyle({ backgroundColor: 'rgba(231, 76, 60, 0.8)' });
            });
            
            backButton.on('pointerdown', () => {
                console.log('Returning to rank match...');
                
                // 名前入力UIを強制的に削除
                this.removeNameInputUI();
                
                // ボタンクリック時の効果音を再生
                this.playButtonSound();
                
                // すべての音声を停止
                this.stopAllSounds();
                
                this.cameras.main.fadeOut(500, 0, 0, 0);
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // 遷移直前に再度削除を確認
                    this.removeNameInputUI();
                    
                    // 黒画面を表示して0.5秒待機
                    const screenWidth = this.cameras.main.width;
                    const screenHeight = this.cameras.main.height;
                    const blackOverlay = this.add.rectangle(
                        screenWidth / 2,
                        screenHeight / 2,
                        screenWidth,
                        screenHeight,
                        0x000000
                    );
                    blackOverlay.setScrollFactor(0);
                    blackOverlay.setDepth(10000);
                    
                    // 0.5秒後にシーン遷移
                    this.time.delayedCall(500, () => {
                        this.scene.start('RankMatchScene');
                    });
                });
            });
            return;
        }
        
        // 通常モードの場合はTitleSceneに戻る
        this.backButton = this.add.text(
            -1000,
            -700,
            '◀ タイトルへ',
            {
                fontSize: '50px',
                fill: '#ffffff',
                backgroundColor: 'rgba(231, 76, 60, 0.8)',
                padding: { x: 30, y: 15 },
                fontStyle: 'bold'
            }
        );
        this.backButton.setDepth(100);
        this.backButton.setScrollFactor(0);
        this.backButton.setInteractive({ useHandCursor: true });
        
        this.backButton.on('pointerover', () => {
            this.backButton.setStyle({ backgroundColor: 'rgba(192, 57, 43, 0.9)' });
        });
        
        this.backButton.on('pointerout', () => {
            this.backButton.setStyle({ backgroundColor: 'rgba(231, 76, 60, 0.8)' });
        });
        
        this.backButton.on('pointerdown', () => {
            console.log('Returning to title...');
            
            // 名前入力UIを強制的に削除（遷移前に確実に削除）
            this.removeNameInputUI();
            
            // ボタンクリック時の効果音を再生
            this.playButtonSound();
            
            // すべての音声を停止
            this.stopAllSounds();
            
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                // 遷移直前に再度削除を確認
                this.removeNameInputUI();
                
                // 黒画面を表示して0.5秒待機
                const screenWidth = this.cameras.main.width;
                const screenHeight = this.cameras.main.height;
                const blackOverlay = this.add.rectangle(
                    screenWidth / 2,
                    screenHeight / 2,
                    screenWidth,
                    screenHeight,
                    0x000000
                );
                blackOverlay.setScrollFactor(0);
                blackOverlay.setDepth(10000);
                
                // 0.5秒後にシーン遷移
                this.time.delayedCall(500, () => {
                    this.scene.start('TitleScene');
                });
            });
        });
    }
    
    /**
     * ロケットを発射
     * @param {Phaser.Input.Pointer} pointer - ポインター情報
     */
    launchRocket(pointer) {
        if (!this.rocket || this.rocket.isLaunched) return;
        
        // カメラのズームを考慮してワールド座標に変換
        const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
        const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;
        
        console.log('Launching rocket at screen:', pointer.x, pointer.y, 'world:', worldX, worldY);
        
        // 発射角度と速度を計算（ワールド座標を使用）
        const angle = this.launchPoint.calculateAngle(worldX, worldY);
        const speed = this.launchPoint.calculateSpeed(
            worldX,
            worldY,
            GameConfig.rocket.minSpeed,
            GameConfig.rocket.maxSpeed,
            GameConfig.rocket.speedMultiplier
        );
        
        console.log('Launch angle:', angle, 'speed:', speed);
        
        // ロケットを発射
        this.rocket.launch(angle, speed);
        
        // 軌道線をクリア
        this.trajectoryGraphics.clear();
        
        // 状態テキストを更新
        if (this.statusText) {
            this.statusText.setText('発射中...');
            this.statusText.setStyle({ fill: '#ffff00' });
        }
        
        // 飛行中用の再発射ボタンを表示
        if (this.inFlightRetryButton) {
            this.inFlightRetryButton.setVisible(true);
        }
    }
    
    /**
     * ロケットをリセット
     */
    resetRocket() {
        // ゲームオーバーをリセット
        this.isGameOver = false;
        
        // 物理演算を再開
        if (this.matter.world.isPaused) {
            this.matter.world.resume();
        }
        
        this.rocket.reset();
        this.trajectoryGraphics.clear();
        
        // カメラ追従をリセット
        this.isCameraFollowing = false;
        
        // コックピット分離時刻をリセット
        this.cockpitSeparationTime = null;
        
        // 分離ゲージをリセット
        this.separationCharge = 0;
        this.isCharging = false;
        this.wasAt100Percent = false; // リセット
        this.justReached100Percent = false; // リセット
        if (this.separationGauge) {
            this.separationGauge.width = 0;
        }
        if (this.separationText) {
            this.separationText.setVisible(false);
        }
        if (this.separationGaugeBg) {
            this.separationGaugeBg.setVisible(false);
        }
        if (this.separationGauge) {
            this.separationGauge.setVisible(false);
        }
        if (this.separationPowerText) {
            this.separationPowerText.setVisible(false);
        }
        
        // スピードメーターをリセット
        if (this.speedometer) {
            this.speedometer.setVisible(false);
        }
        if (this.speedometerText) {
            this.speedometerText.setVisible(false);
        }
        if (this.distanceText) {
            this.distanceText.setVisible(false);
        }
        if (this.speedometerInfo && this.speedometerInfo.label) {
            this.speedometerInfo.label.setVisible(false);
        }
        if (this.speedometerNeedle) {
            this.speedometerNeedle.setVisible(false);
        }
        
        // 飛行中用の再発射ボタンを非表示
        if (this.inFlightRetryButton) {
            this.inFlightRetryButton.setVisible(false);
        }

        // 状態テキストを更新
        if (this.statusText) {
            this.statusText.setText('準備完了');
            this.statusText.setStyle({ fill: '#00ff00' });
        }
    }
    
    /**
     * カメラの位置を更新
     */
    updateCamera() {
        if (!this.rocket.isLaunched) {
            // 発射前は固定位置
            const cameraX = this.launchPoint.x + (this.cameras.main.width / GameConfig.cameraZoom) / 2;
            const cameraY = this.launchPoint.y - (this.cameras.main.height / GameConfig.cameraZoom) / 2;
            this.cameras.main.centerOn(cameraX, cameraY);
            this.isCameraFollowing = false;
            return;
        }
        
        // コックピットが分離されている場合は、コックピットを追従
        const cockpitPos = this.rocket.getSeparatedCockpitPosition();
        if (cockpitPos) {
            const cameraX = cockpitPos.x;
            const cameraY = this.launchPoint.y - (this.cameras.main.height / GameConfig.cameraZoom) / 2;
            this.cameras.main.centerOn(cameraX, cameraY);
            return;
        }
        
        // ロケットの位置を取得
        const rocketPos = this.rocket.getPosition();
        
        // ロケットが画面中央（閾値）を超えたらカメラ追従モードに切り替え
        if (!this.isCameraFollowing && rocketPos.x >= this.cameraFollowThreshold) {
            this.isCameraFollowing = true;
            console.log('Camera now following rocket at X:', rocketPos.x.toFixed(2));
        }
        
        if (this.isCameraFollowing) {
            // カメラ追従モード: X方向はロケットの重心を中央に、Y方向は固定
            const cameraX = rocketPos.x;
            const cameraY = this.launchPoint.y - (this.cameras.main.height / GameConfig.cameraZoom) / 2;
            this.cameras.main.centerOn(cameraX, cameraY);
        } else {
            // 固定モード: 発射地点を基準に固定
            const cameraX = this.launchPoint.x + (this.cameras.main.width / GameConfig.cameraZoom) / 2;
            const cameraY = this.launchPoint.y - (this.cameras.main.height / GameConfig.cameraZoom) / 2;
            this.cameras.main.centerOn(cameraX, cameraY);
        }
    }
    
    /**
     * 飛行距離に応じて背景画像のキーを取得
     */
    getBackgroundKeyForDistance(distance) {
        // 0-5000m: bg_1
        // 5000-10000m: bg_2
        // 10000-15000m: bg_3
        // 15000-20000m: bg_4
        // 20000-25000m: bg_5
        // 25000m~: bg_6
        if (distance < 5000) return 'bg_1';
        if (distance < 10000) return 'bg_2';
        if (distance < 15000) return 'bg_3';
        if (distance < 20000) return 'bg_4';
        if (distance < 25000) return 'bg_5';
        return 'bg_6';
    }
    
    /**
     * 背景を作成（無限スクロール・複数画像配置）
     */
    createBackground() {
        // 背景画像のサイズを取得
        const bgTexture = this.textures.get('bg_1');
        const bgWidth = bgTexture.getSourceImage().width;
        const bgHeight = bgTexture.getSourceImage().height;
        
        console.log('Background image size:', bgWidth, 'x', bgHeight);
        
        // カメラのズームを考慮した高さスケール
        const worldHeight = this.cameras.main.height / GameConfig.cameraZoom;
        const scale = worldHeight / bgHeight;
        const scaledWidth = bgWidth * scale;
        
        // 背景画像を7枚横に配置
        const bgCount = 7;
        for (let i = 0; i < bgCount; i++) {
            const bg = this.add.image(i * scaledWidth, 0, 'bg_1');
            bg.setOrigin(0, 0);
            bg.setScale(scale);
            bg.setDepth(-100);
            bg.setScrollFactor(1); // ワールド座標に固定
            bg.setData('currentBgKey', 'bg_1'); // 現在の背景キーを保存
            
            this.backgroundImages.push(bg);
        }
        
        // 背景情報を保存
        this.backgroundInfo = {
            bgWidth: scaledWidth,
            bgCount: bgCount,
            lastCameraX: 0,  // 前回のカメラX座標
            scale: scale     // スケール情報を保存
        };
        
        console.log('Background created with', bgCount, 'images');
        console.log('Background image width:', scaledWidth);
    }
    
    /**
     * 背景の無限スクロールを更新
     */
    updateBackgroundScroll() {
        if (!this.backgroundInfo || this.backgroundImages.length === 0) return;
        
        const cameraX = this.cameras.main.scrollX;
        const bgWidth = this.backgroundInfo.bgWidth;
        
        // 現在の飛行距離を取得（コックピットまたはロケットの位置）
        let currentDistance = 0;
        if (this.rocket) {
            if (this.rocket.isCockpitSeparated && this.rocket.separatedCockpitSprites.length > 0) {
                currentDistance = this.rocket.separatedCockpitSprites[0].x - this.launchPoint.x;
            } else if (this.rocket.sprite) {
                currentDistance = this.rocket.sprite.x - this.launchPoint.x;
            }
        }
        
        // カメラが約1000ピクセル移動したかチェック
        const cameraMovement = cameraX - this.backgroundInfo.lastCameraX;
        
        if (Math.abs(cameraMovement) >= 1000) {
            // 背景画像の位置をチェックして再配置
            this.backgroundImages.forEach(bg => {
                // 画面の左端より左に完全に出た画像を見つける
                if (bg.x + bgWidth < cameraX - 1000) {
                    // 最も右にある背景画像を見つける
                    let rightmostX = -Infinity;
                    this.backgroundImages.forEach(other => {
                        if (other.x > rightmostX) {
                            rightmostX = other.x;
                        }
                    });
                    
                    // 右端の背景のさらに右に再配置
                    bg.setX(rightmostX + bgWidth);
                    
                    // 新しい位置での距離を計算
                    const bgDistance = bg.x - this.launchPoint.x;
                    const newBgKey = this.getBackgroundKeyForDistance(bgDistance);
                    
                    // 背景画像を変更（必要な場合のみ）
                    const currentBgKey = bg.getData('currentBgKey');
                    if (currentBgKey !== newBgKey) {
                        bg.setTexture(newBgKey);
                        bg.setData('currentBgKey', newBgKey);
                        console.log(`Background changed to ${newBgKey} at distance ${bgDistance.toFixed(0)}m`);
                    }
                }
            });
            
            // カメラ位置を更新
            this.backgroundInfo.lastCameraX = cameraX;
        }
        
        // 現在表示中のすべての背景画像を距離に応じて更新
        this.backgroundImages.forEach(bg => {
            const bgDistance = bg.x - this.launchPoint.x;
            const correctBgKey = this.getBackgroundKeyForDistance(bgDistance);
            const currentBgKey = bg.getData('currentBgKey');
            
            if (currentBgKey !== correctBgKey) {
                bg.setTexture(correctBgKey);
                bg.setData('currentBgKey', correctBgKey);
                console.log(`Background updated to ${correctBgKey} at distance ${bgDistance.toFixed(0)}m`);
            }
        });
    }
    
    /**
     * 雲を生成（廃止・背景画像使用のため不要）
     */
    createClouds(count, scrollFactor, depth, color, alpha) {
        for (let i = 0; i < count; i++) {
            const x = Math.random() * 20000;
            const y = Math.random() * -2000 - 500;
            const scale = 0.5 + Math.random() * 1.5;
            
            const cloud = this.add.graphics();
            cloud.fillStyle(color, alpha);
            
            // 雲の形を描画（楕円を複数重ねて雲っぽく）
            const baseX = 0;
            const baseY = 0;
            cloud.fillEllipse(baseX, baseY, 60 * scale, 40 * scale);
            cloud.fillEllipse(baseX - 30 * scale, baseY, 50 * scale, 35 * scale);
            cloud.fillEllipse(baseX + 30 * scale, baseY, 50 * scale, 35 * scale);
            cloud.fillEllipse(baseX - 15 * scale, baseY - 15 * scale, 40 * scale, 30 * scale);
            cloud.fillEllipse(baseX + 15 * scale, baseY - 15 * scale, 40 * scale, 30 * scale);
            
            cloud.setPosition(x, y);
            cloud.setScrollFactor(scrollFactor);
            cloud.setDepth(depth);
        }
    }
    
    /**
     * 遠くの山々を生成（廃止・背景画像使用のため不要）
     */
    createMountains() {
        // 背景画像を使用するため、この関数は何もしない
    }
    
    /**
     * 地面を作成
     */
    createGround() {
        // 地面は射出地点より下に配置（物理衝突用）
        const groundY = this.launchPoint.y + 500;
        
        // 非常に長い地面を作成（ロケットが遠くまで飛べるように）
        const groundWidth = 100000;
        
        this.ground = this.matter.add.rectangle(
            groundWidth / 2,
            groundY,
            groundWidth,
            100,
            {
                isStatic: true,
                label: 'ground',
                friction: 0.5,
                restitution: 0.3
            }
        );
        
        // 地面を視覚化（物理地面の位置）
        const groundGraphics = this.add.graphics();
        groundGraphics.lineStyle(5, 0x8b4513, 1);
        groundGraphics.lineBetween(0, groundY - 50, groundWidth, groundY - 50);
        groundGraphics.setScrollFactor(1);
        
        // ゲーム終了ライン（射出地点の高さ）を視覚化
        const finishLineGraphics = this.add.graphics();
        finishLineGraphics.lineStyle(3, 0xff0000, 0.5); // 赤い点線
        for (let x = 0; x < groundWidth; x += 50) {
            finishLineGraphics.lineBetween(x, this.launchPoint.y, x + 25, this.launchPoint.y);
        }
        finishLineGraphics.setScrollFactor(1);
        
        console.log('Ground created at Y:', groundY, '(physical ground)');
        console.log('Finish line at Y:', this.launchPoint.y, '(game over trigger)');
    }
    
    /**
     * スピードメーターを作成
     */
    createSpeedometer() {
        const meterX = this.cameras.main.width + 600; // 画面右下
        const meterY = this.cameras.main.height + 200;
        const meterRadius = 300; // 半径を大きく（150 → 200）
        
        // メーター背景
        this.speedometer = this.add.graphics();
        this.speedometer.setScrollFactor(0);
        this.speedometer.setDepth(200);
        
        // 背景円
        this.speedometer.fillStyle(0x000000, 0.7);
        this.speedometer.fillCircle(meterX, meterY, meterRadius);
        
        // 外枠
        this.speedometer.lineStyle(12, 0xffffff, 0.8); // 線を太く（8 → 12）
        this.speedometer.strokeCircle(meterX, meterY, meterRadius);
        
        // 目盛りを描画
        for (let i = 0; i <= 10; i++) {
            const angle = Math.PI + (i / 10) * Math.PI; // 180度から360度まで
            const startRadius = meterRadius - 35; // 目盛りの位置を調整
            const endRadius = meterRadius - 15;
            
            const startX = meterX + Math.cos(angle) * startRadius;
            const startY = meterY + Math.sin(angle) * startRadius;
            const endX = meterX + Math.cos(angle) * endRadius;
            const endY = meterY + Math.sin(angle) * endRadius;
            
            this.speedometer.lineStyle(6, 0xffffff, 0.6); // 目盛りを太く（4 → 6）
            this.speedometer.lineBetween(startX, startY, endX, endY);
        }
        
        // 速度テキスト
        this.speedometerText = this.add.text(meterX, meterY + 70, '0 km/h', {
            fontSize: '56px', // フォントサイズを大きく（40 → 56）
            fill: '#00ff00',
            fontStyle: 'bold'
        });
        this.speedometerText.setOrigin(0.5);
        this.speedometerText.setScrollFactor(0);
        this.speedometerText.setDepth(201);
        
        // 飛距離テキスト
        this.distanceText = this.add.text(meterX, meterY + 140, '飛距離: 0 m', {
            fontSize: '48px', // フォントサイズを大きく（36 → 48）
            fill: '#ffff00',
            fontStyle: 'bold'
        });
        this.distanceText.setOrigin(0.5);
        this.distanceText.setScrollFactor(0);
        this.distanceText.setDepth(201);
        this.distanceText.setVisible(false);
        
        // ラベル
        const label = this.add.text(meterX, meterY - 110, 'SPEED', {
            fontSize: '48px', // フォントサイズを大きく（36 → 48）
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        label.setOrigin(0.5);
        label.setScrollFactor(0);
        label.setDepth(201);
        
        // 針用のグラフィックス
        this.speedometerNeedle = this.add.graphics();
        this.speedometerNeedle.setScrollFactor(0);
        this.speedometerNeedle.setDepth(202);
        
        // 初期状態では非表示
        this.speedometer.setVisible(false);
        this.speedometerText.setVisible(false);
        this.distanceText.setVisible(false);
        label.setVisible(false);
        this.speedometerNeedle.setVisible(false);
        
        // メーター情報を保存
        this.speedometerInfo = {
            x: meterX,
            y: meterY,
            radius: meterRadius,
            label: label
        };
    }
    
    /**
     * スピードメーターを更新
     */
    updateSpeedometer() {
        if (!this.rocket || !this.rocket.isCockpitSeparated) {
            return;
        }
        
        const cockpitPos = this.rocket.getSeparatedCockpitPosition();
        if (!cockpitPos) {
            return;
        }
        
        // コックピットの速度を取得
        const cockpitSprite = this.rocket.separatedCockpitSprites[0];
        if (!cockpitSprite || !cockpitSprite.body) {
            return;
        }
        
        const velocityX = cockpitSprite.body.velocity.x;
        const velocityY = cockpitSprite.body.velocity.y;
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        
        // m/s から km/h に変換（ゲーム内の速度スケール調整）
        const speedKmh = speed * 3.6;
        
        // メーターを表示
        if (!this.speedometer.visible) {
            this.speedometer.setVisible(true);
            this.speedometerText.setVisible(true);
            this.distanceText.setVisible(true);
            this.speedometerInfo.label.setVisible(true);
            this.speedometerNeedle.setVisible(true);
        }
        
        // テキストを更新
        this.speedometerText.setText(Math.round(speedKmh) + ' km/h');
        
        // 飛距離を計算して表示（射出地点からの距離）
        const distanceFromLaunch = cockpitPos.x - this.launchPoint.x;
        const distanceMeters = Math.round(distanceFromLaunch);
        this.distanceText.setText('飛距離: ' + distanceMeters + ' m');
        
        // 針の角度を計算（0-500 km/h を 180度-360度にマッピング）
        const maxSpeed = 500;
        const clampedSpeed = Math.min(speedKmh, maxSpeed);
        const needleAngle = Math.PI + (clampedSpeed / maxSpeed) * Math.PI;
        
        // 針を描画
        this.speedometerNeedle.clear();
        this.speedometerNeedle.lineStyle(8, 0xff0000, 1); // 針を太く（6 → 8）
        
        const needleLength = this.speedometerInfo.radius - 40; // 針の長さを調整
        const needleEndX = this.speedometerInfo.x + Math.cos(needleAngle) * needleLength;
        const needleEndY = this.speedometerInfo.y + Math.sin(needleAngle) * needleLength;
        
        this.speedometerNeedle.lineBetween(
            this.speedometerInfo.x,
            this.speedometerInfo.y,
            needleEndX,
            needleEndY
        );
        
        // 中心の円
        this.speedometerNeedle.fillStyle(0xff0000, 1);
        this.speedometerNeedle.fillCircle(this.speedometerInfo.x, this.speedometerInfo.y, 14); // 中心点を大きく（10 → 14）
    }
    
    /**
     * コックピットの地面接触を検知
     */
    checkCockpitGroundCollision() {
        if (!this.rocket || !this.rocket.isCockpitSeparated || this.isGameOver) {
            return;
        }
        
        const cockpitSprite = this.rocket.separatedCockpitSprites[0];
        if (!cockpitSprite || !cockpitSprite.body) {
            return;
        }
        
        // コックピット分離から1秒経過していない場合は判定しない
        if (this.cockpitSeparationTime === null) {
            return;
        }
        
        const elapsedTime = this.time.now - this.cockpitSeparationTime;
        if (elapsedTime < 1000) { // 1000ms = 1秒
            return;
        }
        
        // 射出地点のY座標を基準（0m）として
        const cockpitY = cockpitSprite.y;
        const groundY = this.launchPoint.y; // 射出地点を0mとする
        const altitude = groundY - cockpitY; // 高度（正の値が上）
        const velocityY = cockpitSprite.body.velocity.y;
        
        // 高度500m以下、かつ下方向へ速度を持っている場合にアイリスアウト開始
        if (this.enableIrisOutEffect && !this.isIrisOutStarted && altitude <= 500 && velocityY > 0) {
            this.isIrisOutStarted = true;
            this.startIrisOutEffect(cockpitSprite);
        }
        
        // アイリスアウト中はコックピットを追従して更新
        if (this.enableIrisOutEffect && this.isIrisOutStarted && !this.isIrisOutComplete) {
            this.updateIrisOut();
        }
        
        // 地面に到達したら終了（100px上で判定）
        if (cockpitY >= groundY - 100) {
            this.gameOver();
        }
    }
    
    /**
     * アイリスアウト演出を開始
     */
    startIrisOutEffect(cockpitSprite) {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const maxRadius = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
        
        // アイリスアウト用のグラフィックス
        const irisGraphics = this.add.graphics();
        irisGraphics.setDepth(500);
        irisGraphics.setScrollFactor(0);
        this.irisGraphics = irisGraphics;
        
        // アニメーション用オブジェクト
        this.irisAnimData = { radius: maxRadius };
        this.irisMaxRadius = maxRadius;
        this.irisCockpitSprite = cockpitSprite;
        
        // アイリスアウトアニメーション
        this.tweens.add({
            targets: this.irisAnimData,
            radius: 0,
            duration: 2000,
            ease: 'Power2',
            onComplete: () => {
                this.isIrisOutComplete = true;
            }
        });
    }
    
    /**
     * アイリスアウトを更新（コックピットを追従）
     */
    updateIrisOut() {
        if (!this.irisGraphics || !this.irisCockpitSprite) return;
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const camX = this.cameras.main.scrollX;
        const camY = this.cameras.main.scrollY;
        
        // コックピットのスクリーン座標
        const cockpitScreenX = this.irisCockpitSprite.x - camX;
        const cockpitScreenY = this.irisCockpitSprite.y - camY;
        
        const r = this.irisAnimData.radius;
        
        this.irisGraphics.clear();
        this.irisGraphics.fillStyle(0x000000, 1);
        
        // 外側から円形に黒く染める（三角形で構成）
        const segments = 64;
        const outerRadius = this.irisMaxRadius * 2;
        
        for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI * 2;
            const angle2 = ((i + 1) / segments) * Math.PI * 2;
            
            const x1 = cockpitScreenX + Math.cos(angle1) * r;
            const y1 = cockpitScreenY + Math.sin(angle1) * r;
            const x2 = cockpitScreenX + Math.cos(angle2) * r;
            const y2 = cockpitScreenY + Math.sin(angle2) * r;
            const x3 = cockpitScreenX + Math.cos(angle1) * outerRadius;
            const y3 = cockpitScreenY + Math.sin(angle1) * outerRadius;
            const x4 = cockpitScreenX + Math.cos(angle2) * outerRadius;
            const y4 = cockpitScreenY + Math.sin(angle2) * outerRadius;
            
            // 2つの三角形で扇形を描画
            this.irisGraphics.fillTriangle(x1, y1, x3, y3, x4, y4);
            this.irisGraphics.fillTriangle(x1, y1, x4, y4, x2, y2);
        }
    }
    
    /**
     * ゲーム終了処理
     */
    gameOver() {
        if (this.isGameOver) return;
        
        this.isGameOver = true;
        console.log('Game Over! Cockpit touched the ground.');
        
        // uo.wavの再生を中断
        if (this.uoSound && this.uoSound.isPlaying) {
            this.uoSound.stop();
            this.uoSound = null;
        }
        
        // oe.wavを再生
        if (this.cache.audio.exists('oe')) {
            // 再生中の音声オブジェクトを保存（中断用）
            this.oeSound = this.sound.play('oe', { volume: 0.3 });
        }
        
        // 着陸時の効果音を再生
        this.playLandingSound();
        
        // スピードメーターを非表示
        if (this.speedometer) {
            this.speedometer.setVisible(false);
        }
        if (this.speedometerText) {
            this.speedometerText.setVisible(false);
        }
        if (this.distanceText) {
            this.distanceText.setVisible(false);
        }
        
        // 飛行中用の再発射ボタンを非表示
        if (this.inFlightRetryButton) {
            this.inFlightRetryButton.setVisible(false);
        }
        if (this.speedometerInfo && this.speedometerInfo.label) {
            this.speedometerInfo.label.setVisible(false);
        }
        if (this.speedometerNeedle) {
            this.speedometerNeedle.setVisible(false);
        }
        
        // 物理演算を停止
        this.matter.world.pause();
        
        const cockpitSprite = this.rocket.separatedCockpitSprites[0];
        if (cockpitSprite && cockpitSprite.body) {
            const velocityX = cockpitSprite.body.velocity.x;
            const velocityY = cockpitSprite.body.velocity.y;
            const finalSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            const finalSpeedKmh = Math.round(finalSpeed * 3.6);
            
            // 最終飛距離を計算
            const finalDistance = Math.round(cockpitSprite.x - this.launchPoint.x);
            
            // トロフィーをチェック（非同期で実行、エラーは無視）
            this.checkAndUnlockTrophies(finalDistance, finalSpeedKmh).catch(error => {
                console.error('Error checking trophies:', error);
            });
            
            // 着陸時にリザルト表示を開始（アイリスアウトは裏で継続）
            // 注意: isPersonalBest()の判定はshowResultScreen()内で行う（自己ベストを更新する前）
            this.showResultScreen(finalDistance, finalSpeedKmh).catch(error => {
                console.error('Error showing result screen:', error);
            });
            
            // 並行してアイリスアウトを縮小
            this.shrinkIrisToFinal();
        }
        
        // 状態テキストを更新
        if (this.statusText) {
            this.statusText.setText('ゲーム終了');
            this.statusText.setStyle({ fill: '#ff0000' });
        }
    }
    
    
    /**
     * 着陸後にアイリスアウトをさらに縮小（裏で継続）
     */
    shrinkIrisToFinal() {
        const cockpitSize = 80; // コックピットがギリギリ見えるサイズ
        
        if (!this.irisGraphics || !this.irisCockpitSprite || !this.irisAnimData) {
            return;
        }
        
        // 既存のアイリスアウトtweenを停止
        this.tweens.killTweensOf(this.irisAnimData);
        
        // 現在の半径からコックピットサイズまで縮小
        this.tweens.add({
            targets: this.irisAnimData,
            radius: cockpitSize,
            duration: 1500,
            ease: 'Power2',
            onUpdate: () => {
                this.updateIrisOut();
            },
            onComplete: () => {
                this.isIrisOutComplete = true;
            }
        });
    }
    
    /**
     * リザルト画面を表示
     */
    async showResultScreen(finalDistance, finalSpeedKmh) {
        // ゲーム終了時にトロフィーデータをまとめて更新（非同期で実行、リザルト表示をブロックしない）
        this.syncTrophyDataToAPI().catch(error => {
            console.error('Error syncing trophy data to API:', error);
        });
        
        const screenCenterX = this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.height / 2;
        const screenWidth = this.cameras.main.width;
        
        // リザルト表示時に不要なUIを非表示にする
        if (this.instructionsText) {
            this.instructionsText.setVisible(false);
        }
        if (this.backButton) {
            this.backButton.setVisible(false);
        }
        if (this.separationResultText) {
            this.separationResultText.setVisible(false);
        }
        
        // 自己ベストを更新したかどうかをチェック（自己ベストを更新する前に判定）
        console.log(`Checking personal best: finalDistance=${finalDistance}, mode=${this.isRankMatch ? `rankMatch_${this.rankMatchDate}` : 'normal'}`);
        const isPersonalBest = this.isPersonalBest(finalDistance);
        console.log(`isPersonalBest result: ${isPersonalBest}`);
        
        // 自己ベストを更新（判定後に更新）
        if (isPersonalBest) {
            const currentPersonalBest = this.getPersonalBest();
            this.setPersonalBest(finalDistance);
            console.log(`Personal best updated in showResultScreen: ${currentPersonalBest} -> ${finalDistance}`);
            // API経由で自己ベストを保存
            this.savePersonalBestToAPI(finalDistance).catch(error => {
                console.error('Error saving personal best to API:', error);
            });
        }
        
        // セピア調エフェクトを適用（画面全体を覆う半透明のセピア色オーバーレイ）
        const screenHeight = this.cameras.main.height;
        
        // kirakira.pngアニメーションを再生
        if (this.textures.exists('kirakira_sheet') && this.anims.exists('kirakira_anim')) {
            const kirakiraSprite = this.add.sprite(screenCenterX, screenCenterY, 'kirakira_sheet');
            kirakiraSprite.setScrollFactor(0);
            kirakiraSprite.setDepth(50); // セピアオーバーレイより下
            kirakiraSprite.setAlpha(0.25); // 透明度30%
            // 画面全体に表示するようにスケール調整
            const texture = this.textures.get('kirakira_sheet');
            const frameHeight = texture.source[0].height / 26;
            const scale = screenHeight / frameHeight + 6.3;
            kirakiraSprite.setScale(scale);
            kirakiraSprite.play('kirakira_anim');
        }
        const sepiaOverlay = this.add.rectangle(
            screenCenterX,
            screenCenterY,
            screenWidth,
            screenHeight,
            0x704214, // セピア色（茶色がかった色）
            0.15 // 透明度（0.15 = 15%の不透明度）
        );
        sepiaOverlay.setScrollFactor(0);
        sepiaOverlay.setDepth(100); // bg_x.png（深度-100）より上、リザルトテキスト（深度600）より下
        sepiaOverlay.setScale(4);
        
        // bg_black.pngを画面中央に表示
        if (this.textures.exists('bg_black')) {
            const bgBlackImage = this.add.image(screenCenterX, screenCenterY + 35, 'bg_black');
            bgBlackImage.setScrollFactor(0);
            bgBlackImage.setDepth(1000); // 一番上のレイヤー
            bgBlackImage.setOrigin(0.5);
            
            // 画面の高さに合わせてスケール調整
            const imageHeight = bgBlackImage.height;
            const scaleY = screenHeight / imageHeight + 2.8;
            bgBlackImage.setScale(scaleY);
        }
        
        // shibou.jsonからランダムに1つ選んで画面中央に表示
        if (this.cache.json.exists('shibou')) {
            const shibouData = this.cache.json.get('shibou');
            if (shibouData && Array.isArray(shibouData) && shibouData.length > 0) {
                // ランダムに1つ選ぶ
                const randomIndex = Math.floor(Math.random() * shibouData.length);
                const selectedShibou = shibouData[randomIndex];
                
                // メッセージ回収状況を保存
                const collectedShibou = JSON.parse(localStorage.getItem('collectedShibou') || '[]');
                if (!collectedShibou.includes(selectedShibou.num)) {
                    collectedShibou.push(selectedShibou.num);
                    localStorage.setItem('collectedShibou', JSON.stringify(collectedShibou));
                    
                    // APIに保存
                    this.updateTrophyData({ collectedShibou }).catch(error => {
                        console.error('Error updating collectedShibou:', error);
                    });
                }
                
                // テキストを画面中央に表示
                const shibouText = this.add.text(
                    screenCenterX,
                    screenCenterY - 200,
                    selectedShibou.text,
                    {
                        fontSize: '64px',
                        fill: '#ffffff',
                        fontStyle: 'bold',
                        fontFamily: '"ヒラギノ明朝 ProN", "Hiragino Mincho ProN", "游明朝", "Yu Mincho", "MS 明朝", "MS Mincho", serif',
                        align: 'center',
                        wordWrap: { width: screenWidth - 200 }
                    }
                );
                shibouText.setOrigin(0.5);
                shibouText.setScrollFactor(0);
                shibouText.setDepth(600);
            }
        }
        
        // 新記録ならhoronbia.jpg、そうでなければiei.pngを表示（現在は無効化）
        // if (isPersonalBest && this.textures.exists('horonbia')) {
        //     const horonbiaImage = this.add.image(screenWidth - 1400, 950, 'horonbia');
        //     horonbiaImage.setScrollFactor(0);
        //     horonbiaImage.setDepth(600);
        //     horonbiaImage.setScale(1); // horonbia用のサイズ
        // } else if (this.textures.exists('iei')) {
        //     const ieiImage = this.add.image(screenWidth + 450, 500, 'iei');
        //     ieiImage.setScrollFactor(0);
        //     ieiImage.setDepth(600);
        //     ieiImage.setScale(2.6); // iei用のサイズ
        // }
        
        // 左上にhororo_keirei.pngを表示
        if (this.textures.exists('hororo_keirei')) {
            const keireiImage = this.add.image(-1000, -500, 'hororo_keirei');
            keireiImage.setScrollFactor(0);
            keireiImage.setDepth(600);
            keireiImage.setOrigin(0, 0);
            keireiImage.setAlpha(0.6); // 透明度60%
        }
        
        // 右下にeru_back, hirameki_back, binba_backを並べて表示
        const backImageY = screenHeight - 100;
        const backImageSpacing = 150;
        
        if (this.textures.exists('eru_back')) {
            const eruImage = this.add.image(screenWidth - backImageSpacing * 3 +400 - 1300, backImageY + 1200, 'eru_back');
            eruImage.setScrollFactor(0);
            eruImage.setDepth(600);
            eruImage.setOrigin(0.5, 1);
        }
        if (this.textures.exists('hirameki_back')) {
            const hiramekiImage = this.add.image(screenWidth - backImageSpacing * 2 +600 - 1300, backImageY + 1200, 'hirameki_back');
            hiramekiImage.setScrollFactor(0);
            hiramekiImage.setDepth(600);
            hiramekiImage.setOrigin(0.5, 1);
        }
        if (this.textures.exists('binba_back')) {
            const binbaImage = this.add.image(screenWidth - backImageSpacing +800 - 1300, backImageY + 1000, 'binba_back');
            binbaImage.setScrollFactor(0);
            binbaImage.setDepth(600);
            binbaImage.setOrigin(0.5, 1);
            binbaImage.setScale(0.8);
        }
        
        // 右下に「fin.」を筆記体で表示
        const finText = this.add.text(
            screenWidth + 800,
            screenHeight + 750,
            'hororo winter 2026',
            {
                fontSize: '64px',
                fill: '#ffffff',
                fontFamily: '"Brush Script MT", "Brush Script", "Lucida Handwriting", "Comic Sans MS", cursive',
                fontStyle: 'italic'
            }
        );
        finText.setOrigin(1, 1); // 右下揃え
        finText.setScrollFactor(0);
        finText.setDepth(1000);
        
        // スクリーンショットボタン（右下）
        const screenshotButton = this.add.container(screenWidth + 1000, screenHeight + 500);
        const screenshotBg = this.add.rectangle(0, 0, 200, 60, 0x4a90e2);
        screenshotBg.setStrokeStyle(2, 0xffffff);
        const screenshotText = this.add.text(0, 0, 'スクショ', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        screenshotText.setOrigin(0.5);
        screenshotButton.add([screenshotBg, screenshotText]);
        screenshotButton.setSize(200, 60);
        screenshotButton.setInteractive({ useHandCursor: true });
        screenshotButton.setScrollFactor(0);
        screenshotButton.setDepth(1000);
        
        // スクリーンショットボタンのホバー効果
        screenshotButton.on('pointerover', () => {
            screenshotBg.setFillStyle(0x357abd);
        });
        screenshotButton.on('pointerout', () => {
            screenshotBg.setFillStyle(0x4a90e2);
        });
        
        // スクリーンショットボタンのクリックイベント
        screenshotButton.on('pointerdown', () => {
            // ゲーム画面をスクリーンショット
            this.game.renderer.snapshot((image) => {
                // Canvasに描画してBlobに変換
                const canvas = document.createElement('canvas');
                canvas.width = image.width;
                canvas.height = image.height;
                const ctx = canvas.getContext('2d');
                ctx.drawImage(image, 0, 0);
                
                // Blobに変換
                canvas.toBlob((blob) => {
                    if (!blob) {
                        console.error('Blobの作成に失敗しました');
                        return;
                    }
                    
                    // クリップボードにコピー
                    if (navigator.clipboard && navigator.clipboard.write) {
                        const item = new ClipboardItem({ 'image/png': blob });
                        navigator.clipboard.write([item]).then(() => {
                            console.log('スクリーンショットをクリップボードにコピーしました');
                            // ボタンテキストを一時的に変更してフィードバック
                            screenshotText.setText('コピー済み');
                            this.time.delayedCall(2000, () => {
                                screenshotText.setText('スクショ');
                            });
                        }).catch((err) => {
                            console.error('クリップボードへのコピーに失敗しました:', err);
                            // フォールバック: ダウンロード
                            this.downloadScreenshot(blob);
                        });
                    } else {
                        // クリップボードAPIが使えない場合はダウンロード
                        this.downloadScreenshot(blob);
                    }
                }, 'image/png');
            });
        });
        
        // 「着陸成功！」テキスト（画面中央上部）
        const gameOverText = this.add.text(
            screenCenterX + 1100,
            screenCenterY - 330 - 380,
            '着陸成功！',
            {
                fontSize: '72px',
                fill: '#ffff00',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        gameOverText.setOrigin(0.5);
        gameOverText.setScrollFactor(0);
        gameOverText.setDepth(600);
        
        // 飛距離を大きく表示（画面中央）
        const distanceResultText = this.add.text(
            screenCenterX + 1100,
            screenCenterY - 180 - 250,
            `${finalDistance} m`,
            {
                fontSize: '144px',
                fill: '#00ff00',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 6
            }
        );
        distanceResultText.setOrigin(0.5);
        distanceResultText.setScrollFactor(0);
        distanceResultText.setDepth(600);
        
        // 着地速度（飛距離の下）
        const speedText = this.add.text(
            screenCenterX + 1100,
            screenCenterY - 60 - 250,
            `着地速度: ${finalSpeedKmh} km/h`,
            {
                fontSize: '36px',
                fill: '#ffffff',
                fontStyle: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 15, y: 8 }
            }
        );
        speedText.setOrigin(0.5);
        speedText.setScrollFactor(0);
        speedText.setDepth(600);
        
        // ランキング登録は毎回表示（飛距離に関係なく）
        this.showNameInput(finalDistance);
        
        // 自己ベスト更新の有無に関わらず、「確定して再発射」ボタンを表示
        this.showConfirmAndRetryButton(finalDistance);
    }
    
    /**
     * 軌道を予測表示
     */
    updateTrajectoryPreview() {
        if (!this.rocket || this.rocket.isLaunched) return;
        
        const pointer = this.input.activePointer;
        if (!pointer || pointer.x <= 0 || pointer.y <= 0) return;
        
        // カメラのズームを考慮してワールド座標に変換
        const worldX = this.cameras.main.getWorldPoint(pointer.x, pointer.y).x;
        const worldY = this.cameras.main.getWorldPoint(pointer.x, pointer.y).y;
        
        // 発射角度と速度を計算（ワールド座標を使用）
        const angle = this.launchPoint.calculateAngle(worldX, worldY);
        const speed = this.launchPoint.calculateSpeed(
            worldX,
            worldY,
            GameConfig.rocket.minSpeed,
            GameConfig.rocket.maxSpeed,
            GameConfig.rocket.speedMultiplier
        );
        
        const velocityX = Math.cos(angle) * speed;
        const velocityY = Math.sin(angle) * speed;
        
        // 軌道を計算して描画（ワールドサイズを考慮）
        const worldWidth = this.cameras.main.width / GameConfig.cameraZoom;
        const worldHeight = this.cameras.main.height / GameConfig.cameraZoom;
        
        const points = TrajectoryCalculator.calculate(
            this.launchPoint.x,
            this.launchPoint.y,
            velocityX,
            velocityY,
            worldWidth,
            worldHeight
        );
        
        TrajectoryCalculator.draw(this.trajectoryGraphics, points);
    }
    
    update() {
        if (!this.rocket) return;
        
        // ゲームオーバー時は更新しない
        if (this.isGameOver) return;
        
        // カメラの位置を更新
        this.updateCamera();
        
        // 背景の無限スクロールを更新
        this.updateBackgroundScroll();
        
        // スピードメーターを更新
        this.updateSpeedometer();
        
        // コックピットの地面接触を検知
        this.checkCockpitGroundCollision();
        
        if (this.rocket.isLaunched) {
            // ロケットの角度を更新
            this.rocket.updateRotation();
            
            // ゲーム統計を記録
            this.updateGameStats();
            
            // コックピット分離UIの表示/非表示（1回のみ分離可能）
            const hasCockpit = this.rocket.hasCockpit();
            if (hasCockpit && this.rocket.separationCount < 1 && this.separationText && this.separationGaugeBg && this.separationGauge && this.separationPowerText) {
                this.separationText.setVisible(true);
                this.separationGaugeBg.setVisible(true);
                this.separationGauge.setVisible(true);
                this.separationPowerText.setVisible(true);
            } else if (this.separationText && this.separationGaugeBg && this.separationGauge && this.separationPowerText) {
                this.separationText.setVisible(false);
                this.separationGaugeBg.setVisible(false);
                this.separationGauge.setVisible(false);
                this.separationPowerText.setVisible(false);
            }
            
            // ゲージを更新
            this.updateSeparationGauge();
            
            // カメラがロケット/コックピットを追従しているため、画面外判定は不要
            // （削除: isOutOfBounds チェック）
        } else {
            // 軌道を予測表示
            this.updateTrajectoryPreview();
        }
    }
    
    /**
     * ゲーム統計を更新（プレイ中）
     */
    updateGameStats() {
        if (!this.rocket || !this.rocket.sprite || !this.rocket.sprite.body) return;
        
        // 回転量を記録
        const rotation = Math.abs(this.rocket.sprite.rotation);
        if (rotation > this.gameStats.maxRotation) {
            this.gameStats.maxRotation = rotation;
        }
        
        // 高度を記録（Y座標が小さいほど高い）
        const altitude = this.launchPoint.y - this.rocket.sprite.y;
        if (altitude > this.gameStats.maxAltitude) {
            this.gameStats.maxAltitude = altitude;
        }
        
        // 速度を記録
        const velocityX = this.rocket.sprite.body.velocity.x;
        const velocityY = this.rocket.sprite.body.velocity.y;
        const speed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
        const speedKmh = speed * 3.6;
        if (speedKmh > this.gameStats.maxSpeed) {
            this.gameStats.maxSpeed = speedKmh;
        }
    }
    
    /**
     * トロフィーをチェックして解除
     */
    
    /**
     * 自己ベストのキーを取得（モードに応じて）
     * @returns {string} - localStorageのキー
     */
    getPersonalBestKey() {
        if (this.isRankMatch && this.rankMatchDate) {
            // ランクマッチモード: 日付ごとに別々のキー
            return `personalBest_rankMatch_${this.rankMatchDate}`;
        } else {
            // 通常モード（限界スコアモード）
            return 'personalBest_normal';
        }
    }
    
    /**
     * 自己ベストを取得（モードに応じて）
     * @returns {number} - 自己ベストの距離
     */
    getPersonalBest() {
        const key = this.getPersonalBestKey();
        // 後方互換性: 通常モードの場合、古いキーも確認
        if (!this.isRankMatch) {
            const oldKey = 'personalBest';
            const oldValue = localStorage.getItem(oldKey);
            if (oldValue) {
                // 古いキーから新しいキーに移行
                localStorage.setItem(key, oldValue);
                localStorage.removeItem(oldKey);
                const value = parseInt(oldValue, 10);
                console.log(`getPersonalBest: migrated from ${oldKey} to ${key}, value=${value}`);
                return value;
            }
        }
        const value = parseInt(localStorage.getItem(key) || '0', 10);
        console.log(`getPersonalBest: key=${key}, value=${value}, exists=${localStorage.getItem(key) !== null}`);
        return value;
    }
    
    /**
     * 自己ベストを保存（モードに応じて）
     * @param {number} distance - 保存する距離
     */
    setPersonalBest(distance) {
        const key = this.getPersonalBestKey();
        localStorage.setItem(key, distance.toString());
    }
    
    /**
     * 自己ベストをAPI経由で保存
     * @param {number} distance - 保存する距離
     */
    async savePersonalBestToAPI(distance) {
        try {
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                // トークンがない場合はスキップ
                return;
            }
            
            // 現在のトロフィーデータを取得
            const response = await apiClient.getTrophies(authToken);
            const trophyData = response.data || {
                unlockedTrophies: [],
                collectedShibou: [],
                playCount: 0,
                rankCounts: {},
                personalBest_normal: 0,
                personalBest_rankMatch: {}
            };
            
            // 自己ベストを更新
            if (this.isRankMatch && this.rankMatchDate) {
                // ランクマッチモード: 日付ごとに保存
                if (!trophyData.personalBest_rankMatch) {
                    trophyData.personalBest_rankMatch = {};
                }
                const currentBest = trophyData.personalBest_rankMatch[this.rankMatchDate] || 0;
                if (distance > currentBest) {
                    trophyData.personalBest_rankMatch[this.rankMatchDate] = distance;
                }
            } else {
                // 通常モード（限界スコアモード）
                trophyData.personalBest_normal = Math.max(trophyData.personalBest_normal || 0, distance);
            }
            
            // APIに更新
            await apiClient.updateTrophies(authToken, trophyData);
            
            console.log('Personal best saved to API:', distance, this.isRankMatch ? `(RankMatch: ${this.rankMatchDate})` : '(Normal)');
        } catch (error) {
            console.error('Error saving personal best to API:', error);
            throw error;
        }
    }
    
    /**
     * 自己ベストを更新したかどうかを判定
     * @param {number} distance - 現在の記録
     * @returns {boolean} - 自己ベストを更新した場合true
     */
    isPersonalBest(distance) {
        try {
            // モードに応じた自己ベストを取得（localStorageから）
            const savedPersonalBest = this.getPersonalBest();
            
            // 現在の記録が過去の自己ベストよりも大きい場合のみ更新とみなす（同じ距離は更新とみなさない）
            const isNewBest = distance > savedPersonalBest;
            
            console.log(`Personal best check: distance=${distance}, savedBest=${savedPersonalBest}, isNewBest=${isNewBest}, mode=${this.isRankMatch ? `rankMatch_${this.rankMatchDate}` : 'normal'}`);
            
            return isNewBest;
        } catch (error) {
            console.error('Error checking personal best:', error);
            // エラーが発生した場合は、モードに応じたpersonalBestと比較
            const savedPersonalBest = this.getPersonalBest();
            return distance > savedPersonalBest;
        }
    }
    
    /**
     * 自己ベストを更新できなかった場合のメッセージを表示
     */
    showNoPersonalBestMessage(finalDistance) {
        const screenWidth = this.cameras.main.width +900;
        const screenHeight = this.cameras.main.height;
        const screenCenterX = screenWidth / 2;
        const screenCenterY = screenHeight / 2 + 600;
        
        // メッセージパネル
        const messagePanel = this.add.container(screenCenterX + 500, screenCenterY - 400);
        messagePanel.setScrollFactor(0);
        messagePanel.setDepth(600);
        
        // パネル背景
        const panelBg = this.add.rectangle(0, -200, 1200, 400, 0x2c3e50);
        panelBg.setStrokeStyle(3, 0xffffff);
        
        // メッセージテキスト
        const messageText = this.add.text(0, -250, '自己ベストを更新できませんでした', {
            fontSize: '64px',
            fill: '#ffffff',
            fontStyle: 'bold',
            align: 'center',
            wordWrap: { width: 550 }
        });
        messageText.setOrigin(0.5);
        
        // 現在の記録を表示
        const currentRecordText = this.add.text(0, -200, `今回の記録: ${finalDistance.toLocaleString()} m`, {
            fontSize: '52px',
            fill: '#bdc3c7',
            align: 'center'
        });
        currentRecordText.setOrigin(0.5);
        
        messagePanel.add([panelBg, messageText, currentRecordText]);
        
        // 3秒後に自動的にフェードアウト
        this.tweens.add({
            targets: messagePanel,
            alpha: 0,
            duration: 500,
            delay: 2500,
            ease: 'Power2',
            onComplete: () => {
                messagePanel.destroy();
            }
        });
    }
    
    /**
     * 名前入力UIを表示
     */
    showNameInput(finalDistance) {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const screenCenterX = screenWidth / 2;
        const screenCenterY = screenHeight / 2;
        
        // // オーバーレイ背景（半透明の黒）
        // const overlayBg = this.add.rectangle(
        //     screenCenterX + 600,
        //     screenCenterY - 1500,
        //     screenWidth,
        //     screenHeight,
        //     0x000000,
        //     0.7
        // );
        // overlayBg.setDepth(400);
        
        // 名前入力パネル（画面中央下部に配置）
        // テキストとボタンはスクリーン座標（固定座標）で表示
        const panelWidth = 1400;
        const panelHeight = 900;
        
        // タイトル（画面中央下部）
        const titleText = this.add.text(screenCenterX + 1100, screenCenterY + 90 - 250, 'ランキングに登録', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        titleText.setOrigin(0.5);
        titleText.setScrollFactor(0);
        titleText.setDepth(600);
        
        // 説明文（タイトルの下）
        const instructionText = this.add.text(screenCenterX + 1100, screenCenterY + 150 - 250, 'アルファベットと数字5文字で名前を入力', {
            fontSize: '35px',
            fill: '#ffffff'
        });
        instructionText.setOrigin(0.5);
        instructionText.setScrollFactor(0);
        instructionText.setDepth(600);
        
        // 注意書き（入力フィールドの下）
        const warningText = this.add.text(screenCenterX + 1100, screenCenterY + 370 - 200, '※確定して再発射を押さないとランキングには反映されません', {
            fontSize: '35px',
            fill: '#ffff00'
        });
        warningText.setOrigin(0.5);
        warningText.setScrollFactor(0);
        warningText.setDepth(600);
        
        // HTMLのinput要素を作成
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const canvasRect = this.game.canvas.getBoundingClientRect();
            
            const scaleX = this.game.scale.displaySize.width / this.game.scale.gameSize.width;
            const scaleY = this.game.scale.displaySize.height / this.game.scale.gameSize.height;
            
            // 入力フィールドの位置をスクリーン座標（相対座標）で計算（画面中央、説明文の下）
            const inputWidth = 150;
            const inputHeight = 35;
            // 説明文のY座標: screenCenterY + 150 - 250 = screenCenterY - 100
            // 説明文の下に配置（説明文の高さの半分 + 間隔40px）
            const instructionY = screenCenterY + 150 - 250; // 説明文のY座標
            const inputYOffset = instructionY + 17.5 + 40; // 説明文の下に配置
            // 画面の固定位置（ビューポート座標）で計算
            const inputX = canvasRect.left + (screenCenterX + 363 - inputWidth / 2) * scaleX;
            const inputY = canvasRect.top + inputYOffset * scaleY + 37;
            
            const nameInput = document.createElement('input');
            nameInput.type = 'text';
            nameInput.maxLength = 5;
            nameInput.style.position = 'fixed'; // fixedに変更してスクロールに影響されないように
            nameInput.style.left = inputX + 'px';
            nameInput.style.top = inputY + 'px';
            nameInput.style.width = (inputWidth * scaleX) + 'px';
            nameInput.style.height = (inputHeight * scaleY) + 'px';
            nameInput.style.fontSize = (20 * scaleX) + 'px';
            nameInput.style.textAlign = 'center';
            nameInput.style.textTransform = 'uppercase';
            nameInput.style.border = '3px solid #ffffff';
            nameInput.style.borderRadius = '5px';
            nameInput.style.backgroundColor = '#1a1a2e';
            nameInput.style.color = '#ffffff';
            nameInput.style.zIndex = '402';
            
            // ユーザーIDを取得（localStorageから）
            const userId = localStorage.getItem('userId') || 'ANON';
            const defaultName = userId.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) || 'ANON';
            nameInput.value = defaultName;
            nameInput.placeholder = defaultName;
            
            // アルファベットと数字のみ入力可能にする
            nameInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 5);
            });
            
            // Enterキーで確定
            nameInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    const inputValue = nameInput.value || defaultName;
                    this.submitName(finalDistance, inputValue);
                }
            });
            
            gameContainer.appendChild(nameInput);
            nameInput.focus();
            nameInput.select();
            
            // // 確定ボタン（スクリーン座標で固定）
            // const submitButtonX = screenCenterX + 500;
            // const submitButtonY = screenCenterY + 250;
            // const submitButton = this.add.container(submitButtonX, submitButtonY);
            // const submitBg = this.add.rectangle(0, 0, 400, 100, 0x4ecdc4);
            // submitBg.setStrokeStyle(2, 0xffffff);
            // const submitText = this.add.text(0, 0, '確定', {
            //     fontSize: '96px',
            //     fill: '#ffffff',
            //     fontStyle: 'bold'
            // });
            // submitText.setOrigin(0.5);
            // submitButton.add([submitBg, submitText]);
            // submitButton.setSize(400, 100);
            // submitButton.setInteractive({ useHandCursor: true });
            // submitButton.setScrollFactor(0); // スクリーン座標に固定
            // submitButton.setDepth(401);
            
            // // 確定ボタンのホバー効果
            // submitButton.on('pointerover', () => {
            //     submitBg.setFillStyle(0x3ab5dd);
            // });
            // submitButton.on('pointerout', () => {
            //     submitBg.setFillStyle(0x4ecdc4);
            // });
            
            // // 確定ボタンのクリックイベント
            // submitButton.on('pointerdown', () => {
            //     // deci.mp3を音量50%で再生
            //     if (this.cache.audio.exists('deci')) {
            //         this.sound.play('deci', {
            //             volume: 0.5
            //         });
            //     }
            //     this.submitName(finalDistance, nameInput.value || 'MGR01');
            // });
            
            // 参照を保存（クリーンアップ用）
            this.nameInputOverlay = {
                titleText: titleText,
                instructionText: instructionText,
                warningText: warningText,
                nameInput: nameInput
            };
        }
    }
    
    /**
     * 再発射ボタンを表示
     */
    showRetryButton() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const screenCenterX = screenWidth / 2;
        const screenCenterY = screenHeight / 2;
        const buttonY = screenCenterY - 170; // 画面中央下部
        
        // 再発射ボタン（スクリーン座標で固定）
        const retryButton = this.add.container(screenCenterX + 1100, buttonY + 150);
        const retryBg = this.add.rectangle(0, 0, 400, 80, 0x4ecdc4);
        retryBg.setStrokeStyle(2, 0xffffff);
        const retryText = this.add.text(0, 0, '再発射', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        retryText.setOrigin(0.5);
        retryButton.add([retryBg, retryText]);
        retryButton.setSize(400, 80);
        retryButton.setInteractive({ useHandCursor: true });
        retryButton.setScrollFactor(0); // スクリーン座標に固定
        retryButton.setDepth(600);
        retryButton.setScale(1.5);
        
        // 再発射ボタンのホバー効果
        retryButton.on('pointerover', () => {
            retryBg.setFillStyle(0x3ab5dd);
        });
        retryButton.on('pointerout', () => {
            retryBg.setFillStyle(0x4ecdc4);
        });
        
        // 再発射ボタンのクリックイベント
        retryButton.on('pointerdown', () => {
            // 名前入力UIを強制的に削除
            this.removeNameInputUI();
            
            // deci.mp3を音量50%で再生
            if (this.cache.audio.exists('deci')) {
                this.sound.play('deci', {
                    volume: 0.5
                });
            }
            
            // アイリスアウトトランジションを開始
            this.startRetryIrisOutTransition();
        });
        
        // 参照を保存（クリーンアップ用）
        if (!this.nameInputOverlay) {
            this.nameInputOverlay = {};
        }
        this.nameInputOverlay.retryButton = retryButton;
    }
    
    /**
     * 確定して再発射ボタンを表示（新記録時用）
     */
    showConfirmAndRetryButton(finalDistance) {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const screenCenterX = screenWidth / 2;
        const screenCenterY = screenHeight / 2;
        const buttonY = screenCenterY + 220;
        
        const confirmRetryButton = this.add.container(screenCenterX + 1100, buttonY + 100);
        const confirmRetryBg = this.add.rectangle(0, 0, 500, 80, 0x27ae60);
        confirmRetryBg.setStrokeStyle(2, 0xffffff);
        const confirmRetryText = this.add.text(0, 0, '確定して再発射', {
            fontSize: '48px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        confirmRetryText.setOrigin(0.5);
        confirmRetryButton.add([confirmRetryBg, confirmRetryText]);
        confirmRetryButton.setSize(500, 80);
        confirmRetryButton.setInteractive({ useHandCursor: true });
        confirmRetryButton.setScrollFactor(0);
        confirmRetryButton.setDepth(600);
        
        confirmRetryButton.on('pointerover', () => {
            confirmRetryBg.setFillStyle(0x2ecc71);
        });
        confirmRetryButton.on('pointerout', () => {
            confirmRetryBg.setFillStyle(0x27ae60);
        });
        
        confirmRetryButton.on('pointerdown', () => {
            // deci.mp3を再生
            if (this.cache.audio.exists('deci')) {
                this.sound.play('deci', { volume: 0.5 });
            }
            
            // 名前入力から名前を取得してランキング更新
            // ユーザーIDをデフォルト値として使用
            const userId = localStorage.getItem('userId') || 'ANON';
            const defaultName = userId.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5) || 'ANON';
            let playerName = defaultName;
            if (this.nameInputOverlay && this.nameInputOverlay.nameInput) {
                const nameInput = this.nameInputOverlay.nameInput;
                // DOM要素から直接値を取得
                const inputValue = nameInput.value || nameInput.placeholder || defaultName;
                playerName = inputValue.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
                if (playerName.length === 0) {
                    playerName = defaultName;
                }
            }
            
            // ランキングを更新（submitNameを使用）
            this.submitName(finalDistance, playerName);
            
            // アイリスアウトトランジションを開始
            this.startRetryIrisOutTransition();
        });
        
        // 参照を保存
        if (!this.nameInputOverlay) {
            this.nameInputOverlay = {};
        }
        this.nameInputOverlay.confirmRetryButton = confirmRetryButton;
    }
    
    /**
     * 再発射時のアイリスアウトトランジション
     */
    startRetryIrisOutTransition() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const maxRadius = Math.sqrt(screenWidth * screenWidth + screenHeight * screenHeight);
        
        // コックピットの位置を取得（スクリーン座標）
        let centerX = screenWidth / 2;
        let centerY = screenHeight / 2;
        
        if (this.rocket && this.rocket.separatedCockpitSprites && this.rocket.separatedCockpitSprites[0]) {
            const cockpit = this.rocket.separatedCockpitSprites[0];
            centerX = cockpit.x - this.cameras.main.scrollX;
            centerY = cockpit.y - this.cameras.main.scrollY;
        }
        
        // アイリスアウト用グラフィックス
        const transitionGraphics = this.add.graphics();
        transitionGraphics.setScrollFactor(0);
        transitionGraphics.setDepth(1000);
        
        const animData = { radius: maxRadius };
        const cockpitSize = 0; // 最小サイズ（完全に閉じる）
        
        // アイリスアウトアニメーション
        this.tweens.add({
            targets: animData,
            radius: cockpitSize,
            duration: 800,
            ease: 'Power2',
            onUpdate: () => {
                transitionGraphics.clear();
                transitionGraphics.fillStyle(0x000000, 1);
                
                // 外側から円形に黒く染める
                const segments = 64;
                const outerRadius = maxRadius * 2;
                const r = animData.radius;
                
                for (let i = 0; i < segments; i++) {
                    const angle1 = (i / segments) * Math.PI * 2;
                    const angle2 = ((i + 1) / segments) * Math.PI * 2;
                    
                    const x1 = centerX + Math.cos(angle1) * r;
                    const y1 = centerY + Math.sin(angle1) * r;
                    const x2 = centerX + Math.cos(angle2) * r;
                    const y2 = centerY + Math.sin(angle2) * r;
                    const x3 = centerX + Math.cos(angle1) * outerRadius;
                    const y3 = centerY + Math.sin(angle1) * outerRadius;
                    const x4 = centerX + Math.cos(angle2) * outerRadius;
                    const y4 = centerY + Math.sin(angle2) * outerRadius;
                    
                    transitionGraphics.fillTriangle(x1, y1, x3, y3, x4, y4);
                    transitionGraphics.fillTriangle(x1, y1, x4, y4, x2, y2);
                }
            },
            onComplete: () => {
                // すべての表示オブジェクトを非表示にする（先に実行）
                this.children.list.forEach(child => {
                    if (child !== transitionGraphics) {
                        child.setVisible(false);
                    }
                });
                
                // 背景色を黒に設定
                this.cameras.main.setBackgroundColor('#000000');
                
                // 完全に黒くなったら画面全体をブラックアウト
                transitionGraphics.clear();
                transitionGraphics.fillStyle(0x000000, 1);
                transitionGraphics.fillRect(-500, -500, screenWidth + 1000, screenHeight + 1000);
                
                // 名前入力UIを削除
                this.removeNameInputUI();
                
                // カメラをフェードアウトしてからシーン遷移
                this.cameras.main.fadeOut(300, 0, 0, 0);
                
                this.cameras.main.once('camerafadeoutcomplete', () => {
                    // トランジショングラフィックスを破棄
                    transitionGraphics.destroy();
                    
                    // 黒画面を表示して0.5秒待機
                    const screenWidth = this.cameras.main.width;
                    const screenHeight = this.cameras.main.height;
                    const blackOverlay = this.add.rectangle(
                        screenWidth / 2,
                        screenHeight / 2,
                        screenWidth,
                        screenHeight,
                        0x000000
                    );
                    blackOverlay.setScrollFactor(0);
                    blackOverlay.setDepth(10000);
                    
                    // 0.5秒後にシーン遷移
                    const rocketDesignData = this.rocketDesign ? this.rocketDesign.toJSON() : null;
                    this.time.delayedCall(500, () => {
                        this.scene.start('GameScene', { 
                            rocketDesign: rocketDesignData,
                            isRankMatch: this.isRankMatch,
                            dateString: this.rankMatchDate
                        });
                    });
                });
            }
        });
    }
    
    /**
     * 名前入力UIを強制的に削除
     */
    removeNameInputUI() {
        // 確実に削除するため、複数回呼ばれても安全にする
        if (this.nameInputOverlay) {
            // HTMLのinput要素を削除
            if (this.nameInputOverlay.nameInput) {
                try {
                    if (this.nameInputOverlay.nameInput.parentNode) {
                        this.nameInputOverlay.nameInput.parentNode.removeChild(this.nameInputOverlay.nameInput);
                    }
                    // イベントリスナーを削除
                    const newInput = this.nameInputOverlay.nameInput.cloneNode(false);
                    this.nameInputOverlay.nameInput.replaceWith(newInput);
                    this.nameInputOverlay.nameInput = null;
                } catch (e) {
                    console.warn('Error removing nameInput:', e);
                }
            }
            // Phaserのテキストとボタンを削除
            if (this.nameInputOverlay.titleText) {
                try {
                    this.nameInputOverlay.titleText.destroy();
                } catch (e) {
                    console.warn('Error destroying titleText:', e);
                }
                this.nameInputOverlay.titleText = null;
            }
            if (this.nameInputOverlay.instructionText) {
                try {
                    this.nameInputOverlay.instructionText.destroy();
                } catch (e) {
                    console.warn('Error destroying instructionText:', e);
                }
                this.nameInputOverlay.instructionText = null;
            }
            if (this.nameInputOverlay.submitButton) {
                try {
                    this.nameInputOverlay.submitButton.destroy();
                } catch (e) {
                    console.warn('Error destroying submitButton:', e);
                }
                this.nameInputOverlay.submitButton = null;
            }
            if (this.nameInputOverlay.retryButton) {
                try {
                    this.nameInputOverlay.retryButton.destroy();
                } catch (e) {
                    console.warn('Error destroying retryButton:', e);
                }
                this.nameInputOverlay.retryButton = null;
            }
            this.nameInputOverlay = null;
        }
        
        // 念のため、game-container内のinput要素も直接削除
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const inputs = gameContainer.querySelectorAll('input[type="text"]');
            inputs.forEach(input => {
                try {
                    if (input.parentNode) {
                        input.parentNode.removeChild(input);
                    }
                } catch (e) {
                    console.warn('Error removing input element:', e);
                }
            });
        }
    }
    
    /**
     * 名前を確定してランキングに保存
     */
    async submitName(distance, name) {
        // 名前を正規化（アルファベットと数字のみ、大文字、最大5文字）
        // 入力されていない文字は埋めない
        const normalizedName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
        this.lastEnteredName = normalizedName; // トロフィーチェック用に保存
        
        try {
            // ランキングに保存（API呼び出し）
            await this.saveDistanceToRanking(distance, normalizedName);
            
            // ランクマッチでのメダル獲得トロフィーをチェック（ランキング保存後）
            if (this.isRankMatch && this.rankMatchDate) {
                await this.checkRankMatchMedalTrophies(distance, normalizedName);
            }
        } catch (error) {
            console.error('Error saving ranking:', error);
            // エラーが発生してもローカルストレージにフォールバック
            this.saveDistanceToRankingLocal(distance, normalizedName);
        }
        
        // 名前入力UIを削除
        this.removeNameInputUI();
    }
    
    /**
     * スクリーンショットをダウンロード
     */
    downloadScreenshot(blob) {
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `hororo_winter_2026_${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    }
    
    /**
     * ランクマッチでのメダル獲得トロフィーをチェック
     */
    async checkRankMatchMedalTrophies(distance, name) {
        try {
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            const response = await apiClient.getRanking('rankMatch', this.rankMatchDate, 10, authToken);
            const ranking = response.data?.records || [];
            const sortedRanking = [...ranking].sort((a, b) => b.distance - a.distance);
            
            // 現在の記録の順位を確認
            const currentRecordIndex = sortedRanking.findIndex(r => 
                Math.abs(r.distance - distance) < 0.01 && 
                r.name === name
            );
            
            const trophies = this.getNewTrophyList();
            
            // メダル獲得（3位以内）
            if (currentRecordIndex >= 0 && currentRecordIndex < 3) {
                const medalTrophy = trophies.find(t => t.id === 'trophy_7');
                if (medalTrophy) {
                    await this.saveTrophyToAPI(medalTrophy.id);
                    console.log('Trophy unlocked: trophy_7 (Rank Match Medal)');
                }
            }
            
            // 金メダル獲得（1位）
            if (currentRecordIndex === 0) {
                const goldMedalTrophy = trophies.find(t => t.id === 'trophy_10');
                if (goldMedalTrophy) {
                    await this.saveTrophyToAPI(goldMedalTrophy.id);
                    console.log('Trophy unlocked: trophy_10 (Rank Match Gold Medal)');
                }
            }
        } catch (error) {
            console.error('Error checking rank match medals:', error);
            // エラー時はローカルストレージから取得
            const rankingKey = `rankMatchRanking_${this.rankMatchDate}`;
            const ranking = JSON.parse(localStorage.getItem(rankingKey) || '[]');
            const sortedRanking = [...ranking].sort((a, b) => b.distance - a.distance);
            const currentRecordIndex = sortedRanking.findIndex(r => 
                Math.abs(r.distance - distance) < 0.01 && 
                r.name === name
            );
            
            const trophies = this.getNewTrophyList();
            
            // メダル獲得（3位以内）
            if (currentRecordIndex >= 0 && currentRecordIndex < 3) {
                const medalTrophy = trophies.find(t => t.id === 'trophy_7');
                if (medalTrophy) {
                    await this.saveTrophyToAPI(medalTrophy.id).catch(err => {
                        console.error('Error saving medal trophy:', err);
                    });
                }
            }
            
            // 金メダル獲得（1位）
            if (currentRecordIndex === 0) {
                const goldMedalTrophy = trophies.find(t => t.id === 'trophy_10');
                if (goldMedalTrophy) {
                    await this.saveTrophyToAPI(goldMedalTrophy.id).catch(err => {
                        console.error('Error saving gold medal trophy:', err);
                    });
                }
            }
            
            // rankCountsを更新（エラー時も）
            const rankCounts = { 1: 0, 2: 0, 3: 0 };
            if (currentRecordIndex === 0) rankCounts[1] = 1;
            else if (currentRecordIndex === 1) rankCounts[2] = 1;
            else if (currentRecordIndex === 2) rankCounts[3] = 1;
            
            await this.updateTrophyRankCounts(rankCounts).catch(err => {
                console.error('Error updating rankCounts:', err);
            });
        }
    }
    
    /**
     * トロフィーデータをAPIに同期（ゲーム終了時に呼び出し）
     */
    async syncTrophyDataToAPI() {
        try {
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                return; // トークンがない場合はスキップ
            }
            
            // 現在のトロフィーデータを取得
            const response = await apiClient.getTrophies(authToken);
            const trophyData = response.data || {
                unlockedTrophies: [],
                collectedShibou: [],
                playCount: 0,
                rankCounts: { 1: 0, 2: 0, 3: 0 }
            };
            
            // ローカルストレージから最新データを取得してマージ
            const localUnlockedTrophies = JSON.parse(localStorage.getItem('unlockedTrophies') || '[]');
            const localCollectedShibou = JSON.parse(localStorage.getItem('collectedShibou') || '[]');
            const localPlayCount = parseInt(localStorage.getItem('playCount') || '0', 10);
            
            // 自己ベスト情報を取得
            const localPersonalBest_normal = parseInt(localStorage.getItem('personalBest_normal') || '0', 10);
            const localPersonalBest_rankMatch = {};
            // ランクマッチの自己ベストをすべて取得
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith('personalBest_rankMatch_')) {
                    const dateString = key.replace('personalBest_rankMatch_', '');
                    localPersonalBest_rankMatch[dateString] = parseInt(localStorage.getItem(key) || '0', 10);
                }
            }
            
            // マージ（ローカルの方が新しい場合は上書き）
            trophyData.unlockedTrophies = [...new Set([...trophyData.unlockedTrophies, ...localUnlockedTrophies])];
            trophyData.collectedShibou = [...new Set([...trophyData.collectedShibou, ...localCollectedShibou])];
            trophyData.playCount = Math.max(trophyData.playCount || 0, localPlayCount);
            
            // 自己ベストをマージ（大きい方を採用）
            trophyData.personalBest_normal = Math.max(trophyData.personalBest_normal || 0, localPersonalBest_normal);
            if (!trophyData.personalBest_rankMatch) {
                trophyData.personalBest_rankMatch = {};
            }
            Object.keys(localPersonalBest_rankMatch).forEach(dateString => {
                const localBest = localPersonalBest_rankMatch[dateString];
                const serverBest = trophyData.personalBest_rankMatch[dateString] || 0;
                trophyData.personalBest_rankMatch[dateString] = Math.max(localBest, serverBest);
            });
            
            // rankCountsは既にAPIに保存されているので、そのまま使用
            
            // APIに更新
            await apiClient.updateTrophies(authToken, trophyData);
            
            // ローカルストレージも更新
            localStorage.setItem('unlockedTrophies', JSON.stringify(trophyData.unlockedTrophies));
            localStorage.setItem('collectedShibou', JSON.stringify(trophyData.collectedShibou));
            localStorage.setItem('playCount', trophyData.playCount.toString());
            
            // 自己ベストもローカルストレージに保存
            localStorage.setItem('personalBest_normal', trophyData.personalBest_normal.toString());
            Object.keys(trophyData.personalBest_rankMatch).forEach(dateString => {
                const key = `personalBest_rankMatch_${dateString}`;
                localStorage.setItem(key, trophyData.personalBest_rankMatch[dateString].toString());
            });
            
            console.log('Trophy data synced to API');
        } catch (error) {
            console.error('Error syncing trophy data to API:', error);
            throw error;
        }
    }
    
    /**
     * 複数のトロフィーをバッチ処理でAPIに保存（パフォーマンス改善）
     */
    async saveTrophiesBatch(trophyIds) {
        try {
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                // トークンがない場合はローカルストレージに保存
                const existing = localStorage.getItem('unlockedTrophies');
                const unlockedList = existing ? JSON.parse(existing) : [];
                trophyIds.forEach(trophyId => {
                    if (!unlockedList.includes(trophyId)) {
                        unlockedList.push(trophyId);
                    }
                });
                localStorage.setItem('unlockedTrophies', JSON.stringify(unlockedList));
                return;
            }
            
            // 現在のトロフィーデータを取得（1回だけ）
            const response = await apiClient.getTrophies(authToken);
            const trophyData = response.data || {
                unlockedTrophies: [],
                collectedShibou: [],
                playCount: 0,
                rankCounts: {}
            };
            
            // 新しいトロフィーを追加
            let hasNewTrophies = false;
            trophyIds.forEach(trophyId => {
                if (!trophyData.unlockedTrophies.includes(trophyId)) {
                    trophyData.unlockedTrophies.push(trophyId);
                    hasNewTrophies = true;
                }
            });
            
            // 新しいトロフィーがある場合のみAPIに更新
            if (hasNewTrophies) {
                await apiClient.updateTrophies(authToken, trophyData);
                
                // ローカルストレージにも保存
                localStorage.setItem('unlockedTrophies', JSON.stringify(trophyData.unlockedTrophies));
            }
        } catch (error) {
            console.error('Error saving trophies batch to API:', error);
            throw error;
        }
    }
    
    /**
     * 単一のトロフィーをAPIに保存（後方互換性のため残す）
     * バッチ処理を使用してパフォーマンスを改善
     */
    async saveTrophyToAPI(trophyId) {
        return await this.saveTrophiesBatch([trophyId]);
    }
    
    /**
     * トロフィーデータを更新（部分更新）
     */
    async updateTrophyData(updates) {
        try {
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                // トークンがない場合はローカルストレージのみ更新
                if (updates.playCount !== undefined) {
                    localStorage.setItem('playCount', updates.playCount.toString());
                }
                if (updates.collectedShibou !== undefined) {
                    localStorage.setItem('collectedShibou', JSON.stringify(updates.collectedShibou));
                }
                return;
            }
            
            // 現在のトロフィーデータを取得
            const response = await apiClient.getTrophies(authToken);
            const trophyData = response.data || {
                unlockedTrophies: [],
                collectedShibou: [],
                playCount: 0,
                rankCounts: {}
            };
            
            // 更新をマージ
            if (updates.playCount !== undefined) {
                trophyData.playCount = updates.playCount;
            }
            if (updates.collectedShibou !== undefined) {
                trophyData.collectedShibou = updates.collectedShibou;
            }
            
            // APIに更新
            await apiClient.updateTrophies(authToken, trophyData);
            
            // ローカルストレージにも保存
            if (updates.playCount !== undefined) {
                localStorage.setItem('playCount', trophyData.playCount.toString());
            }
            if (updates.collectedShibou !== undefined) {
                localStorage.setItem('collectedShibou', JSON.stringify(trophyData.collectedShibou));
            }
        } catch (error) {
            console.error('Error updating trophy data:', error);
            throw error;
        }
    }
    
    /**
     * rankCountsを更新
     */
    async updateTrophyRankCounts(newRankCounts) {
        try {
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            
            if (!authToken) {
                return; // トークンがない場合はスキップ
            }
            
            // 現在のトロフィーデータを取得
            const response = await apiClient.getTrophies(authToken);
            const trophyData = response.data || {
                unlockedTrophies: [],
                collectedShibou: [],
                playCount: 0,
                rankCounts: { 1: 0, 2: 0, 3: 0 }
            };
            
            // rankCountsを更新（累積）
            trophyData.rankCounts = trophyData.rankCounts || { 1: 0, 2: 0, 3: 0 };
            if (newRankCounts[1]) trophyData.rankCounts[1] = (trophyData.rankCounts[1] || 0) + newRankCounts[1];
            if (newRankCounts[2]) trophyData.rankCounts[2] = (trophyData.rankCounts[2] || 0) + newRankCounts[2];
            if (newRankCounts[3]) trophyData.rankCounts[3] = (trophyData.rankCounts[3] || 0) + newRankCounts[3];
            
            // APIに更新
            await apiClient.updateTrophies(authToken, trophyData);
        } catch (error) {
            console.error('Error updating rankCounts:', error);
            throw error;
        }
    }
    
    /**
     * 距離をランキングに保存（API呼び出し）
     */
    async saveDistanceToRanking(distance, name = 'AAA') {
        try {
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            const normalizedName = name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5);
            
            // ランクマッチモードの場合は日付ベースでランキングを保存
            if (this.isRankMatch && this.rankMatchDate) {
                await apiClient.updateRanking('rankMatch', distance, normalizedName, this.rankMatchDate, authToken);
                console.log('Rank match distance saved to API:', distance, 'm', 'Name:', normalizedName, 'Date:', this.rankMatchDate);
                return;
            }
            
            // 通常モードの場合は通常のランキングに保存
            await apiClient.updateRanking('distance', distance, normalizedName, null, authToken);
            console.log('Distance saved to API:', distance, 'm', 'Name:', normalizedName);
        } catch (error) {
            console.error('Error saving distance to ranking API:', error);
            throw error; // エラーを呼び出し元に伝播
        }
    }

    /**
     * 距離をランキングに保存（ローカルストレージ、フォールバック用）
     */
    saveDistanceToRankingLocal(distance, name = 'AAA') {
        try {
            // ランクマッチモードの場合は日付ベースでランキングを保存
            if (this.isRankMatch && this.rankMatchDate) {
                const rankingKey = `rankMatchRanking_${this.rankMatchDate}`;
                const existingRanking = JSON.parse(localStorage.getItem(rankingKey) || '[]');
                
                const newRecord = {
                    distance: distance,
                    name: name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5),
                    date: new Date().toISOString()
                };
                
                existingRanking.push(newRecord);
                existingRanking.sort((a, b) => b.distance - a.distance);
                const top10 = existingRanking.slice(0, 10);
                
                localStorage.setItem(rankingKey, JSON.stringify(top10));
                console.log('Rank match distance saved to local:', distance, 'm', 'Name:', newRecord.name, 'Date:', this.rankMatchDate);
                return;
            }
            
            // 通常モードの場合は通常のランキングに保存
            const rankingKey = 'distanceRanking';
            const existingRanking = JSON.parse(localStorage.getItem(rankingKey) || '[]');
            
            const newRecord = {
                distance: distance,
                name: name.toUpperCase().replace(/[^A-Z0-9]/g, '').substring(0, 5),
                date: new Date().toISOString()
            };
            
            existingRanking.push(newRecord);
            existingRanking.sort((a, b) => b.distance - a.distance);
            const top10 = existingRanking.slice(0, 10);
            
            localStorage.setItem(rankingKey, JSON.stringify(top10));
            console.log('Distance saved to local:', distance, 'm', 'Name:', newRecord.name);
        } catch (error) {
            console.error('Error saving distance to ranking local:', error);
        }
    }
    
    async checkAndUnlockTrophies(finalDistance, finalSpeedKmh) {
        console.log('Checking trophies...');
        console.log('Distance:', finalDistance, 'm');
        console.log('Landing Speed:', finalSpeedKmh, 'km/h');
        console.log('Game Stats:', this.gameStats);
        
        // 既にアンロックされているトロフィーを取得
        const existingUnlocked = JSON.parse(localStorage.getItem('unlockedTrophies') || '[]');
        
        // プレイ回数をインクリメント
        let playCount = parseInt(localStorage.getItem('playCount') || '0', 10);
        playCount++;
        localStorage.setItem('playCount', playCount.toString());
        console.log('Play count:', playCount);
        
        // パーソナルベストを取得（飛距離トロフィーのチェックに使用）
        const currentPersonalBest = this.getPersonalBest();
        const personalBest = Math.max(currentPersonalBest, finalDistance);
        if (finalDistance > currentPersonalBest) {
            this.setPersonalBest(finalDistance);
            // API経由で自己ベストを保存
            this.savePersonalBestToAPI(finalDistance).catch(error => {
                console.error('Error saving personal best to API:', error);
            });
        }
        
        // トロフィーデータを生成（TrophySceneと同じロジック）
        const trophies = this.getNewTrophyList();
        
        // アンロックされたトロフィーのIDを収集
        const unlockedTrophyIds = [];
        
        // 各トロフィーをチェック
        trophies.forEach(trophy => {
            // 既にアンロックされているトロフィーはスキップ
            if (existingUnlocked.includes(trophy.id)) {
                return;
            }
            
            let unlocked = false;
            
            const stats = this.gameStats;
            const parts = stats.partsCounts;
            
            if (trophy.condition === 'playCount' && playCount >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'distance' && personalBest >= trophy.threshold) {
                // 飛距離トロフィーはpersonalBestと比較
                unlocked = true;
            } else if (trophy.condition === 'negativeDistance' && personalBest <= trophy.threshold) {
                // マイナス飛距離トロフィーもpersonalBestと比較
                unlocked = true;
            } else if (trophy.condition === 'shibou') {
                // shibou.jsonのメッセージ回収トロフィー（GameSceneではチェックしない）
                unlocked = false;
            } else if (trophy.condition === 'rankMatch') {
                // ランクマッチトロフィー（submitName内でチェック）
                unlocked = false;
            } else if (trophy.condition === 'speed' && this.gameStats.maxSpeed >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'partsLimit' && 
                       parts.total <= trophy.maxParts && 
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'stableRotation' &&
                       stats.maxRotation <= trophy.maxRotation &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'engineLimit' &&
                       parts.engine <= trophy.maxEngines &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'withoutPart') {
                const hasNone = trophy.forbiddenPart === 'nose' ? parts.nose === 0 :
                               trophy.forbiddenPart === 'wing' ? parts.wing === 0 :
                               trophy.forbiddenPart === 'fuelTank' ? parts.fuelTank === 0 : false;
                if (hasNone && finalDistance >= trophy.threshold) {
                    unlocked = true;
                }
            } else if (trophy.condition === 'softLanding' &&
                       finalSpeedKmh <= trophy.maxLandingSpeed &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'fastLanding' &&
                       finalSpeedKmh >= trophy.minLandingSpeed &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'weightLimit' &&
                       stats.totalMass <= trophy.maxWeight &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'altitude' &&
                       stats.maxAltitude >= trophy.minAltitude &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'fuelTankCount' &&
                       parts.fuelTank === trophy.requiredTanks &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'bodyLimit' &&
                       parts.body <= trophy.maxBody &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'master' &&
                       parts.total <= trophy.maxParts &&
                       this.gameStats.maxSpeed >= trophy.minSpeed &&
                       finalDistance >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'rankMatchMedal' || trophy.condition === 'rankMatchGoldMedal') {
                // ランクマッチでのメダル獲得チェックはsubmitName内で実行されるため、ここではスキップ
                unlocked = false;
            }
            
            if (unlocked) {
                unlockedTrophyIds.push(trophy.id);
                console.log('Trophy unlocked:', trophy.id);
            }
        });
        
        // アンロックされたトロフィーがある場合、バッチ処理でAPIに保存
        if (unlockedTrophyIds.length > 0) {
            try {
                await this.saveTrophiesBatch(unlockedTrophyIds);
            } catch (error) {
                console.error('Error saving trophies to API:', error);
                // エラー時はローカルストレージに保存
                const existing = localStorage.getItem('unlockedTrophies');
                const unlockedList = existing ? JSON.parse(existing) : [];
                unlockedTrophyIds.forEach(trophyId => {
                    if (!unlockedList.includes(trophyId)) {
                        unlockedList.push(trophyId);
                    }
                });
                localStorage.setItem('unlockedTrophies', JSON.stringify(unlockedList));
            }
        }
        
        // プレイ回数をAPIに保存（非同期で実行、エラーは無視）
        this.updateTrophyData({ playCount }).catch(error => {
            console.error('Error updating play count:', error);
        });
    }
    
    /**
     * 新しいトロフィーリストを取得（TrophySceneと同じロジック）
     */
    getNewTrophyList() {
        const trophies = [];
        
        // 飛距離トロフィー（56個）
        // 1000m刻みで50000mまで（50個）
        for (let i = 1; i <= 50; i++) {
            const distance = i * 1000;
            trophies.push({
                id: `trophy_distance_${distance}`,
                condition: 'distance',
                threshold: distance
            });
        }
        
        // 10000m刻みで100000mまで（6個：60000, 70000, 80000, 90000, 100000）
        for (let i = 6; i <= 10; i++) {
            const distance = i * 10000;
            trophies.push({
                id: `trophy_distance_${distance}`,
                condition: 'distance',
                threshold: distance
            });
        }
        
        // shibou.jsonのメッセージ回収トロフィー（30個）
        for (let i = 1; i <= 30; i++) {
            trophies.push({
                id: `trophy_shibou_${i}`,
                condition: 'shibou',
                shibouNum: i
            });
        }
        
        // プレイ回数トロフィー（10個：10回刻みで100回まで）
        for (let i = 1; i <= 10; i++) {
            const count = i * 10;
            trophies.push({
                id: `trophy_playcount_${count}`,
                condition: 'playCount',
                threshold: count
            });
        }
        
        // ランク上位達成トロフィー（3個：1位、2位、3位各1回）
        trophies.push({
            id: 'trophy_rank_1_1',
            condition: 'rankMatch',
            rank: 1,
            threshold: 1
        });
        trophies.push({
            id: 'trophy_rank_2_1',
            condition: 'rankMatch',
            rank: 2,
            threshold: 1
        });
        trophies.push({
            id: 'trophy_rank_3_1',
            condition: 'rankMatch',
            rank: 3,
            threshold: 1
        });
        
        // マイナス飛距離トロフィー（32個）
        // -1000m刻みで-30000mまで（30個）
        for (let i = 1; i <= 30; i++) {
            const distance = -i * 1000;
            trophies.push({
                id: `trophy_negative_distance_${Math.abs(distance)}`,
                condition: 'negativeDistance',
                threshold: distance
            });
        }
        
        // -10000m刻みで-50000mまで（2個：-40000, -50000）
        for (let i = 4; i <= 5; i++) {
            const distance = -i * 10000;
            trophies.push({
                id: `trophy_negative_distance_${Math.abs(distance)}`,
                condition: 'negativeDistance',
                threshold: distance
            });
        }
        
        return trophies;
    }
    
    /**
     * トロフィーチェック用のトロフィーデータを生成（旧実装、互換性のため残す）
     */
    generateTrophiesForCheck() {
        const trophies = [];
        const centerRow = 5;
        const centerCol = 5;
        
        for (let row = 0; row < 11; row++) {
            for (let col = 0; col < 11; col++) {
                const index = row * 11 + col;
                
                // 中心のマス
                if (row === centerRow && col === centerCol) {
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'playCount',
                        threshold: 1
                    });
                } else if (row === 0) {
                    // プレイ回数系
                    const playCount = (col + 1) * 5;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'playCount',
                        threshold: playCount
                    });
                } else if (row === 1) {
                    // 回転なし系
                    const distance = (col + 1) * 500;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'stableRotation',
                        threshold: distance,
                        maxRotation: 0.5
                    });
                } else if (row === 2) {
                    // エンジン数制限
                    const engineCount = Math.max(1, 6 - Math.floor(col / 2));
                    const distance = (col + 1) * 400;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'engineLimit',
                        threshold: distance,
                        maxEngines: engineCount
                    });
                } else if (row === 3) {
                    // 特定パーツなし系
                    const distance = (col + 1) * 300;
                    const partKey = col % 3 === 0 ? 'nose' : col % 3 === 1 ? 'wing' : 'fuelTank';
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'withoutPart',
                        threshold: distance,
                        forbiddenPart: partKey
                    });
                } else if (row === 4) {
                    if (col < 5) {
                        // ソフトランディング
                        const maxSpeed = 50 - col * 5;
                        const distance = (col + 1) * 200;
                        trophies.push({
                            id: `trophy_${index}`,
                            condition: 'softLanding',
                            threshold: distance,
                            maxLandingSpeed: maxSpeed
                        });
                    } else {
                        // 高速着地
                        const minSpeed = 100 + (col - 5) * 20;
                        const distance = (col - 4) * 300;
                        trophies.push({
                            id: `trophy_${index}`,
                            condition: 'fastLanding',
                            threshold: distance,
                            minLandingSpeed: minSpeed
                        });
                    }
                } else if (row === 6) {
                    // 低重量チャレンジ
                    const maxWeight = 50 - col * 3;
                    const distance = (col + 1) * 250;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'weightLimit',
                        threshold: distance,
                        maxWeight: maxWeight
                    });
                } else if (row === 7) {
                    // 高高度到達
                    const altitude = (col + 1) * 100;
                    const distance = (col + 1) * 200;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'altitude',
                        threshold: distance,
                        minAltitude: altitude
                    });
                } else if (row === 8) {
                    // 燃料タンク指定
                    const tankCount = Math.max(0, col % 5);
                    const distance = (col + 1) * 300;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'fuelTankCount',
                        threshold: distance,
                        requiredTanks: tankCount
                    });
                } else if (row === 9) {
                    // ボディパーツ数指定
                    const bodyCount = Math.max(1, 10 - col);
                    const distance = (col + 1) * 200;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'bodyLimit',
                        threshold: distance,
                        maxBody: bodyCount
                    });
                } else if (row === 10) {
                    // 総合チャレンジ
                    const distance = (col + 1) * 500;
                    const maxParts = 20 - Math.floor(col / 2);
                    const maxSpeed = 200 + col * 20;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'master',
                        threshold: distance,
                        maxParts: maxParts,
                        minSpeed: maxSpeed
                    });
                } else {
                    // デフォルト（距離）
                    const distance = (row + 1) * 500 + col * 100;
                    trophies.push({
                        id: `trophy_${index}`,
                        condition: 'distance',
                        threshold: distance
                    });
                }
            }
        }
        
        return trophies;
    }
    
    /**
     * BGMを再生
     */
    playBGM() {
        // メニューBGM（BGM.mp3）を停止（GameSceneでは別のBGMを使用）
        const menuBGM = this.sound.get('bgm');
        if (menuBGM && menuBGM.isPlaying) {
            menuBGM.stop();
            console.log('Menu BGM (BGM.mp3) stopped for game scene');
        }
        
        // 念のため、すべてのサウンドをチェックしてメニューBGMを停止
        try {
            const allSounds = this.sound.sounds;
            if (allSounds) {
                allSounds.forEach(sound => {
                    if (sound.key === 'bgm' && sound.isPlaying) {
                        sound.stop();
                        console.log('Menu BGM stopped (from sounds array)');
                    }
                });
            }
        } catch (e) {
            console.warn('Error stopping Menu BGM from sounds array:', e);
        }
        
        // 既に同じゲームBGMが再生中かチェック
        const existingSound = this.sound.get('gameBGM');
        if (existingSound && existingSound.isPlaying) {
            // 既に再生中ならそのまま続ける
            this.bgm = existingSound;
            console.log('Game BGM already playing, continuing...');
            return;
        }
        
        // 既に存在するが停止している場合は再利用
        if (existingSound) {
            this.bgm = existingSound;
            this.bgm.setVolume(0.05);
            this.bgm.play();
            console.log('Game BGM resumed');
            return;
        }
        
        // 新しいBGMを再生（音量5%）
        if (this.cache.audio.exists('gameBGM')) {
            this.bgm = this.sound.add('gameBGM', {
                volume: 0.05, // 音量5%
                loop: true // ループ再生
            });
            this.bgm.play();
            console.log('Game BGM (maou_bgm_neorock68.ogg) started playing');
        } else {
            console.warn('Game BGM not loaded yet');
        }
    }
    
    /**
     * ボタンクリック時の効果音を再生
     */
    playButtonSound() {
        if (this.cache.audio.exists('deci')) {
            this.sound.play('deci', {
                volume: 0.5 // 音量50%
            });
            console.log('Button sound played');
        } else {
            console.warn('Button sound not loaded yet');
        }
    }
    
    /**
     * 着陸時の効果音を再生
     */
    playLandingSound() {
        if (this.cache.audio.exists('end')) {
            this.sound.play('end', {
                volume: 0.2 // 音量20%
            });
            console.log('Landing sound (end) played');
        } else {
            console.warn('Landing sound not loaded yet');
        }
    }
    
    /**
     * BGMを停止
     */
    stopBGM() {
        // this.bgmが設定されている場合は停止
        if (this.bgm) {
            if (this.bgm.isPlaying) {
                this.bgm.stop();
                console.log('Game BGM stopped (from this.bgm)');
            }
        }
        
        // 念のため、sound.get('gameBGM')でもチェックして停止
        const gameBGMSound = this.sound.get('gameBGM');
        if (gameBGMSound) {
            if (gameBGMSound.isPlaying) {
                gameBGMSound.stop();
                console.log('Game BGM stopped (from sound.get)');
            }
        }
        
        // すべての'gameBGM'キーのサウンドを停止（Phaser 3の仕様に対応）
        try {
            const allSounds = this.sound.sounds;
            if (allSounds) {
                allSounds.forEach(sound => {
                    if (sound.key === 'gameBGM' && sound.isPlaying) {
                        sound.stop();
                        console.log('Game BGM stopped (from sounds array)');
                    }
                });
            }
        } catch (e) {
            console.warn('Error stopping Game BGM from sounds array:', e);
        }
    }
    
    /**
     * すべての音声を停止
     */
    stopAllSounds() {
        // BGMを停止
        this.stopBGM();
        
        // uo.wavの再生を停止
        if (this.uoSound && this.uoSound.isPlaying) {
            this.uoSound.stop();
            this.uoSound = null;
        }
        
        // oe.wavの再生を停止
        if (this.oeSound && this.oeSound.isPlaying) {
            this.oeSound.stop();
            this.oeSound = null;
        }
        
        // すべての再生中のサウンドを停止
        try {
            const allSounds = this.sound.sounds;
            if (allSounds) {
                allSounds.forEach(sound => {
                    if (sound.isPlaying) {
                        sound.stop();
                        console.log(`Stopped sound: ${sound.key}`);
                    }
                });
            }
        } catch (e) {
            console.warn('Error stopping all sounds:', e);
        }
        
        console.log('All sounds stopped');
    }
    
    /**
     * シーンが停止する時のクリーンアップ
     */
    shutdown() {
        console.log('GameScene: shutdown() called - cleaning up');
        
        // justmeet動画をクリーンアップ
        this.removeJustmeetVideo();
        
        // 名前入力UIをクリーンアップ（確実に削除）
        this.removeNameInputUI();
        
        // 念のため、少し遅延させて再度削除を試みる（非同期で実行）
        if (typeof setTimeout !== 'undefined') {
            setTimeout(() => {
                this.removeNameInputUI();
            }, 100);
        }
        
        // BGMを停止
        this.stopBGM();
        this.bgm = null;
        
        // oe.wavの再生を停止
        if (this.oeSound && this.oeSound.isPlaying) {
            this.oeSound.stop();
            this.oeSound = null;
        }
        
        // ロケットを破棄
        if (this.rocket && this.rocket.sprite && this.rocket.sprite.active) {
            this.rocket.sprite.destroy();
        }
        this.rocket = null;
        
        // グラフィックスをクリア
        if (this.trajectoryGraphics) {
            this.trajectoryGraphics.clear();
            this.trajectoryGraphics.destroy();
            this.trajectoryGraphics = null;
        }
        
        // ロケットのテクスチャをクリーンアップ
        if (this.textures.exists('rocketSpriteFromParts')) {
            this.textures.remove('rocketSpriteFromParts');
            console.log('Removed custom rocket texture');
        }
        if (this.textures.exists('rocketSprite')) {
            this.textures.remove('rocketSprite');
            console.log('Removed default rocket texture');
        }
        
        // 参照をクリア
        this.launchPoint = null;
        this.rocketDesign = null;
        this.statusText = null;
        
        console.log('GameScene: Cleanup complete');
    }
}

