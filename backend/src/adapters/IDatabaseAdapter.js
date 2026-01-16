/**
 * データベースアダプタのインターフェース
 */
class IDatabaseAdapter {
    /**
     * ユーザー情報を取得
     * @param {string} userId - ユーザーID
     * @returns {Promise<Object|null>} ユーザー情報
     */
    async getUser(userId) {
        throw new Error('getUser method must be implemented');
    }

    /**
     * ユーザー情報を保存
     * @param {Object} userData - ユーザーデータ
     * @returns {Promise<Object>} 保存されたユーザー情報
     */
    async saveUser(userData) {
        throw new Error('saveUser method must be implemented');
    }

    /**
     * ユーザー名でユーザーを検索
     * @param {string} username - ユーザー名
     * @returns {Promise<Object|null>} ユーザー情報
     */
    async getUserByUsername(username) {
        throw new Error('getUserByUsername method must be implemented');
    }

    /**
     * トロフィーデータを取得
     * @param {string} userId - ユーザーID
     * @returns {Promise<Object|null>} トロフィーデータ
     */
    async getTrophies(userId) {
        throw new Error('getTrophies method must be implemented');
    }

    /**
     * トロフィーデータを保存
     * @param {string} userId - ユーザーID
     * @param {Object} trophyData - トロフィーデータ
     * @returns {Promise<Object>} 保存されたトロフィーデータ
     */
    async saveTrophies(userId, trophyData) {
        throw new Error('saveTrophies method must be implemented');
    }

    /**
     * お気に入り一覧を取得
     * @param {string} userId - ユーザーID
     * @returns {Promise<Array>} お気に入り一覧
     */
    async getFavorites(userId) {
        throw new Error('getFavorites method must be implemented');
    }

    /**
     * お気に入りを保存
     * @param {string} userId - ユーザーID
     * @param {Object} favoriteData - お気に入りデータ
     * @returns {Promise<Object>} 保存されたお気に入り
     */
    async saveFavorite(userId, favoriteData) {
        throw new Error('saveFavorite method must be implemented');
    }

    /**
     * お気に入りを削除
     * @param {string} userId - ユーザーID
     * @param {string} favoriteId - お気に入りID
     * @returns {Promise<boolean>} 削除成功時true
     */
    async deleteFavorite(userId, favoriteId) {
        throw new Error('deleteFavorite method must be implemented');
    }

    /**
     * ランキングを取得
     * @param {string} rankingKey - ランキングキー
     * @param {number} limit - 取得件数
     * @returns {Promise<Array>} ランキングレコードの配列
     */
    async getRanking(rankingKey, limit = 10) {
        throw new Error('getRanking method must be implemented');
    }

    /**
     * ランキングに記録を追加
     * @param {string} rankingKey - ランキングキー
     * @param {Object} record - ランキングレコード
     * @param {number} limit - 保持する最大件数
     * @returns {Promise<Array>} 更新後のランキングレコードの配列
     */
    async updateRanking(rankingKey, record, limit = 10) {
        throw new Error('updateRanking method must be implemented');
    }
}

module.exports = IDatabaseAdapter;

