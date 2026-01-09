import { Rocket } from '../domain/Rocket.js';
import { LaunchPoint } from '../domain/LaunchPoint.js';
import { TrajectoryCalculator } from '../domain/TrajectoryCalculator.js';
import { GameConfig } from '../config/gameConfig.js';
import { RocketDesign } from '../entities/RocketDesign.js';

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
            
            // プロパティを初期化
            this.statusText = null;
            this.rocket = null;
            this.launchPoint = null;
            this.trajectoryGraphics = null;
            this.separationCharge = 0;
            this.isCharging = false;
            this.separationGauge = null;
            this.separationGaugeBg = null;
            this.separationText = null;
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
            
            // フェードイン効果
            this.cameras.main.fadeIn(500, 0, 0, 0);
            
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
            } else if (this.rocket && this.rocket.isLaunched && !this.rocket.isCockpitSeparated) {
                // ロケット発射後はチャージ開始
                this.isCharging = true;
                this.separationCharge = 0;
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
        const instructions = this.add.text(
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
        instructions.setOrigin(0.5, 0); // 中央揃え
        instructions.setDepth(100);
        instructions.setScrollFactor(0); // UIを固定
        
        // ゲーム状態表示（画面右上）
        const statusText = this.add.text(
            this.cameras.main.width + 700,
            -500,
            '準備完了',
            {
                fontSize: '60px',
                fill: '#00ff00',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 15, y: 8 },
                fontStyle: 'bold'
            }
        );
        statusText.setOrigin(1, 0); // 右揃え
        statusText.setDepth(100);
        statusText.setScrollFactor(0);
        
        // 状態テキストをクラス変数として保存
        this.statusText = statusText;
        
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
        
        // ゲージ背景
        this.separationGaugeBg = this.add.rectangle(
            uiX,
            uiY,
            400,
            60,
            0x333333
        );
        this.separationGaugeBg.setStrokeStyle(5, 0xffffff);
        this.separationGaugeBg.setDepth(100);
        this.separationGaugeBg.setScrollFactor(0);
        this.separationGaugeBg.setVisible(false);
        
        // ゲージ本体
        this.separationGauge = this.add.rectangle(
            uiX - 200,
            uiY,
            0,
            52,
            0xff6b6b
        );
        this.separationGauge.setOrigin(0, 0.5);
        this.separationGauge.setDepth(101);
        this.separationGauge.setScrollFactor(0);
        this.separationGauge.setVisible(false);
    }
    
    /**
     * コックピット分離ゲージを更新
     */
    updateSeparationGauge() {
        if (this.isCharging && this.rocket && this.rocket.isLaunched && !this.rocket.isCockpitSeparated) {
            // ゲージを増加（1フレームあたり3%）
            this.separationCharge = Math.min(100, this.separationCharge + 3);
            
            // ゲージUIを更新（400ピクセル幅に変更）
            this.separationGauge.width = (this.separationCharge / 100) * 400;
            
            // ゲージが満タンになったら色を変える
            if (this.separationCharge >= 100) {
                this.separationGauge.setFillStyle(0x00ff00); // 緑色
            } else {
                this.separationGauge.setFillStyle(0xff6b6b); // 赤色
            }
        }
    }
    
    /**
     * コックピット分離処理
     */
    separateCockpit() {
        if (!this.rocket || !this.rocket.isLaunched || this.rocket.isCockpitSeparated) {
            return;
        }
        
        // ゲージが一定以上溜まっている場合のみ分離
        if (this.separationCharge >= 30) {
            console.log('Separating cockpit with charge:', this.separationCharge);
            
            // ロケットのコックピットを分離
            this.rocket.separateCockpit(this.separationCharge);
            
            // ゲージをリセット
            this.separationCharge = 0;
            this.separationGauge.width = 0;
            
            // UIを非表示
            this.separationText.setVisible(false);
            this.separationGaugeBg.setVisible(false);
            this.separationGauge.setVisible(false);
            
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
        const backButton = this.add.text(
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
            console.log('Returning to title...');
            
            // ボタンクリック時の効果音を再生
            this.playButtonSound();
            
            // すべての音声を停止
            this.stopAllSounds();
            
            this.cameras.main.fadeOut(500, 0, 0, 0);
            this.cameras.main.once('camerafadeoutcomplete', () => {
                this.scene.start('TitleScene');
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
        
        // 射出地点のY座標を基準（0m）として、コックピットがそれ以下になったら終了
        const cockpitY = cockpitSprite.y;
        const groundY = this.launchPoint.y; // 射出地点を0mとする
        
        if (cockpitY >= groundY) {
            this.gameOver();
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
        
        // 物理演算を停止
        this.matter.world.pause();
        
        // カメラの位置に関係なく、画面中央に表示
        const screenCenterX = this.cameras.main.width / 2;
        const screenCenterY = this.cameras.main.height / 2;
        
        // リザルト表示（飛距離を中心に大きく表示）
        
        const cockpitSprite = this.rocket.separatedCockpitSprites[0];
        if (cockpitSprite && cockpitSprite.body) {
            const velocityX = cockpitSprite.body.velocity.x;
            const velocityY = cockpitSprite.body.velocity.y;
            const finalSpeed = Math.sqrt(velocityX * velocityX + velocityY * velocityY);
            const finalSpeedKmh = Math.round(finalSpeed * 3.6);
            
            // 最終飛距離を計算
            const finalDistance = Math.round(cockpitSprite.x - this.launchPoint.x);
            
            // トロフィーをチェック
            this.checkAndUnlockTrophies(finalDistance, finalSpeedKmh);
            
            // 「着陸成功！」テキスト
            const gameOverText = this.add.text(
                screenCenterX,
                screenCenterY - 180,
                '着陸成功！',
                {
                    fontSize: '72px',
                    fill: '#ffff00',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 8
                }
            );
            gameOverText.setOrigin(0.5);
            gameOverText.setScrollFactor(0);
            gameOverText.setDepth(300);
            
            // 飛距離を大きく表示（メインリザルト）
            const distanceResultText = this.add.text(
                screenCenterX,
                screenCenterY - 50,
                `${finalDistance} m`,
                {
                    fontSize: '120px',
                    fill: '#00ff00',
                    fontStyle: 'bold',
                    stroke: '#000000',
                    strokeThickness: 10
                }
            );
            distanceResultText.setOrigin(0.5);
            distanceResultText.setScrollFactor(0);
            distanceResultText.setDepth(300);
            
            // // 「飛距離」ラベル
            // const distanceLabel = this.add.text(
            //     screenCenterX,
            //     screenCenterY - 120,
            //     '飛距離',
            //     {
            //         fontSize: '48px',
            //         fill: '#ffffff',
            //         fontStyle: 'bold',
            //         backgroundColor: 'rgba(0, 0, 0, 0.7)',
            //         padding: { x: 20, y: 10 }
            //     }
            // );
            // distanceLabel.setOrigin(0.5);
            // distanceLabel.setScrollFactor(0);
            // distanceLabel.setDepth(300);
            
            // 着地速度（サブ情報）
            const speedText = this.add.text(
                screenCenterX,
                screenCenterY + 80,
                `着地速度: ${finalSpeedKmh} km/h`,
                {
                    fontSize: '36px',
                    fill: '#ffffff',
                    fontStyle: 'bold',
                    backgroundColor: 'rgba(0, 0, 0, 0.7)',
                    padding: { x: 20, y: 10 }
                }
            );
            speedText.setOrigin(0.5);
            speedText.setScrollFactor(0);
            speedText.setDepth(300);
        }
        
        // キーボード操作の案内は削除
        
        // 状態テキストを更新
        if (this.statusText) {
            this.statusText.setText('ゲーム終了');
            this.statusText.setStyle({ fill: '#ff0000' });
        }
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
            
            // コックピット分離UIの表示/非表示
            const hasCockpit = this.rocket.hasCockpit();
            if (hasCockpit && !this.rocket.isCockpitSeparated) {
                this.separationText.setVisible(true);
                this.separationGaugeBg.setVisible(true);
                this.separationGauge.setVisible(true);
            } else {
                this.separationText.setVisible(false);
                this.separationGaugeBg.setVisible(false);
                this.separationGauge.setVisible(false);
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
    checkAndUnlockTrophies(finalDistance, finalSpeedKmh) {
        console.log('Checking trophies...');
        console.log('Distance:', finalDistance, 'm');
        console.log('Landing Speed:', finalSpeedKmh, 'km/h');
        console.log('Game Stats:', this.gameStats);
        
        // プレイ回数をインクリメント
        let playCount = parseInt(localStorage.getItem('playCount') || '0', 10);
        playCount++;
        localStorage.setItem('playCount', playCount.toString());
        console.log('Play count:', playCount);
        
        // トロフィーデータを生成（TrophySceneと同じロジック）
        const trophies = this.generateTrophiesForCheck();
        
        // 各トロフィーをチェック
        trophies.forEach(trophy => {
            let unlocked = false;
            
            const stats = this.gameStats;
            const parts = stats.partsCounts;
            
            if (trophy.condition === 'playCount' && playCount >= trophy.threshold) {
                unlocked = true;
            } else if (trophy.condition === 'distance' && finalDistance >= trophy.threshold) {
                unlocked = true;
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
            }
            
            if (unlocked) {
                // トロフィーをローカルストレージに保存
                const existing = localStorage.getItem('unlockedTrophies');
                const unlockedList = existing ? JSON.parse(existing) : [];
                if (!unlockedList.includes(trophy.id)) {
                    unlockedList.push(trophy.id);
                    localStorage.setItem('unlockedTrophies', JSON.stringify(unlockedList));
                }
                console.log('Trophy unlocked:', trophy.id);
            }
        });
    }
    
    /**
     * トロフィーチェック用のトロフィーデータを生成
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

