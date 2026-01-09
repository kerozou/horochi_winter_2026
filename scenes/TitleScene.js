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
        video.width = width;
        video.height = height;
        video.autoplay = autoplay;
        video.loop = loop;
        video.muted = muted;
        video.volume = volume;
        video.controls = controls;
        video.playsInline = playsInline;
        video.style.position = 'absolute';
        video.style.pointerEvents = 'none'; // Phaserのイベントを妨げないように
        
        // Phaserの座標系に合わせて配置
        // Phaserのキャンバスは通常、game-container内に配置される
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const containerRect = gameContainer.getBoundingClientRect();
            video.style.left = (containerRect.left + x) + 'px';
            video.style.top = (containerRect.top + y) + 'px';
            video.style.zIndex = zIndex.toString(); // オプションで指定されたz-indexを使用
            gameContainer.appendChild(video);
        } else {
            // game-containerが見つからない場合はbodyに追加
            document.body.appendChild(video);
            video.style.left = x + 'px';
            video.style.top = y + 'px';
            video.style.zIndex = zIndex.toString();
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
            centerY - 150,
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
            centerY - 80,
            'かっこいいロケットを作って皆に自慢しよう！',
            {
                fontSize: '28px',
                fill: '#ffffff',
                fontStyle: 'italic'
            }
        );
        subtitle.setOrigin(0.5);
        
        // スタートボタン
        const startButton = this.createButton(
            rightHalfCenterX,
            centerY + 50,
            'ロケットエディタへ',
            () => {
                console.log('Starting Rocket Editor...');
                this.transitionToEditor();
            }
        );
        
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
     * ロケットエディタへの遷移（動画も含めてフェードアウト）
     */
    transitionToEditor() {
        const fadeDuration = 500; // フェードアウトの時間（ミリ秒）
        
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

