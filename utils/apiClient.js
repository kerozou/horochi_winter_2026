/**
 * バックエンドAPIクライアント
 */
export class ApiClient {
    constructor(baseUrl = null) {
        // 環境変数またはデフォルト値からベースURLを取得
        // 開発環境では serverless-offline を使用する場合: http://localhost:3000
        // 本番環境では API Gateway のエンドポイントを使用
        this.baseUrl = baseUrl || 
            (typeof window !== 'undefined' && window.API_BASE_URL) ||
            (typeof process !== 'undefined' && process.env && process.env.API_BASE_URL) ||
            'http://localhost:3000'; // デフォルトはローカル開発サーバー
    }

    /**
     * APIリクエストを送信
     */
    async request(endpoint, options = {}) {
        const url = `${this.baseUrl}${endpoint}`;
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        const config = {
            ...defaultOptions,
            ...options,
            headers: {
                ...defaultOptions.headers,
                ...options.headers
            }
        };

        try {
            const response = await fetch(url, config);
            let data;
            
            // レスポンスがJSONかどうかを確認
            const contentType = response.headers.get('content-type');
            if (contentType && contentType.includes('application/json')) {
                data = await response.json();
            } else {
                const text = await response.text();
                throw new Error(text || `HTTP error! status: ${response.status}`);
            }
            
            if (!response.ok) {
                const error = new Error(data.message || `HTTP error! status: ${response.status}`);
                error.status = response.status;
                error.data = data;
                throw error;
            }
            
            return data;
        } catch (error) {
            console.error('API request error:', error);
            // ネットワークエラーの場合
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                throw new Error('ネットワークエラーが発生しました。サーバーに接続できません。');
            }
            throw error;
        }
    }

    /**
     * ユーザー登録
     */
    async register(userId, password, email = null) {
        const body = { userId, password };
        if (email) {
            body.email = email;
        }
        
        return await this.request('/auth/register', {
            method: 'POST',
            body: JSON.stringify(body)
        });
    }

    /**
     * ユーザーログイン
     */
    async login(userId, password) {
        return await this.request('/auth/login', {
            method: 'POST',
            body: JSON.stringify({ userId, password })
        });
    }

    /**
     * ユーザー情報取得
     */
    async getUser(token) {
        return await this.request('/auth/user', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    /**
     * トロフィーデータ取得
     */
    async getTrophies(token) {
        return await this.request('/trophies', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    /**
     * トロフィーデータ更新
     */
    async updateTrophies(token, trophyData) {
        return await this.request('/trophies', {
            method: 'PUT',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(trophyData)
        });
    }

    /**
     * お気に入り一覧取得
     */
    async getFavorites(token) {
        return await this.request('/favorites', {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    /**
     * お気に入り保存
     */
    async saveFavorite(token, favoriteData) {
        return await this.request('/favorites', {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify(favoriteData)
        });
    }

    /**
     * お気に入り削除
     */
    async deleteFavorite(token, favoriteId) {
        return await this.request(`/favorites/${favoriteId}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${token}`
            }
        });
    }

    /**
     * ランキングを取得
     * @param {string} rankingType - 'distance' または 'rankMatch'
     * @param {string} dateString - 日付文字列（rankMatchの場合のみ）
     * @param {number} limit - 取得件数（デフォルト: 10）
     * @param {string} token - 認証トークン（オプション）
     */
    async getRanking(rankingType = 'distance', dateString = null, limit = 10, token = null) {
        const params = new URLSearchParams({
            type: rankingType,
            limit: limit.toString()
        });
        if (dateString) {
            params.append('date', dateString);
        }
        
        const headers = {};
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return await this.request(`/rankings?${params.toString()}`, {
            method: 'GET',
            headers
        });
    }

    /**
     * ランキングに記録を追加
     * @param {string} rankingType - 'distance' または 'rankMatch'
     * @param {number} distance - 飛距離
     * @param {string} name - プレイヤー名
     * @param {string} dateString - 日付文字列（rankMatchの場合のみ）
     * @param {string} token - 認証トークン（オプション）
     */
    async updateRanking(rankingType, distance, name, dateString = null, token = null) {
        const body = {
            rankingType,
            distance,
            name
        };
        if (dateString) {
            body.dateString = dateString;
        }
        
        const headers = {
            'Content-Type': 'application/json'
        };
        if (token) {
            headers['Authorization'] = `Bearer ${token}`;
        }
        
        return await this.request('/rankings', {
            method: 'POST',
            headers,
            body: JSON.stringify(body)
        });
    }
}

// シングルトンインスタンス（遅延初期化）
let _apiClientInstance = null;

export function getApiClient() {
    if (!_apiClientInstance) {
        // GameConfigが利用可能な場合はそれを使用
        let baseUrl = null;
        if (typeof window !== 'undefined' && window.GameConfig?.api?.baseUrl) {
            baseUrl = window.GameConfig.api.baseUrl;
        } else if (typeof window !== 'undefined' && window.API_BASE_URL) {
            baseUrl = window.API_BASE_URL;
        }
        _apiClientInstance = new ApiClient(baseUrl);
    }
    return _apiClientInstance;
}

// 後方互換性のため、直接インスタンスもエクスポート（安全に初期化）
let _apiClient = null;
try {
    _apiClient = getApiClient();
} catch (error) {
    console.warn('Failed to initialize API client:', error);
    // エラーが発生してもゲームは起動できるようにする
    _apiClient = new ApiClient();
}
export const apiClient = _apiClient;

