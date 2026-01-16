/**
 * タイトルシーン
 */
export class TitleScene extends Phaser.Scene {
    constructor() {
        super({ key: 'TitleScene' });
    }
    
    preload() {
        // BGMを読み込む
        if (!this.cache.audio.exists('bgm')) {
            this.load.audio('bgm', 'resources/BGM.mp3');
        }
        
        // ボタンクリック時の効果音を読み込む
        if (!this.cache.audio.exists('deci')) {
            this.load.audio('deci', 'resources/deci.mp3');
        }
        
        // タイトルシーン表示時の効果音を読み込む
        if (!this.cache.audio.exists('cv001')) {
            this.load.audio('cv001', 'resources/cv001.wav');
        }
        
        // スタンプ画像をグリッドスプライトシートとして読み込む
        // STAMP_flower_01_sheet.png: 5列×3行（15フレーム）
        if (!this.textures.exists('stampFlowerGrid')) {
            this.load.spritesheet('stampFlowerGrid', 'resources/STAMP_flower_01_sheet.png', {
                frameWidth: 875 / 5,  // 1フレームの幅（画像サイズに合わせて調整）
                frameHeight: 477 / 3 // 1フレームの高さ（画像サイズに合わせて調整）
            });
        }
        
        // STAMP_kira_04_sheet.png: グリッドサイズは画像に依存
        if (!this.textures.exists('stampKiraGrid')) {
            this.load.spritesheet('stampKiraGrid', 'resources/STAMP_kira_04_sheet.png', {
                frameWidth: 2250 / 5,  // 1フレームの幅（画像サイズに合わせて調整）
                frameHeight: 1800 / 4  // 1フレームの高さ（画像サイズに合わせて調整）
            });
        }
        
        // syuutyuu.png: 5列×4行（20フレーム、17フレーム使用）
        if (!this.textures.exists('syuutyuuGrid')) {
            this.load.spritesheet('syuutyuuGrid', 'resources/syuutyuu.png', {
                frameWidth: 6935 / 5,   // 1フレームの幅（画像サイズに合わせて調整：画像幅÷5）
                frameHeight: 3120 / 4  // 1フレームの高さ（画像サイズに合わせて調整：画像高さ÷4）
            });
        }
    }
    
    /**
     * MOVファイルを再生するためのビデオ要素を作成
     * @param {string} videoPath - ビデオファイルのパス
     * @param {number} x - X座標（Phaser座標系）
     * @param {number} y - Y座標（Phaser座標系）
     * @param {number} width - 幅
     * @param {number} height - 高さ
     * @param {object} options - オプション（autoplay, loop, muted, volume等）
     * @returns {HTMLVideoElement} ビデオ要素
     */
    createVideoElement(videoPath, x, y, width, height, options = {}) {
        const {
            autoplay = true,
            loop = true,
            muted = false,
            volume = 1.0,
            controls = false,
            playsInline = true,
            zIndex = 1 // デフォルトのz-index（低めに設定）
        } = options;
        
        // ビデオ要素を作成
        const video = document.createElement('video');
        video.src = videoPath;
        video.autoplay = autoplay;
        video.loop = loop;
        video.muted = muted;
        video.volume = volume;
        video.controls = controls;
        video.playsInline = playsInline;
        video.style.position = 'absolute';
        video.style.pointerEvents = 'none'; // Phaserのイベントを妨げないように
        video.style.zIndex = zIndex.toString();
        // 位置計算が完了するまで非表示にする
        video.style.opacity = '0';
        video.style.visibility = 'hidden';
        // フェードインのトランジション効果を設定
        video.style.transition = 'opacity 0.5s ease-in';
        
        // 動画要素の位置とサイズを更新する関数
        const updateVideoPosition = () => {
            const gameContainer = document.getElementById('game-container');
            if (!gameContainer) return;
            
            const game = this.game;
            
            if (game && game.scale && game.canvas) {
                // Phaserのスケール情報を取得
                const scaleX = game.scale.displaySize.width / game.scale.gameSize.width;
                const scaleY = game.scale.displaySize.height / game.scale.gameSize.height;
                
                // キャンバスの位置を基準に計算（game-container内での相対位置）
                const canvasRect = game.canvas.getBoundingClientRect();
                const containerRect = gameContainer.getBoundingClientRect();
                
                // game-container内でのキャンバスの相対位置
                const canvasOffsetX = canvasRect.left - containerRect.left;
                const canvasOffsetY = canvasRect.top - containerRect.top;
                
                // Phaser座標系での位置を、game-container内の相対位置に変換
                // これにより、ブラウザサイズが変わってもゲーム画面内の同じ位置（Phaser座標系）に表示される
                video.style.left = (canvasOffsetX + x * scaleX) + 'px';
                video.style.top = (canvasOffsetY + y * scaleY) + 'px';
                video.style.width = (width * scaleX) + 'px';
                video.style.height = (height * scaleY) + 'px';
                
                // 位置計算が完了したら表示する（次のフレームでトランジション開始）
                requestAnimationFrame(() => {
                    video.style.visibility = 'visible';
                    requestAnimationFrame(() => {
                        video.style.opacity = '1';
                    });
                });
            } else {
                // Phaserのスケール情報が取得できない場合は従来の方法
                video.style.left = x + 'px';
                video.style.top = y + 'px';
                video.style.width = width + 'px';
                video.style.height = height + 'px';
                
                // 位置計算が完了したら表示する（次のフレームでトランジション開始）
                requestAnimationFrame(() => {
                    video.style.visibility = 'visible';
                    requestAnimationFrame(() => {
                        video.style.opacity = '1';
                    });
                });
            }
        };
        
        // 初回配置
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            gameContainer.appendChild(video);
            // 少し遅延させてPhaserのスケールが確定してから位置を計算
            setTimeout(updateVideoPosition, 100);
            // リサイズイベントに対応
            window.addEventListener('resize', updateVideoPosition);
            // リサイズリスナーを保存（クリーンアップ用）
            video._resizeHandler = updateVideoPosition;
        } else {
            // game-containerが見つからない場合はbodyに追加
            document.body.appendChild(video);
            video.style.left = x + 'px';
            video.style.top = y + 'px';
            video.style.width = width + 'px';
            video.style.height = height + 'px';
        }
        
