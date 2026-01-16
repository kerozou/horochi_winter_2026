const DatabaseAdapterFactory = require('../adapters/DatabaseAdapterFactory');
const Trophy = require('../models/Trophy');
const { getUserIdFromRequest } = require('../utils/auth');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/response');

/**
 * トロフィーデータ取得
 */
async function getTrophies(event) {
    try {
        const userId = getUserIdFromRequest(event);
        if (!userId) {
            return unauthorizedResponse('Invalid or missing token');
        }

        const db = DatabaseAdapterFactory.create();
        const trophyData = await db.getTrophies(userId);

        if (!trophyData) {
            // 初期データを返す
            return successResponse({
                unlockedTrophies: [],
                collectedShibou: [],
                playCount: 0,
                rankCounts: {}
            });
        }

        const trophy = new Trophy(trophyData);
        return successResponse(trophy.toJSON());
    } catch (error) {
        console.error('Get trophies error:', error);
        return errorResponse(500, 'Internal server error', error);
    }
}

/**
 * トロフィーデータ更新
 */
async function updateTrophies(event) {
    try {
        const userId = getUserIdFromRequest(event);
        if (!userId) {
            return unauthorizedResponse('Invalid or missing token');
        }

        const body = JSON.parse(event.body || '{}');
        const { unlockedTrophies, collectedShibou, playCount, rankCounts } = body;

        const db = DatabaseAdapterFactory.create();
        
        // 既存データを取得
        const existingData = await db.getTrophies(userId);
        
        const trophyData = {
            userId,
            unlockedTrophies: unlockedTrophies !== undefined ? unlockedTrophies : (existingData?.unlockedTrophies || []),
            collectedShibou: collectedShibou !== undefined ? collectedShibou : (existingData?.collectedShibou || []),
            playCount: playCount !== undefined ? playCount : (existingData?.playCount || 0),
            rankCounts: rankCounts !== undefined ? rankCounts : (existingData?.rankCounts || {}),
            updatedAt: new Date().toISOString()
        };

        await db.saveTrophies(userId, trophyData);

        const trophy = new Trophy(trophyData);
        return successResponse(trophy.toJSON());
    } catch (error) {
        console.error('Update trophies error:', error);
        return errorResponse(500, 'Internal server error', error);
    }
}

// Lambda関数のエントリーポイント
module.exports.getTrophies = async (event) => {
    return await getTrophies(event);
};

module.exports.updateTrophies = async (event) => {
    return await updateTrophies(event);
};

