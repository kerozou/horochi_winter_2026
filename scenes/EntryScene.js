/**
 * エントリーシーン（最初に表示される画面）
 */
export class EntryScene extends Phaser.Scene {
    constructor() {
        super({ key: 'EntryScene' });
        this.apiClient = null;
    }
    
    async init() {
        // apiClientを動的に読み込む（エラーが発生してもゲームは起動できるように）
        try {
            const apiClientModule = await import('../utils/apiClient.js');
            this.apiClient = apiClientModule.apiClient || apiClientModule.getApiClient?.();
        } catch (error) {
            console.warn('Failed to load API client:', error);
            // APIクライアントが読み込めなくてもゲームは起動できるようにする
        }
    }
    
    create() {
        console.log('EntryScene: create() called');
        
        // ユーザーIDとパスワードのキャッシュをクリア
        localStorage.removeItem('userId');
        localStorage.removeItem('userPassword');
        localStorage.removeItem('authToken');
        localStorage.removeItem('isOfflineMode');
        console.log('Cleared user authentication cache');
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // 背景（黒塗り）
        const graphics = this.add.graphics();
        graphics.fillStyle(0x000000); // 黒色
        graphics.fillRect(0, 0, screenWidth, screenHeight);
        
        // タイトルロゴ
        const title = this.add.text(
            centerX,
            centerY - 200,
            'Horochi Winter 2026',
            {
                fontSize: '48px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        title.setOrigin(0.5);
        
        // ユーザーID入力ラベル
        const userIdLabel = this.add.text(
            centerX,
            centerY - 100,
            'ユーザーID（5文字の英数字）',
            {
                fontSize: '24px',
                fill: '#ffffff'
            }
        );
        userIdLabel.setOrigin(0.5);
        this.userIdLabel = userIdLabel;
        
        // パスワード入力ラベル
        const passwordLabel = this.add.text(
            centerX,
            centerY - 20,
            'パスワード',
            {
                fontSize: '24px',
                fill: '#ffffff'
            }
        );
        passwordLabel.setOrigin(0.5);
        this.passwordLabel = passwordLabel;
        
        // エラーメッセージ表示用（初期状態では非表示）
        const errorText = this.add.text(
            centerX,
            centerY + 100,
            '',
            {
                fontSize: '20px',
                fill: '#ff0000',
                fontStyle: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 20, y: 10 },
                wordWrap: { width: 600 }
            }
        );
        errorText.setOrigin(0.5);
        errorText.setVisible(false);
        this.errorText = errorText;
        
        // HTMLのinput要素を作成
        const gameContainer = document.getElementById('game-container');
        if (gameContainer) {
            const canvasRect = this.game.canvas.getBoundingClientRect();
            const scaleX = this.game.scale.displaySize.width / this.game.scale.gameSize.width;
            const scaleY = this.game.scale.displaySize.height / this.game.scale.gameSize.height;
            
            // ユーザーID入力フィールド
            const userIdInputX = canvasRect.left + centerX * scaleX;
            const userIdInputY = canvasRect.top + (centerY - 60) * scaleY;
            
            const userIdInput = document.createElement('input');
            userIdInput.type = 'text';
            userIdInput.maxLength = 5;
            userIdInput.style.position = 'fixed';
            userIdInput.style.left = (userIdInputX - 100) + 'px';
            userIdInput.style.top = userIdInputY + 'px';
            userIdInput.style.width = (200 * scaleX) + 'px';
            userIdInput.style.height = (35 * scaleY) + 'px';
            userIdInput.style.fontSize = (20 * scaleX) + 'px';
            userIdInput.style.textAlign = 'center';
            userIdInput.style.textTransform = 'uppercase';
            userIdInput.style.border = '3px solid #ffffff';
            userIdInput.style.borderRadius = '5px';
            userIdInput.style.backgroundColor = '#1a1a2e';
            userIdInput.style.color = '#ffffff';
            userIdInput.style.zIndex = '1000';
            userIdInput.placeholder = 'ABC12';
            
            // アルファベットと数字のみ入力可能にする
            userIdInput.addEventListener('input', (e) => {
                e.target.value = e.target.value.replace(/[^A-Za-z0-9]/g, '').toUpperCase().substring(0, 5);
            });
            
            gameContainer.appendChild(userIdInput);
            this.userIdInput = userIdInput;
            
            // パスワード入力フィールド
            const passwordInputY = canvasRect.top + (centerY + 20) * scaleY;
            
            const passwordInput = document.createElement('input');
            passwordInput.type = 'password';
            passwordInput.style.position = 'fixed';
            passwordInput.style.left = (userIdInputX - 100) + 'px';
            passwordInput.style.top = passwordInputY + 'px';
            passwordInput.style.width = (200 * scaleX) + 'px';
            passwordInput.style.height = (35 * scaleY) + 'px';
            passwordInput.style.fontSize = (20 * scaleX) + 'px';
            passwordInput.style.textAlign = 'center';
            passwordInput.style.border = '3px solid #ffffff';
            passwordInput.style.borderRadius = '5px';
            passwordInput.style.backgroundColor = '#1a1a2e';
            passwordInput.style.color = '#ffffff';
            passwordInput.style.zIndex = '1000';
            passwordInput.placeholder = 'パスワード';
            
            // Enterキーでログイン
            passwordInput.addEventListener('keydown', (e) => {
                if (e.key === 'Enter') {
                    this.handleLoginOrRegister();
                }
            });
            
            gameContainer.appendChild(passwordInput);
            this.passwordInput = passwordInput;
        }
        
        // 登録/ログインボタン
        const loginButton = this.createButton(
            centerX,
            centerY + 60,
            '登録/ログイン',
            () => {
                this.handleLoginOrRegister();
            }
        );
        this.loginButton = loginButton;
        
        // アニメーション効果（タイトル）
        this.tweens.add({
            targets: title,
            scale: { from: 0.8, to: 1.0 },
            duration: 1000,
            ease: 'Back.easeOut'
        });
        
        // フェードイン効果
        this.cameras.main.fadeIn(500, 0, 0, 0);
        
        // サーバーへの疎通確認
        this.checkServerConnection();
    }
    
    /**
     * サーバーへの疎通確認
     */
    async checkServerConnection() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        
        // オフラインモード表示用テキスト（初期状態では非表示）
        const offlineModeText = this.add.text(
            centerX,
            screenHeight - 30,
            '※オフラインモードで接続中',
            {
                fontSize: '20px',
                fill: '#ffff00',
                fontStyle: 'bold',
                backgroundColor: 'rgba(0, 0, 0, 0.7)',
                padding: { x: 15, y: 8 }
            }
        );
        offlineModeText.setOrigin(0.5);
        offlineModeText.setScrollFactor(0);
        offlineModeText.setDepth(1000);
        offlineModeText.setVisible(false);
        this.offlineModeText = offlineModeText;
        
        // APIクライアントが利用可能か確認
        if (!this.apiClient) {
            // APIクライアントが利用できない場合はオフラインモード表示
            this.offlineModeText.setVisible(true);
            return;
        }
        
        try {
            // サーバーへの疎通確認（タイムアウトを設定：3秒）
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 3000);
            
            try {
                // ヘルスチェックエンドポイントにリクエストを送る
                console.log('Checking server connection to:', `${this.apiClient.baseUrl}/health`);
                const response = await fetch(`${this.apiClient.baseUrl}/health`, {
                    method: 'GET',
                    signal: controller.signal,
                    headers: {
                        'Content-Type': 'application/json'
                    }
                });
                clearTimeout(timeoutId);
                
                // レスポンスが返ってきた場合は接続成功（404、502、500でもAPI Gatewayに接続できているとみなす）
                // 404: エンドポイントが存在しない（API Gatewayに接続できている）
                // 502/500: Lambda関数でエラー（API Gatewayに接続できている）
                // 200: 正常（API Gatewayに接続できている）
                console.log('Server connection successful, status:', response.status);
                this.offlineModeText.setVisible(false);
            } catch (error) {
                clearTimeout(timeoutId);
                
                console.log('Server connection check error:', {
                    name: error.name,
                    message: error.message,
                    type: typeof error
                });
                
                // タイムアウトエラーの場合
                if (error.name === 'AbortError') {
                    console.warn('Server connection timeout, showing offline mode message');
                    this.offlineModeText.setVisible(true);
                    return;
                }
                
                // TypeError（Failed to fetch）の場合、詳細を確認
                if (error.name === 'TypeError' && error.message.includes('fetch')) {
                    // 実際のネットワークエラーかどうかを判断するため、エラーメッセージを確認
                    const errorMessage = error.message || '';
                    
                    // 明確にネットワーク接続エラーの場合のみオフラインモード表示
                    // CORSエラーや502エラーなどは、API Gatewayに接続できているとみなす
                    if (errorMessage.includes('ERR_CONNECTION_REFUSED') ||
                        errorMessage.includes('ERR_NAME_NOT_RESOLVED') ||
                        errorMessage.includes('ERR_NETWORK_CHANGED') ||
                        errorMessage.includes('ERR_INTERNET_DISCONNECTED')) {
                        console.warn('Network connection error, showing offline mode message');
                        this.offlineModeText.setVisible(true);
                    } else {
                        // その他のエラー（CORS、502など）はAPI Gatewayに接続できているとみなす
                        // Failed to fetchはCORSエラーの可能性が高いが、API Gatewayには接続できている
                        console.log('API Gateway is reachable (got error but not network connection error). Error:', errorMessage);
                        this.offlineModeText.setVisible(false);
                    }
                } else {
                    // その他のエラーは接続できている可能性があるとみなす
                    console.log('Server might be reachable (got error but not network error)');
                    this.offlineModeText.setVisible(false);
                }
            }
        } catch (error) {
            console.warn('Server connection check failed:', error);
            // エラーが発生した場合はオフラインモードとみなす
            this.offlineModeText.setVisible(true);
        }
    }
    
    /**
     * ログインまたは登録を処理
     */
    async handleLoginOrRegister() {
        const userId = this.userIdInput?.value?.toUpperCase().trim();
        const password = this.passwordInput?.value;
        
        // バリデーション
        if (!userId || userId.length !== 5) {
            this.showError('ユーザーIDは5文字の英数字で入力してください');
            return;
        }
        
        if (!password || password.length === 0) {
            this.showError('パスワードを入力してください');
            return;
        }
        
        // ユーザーIDの形式チェック
        const userIdRegex = /^[A-Z0-9]{5}$/;
        if (!userIdRegex.test(userId)) {
            this.showError('ユーザーIDは大文字の英数字のみ使用できます');
            return;
        }
        
        // エラーメッセージを非表示
        this.hideError();
        
        // オフラインモード（ローカルストレージを使用）
        const useOfflineMode = () => {
            // 既存のユーザー情報を確認
            const savedUserId = localStorage.getItem('userId');
            const savedPassword = localStorage.getItem('userPassword');
            
            // 既存ユーザーの場合、パスワードを確認
            if (savedUserId === userId && savedPassword) {
                // パスワードが一致しない場合はエラー
                if (savedPassword !== password) {
                    this.showError('ユーザーIDが使用されている、もしくはパスワードを間違えています');
                    return false;
                }
                // パスワードが一致する場合はログイン成功として処理
                console.log('Offline mode: Login successful for existing user:', userId);
            } else if (savedUserId && savedUserId !== userId) {
                // 別のユーザーIDが既に保存されている場合
                this.showError('ユーザーIDが使用されている、もしくはパスワードを間違えています');
                return false;
            } else {
                // 新規ユーザーの場合、登録として処理
                console.log('Offline mode: Registering new user:', userId);
            }
            
            // ローカルストレージに保存（新規登録または既存ユーザーのログイン）
            localStorage.setItem('userId', userId);
            localStorage.setItem('userPassword', password); // 簡易的な保存（本番環境ではハッシュ化推奨）
            localStorage.setItem('isOfflineMode', 'true');
            
            console.log('Offline mode: User ID saved:', userId);
            
            // 入力フィールドをクリア
            if (this.passwordInput) {
                this.passwordInput.value = '';
            }
            
            // エラーメッセージを非表示
            this.hideError();
            
            // 入力フォームを削除
            this.removeInputForms();
            
            // ローディング表示
            this.showLoading();
            
            // タイトルシーンに遷移
            this.transitionToTitle(userId);
            return true;
        };
        
        // APIクライアントが利用可能か確認
        if (!this.apiClient) {
            // APIクライアントが利用できない場合はオフラインモードを使用
            console.warn('API client not available, using offline mode');
            useOfflineMode();
            return;
        }
        
        try {
            // まずログインを試みる
            let response;
            let isNetworkError = false;
            try {
                response = await this.apiClient.login(userId, password);
            } catch (loginError) {
                // ネットワークエラーまたはCORSエラーの場合はオフラインモードにフォールバック
                // ただし、ステータスコードが設定されている場合は、API Gatewayに接続できているとみなす
                if (loginError.status) {
                    // API Gatewayに接続できているが、Lambda関数でエラーが発生した場合
                    // ログインに失敗した場合は登録を試みる
                    try {
                        response = await this.apiClient.register(userId, password);
                    } catch (registerError) {
                        // 登録も失敗した場合
                        if (registerError.status) {
                            // API Gatewayに接続できているが、Lambda関数でエラーが発生した場合
                            const errorMessage = registerError.message || 'エラーが発生しました';
                            if (errorMessage.includes('already exists') || errorMessage.includes('User ID already exists')) {
                                this.showError('ユーザーIDが使用されている、もしくはパスワードを間違えています');
                            } else {
                                this.showError('ユーザーIDが使用されている、もしくはパスワードを間違えています');
                            }
                            return;
                        } else {
                            // ネットワークエラーまたはCORSエラーの場合
                            console.warn('Network error during register, falling back to offline mode');
                            isNetworkError = true;
                        }
                    }
                } else {
                    // ネットワークエラーまたはCORSエラーの場合
                    console.warn('Network error during login, falling back to offline mode');
                    isNetworkError = true;
                }
            }
            
            // ネットワークエラーの場合はオフラインモードを使用
            if (isNetworkError) {
                useOfflineMode();
                return;
            }
            
            // 成功した場合
            if (response && response.success && response.data) {
                // トークンをlocalStorageに保存
                if (response.data.token) {
                    localStorage.setItem('authToken', response.data.token);
                    console.log('Auth token saved');
                }
                
                // ユーザー情報をlocalStorageに保存
                if (response.data.user && response.data.user.userId) {
                    localStorage.setItem('userId', response.data.user.userId);
                    console.log('User ID saved:', response.data.user.userId);
                }
                
                // オフラインモードフラグをクリア
                localStorage.removeItem('isOfflineMode');
                
                // 入力フィールドをクリア
                if (this.passwordInput) {
                    this.passwordInput.value = '';
                }
                
                // エラーメッセージを非表示
                this.hideError();
                
                // 入力フォームを削除
                this.removeInputForms();
                
                // ローディング表示
                this.showLoading();
                
                // タイトルシーンに遷移（ユーザーIDを渡す）
                console.log('Transitioning to TitleScene with userId:', response.data.user?.userId);
                this.transitionToTitle(response.data.user?.userId);
            } else {
                this.showError('ユーザーIDが使用されている、もしくはパスワードを間違えています');
            }
        } catch (error) {
            console.error('Login/Register error:', error);
            // ネットワークエラーまたはCORSエラーの場合はオフラインモードにフォールバック
            // ただし、ステータスコードが設定されている場合は、API Gatewayに接続できているとみなす
            if (error.status) {
                // API Gatewayに接続できているが、Lambda関数でエラーが発生した場合
                this.showError('ユーザーIDが使用されている、もしくはパスワードを間違えています');
            } else if (error.message && (
                error.message.includes('ネットワークエラー') ||
                error.message.includes('接続できません') ||
                error.name === 'TypeError'
            )) {
                // ネットワークエラーまたはCORSエラーの場合
                console.warn('Network error, falling back to offline mode');
                useOfflineMode();
            } else {
                this.showError('ユーザーIDが使用されている、もしくはパスワードを間違えています');
            }
        }
    }
    
    /**
     * エラーメッセージを表示
     */
    showError(message) {
        if (this.errorText) {
            this.errorText.setText(message);
            this.errorText.setVisible(true);
        }
    }
    
    /**
     * エラーメッセージを非表示
     */
    hideError() {
        if (this.errorText) {
            this.errorText.setVisible(false);
        }
    }
    
    /**
     * ボタンを作成
     */
    createButton(x, y, text, callback) {
        const button = this.add.container(x, y);
        
        // ボタン背景
        const bg = this.add.rectangle(0, 0, 400, 70, 0x4ecdc4);
        bg.setStrokeStyle(4, 0xffffff);
        
        // ボタンテキスト
        const buttonText = this.add.text(0, 0, text, {
            fontSize: '28px',
            fill: '#ffffff',
            fontStyle: 'bold'
        });
        buttonText.setOrigin(0.5);
        
        button.add([bg, buttonText]);
        button.setSize(400, 70);
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
     * 入力フォームを削除
     */
    removeInputForms() {
        // ユーザーID入力フィールドを削除
        if (this.userIdInput && this.userIdInput.parentNode) {
            this.userIdInput.parentNode.removeChild(this.userIdInput);
            this.userIdInput = null;
        }
        
        // パスワード入力フィールドを削除
        if (this.passwordInput && this.passwordInput.parentNode) {
            this.passwordInput.parentNode.removeChild(this.passwordInput);
            this.passwordInput = null;
        }
        
        // ラベルを非表示
        if (this.userIdLabel) {
            this.userIdLabel.setVisible(false);
        }
        if (this.passwordLabel) {
            this.passwordLabel.setVisible(false);
        }
        
        // ボタンを非表示
        if (this.loginButton) {
            this.loginButton.setVisible(false);
        }
    }
    
    /**
     * ローディング表示
     */
    showLoading() {
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // ローディングテキスト
        const loadingText = this.add.text(
            centerX,
            centerY,
            'NowLoading',
            {
                fontSize: '48px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        loadingText.setOrigin(0.5);
        loadingText.setScrollFactor(0);
        loadingText.setDepth(2000);
        
        // 点滅アニメーション
        this.tweens.add({
            targets: loadingText,
            alpha: { from: 1, to: 0.3 },
            duration: 800,
            yoyo: true,
            repeat: -1,
            ease: 'Sine.easeInOut'
        });
        
        this.loadingText = loadingText;
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
            // ローディングテキストを削除
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
        
        // ローディングテキストを削除
        if (this.loadingText) {
            this.loadingText.destroy();
            this.loadingText = null;
        }
    }
}