        // エラーハンドリング
        video.addEventListener('error', (e) => {
            console.error('Video error:', e);
            console.error('Video path:', videoPath);
        });
        
        // 再生開始
        if (autoplay) {
            video.play().catch(err => {
                console.warn('Video autoplay failed:', err);
                // 自動再生が失敗した場合（ブラウザのポリシー）、ユーザー操作後に再生
                video.muted = true; // ミュートにすると自動再生できる場合がある
                video.play().catch(e => console.error('Video play failed:', e));
            });
        }
        
        // シーン終了時にクリーンアップ
        this.events.once('shutdown', () => {
            if (video.parentNode) {
                // リサイズリスナーを削除
                if (video._resizeHandler) {
                    window.removeEventListener('resize', video._resizeHandler);
                }
                video.pause();
                video.src = '';
                video.load();
                video.parentNode.removeChild(video);
            }
        });
        
        return video;
    }
    
    create() {
        console.log('TitleScene: create() called');
        
        // 既存の動画要素をクリーンアップ（タイトル画面に戻った時に再作成するため）
        if (this.videoElement && this.videoElement.parentNode) {
            this.videoElement.pause();
            this.videoElement.src = '';
            this.videoElement.load();
            this.videoElement.parentNode.removeChild(this.videoElement);
            this.videoElement = null;
        }
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const leftHalfWidth = screenWidth / 2;
        const rightHalfStartX = leftHalfWidth;
        const rightHalfCenterX = rightHalfStartX + leftHalfWidth / 2;
        const centerY = screenHeight / 2;
        
        // 背景グラデーション
        const graphics = this.add.graphics();
        graphics.fillGradientStyle(0x667eea, 0x667eea, 0x764ba2, 0x764ba2, 1);
        graphics.fillRect(0, 0, screenWidth, screenHeight);
        
        // 左半分にhorochi_mv-1.mp4を表示
        const videoWidth = leftHalfWidth;
        const videoHeight = screenHeight;
        this.videoElement = this.createVideoElement(
            'resources/horochi_mv-1.mp4',
            0,                    // X座標（左端）
            0,                    // Y座標（上端）
            videoWidth,           // 幅（画面の左半分）
            videoHeight,          // 高さ（画面全体）
            {
                autoplay: true,
                loop: true,
                muted: false,
                volume: 1.0,
                controls: false,
                playsInline: true,
                zIndex: 1         // 動画のz-indexを低く設定（アニメーションが上に表示されるように）
            }
        );
        
        // 画面左上に花のスタンプをグリッドアニメーション表示（動画よりも上のレイヤー）
        // STAMP_flower_01_sheet.png: 5列×3行（15フレーム）
        const flowerSprite = this.createGridAnimationSprite(
            'stampFlowerGrid',
            'flowerGridAnimate',
            screenWidth - 550,                                    // X座標（左端から少し右）
            screenHeight - 250,                                    // Y座標（上端から少し下）
            0,                                      // 原点X (0=左)
            0,                                      // 原点Y (0=上)
            5,                                      // グリッド列数（x）
            3,                                      // グリッド行数（y）
            12,                                     // フレームレート
            1,                                      // 拡大率
            -1,                                     // 無限ループ
            15                                      // 最大フレーム数
        );
        if (flowerSprite) {
            flowerSprite.setDepth(0); // 動画よりも上のレイヤー
        }
        
        // 画面右下にキラキラのスタンプをグリッドアニメーション表示
        // STAMP_kira_04_sheet.png: 5列×4行（20フレーム、16フレーム使用）
        const kiraSprite = this.createGridAnimationSprite(
            'stampKiraGrid',
            'kiraGridAnimate',
            screenWidth + 50,                            // X座標（右端）
            screenHeight,                           // Y座標（下端）
            1,                                      // 原点X (1=右)
            1,                                      // 原点Y (1=下)
            5,                                      // グリッド列数（x）
            4,                                      // グリッド行数（y）
            16,                                     // フレームレート
            0.6,                                      // 拡大率
            -1,                                     // 無限ループ
            16                                      // 最大フレーム数
        );
        if (kiraSprite) {
            kiraSprite.setDepth(100); // 動画よりも上のレイヤー
        }
        
        // 右半分にタイトルロゴ
        const title = this.add.text(
            rightHalfCenterX,
            centerY - 300,
            'ほろっちの冬休み',
            {
                fontSize: '64px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        title.setOrigin(0.5);
        
        // サブタイトル
        const subtitle = this.add.text(
            rightHalfCenterX,
            centerY - 230,
            'ver2.0\nナウいロケットを作って皆に自慢しよう！',
            {
                fontSize: '28px',
                fill: '#ffffff',
                fontStyle: 'italic'
            }
        );
        subtitle.setOrigin(0.5);

        
        // ランクマッチボタン
        const rankMatchButton = this.createButton(
            rightHalfCenterX,
            centerY - 80,
            '⚔️ ランクマッチ',
            () => {
                console.log('Transitioning to Rank Match Scene...');
                this.transitionToRankMatchScene();
            }
        );
        
        // スタートボタン
        const startButton = this.createButton(
            rightHalfCenterX,
            centerY,
            '🧭 限界スコアモード',
            () => {
                console.log('Starting Rocket Editor...');
                this.transitionToEditor();
            }
        );
        
        // ランキング表示ボタン
        const rankingButton = this.createButton(
            rightHalfCenterX,
            centerY + 80,
            '👑 ランキング',
            () => {
                console.log('Showing ranking...');
                this.showRanking();
            }
        );
        
        // トロフィーボタン
        const trophyButton = this.createButton(
            rightHalfCenterX,
            centerY + 160,
            '🏆 トロフィー',
            () => {
                console.log('Transitioning to Trophy Scene...');
                this.transitionToTrophyScene();
            }
        );
        
        // クレジット表示ボタン（小さい正方形、画面右下）
        const creditButtonSize = 50; // 正方形のサイズ
        const creditButton = this.add.container(screenWidth - creditButtonSize - 10, screenHeight - creditButtonSize - 10);
        
        // ボタン背景（正方形）
        const creditBg = this.add.rectangle(0, 0, creditButtonSize, creditButtonSize, 0x4ecdc4);
        creditBg.setStrokeStyle(2, 0xffffff);
        
        // ボタンテキスト（「i」アイコンまたは「ク」の文字）
        const creditText = this.add.text(0, 0, 'i', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        creditText.setOrigin(0.5);
        
        creditButton.add([creditBg, creditText]);
        creditButton.setSize(creditButtonSize, creditButtonSize);
        creditButton.setInteractive({ useHandCursor: true });
        
        // ホバー効果
        creditButton.on('pointerover', () => {
            creditBg.setFillStyle(0x3ab5dd);
        });
        creditButton.on('pointerout', () => {
            creditBg.setFillStyle(0x4ecdc4);
        });
        
        // クリックイベント
        creditButton.on('pointerdown', () => {
            this.playButtonSound();
            console.log('Showing credits...');
            this.showCredits();
        });
        
        // デバッグ用：自己記録クリアボタン（フラグで表示/非表示を切り替え）
        const showDebugClearButton = true; // trueにすると表示される
        if (showDebugClearButton) {
            const clearButtonSize = 50;
            const clearButton = this.add.container(screenWidth - creditButtonSize - clearButtonSize - 20, screenHeight - clearButtonSize - 10);
            
            const clearBg = this.add.rectangle(0, 0, clearButtonSize, clearButtonSize, 0xe74c3c);
            clearBg.setStrokeStyle(2, 0xffffff);
            
            const clearText = this.add.text(0, 0, 'X', {
                fontSize: '32px',
                fill: '#ffffff',
                fontStyle: 'bold'
            });
            clearText.setOrigin(0.5);
            
            clearButton.add([clearBg, clearText]);
            clearButton.setSize(clearButtonSize, clearButtonSize);
            clearButton.setInteractive({ useHandCursor: true });
            
            clearButton.on('pointerover', () => {
                clearBg.setFillStyle(0xc0392b);
            });
            clearButton.on('pointerout', () => {
                clearBg.setFillStyle(0xe74c3c);
            });
            
            clearButton.on('pointerdown', () => {
                this.playButtonSound();
                // 自己記録をクリア
                localStorage.removeItem('personalBest');
                localStorage.removeItem('distanceRanking');
                localStorage.removeItem('rankMatchRanking');
                console.log('自己記録をクリアしました');
                alert('自己記録をクリアしました');
            });
        }
        
        // 操作説明
        const instructions = this.add.text(
            rightHalfCenterX,
            screenHeight - 50,
            'クリックしてボタンを選択',
            {
                fontSize: '20px',
                fill: '#ffffff',
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                padding: { x: 15, y: 8 }
            }
        );
        instructions.setOrigin(0.5);
        
        // アニメーション効果
        this.tweens.add({
            targets: title,
            scale: { from: 0.9, to: 1.1 },
            duration: 2000,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        // BGMを再生
        this.playBGM();
        
        // タイトルシーン表示時の効果音を再生
        this.playTitleSound();
        
        // フェードイン効果
        this.cameras.main.fadeIn(500, 0, 0, 0);
    }
    
    /**
     * PNG画像をグリッドに分割してアニメーション表示
     * @param {string} imagePath - 画像ファイルのパス（使用しない、preloadで既に読み込まれている想定）
     * @param {string} textureKey - テクスチャキー
     * @param {string} animKey - アニメーションキー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} originX - 原点X (0=左, 1=右)
     * @param {number} originY - 原点Y (0=上, 1=下)
     * @param {number} gridCols - グリッドの列数（x）
     * @param {number} gridRows - グリッドの行数（y）
     * @param {number} frameWidth - 1フレームの幅（使用しない、preloadで既に設定済み）
     * @param {number} frameHeight - 1フレームの高さ（使用しない、preloadで既に設定済み）
     * @param {number} frameRate - フレームレート（デフォルト: 12）
     * @param {object} options - オプション（scale, repeat, maxFrames等）
     *                            maxFrames: 表示するフレーム数（未指定の場合はgridCols * gridRows）
     */
    createGridAnimation(imagePath, textureKey, animKey, x, y, originX, originY, gridCols, gridRows, frameWidth, frameHeight, frameRate = 12, options = {}) {
        const { scale = 1, repeat = -1, maxFrames = null } = options;
        
        // preloadで既に読み込まれている想定なので、即座にスプライトを作成
        if (this.textures.exists(textureKey)) {
            this.createGridAnimationSprite(textureKey, animKey, x, y, originX, originY, gridCols, gridRows, frameRate, scale, repeat, maxFrames);
        } else {
            console.warn(`Texture ${textureKey} not found. Make sure it's loaded in preload().`);
        }
    }
    
    /**
     * グリッドアニメーションのスプライトを作成
     * @param {string} textureKey - テクスチャキー
     * @param {string} animKey - アニメーションキー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} originX - 原点X (0=左, 1=右)
     * @param {number} originY - 原点Y (0=上, 1=下)
     * @param {number} gridCols - グリッドの列数（x）
     * @param {number} gridRows - グリッドの行数（y）
     * @param {number} frameRate - フレームレート
     * @param {number} scale - 拡大率
     * @param {number} repeat - 繰り返し回数（-1で無限ループ）
     * @param {number|null} maxFrames - 表示するフレーム数（未指定の場合はgridCols * gridRows）
     */
    createGridAnimationSprite(textureKey, animKey, x, y, originX, originY, gridCols, gridRows, frameRate, scale, repeat, maxFrames = null) {
        try {
            const texture = this.textures.get(textureKey);
            const totalFrames = gridCols * gridRows;
            
            // 表示するフレーム数を決定（maxFramesが指定されている場合はそれを使用、未指定の場合は全フレーム）
            const framesToUse = maxFrames !== null && maxFrames > 0 ? Math.min(maxFrames, totalFrames) : totalFrames;
            
            // 左上から右下に向かってフレーム番号を生成
            // 行0: 0, 1, 2, ..., gridCols-1
            // 行1: gridCols, gridCols+1, ..., 2*gridCols-1
            // ...
            const frameNumbers = [];
            for (let row = 0; row < gridRows; row++) {
                for (let col = 0; col < gridCols; col++) {
                    const frameIndex = row * gridCols + col;
                    if (frameIndex < framesToUse) {
                        frameNumbers.push(frameIndex);
                    }
                }
            }
            
            // アニメーションが既に存在する場合は再利用
            if (!this.anims.exists(animKey)) {
                this.anims.create({
                    key: animKey,
                    frames: frameNumbers.map(frameNum => ({ 
                        key: textureKey, 
                        frame: frameNum 
                    })),
                    frameRate: frameRate,
                    repeat: repeat
                });
                const frameInfo = maxFrames !== null ? `${framesToUse}/${totalFrames}` : `${totalFrames}`;
                console.log(`Created grid animation ${animKey}: ${gridCols}x${gridRows} (${frameInfo} frames) at ${frameRate} fps`);
            }
            
            // スプライトを作成
            const sprite = this.add.sprite(x, y, textureKey);
            sprite.setOrigin(originX, originY);
            sprite.setDepth(1);
            sprite.setScale(scale);
            
            // アニメーションを再生
            sprite.play(animKey);
            
            return sprite;
        } catch (error) {
            console.error(`Error creating grid animation ${textureKey}:`, error);
            return null;
        }
    }
    
    /**
     * アニメーション付きスタンプを作成
     * @param {string} textureKey - テクスチャキー
     * @param {string} animKey - アニメーションキー
     * @param {number} x - X座標
     * @param {number} y - Y座標
     * @param {number} originX - 原点X (0=左, 1=右)
     * @param {number} originY - 原点Y (0=上, 1=下)
     * @param {number} frameRate - フレームレート（デフォルト: 12）
     */
    createAnimatedStamp(textureKey, animKey, x, y, originX, originY, frameRate = 12) {
        if (!this.textures.exists(textureKey)) {
            console.warn(`Texture ${textureKey} not found`);
            return null;
        }
        
        try {
            const texture = this.textures.get(textureKey);
            const frameNames = texture.getFrameNames();
            
            if (frameNames.length === 0) {
                console.warn(`No frames found for ${textureKey}`);
                return null;
            }
            
            // スプライトを作成
            const sprite = this.add.sprite(x, y, textureKey);
            sprite.setOrigin(originX, originY);
            sprite.setDepth(1);
            
            // フレームが1つだけの場合はアニメーションを作成しない
            if (frameNames.length === 1) {
                sprite.setFrame(frameNames[0]);
                return sprite;
            }
            
            // アニメーションが既に存在する場合は再利用
            if (this.anims.exists(animKey)) {
                sprite.play(animKey);
                return sprite;
            }
            
            // アニメーションを作成
            // フレーム名をソートして順番に並べる（frame_0, frame_1, ... の順）
            const sortedFrames = frameNames.sort((a, b) => {
                // フレーム名から数字を抽出して比較
                const numA = parseInt(a.match(/\d+/)?.[0] || '0');
                const numB = parseInt(b.match(/\d+/)?.[0] || '0');
                return numA - numB;
            });
            
            this.anims.create({
                key: animKey,
                frames: sortedFrames.map(frameName => ({ 
                    key: textureKey, 
                    frame: frameName 
                })),
                frameRate: frameRate,
                repeat: -1 // 無限ループ
            });
            
            // アニメーションを再生
            sprite.play(animKey);
            
            console.log(`Created animation ${animKey} with ${sortedFrames.length} frames at ${frameRate} fps`);
            
            return sprite;
        } catch (error) {
            console.error(`Error creating animated stamp ${textureKey}:`, error);
            return null;
        }
    }
    
    /**
     * BGMを再生
     */
    playBGM() {
        // 既に同じBGMが再生中かチェック
        const existingSound = this.sound.get('bgm');
        if (existingSound && existingSound.isPlaying) {
            // 既に再生中ならそのまま続ける
            this.bgm = existingSound;
            console.log('BGM already playing, continuing...');
            return;
        }
        
        // 既に存在するが停止している場合は再利用
        if (existingSound) {
            this.bgm = existingSound;
            this.bgm.setVolume(0.1);
            this.bgm.play();
            console.log('BGM resumed');
            return;
        }
        
        // 新しいBGMを再生（音量10%）
        if (this.cache.audio.exists('bgm')) {
            this.bgm = this.sound.add('bgm', {
                volume: 0.08, // 音量8%
                loop: true // ループ再生
            });
            this.bgm.play();
            console.log('BGM started playing');
        } else {
            console.warn('BGM not loaded yet');
        }
    }
    
    /**
     * BGMを停止
     */
    stopBGM() {
        if (this.bgm && this.bgm.isPlaying) {
            this.bgm.stop();
            console.log('BGM stopped');
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
     * タイトルシーン表示時の効果音を再生
     */
    playTitleSound() {
        if (this.cache.audio.exists('cv001')) {
            this.sound.play('cv001', {
                volume: 0.2 // 音量20%
            });
            console.log('Title sound (cv001) played');
        } else {
            console.warn('Title sound not loaded yet');
        }
    }
    
    /**
     * ボタンを作成
     */
    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        // ボタン背景
        const bg = this.add.rectangle(0, 0, 400, 60, 0x4ecdc4);
        bg.setStrokeStyle(3, 0xffffff);
        
        // ボタンテキスト
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        button.add([bg, buttonText]);
        button.setSize(400, 60);
        button.setInteractive({ useHandCursor: true });
        
        // ホバー効果
        button.on('pointerover', () => {
            bg.setFillStyle(0x3ab5dd);
            this.tweens.add({
                targets: button,
                scale: 1.1,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        button.on('pointerout', () => {
            bg.setFillStyle(0x4ecdc4);
            this.tweens.add({
                targets: button,
                scale: 1.0,
                duration: 200,
                ease: 'Power2'
            });
        });
        
        // クリックイベント
        button.on('pointerdown', () => {
            // ボタンクリック時の効果音を再生
            this.playButtonSound();
            
            this.tweens.add({
                targets: button,
                scale: 0.95,
                duration: 100,
                yoyo: true,
                onComplete: callback
            });
        });
        
        return button;
    }
    
    /**
     * クレジットを表示
     */
    showCredits() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2 + 300;
        const centerY = screenHeight / 2;
        
        // 既にクレジットが表示されている場合は何もしない
        if (this.creditOverlay) {
            return;
        }
        
        // オーバーレイ背景（半透明の黒）
        const overlayBg = this.add.rectangle(
            centerX,
            centerY,
            screenWidth + 5000,
            screenHeight,
            0x000000,
            0.8
        );
        overlayBg.setInteractive();
        overlayBg.setDepth(1000);
        
        // クレジットパネル
        const panelWidth = 600;
        const panelHeight = 500;
        const creditPanel = this.add.container(centerX, centerY);
        creditPanel.setDepth(1001);
        
        // パネル背景
        const panelBg = this.add.rectangle(0, 0, panelWidth, panelHeight, 0x2c3e50);
        panelBg.setStrokeStyle(3, 0xffffff);
        
        // タイトル
        const creditTitle = this.add.text(0, -200, 'クレジット', {
            fontSize: '32px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        creditTitle.setOrigin(0.5);
        
        // クレジット内容
        const creditText = this.add.text(0, 6, 
            'ゲームデザイン・プログラマ:\n' +
            ' ・ほろっち\n\n' +
            'BGM:\n' +
            ' ・ほろっち (タイトル・エディタ)\n' +
            ' ・魔王魂 (ロケット発射)\n\n' +
            '効果音:\n' +
            ' ・効果音ラボ (SE・CV:音枝優日, アズミ)\n' +
            ' ・COEIROINK:幌呂めぐる (CV: ビビアン・レッドドア)\n\n' +
            'イラスト:\n' +
            ' ・ほろっち: キャラクターイラスト・アニメーション\n' +
            ' ・だれのき(@darenoki): 白いエフェクト\n' +
            ' ・サクソラまてりある: キラキラエフェクト\n' +
            ' ・sirousagi: ビル背景イラスト\n'+
            ' ・パブリックドメインQ\n'+
            ' ・videoAC\n\n'+
            'lib:\n' +
            ' ・Phaser.js 3.80.1\n',
            {
                fontSize: '14px',
                fill: '#ffffff',
                align: 'leftr',
                lineSpacing: 2
            }
        );
        creditText.setOrigin(0.5);
        
        // 閉じるボタン
        const closeButton = this.add.container(0, 200);
        const closeBg = this.add.rectangle(0, 0, 200, 50, 0x4ecdc4);
        closeBg.setStrokeStyle(2, 0xffffff);
        const closeText = this.add.text(0, 0, '閉じる', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        closeText.setOrigin(0.5);
        closeButton.add([closeBg, closeText]);
        closeButton.setSize(200, 50);
        closeButton.setInteractive({ useHandCursor: true });
        
        // 閉じるボタンのホバー効果
        closeButton.on('pointerover', () => {
            closeBg.setFillStyle(0x3ab5dd);
        });
        closeButton.on('pointerout', () => {
            closeBg.setFillStyle(0x4ecdc4);
        });
        
        // 閉じるボタンのクリックイベント
        closeButton.on('pointerdown', () => {
            this.playButtonSound();
            this.closeCredits();
        });
        
        // オーバーレイ背景のクリックでも閉じる
        overlayBg.on('pointerdown', () => {
            this.closeCredits();
        });
        
        creditPanel.add([panelBg, creditTitle, creditText, closeButton]);
        
        // 動画の透明度を50%に変更
        if (this.videoElement) {
            this.videoElement.style.transition = 'opacity 300ms ease-out';
            this.videoElement.style.opacity = '0.5';
        }
        
        // フェードインアニメーション
        creditPanel.setAlpha(0);
        overlayBg.setAlpha(0);
        this.tweens.add({
            targets: [creditPanel, overlayBg],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        // 参照を保存
        this.creditOverlay = {
            overlayBg: overlayBg,
            creditPanel: creditPanel
        };
    }
    
    /**
     * ランキングを表示（左側: ランクマッチ、右側: 距離ランキング）
     */
    async showRanking() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 既にランキングが表示されている場合は何もしない
        if (this.rankingOverlay) {
            return;
        }
        
        // オーバーレイ背景（半透明の黒）
        const overlayBg = this.add.rectangle(
            centerX,
            centerY,
            screenWidth,
            screenHeight,
            0x000000,
            0.8
        );
        overlayBg.setInteractive();
        overlayBg.setDepth(1000);
        
        // 今日の日付を取得
        const today = this.getTodayDateString();
        
        // 左側: ランクマッチランキングパネル
        const leftPanelX = screenWidth / 4;
        const leftPanelY = centerY;
        const leftPanelWidth = 500;
        const leftPanelHeight = 500;
        const leftRankMatchPanel = this.add.container(leftPanelX, leftPanelY);
        leftRankMatchPanel.setDepth(1001);
        
        // 左パネル背景
        const leftPanelBg = this.add.rectangle(0, 0, leftPanelWidth, leftPanelHeight, 0x2c3e50);
        leftPanelBg.setStrokeStyle(3, 0xffffff);
        
        // 左パネルタイトル
        const leftPanelTitle = this.add.text(0, -200, '⚔️ ランクマッチ', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        leftPanelTitle.setOrigin(0.5);
        
        // 日付表示
        const leftDateText = this.add.text(0, -170, today, {
            fontSize: '16px',
            fill: '#bdc3c7'
        });
        leftDateText.setOrigin(0.5);
        
        // ローディングメッセージを表示
        const leftLoadingText = this.add.text(0, 0, 'サーバーに問い合わせ中...', {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        leftLoadingText.setOrigin(0.5);
        leftRankMatchPanel.add([leftPanelBg, leftPanelTitle, leftDateText, leftLoadingText]);
        
        // ランクマッチランキングデータを取得（API呼び出し）
        let rankMatchRanking = [];
        try {
            const { getApiClient } = await import('../utils/apiClient.js');
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            const response = await apiClient.getRanking('rankMatch', today, 10, authToken);
            rankMatchRanking = response.data?.records || [];
        } catch (error) {
            console.error('Error fetching rank match ranking:', error);
            // フォールバック: ローカルストレージから取得
            const rankMatchKey = `rankMatchRanking_${today}`;
            rankMatchRanking = JSON.parse(localStorage.getItem(rankMatchKey) || '[]');
        }
        
        // ローディングメッセージを削除
        leftLoadingText.destroy();
        
        // ランクマッチランキング内容（個別のテキストとして表示）
        const rankMatchItems = [];
        if (rankMatchRanking.length === 0) {
            const noRecordText = this.add.text(0, 0, 'まだ記録がありません\n\nランクマッチで\n記録を残しましょう！', {
                fontSize: '16px',
                fill: '#bdc3c7',
                align: 'center'
            });
            noRecordText.setOrigin(0.5);
            rankMatchItems.push(noRecordText);
        } else {
            const startY = -100;
            const itemSpacing = 35; // 1~3位は大きく表示するため間隔を広げる
            const normalItemSpacing = 20; // 4位以降の間隔
            
            rankMatchRanking.slice(0, 10).forEach((record, index) => {
                const rank = index + 1;
                const distance = record.distance;
                // 名前を5文字にパディング（後ろにスペースを追加）
                const name = (record.name || 'AAA').padEnd(5, ' ');
                const date = new Date(record.date);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                
                // 1~3位は大きく表示、4位以降は通常サイズ
                const isTop3 = rank <= 3;
                const fontSize = isTop3 ? '24px' : '16px';
                const nameFontSize = isTop3 ? '22px' : '16px';
                const distanceFontSize = isTop3 ? '20px' : '14px';
                
                // Y座標を計算（1~3位は大きく、4位以降は通常サイズ）
                let y = startY;
                if (rank <= 3) {
                    y = startY + (rank - 1) * itemSpacing;
                } else {
                    y = startY + 3 * itemSpacing + (rank - 4) * normalItemSpacing;
                }
                
                // メダル表示
                let medal = '';
                if (rank === 1) medal = '🥇';
                else if (rank === 2) medal = '🥈';
                else if (rank === 3) medal = '🥉';
                else medal = `${rank}.`;
                
                // メダル/ランク表示
                const medalText = this.add.text(-200, y, medal, {
                    fontSize: isTop3 ? '36px' : '20px',
                    fill: '#ffffff',
                    fontStyle: 'bold'
                });
                medalText.setOrigin(0, 0.5);
                rankMatchItems.push(medalText);
                
                // ユーザー名（左側に配置）
                const nameY = y; // 名前と飛距離を同じ高さに
                const nameText = this.add.text(-150, nameY, name, {
                    fontSize: nameFontSize,
                    fill: '#ffffff',
                    fontStyle: 'bold'
                });
                nameText.setOrigin(0, 0.5);
                rankMatchItems.push(nameText);
                
                // 飛距離（名前の後ろに余白を設けて配置）
                const nameWidth = nameText.width; // 名前の幅を取得
                const spacing = isTop3 ? 30 : 20; // 1~3位は余白を広めに
                const distanceX = -150 + nameWidth + spacing;
                const distanceText = this.add.text(distanceX, nameY, `${distance.toLocaleString()} m`, {
                    fontSize: distanceFontSize,
                    fill: '#3498db',
                    fontStyle: 'bold'
                });
                distanceText.setOrigin(0, 0.5);
                rankMatchItems.push(distanceText);
                
                // 日時（すべての順位に表示）
                const distanceWidth = distanceText.width; // 飛距離の幅を取得
                const dateSpacing = isTop3 ? 20 : 15; // 1~3位は余白を広めに
                const dateX = distanceX + distanceWidth + dateSpacing;
                const dateText = this.add.text(dateX, y, `(${dateStr})`, {
                    fontSize: isTop3 ? '14px' : '12px',
                    fill: '#bdc3c7'
                });
                dateText.setOrigin(0, 0.5);
                rankMatchItems.push(dateText);
            });
        }
        
        leftRankMatchPanel.add([leftPanelBg, leftPanelTitle, leftDateText, ...rankMatchItems]);
        
        // 右側: 距離ランキングパネル
        const rightPanelX = screenWidth * 3 / 4;
        const rightPanelY = centerY;
        const rightPanelWidth = 500;
        const rightPanelHeight = 500;
        const rightDistancePanel = this.add.container(rightPanelX, rightPanelY);
        rightDistancePanel.setDepth(1001);
        
        // 右パネル背景
        const rightPanelBg = this.add.rectangle(0, 0, rightPanelWidth, rightPanelHeight, 0x2c3e50);
        rightPanelBg.setStrokeStyle(3, 0xffffff);
        
        // 右パネルタイトル
        const rightPanelTitle = this.add.text(0, -200, '🧭 限界スコアランキング', {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        rightPanelTitle.setOrigin(0.5);
        
        // ローディングメッセージを表示
        const rightLoadingText = this.add.text(0, 0, 'サーバーに問い合わせ中...', {
            fontSize: '18px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        rightLoadingText.setOrigin(0.5);
        rightDistancePanel.add([rightPanelBg, rightPanelTitle, rightLoadingText]);
        
        // 距離ランキングデータを取得（API呼び出し）
        let distanceRanking = [];
        try {
            const { getApiClient } = await import('../utils/apiClient.js');
            const apiClient = getApiClient();
            const authToken = localStorage.getItem('authToken');
            const response = await apiClient.getRanking('distance', null, 10, authToken);
            distanceRanking = response.data?.records || [];
        } catch (error) {
            console.error('Error fetching distance ranking:', error);
            // フォールバック: ローカルストレージから取得
            const distanceRankingKey = 'distanceRanking';
            distanceRanking = JSON.parse(localStorage.getItem(distanceRankingKey) || '[]');
        }
        
        // ローディングメッセージを削除
        rightLoadingText.destroy();
        
        // 距離ランキング内容（個別のテキストとして表示）
        const distanceItems = [];
        if (distanceRanking.length === 0) {
            const noRecordText = this.add.text(0, 0, 'まだ記録がありません\n\nロケットを飛ばして\n記録を残しましょう！', {
                fontSize: '16px',
                fill: '#bdc3c7',
                align: 'center'
            });
            noRecordText.setOrigin(0.5);
            distanceItems.push(noRecordText);
        } else {
            const startY = -100;
            const itemSpacing = 35; // 1~3位は大きく表示するため間隔を広げる
            const normalItemSpacing = 20; // 4位以降の間隔
            
            distanceRanking.forEach((record, index) => {
                const rank = index + 1;
                const distance = record.distance;
                // 名前を5文字にパディング（後ろにスペースを追加）
                const name = (record.name || 'AAA').padEnd(5, ' ');
                const date = new Date(record.date);
                const dateStr = `${date.getMonth() + 1}/${date.getDate()} ${date.getHours()}:${String(date.getMinutes()).padStart(2, '0')}`;
                
                // 1~3位は大きく表示、4位以降は通常サイズ
                const isTop3 = rank <= 3;
                const fontSize = isTop3 ? '24px' : '16px';
                const nameFontSize = isTop3 ? '22px' : '16px';
                const distanceFontSize = isTop3 ? '20px' : '14px';
                
                // Y座標を計算（1~3位は大きく、4位以降は通常サイズ）
                let y = startY;
                if (rank <= 3) {
                    y = startY + (rank - 1) * itemSpacing;
                } else {
                    y = startY + 3 * itemSpacing + (rank - 4) * normalItemSpacing;
                }
                
                // メダル表示
                let medal = '';
                if (rank === 1) medal = '🥇';
                else if (rank === 2) medal = '🥈';
                else if (rank === 3) medal = '🥉';
                else medal = `${rank}.`;
                
                // メダル/ランク表示
                const medalText = this.add.text(-200, y, medal, {
                    fontSize: isTop3 ? '36px' : '20px',
                    fill: '#ffffff',
                    fontStyle: 'bold'
                });
                medalText.setOrigin(0, 0.5);
                distanceItems.push(medalText);
                
                // ユーザー名（左側に配置）
                const nameY = y; // 名前と飛距離を同じ高さに
                const nameText = this.add.text(-150, nameY, name, {
                    fontSize: nameFontSize,
                    fill: '#ffffff',
                    fontStyle: 'bold'
                });
                nameText.setOrigin(0, 0.5);
                distanceItems.push(nameText);
                
                // 飛距離（名前の後ろに余白を設けて配置）
                const nameWidth = nameText.width; // 名前の幅を取得
                const spacing = isTop3 ? 30 : 20; // 1~3位は余白を広めに
                const distanceX = -150 + nameWidth + spacing;
                const distanceText = this.add.text(distanceX, nameY, `${distance.toLocaleString()} m`, {
                    fontSize: distanceFontSize,
                    fill: '#3498db',
                    fontStyle: 'bold'
                });
                distanceText.setOrigin(0, 0.5);
                distanceItems.push(distanceText);
                
                // 日時（すべての順位に表示）
                const distanceWidth = distanceText.width; // 飛距離の幅を取得
                const dateSpacing = isTop3 ? 20 : 15; // 1~3位は余白を広めに
                const dateX = distanceX + distanceWidth + dateSpacing;
                const dateText = this.add.text(dateX, y, `(${dateStr})`, {
                    fontSize: isTop3 ? '14px' : '12px',
                    fill: '#bdc3c7'
                });
                dateText.setOrigin(0, 0.5);
                distanceItems.push(dateText);
            });
        }
        
        rightDistancePanel.add([rightPanelBg, rightPanelTitle, ...distanceItems]);
        
        // 閉じるボタン（中央下部）
        const closeButton = this.add.container(centerX, centerY + 250);
        const closeBg = this.add.rectangle(0, 0, 200, 50, 0x4ecdc4);
        closeBg.setStrokeStyle(2, 0xffffff);
        const closeText = this.add.text(0, 0, '閉じる', {
            fontSize: '24px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        closeText.setOrigin(0.5);
        closeButton.add([closeBg, closeText]);
        closeButton.setSize(200, 50);
        closeButton.setInteractive({ useHandCursor: true });
        closeButton.setDepth(1002);
        
        // 閉じるボタンのホバー効果
        closeButton.on('pointerover', () => {
            closeBg.setFillStyle(0x3ab5dd);
        });
        closeButton.on('pointerout', () => {
            closeBg.setFillStyle(0x4ecdc4);
        });
        
        // 閉じるボタンのクリックイベント
        closeButton.on('pointerdown', () => {
            this.playButtonSound();
            this.closeRanking();
        });
        
        // オーバーレイ背景のクリックでも閉じる
        overlayBg.on('pointerdown', () => {
            this.closeRanking();
        });
        
        // 動画を一時的に非表示にする
        if (this.videoElement) {
            this.videoElement.style.transition = 'opacity 300ms ease-out';
            this.videoElement.style.opacity = '0';
            this.videoElement.style.visibility = 'hidden';
        }
        
        // フェードインアニメーション
        leftRankMatchPanel.setAlpha(0);
        rightDistancePanel.setAlpha(0);
        closeButton.setAlpha(0);
        overlayBg.setAlpha(0);
        this.tweens.add({
            targets: [leftRankMatchPanel, rightDistancePanel, closeButton, overlayBg],
            alpha: 1,
            duration: 300,
            ease: 'Power2'
        });
        
        // 参照を保存
        this.rankingOverlay = {
            overlayBg: overlayBg,
            leftRankMatchPanel: leftRankMatchPanel,
            rightDistancePanel: rightDistancePanel,
            closeButton: closeButton
        };
    }
    
    /**
     * 今日の日付を文字列で取得（YYYY-MM-DD形式）
     */
    getTodayDateString() {
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    }
    
    /**
     * ランキングを閉じる
     */
    closeRanking() {
        if (!this.rankingOverlay) {
            return;
        }
        
        // 動画を復活させる
        if (this.videoElement) {
            this.videoElement.style.transition = 'opacity 300ms ease-in';
            this.videoElement.style.visibility = 'visible';
            this.videoElement.style.opacity = '1.0';
        }
        
        // フェードアウトアニメーション
        this.tweens.add({
            targets: [this.rankingOverlay.leftRankMatchPanel, this.rankingOverlay.rightDistancePanel, this.rankingOverlay.closeButton, this.rankingOverlay.overlayBg],
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // オブジェクトを削除
                this.rankingOverlay.leftRankMatchPanel.destroy();
                this.rankingOverlay.rightDistancePanel.destroy();
                this.rankingOverlay.closeButton.destroy();
                this.rankingOverlay.overlayBg.destroy();
                this.rankingOverlay = null;
            }
        });
    }
    
    /**
     * クレジットを閉じる
     */
    closeCredits() {
        if (!this.creditOverlay) {
            return;
        }
        
        // 動画の透明度を元に戻す（100%）
        if (this.videoElement) {
            this.videoElement.style.transition = 'opacity 300ms ease-out';
            this.videoElement.style.opacity = '1.0';
        }
        
        // フェードアウトアニメーション
        this.tweens.add({
            targets: [this.creditOverlay.creditPanel, this.creditOverlay.overlayBg],
            alpha: 0,
            duration: 300,
            ease: 'Power2',
            onComplete: () => {
                // オブジェクトを削除
                this.creditOverlay.creditPanel.destroy();
                this.creditOverlay.overlayBg.destroy();
                this.creditOverlay = null;
            }
        });
    }
    
    /**
     * トロフィー画面への遷移
     */
    transitionToTrophyScene() {
        const fadeDuration = 500;
        
        // ランキングが表示されている場合は閉じる
        if (this.rankingOverlay) {
            this.closeRanking();
        }
        
        // クレジットが表示されている場合は閉じる
        if (this.creditOverlay) {
            this.closeCredits();
        }
        
        // Phaserのカメラをフェードアウト
        this.cameras.main.fadeOut(fadeDuration, 0, 0, 0);
        
        // 動画要素もフェードアウト
        if (this.videoElement) {
            this.videoElement.style.transition = `opacity ${fadeDuration}ms ease-out`;
            this.videoElement.style.opacity = '0';
        }
        
        // フェードアウト完了後にシーン遷移
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('TrophyScene');
        });
    }
    
    /**
     * ランクマッチ画面への遷移
     */
    transitionToRankMatchScene() {
        const fadeDuration = 500;
        
        // ランキングが表示されている場合は閉じる
        if (this.rankingOverlay) {
            this.closeRanking();
        }
        
        // クレジットが表示されている場合は閉じる
        if (this.creditOverlay) {
            this.closeCredits();
        }
        
        // Phaserのカメラをフェードアウト
        this.cameras.main.fadeOut(fadeDuration, 0, 0, 0);
        
        // 動画要素もフェードアウト
        if (this.videoElement) {
            this.videoElement.style.transition = `opacity ${fadeDuration}ms ease-out`;
            this.videoElement.style.opacity = '0';
        }
        
        // フェードアウト完了後にシーン遷移
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('RankMatchScene');
        });
    }
    
    /**
     * ロケットエディタへの遷移（動画も含めてフェードアウト）
     */
    transitionToEditor() {
        const fadeDuration = 500; // フェードアウトの時間（ミリ秒）
        
        // ランキングが表示されている場合は閉じる
        if (this.rankingOverlay) {
            this.closeRanking();
        }
        
        // クレジットが表示されている場合は閉じる
        if (this.creditOverlay) {
            this.closeCredits();
        }
        
        // Phaserのカメラをフェードアウト
        this.cameras.main.fadeOut(fadeDuration, 0, 0, 0);
        
        // 動画要素もフェードアウト
        if (this.videoElement) {
            this.videoElement.style.transition = `opacity ${fadeDuration}ms ease-out`;
            this.videoElement.style.opacity = '0';
        }
        
        // フェードアウト完了後にシーン遷移
        this.cameras.main.once('camerafadeoutcomplete', () => {
            this.scene.start('RocketEditorScene');
        });
    }
    
    /**
     * シーンが停止する時のクリーンアップ
     */
    shutdown() {
        console.log('TitleScene: shutdown() called');
        
        // ランキングが表示されている場合は閉じる
        if (this.rankingOverlay) {
            this.closeRanking();
        }
        
        // クレジットが表示されている場合は閉じる
        if (this.creditOverlay) {
            this.closeCredits();
        }
        
        // 同じBGMを使うシーン（RocketEditorScene）に遷移する場合は停止しない
        // GameSceneに遷移する場合は、GameScene側で停止される
        // ここでは参照のみクリア
        this.bgm = null;
        
        // 動画要素の参照をクリア
        this.videoElement = null;
        
        // TitleSceneは静的なUIのみなので、特別なクリーンアップは不要
        // Phaserが自動的にゲームオブジェクトをクリーンアップします
    }
}

