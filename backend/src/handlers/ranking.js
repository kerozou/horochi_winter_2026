const DatabaseAdapterFactory = require('../adapters/DatabaseAdapterFactory');
const Ranking = require('../models/Ranking');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/response');
const { verifyToken } = require('../utils/auth');

/**
 * ランキングを取得
 */
async function getRanking(event) {
    try {
        const rankingType = event.queryStringParameters?.type || 'distance';
        const dateString = event.queryStringParameters?.date || null;
        const limit = parseInt(event.queryStringParameters?.limit || '10');

        const adapter = DatabaseAdapterFactory.create();
        const rankingKey = Ranking.generateKey(rankingType, dateString);
        
        const ranking = await adapter.getRanking(rankingKey, limit);

        return successResponse({
            rankingType,
            dateString,
            records: ranking || []
        });
    } catch (error) {
        console.error('Error getting ranking:', error);
        return errorResponse(500, 'ランキングの取得に失敗しました', error.message);
    }
}

/**
 * ランキングに記録を追加
 */
async function updateRanking(event) {
    try {
        // 認証トークンを取得（オプション）
        const authHeader = event.headers?.Authorization || event.headers?.authorization;
        let userId = null;
        
        if (authHeader && authHeader.startsWith('Bearer ')) {
            const token = authHeader.substring(7);
            try {
                const decoded = verifyToken(token);
                userId = decoded.userId;
            } catch (error) {
                // トークンが無効でも匿名でランキング登録は可能
                console.warn('Invalid token, proceeding as anonymous:', error.message);
            }
        }

        const body = JSON.parse(event.body || '{}');
        const { rankingType, dateString, distance, name } = body;

        // バリデーション
        if (!rankingType || typeof distance !== 'number' || !name) {
            return errorResponse(400, 'ランキングタイプ、飛距離、名前は必須です');
        }

        if (name.length > 5) {
            return errorResponse(400, '名前は5文字以内で入力してください');
        }

        const adapter = DatabaseAdapterFactory.create();
        const rankingKey = Ranking.generateKey(rankingType, dateString);
        
        const record = Ranking.createRecord(rankingType, dateString, distance, name, userId);
        
        if (!Ranking.validateRecord(record)) {
            return errorResponse(400, '無効なランキングレコードです');
        }

        const updatedRanking = await adapter.updateRanking(rankingKey, record, 10);

        return successResponse({
            rankingType,
            dateString,
            records: updatedRanking
        });
    } catch (error) {
        console.error('Error updating ranking:', error);
        return errorResponse(500, 'ランキングの更新に失敗しました', error.message);
    }
}

module.exports.getRanking = async (event) => {
    return await getRanking(event);
};

module.exports.updateRanking = async (event) => {
    return await updateRanking(event);
};

