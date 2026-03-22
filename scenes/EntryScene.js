/**
 * エントリーシーン（ログインなし・ゲストで起動しタイトルへ遷移）
 */
export class EntryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EntryScene' });
    }

    /**
     * 先にスプラッシュ用画像だけ読み込む（create より前に実行される）
     */
    preload() {
        this.load.image('splash_pjhorochi', 'resources/pjhorochi.png');
    }

    create() {
        console.log('EntryScene: create() called (local session → TitleScene)');

        localStorage.removeItem('authToken');
        localStorage.setItem('userId', 'GUEST');
        localStorage.setItem('userPassword', 'guest');
        localStorage.setItem('isOfflineMode', 'true');

        if (!this.cameras || !this.cameras.main) {
            this.time.delayedCall(100, () => {
                if (this.cameras && this.cameras.main) {
                    this.create();
                } else {
                    console.error('Camera still not initialized after delay');
                }
            });
            return;
        }

        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;

        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000);
        graphics.fillRect(0, 0, screenWidth, screenHeight);

        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        if (this.textures.exists('splash_pjhorochi')) {
            const splash = this.add.image(centerX, centerY, 'splash_pjhorochi');
            const scale = Math.min(screenWidth / splash.width, screenHeight / splash.height);
            splash.setScale(scale);
            splash.setDepth(50);
            splash.setScrollFactor(0);
            this.splashImage = splash;
        }

        this.cameras.main.fadeIn(300, 0, 0, 0);

        this.bootstrapLocalAndLoad().catch((err) => {
            console.error('EntryScene: bootstrap failed:', err);
        });
    }

    /**
     * ローカル専用セッション（ランキング・トロフィーは消さず継続）
     */
    async bootstrapLocalAndLoad() {
        this.removeInputForms();
        this.loadResourcesAndTransition('GUEST');
    }

    /**
     * 入力フォームを削除
     */
    removeInputForms() {
        if (this.userIdInput && this.userIdInput.parentNode) {
            this.userIdInput.parentNode.removeChild(this.userIdInput);
            this.userIdInput = null;
        }
        if (this.passwordInput && this.passwordInput.parentNode) {
            this.passwordInput.parentNode.removeChild(this.passwordInput);
            this.passwordInput = null;
        }
    }
    
    /**
     * リソースをロードしてからタイトルシーンに遷移
     * @param {string} userId - ユーザーID
     */
    loadResourcesAndTransition(userId) {
        // カメラが初期化されているか確認
        if (!this.cameras || !this.cameras.main) {
            console.error('Camera not initialized in loadResourcesAndTransition');
            // カメラが初期化されていない場合は直接遷移
            this.transitionToTitle(userId);
            return;
        }
        
        // リソースをロード（スプラッシュ画像は表示したまま）
        this.loadAllResources();
        
        // ロード完了後、スプラッシュをしばらく表示してから遷移（切り替わりを自然に）
        const postSplashWaitMs = 700;
        this.load.once('complete', () => {
            console.log('All resources loaded');
            this.time.delayedCall(postSplashWaitMs, () => {
                if (!this.scene || !this.scene.isActive('EntryScene')) {
                    return;
                }
                this.transitionToTitle(userId);
            });
        });
        
        // ロード開始
        this.load.start();
    }
    
    /**
     * すべてのリソースをロード
     */
    loadAllResources() {
        // 画像リソース
        if (!this.textures.exists('horochi')) {
            this.load.image('horochi', 'resources/horochi.png');
        }
        
        // 背景画像（6種類）
        for (let i = 1; i <= 6; i++) {
            const texKey = `bg_${i}`;
            if (!this.textures.exists(texKey)) {
                this.load.image(texKey, `resources/bg_${i}.png`);
            }
        }
        
        // リザルト表示用の画像
        if (!this.textures.exists('iei')) {
            this.load.image('iei', 'resources/iei.png');
        }
        if (!this.textures.exists('horonbia')) {
            this.load.image('horonbia', 'resources/horonbia.jpg');
        }
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
        if (!this.textures.exists('smokeTemp')) {
            this.load.image('smokeTemp', 'resources/smoke.png');
        }
        
        // スプライトシート
        if (!this.textures.exists('stampFlowerGrid')) {
            this.load.spritesheet('stampFlowerGrid', 'resources/STAMP_flower_01_sheet.png', {
                frameWidth: 875 / 5,
                frameHeight: 477 / 3
            });
        }
        if (!this.textures.exists('stampKiraGrid')) {
            this.load.spritesheet('stampKiraGrid', 'resources/STAMP_kira_04_sheet.png', {
                frameWidth: 2250 / 5,
                frameHeight: 1800 / 4
            });
        }
        if (!this.textures.exists('syuutyuuGrid')) {
            this.load.spritesheet('syuutyuuGrid', 'resources/syuutyuu.png', {
                frameWidth: 6935 / 5,
                frameHeight: 3120 / 4
            });
        }
        
        // 音声リソース
        if (!this.cache.audio.exists('bgm')) {
            this.load.audio('bgm', 'resources/BGM.mp3');
        }
        if (!this.cache.audio.exists('gameBGM')) {
            this.load.audio('gameBGM', 'resources/maou_bgm_neorock68.ogg');
        }
        if (!this.cache.audio.exists('deci')) {
            this.load.audio('deci', 'resources/deci.mp3');
        }
        if (!this.cache.audio.exists('cv001')) {
            this.load.audio('cv001', 'resources/cv001.wav');
        }
        if (!this.cache.audio.exists('end')) {
            this.load.audio('end', 'resources/end.mp3');
        }
        if (!this.cache.audio.exists('bomb')) {
            this.load.audio('bomb', 'resources/bomb.mp3');
        }
        if (!this.cache.audio.exists('uo')) {
            this.load.audio('uo', 'resources/uo.wav');
        }
        if (!this.cache.audio.exists('oe')) {
            this.load.audio('oe', 'resources/oe.wav');
        }
        if (!this.cache.audio.exists('setti')) {
            this.load.audio('setti', 'resources/setti.mp3');
        }
        if (!this.cache.audio.exists('cancel')) {
            this.load.audio('cancel', 'resources/cancel.mp3');
        }
        if (!this.cache.audio.exists('scratch2')) {
            this.load.audio('scratch2', 'resources/scratch2.mp3');
        }
        if (!this.cache.audio.exists('ng')) {
            this.load.audio('ng', 'resources/ng.mp3');
        }
        
        // JSONリソース
        if (!this.cache.json.exists('shibou')) {
            this.load.json('shibou', 'resources/shibou.json');
        }
        if (!this.cache.json.exists('cv')) {
            this.load.json('cv', 'resources/cv.json');
        }
    }
    
    /**
     * タイトルシーンへの遷移（フェードアウト）
     * @param {string} userId - ユーザーID（オプション）
     */
    transitionToTitle(userId = null) {
        const fadeDuration = 500; // フェードアウトの時間（ミリ秒）
        
        // ユーザーIDが渡されていない場合はlocalStorageから取得
        if (!userId) {
            userId = localStorage.getItem('userId');
        }
        
        // Phaserのカメラをフェードアウト
        this.cameras.main.fadeOut(fadeDuration, 0, 0, 0);
        
        // フェードアウト完了後にシーン遷移
        this.cameras.main.once('camerafadeoutcomplete', () => {
            if (this.splashImage) {
                this.splashImage.destroy();
                this.splashImage = null;
            }
            if (this.loadingText) {
                this.loadingText.destroy();
                this.loadingText = null;
            }
            
            // ユーザーIDをTitleSceneに渡す
            this.scene.start('TitleScene', { userId: userId });
        });
    }
    
    /**
     * シーンが停止する時のクリーンアップ
     */
    shutdown() {
        console.log('EntryScene: shutdown() called');
        
        // HTMLのinput要素を削除
        if (this.userIdInput && this.userIdInput.parentNode) {
            this.userIdInput.parentNode.removeChild(this.userIdInput);
        }
        if (this.passwordInput && this.passwordInput.parentNode) {
            this.passwordInput.parentNode.removeChild(this.passwordInput);
        }
        
        if (this.splashImage) {
            this.splashImage.destroy();
            this.splashImage = null;
        }
        if (this.loadingText) {
            this.loadingText.destroy();
            this.loadingText = null;
        }
    }
}

