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
        
        // カメラが初期化されているか確認
        if (!this.cameras || !this.cameras.main) {
            console.error('Camera not initialized in create()');
            // カメラが初期化されていない場合は少し待ってから再試行
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
            centerY + 200,
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
            const userIdInputY = canvasRect.top - 20 + (centerY - 60) * scaleY;
            
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
            const passwordInputY = canvasRect.top - 20 + (centerY + 20) * scaleY;
            
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
        
        // 登録/ログインボタン（左側）
        const loginButton = this.createButton(
            centerX - 250,
            centerY + 100,
            '登録/ログイン',
            () => {
                this.handleLoginOrRegister();
            }
        );
        this.loginButton = loginButton;
        
        // 「とにかくロケットを飛ばす」ボタン（右側）
        const guestLoginButton = this.createButton(
            centerX + 250,
            centerY + 100,
            '🚀 とにかくロケットを飛ばす',
            () => {
                this.handleGuestLogin();
            }
        );
        this.guestLoginButton = guestLoginButton;
        
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
        // カメラが初期化されているか確認
        if (!this.cameras || !this.cameras.main) {
            console.error('Camera not initialized in checkServerConnection');
            return;
        }
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        
        // オフラインモード表示用テキスト（初期状態では非表示）
        const offlineModeText = this.add.text(
            centerX,
            screenHeight - 30,
            '',
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
                
                // 200 OKの場合は接続成功
                if (response.ok) {
                    console.log('Server connection successful, status:', response.status);
                    this.offlineModeText.setVisible(false);
                } else {
                    // 200以外のステータスコードの場合は疎通できないとみなす
                    console.warn('Server connection failed, status:', response.status);
                    this.offlineModeText.setVisible(true);
                }
            } catch (error) {
                clearTimeout(timeoutId);
                
                console.warn('Server connection check error:', {
                    name: error.name,
                    message: error.message
                });
                
                // エラーが発生した場合は疎通できないとみなす（オフラインモード表示）
                this.offlineModeText.setVisible(true);
            }
        } catch (error) {
            console.warn('Server connection check failed:', error);
            // エラーが発生した場合はオフラインモードとみなす
            this.offlineModeText.setVisible(true);
        }
    }
    
    /**
     * ゲストユーザーでログイン（GUEST/guest）
     */
    async handleGuestLogin() {
        const userId = 'GUEST';
        const password = 'guest';
        
        // エラーメッセージを非表示
        this.hideError();
        
        // オフラインモード（ローカルストレージを使用）
        const useOfflineMode = () => {
            // ローカルストレージに保存
            localStorage.setItem('userId', userId);
            localStorage.setItem('userPassword', password);
            localStorage.setItem('isOfflineMode', 'true');
            
            console.log('Offline mode: Guest user logged in:', userId);
            
            // ランキング情報とトロフィー情報のキャッシュをクリア
            this.clearUserDataCache();
            
            // 入力フォームを削除
            this.removeInputForms();
            
            // ローディング表示
            this.showLoading();
            
            // リソースをロードしてからタイトルシーンに遷移
            this.loadResourcesAndTransition(userId);
            return true;
        };
        
        // APIクライアントが利用可能か確認
        if (!this.apiClient) {
            // APIクライアントが利用できない場合はオフラインモードを使用
            console.warn('API client not available, using offline mode for guest');
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
                if (loginError.status) {
                    // API Gatewayに接続できているが、Lambda関数でエラーが発生した場合
                    // ログインに失敗した場合は登録を試みる
                    try {
                        response = await this.apiClient.register(userId, password);
                    } catch (registerError) {
                        // 登録も失敗した場合
                        if (registerError.status) {
                            // API Gatewayに接続できているが、Lambda関数でエラーが発生した場合
                            // ゲストユーザーの場合はオフラインモードにフォールバック
                            console.warn('Guest login/register failed, using offline mode');
                            useOfflineMode();
                            return;
                        } else {
                            // ネットワークエラーまたはCORSエラーの場合
                            console.warn('Network error during guest register, falling back to offline mode');
                            isNetworkError = true;
                        }
                    }
                } else {
                    // ネットワークエラーまたはCORSエラーの場合
                    console.warn('Network error during guest login, falling back to offline mode');
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
                    console.log('Auth token saved for guest');
                }
                
                // ユーザー情報をlocalStorageに保存
                if (response.data.user && response.data.user.userId) {
                    localStorage.setItem('userId', response.data.user.userId);
                    console.log('Guest user ID saved:', response.data.user.userId);
                }
                
                // オフラインモードフラグをクリア
                localStorage.removeItem('isOfflineMode');
                
                // ランキング情報とトロフィー情報のキャッシュをクリア
                this.clearUserDataCache();
                
                // サーバーから最新の情報をロード
                await this.loadUserDataFromServer(response.data.user?.userId, response.data.token);
                
                // 入力フォームを削除
                this.removeInputForms();
                
                // リソースをロードしてからタイトルシーンに遷移
                console.log('Loading resources before transitioning to TitleScene (guest)');
                this.loadResourcesAndTransition(response.data.user?.userId);
            } else {
                // ログイン/登録に失敗した場合はオフラインモードを使用
                console.warn('Guest login/register failed, using offline mode');
                useOfflineMode();
            }
        } catch (error) {
            console.error('Guest login/Register error:', error);
            // エラーが発生した場合はオフラインモードにフォールバック
            console.warn('Error during guest login, falling back to offline mode');
            useOfflineMode();
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
            
            // ランキング情報とトロフィー情報のキャッシュをクリア（オフラインモードでも）
            this.clearUserDataCache();
            
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
            
            // リソースをロードしてからタイトルシーンに遷移
            this.loadResourcesAndTransition(userId);
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
                
                // ランキング情報とトロフィー情報のキャッシュをクリア
                this.clearUserDataCache();
                
                // サーバーから最新の情報をロード
                await this.loadUserDataFromServer(response.data.user?.userId, response.data.token);
                
                // 入力フィールドをクリア
                if (this.passwordInput) {
                    this.passwordInput.value = '';
                }
                
                // エラーメッセージを非表示
                this.hideError();
                
                // 入力フォームを削除
                this.removeInputForms();
                
                // リソースをロードしてからタイトルシーンに遷移
                console.log('Loading resources before transitioning to TitleScene');
                this.loadResourcesAndTransition(response.data.user?.userId);
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
     * ユーザーデータのキャッシュをクリア（ランキング情報とトロフィー情報）
     */
    clearUserDataCache() {
        console.log('Clearing user data cache...');
        
        // ランキング情報をクリア
        localStorage.removeItem('distanceRanking');
        
        // ランクマッチランキングをクリア（すべての日付）
        const keysToRemove = [];
        for (let i = 0; i < localStorage.length; i++) {
            const key = localStorage.key(i);
            if (key && (key.startsWith('rankMatchRanking_') || key.startsWith('personalBest_rankMatch_'))) {
                keysToRemove.push(key);
            }
        }
        keysToRemove.forEach(key => {
            localStorage.removeItem(key);
            console.log('Removed:', key);
        });
        
        // トロフィー情報をクリア
        localStorage.removeItem('unlockedTrophies');
        localStorage.removeItem('collectedShibou');
        localStorage.removeItem('playCount');
        
        // 自己ベストをクリア（通常モード）
        localStorage.removeItem('personalBest_normal');
        // 後方互換性のため、古いキーもクリア
        localStorage.removeItem('personalBest');
        
        console.log('User data cache cleared');
    }
    
    /**
     * サーバーからユーザーデータをロード（トロフィー情報）
     * @param {string} userId - ユーザーID
     * @param {string} token - 認証トークン
     */
    async loadUserDataFromServer(userId, token) {
        if (!this.apiClient || !token) {
            console.warn('API client or token not available, skipping server data load');
            return;
        }
        
        try {
            console.log('Loading user data from server...');
            
            // トロフィー情報をサーバーから取得
            const trophyResponse = await this.apiClient.getTrophies(token);
            if (trophyResponse && trophyResponse.success && trophyResponse.data) {
                const trophyData = trophyResponse.data;
                
                // ローカルストレージに保存
                if (trophyData.unlockedTrophies) {
                    localStorage.setItem('unlockedTrophies', JSON.stringify(trophyData.unlockedTrophies));
                }
                if (trophyData.collectedShibou) {
                    localStorage.setItem('collectedShibou', JSON.stringify(trophyData.collectedShibou));
                }
                if (trophyData.playCount !== undefined) {
                    localStorage.setItem('playCount', trophyData.playCount.toString());
                }
                
                // 自己ベスト情報をローカルストレージに上書き
                if (trophyData.personalBest_normal !== undefined) {
                    localStorage.setItem('personalBest_normal', trophyData.personalBest_normal.toString());
                    console.log(`Loaded personalBest_normal from server: ${trophyData.personalBest_normal}`);
                } else {
                    // サーバーに値がない場合は0を設定（初回プレイ用）
                    localStorage.setItem('personalBest_normal', '0');
                    console.log('No personalBest_normal on server, set to 0');
                }
                if (trophyData.personalBest_rankMatch && typeof trophyData.personalBest_rankMatch === 'object') {
                    // ランクマッチの自己ベストを日付ごとに保存
                    Object.keys(trophyData.personalBest_rankMatch).forEach(dateString => {
                        const key = `personalBest_rankMatch_${dateString}`;
                        localStorage.setItem(key, trophyData.personalBest_rankMatch[dateString].toString());
                        console.log(`Loaded ${key} from server: ${trophyData.personalBest_rankMatch[dateString]}`);
                    });
                }
                
                console.log('Trophy data and personal best loaded from server');
            }
            
            // ランキング情報はゲームプレイ時に必要に応じてロードされるため、ここではロードしない
            
            console.log('User data loaded from server');
        } catch (error) {
            console.error('Error loading user data from server:', error);
            // エラーが発生してもゲームは続行できるようにする
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
        if (this.guestLoginButton) {
            this.guestLoginButton.setVisible(false);
        }
    }
    
    /**
     * ローディング表示
     */
    showLoading() {
        // カメラが初期化されているか確認
        if (!this.cameras || !this.cameras.main) {
            console.error('Camera not initialized in showLoading');
            return;
        }
        
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
        
        const screenWidth = this.cameras.main.width;
        const screenHeight = this.cameras.main.height;
        const centerX = screenWidth / 2;
        const centerY = screenHeight / 2;
        
        // ローディングテキスト
        const loadingText = this.add.text(
            centerX,
            centerY - 50,
            'リソースを読み込み中...',
            {
                fontSize: '32px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 4
            }
        );
        loadingText.setOrigin(0.5);
        loadingText.setScrollFactor(0);
        loadingText.setDepth(2000);
        
        // プログレスバーの背景
        const progressBarBg = this.add.rectangle(
            centerX,
            centerY + 30,
            screenWidth * 0.6,
            30,
            0x333333
        );
        progressBarBg.setOrigin(0.5);
        progressBarBg.setScrollFactor(0);
        progressBarBg.setDepth(2000);
        
        // プログレスバー
        const progressBar = this.add.rectangle(
            centerX - (screenWidth * 0.6) / 2,
            centerY + 30,
            0,
            30,
            0x00ff00
        );
        progressBar.setOrigin(0, 0.5);
        progressBar.setScrollFactor(0);
        progressBar.setDepth(2001);
        
        // パーセンテージ表示
        const progressText = this.add.text(
            centerX,
            centerY + 80,
            '0%',
            {
                fontSize: '24px',
                fill: '#ffffff',
                fontStyle: 'bold',
                stroke: '#000000',
                strokeThickness: 2
            }
        );
        progressText.setOrigin(0.5);
        progressText.setScrollFactor(0);
        progressText.setDepth(2000);
        
        // リソースをロード
        this.loadAllResources();
        
        // プログレス更新イベント
        this.load.on('progress', (progress) => {
            const width = (screenWidth * 0.6) * progress;
            progressBar.width = width;
            progressBar.x = centerX - (screenWidth * 0.6) / 2;
            progressText.setText(Math.round(progress * 100) + '%');
        });
        
        // ロード完了イベント
        this.load.once('complete', () => {
            console.log('All resources loaded');
            
            // プログレスバーを削除
            loadingText.destroy();
            progressBarBg.destroy();
            progressBar.destroy();
            progressText.destroy();
            
            // タイトルシーンに遷移
            this.transitionToTitle(userId);
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

