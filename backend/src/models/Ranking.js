/**
 * ランキングデータモデル
 */
class Ranking {
    /**
     * ランキングレコードを作成
     * @param {string} rankingType - ランキングタイプ ('distance' または 'rankMatch')
     * @param {string} dateString - 日付文字列（rankMatchの場合のみ使用）
     * @param {number} distance - 飛距離
     * @param {string} name - プレイヤー名
     * @param {string} userId - ユーザーID（オプション）
     * @returns {Object} ランキングレコード
     */
    static createRecord(rankingType, dateString, distance, name, userId = null) {
        return {
            distance: distance,
            name: name,
            userId: userId,
            date: new Date().toISOString()
        };
    }

    /**
     * ランキングキーを生成
     * @param {string} rankingType - ランキングタイプ
     * @param {string} dateString - 日付文字列（rankMatchの場合のみ）
     * @returns {string} ランキングキー
     */
    static generateKey(rankingType, dateString = null) {
        if (rankingType === 'rankMatch' && dateString) {
            return `rankMatch_${dateString}`;
        }
        return 'distance';
    }

    /**
     * ランキングレコードを検証
     * @param {Object} record - ランキングレコード
     * @returns {boolean} 有効な場合はtrue
     */
    static validateRecord(record) {
        return record &&
            typeof record.distance === 'number' &&
            typeof record.name === 'string' &&
            record.name.length > 0 &&
            record.name.length <= 5;
    }
}

module.exports = Ranking;

