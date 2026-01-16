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
                rankCounts: {},
                personalBest_normal: 0,
                personalBest_rankMatch: {}
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
        const { unlockedTrophies, collectedShibou, playCount, rankCounts, personalBest_normal, personalBest_rankMatch } = body;

        const db = DatabaseAdapterFactory.create();
        
        // 既存データを取得
        const existingData = await db.getTrophies(userId);
        
        // 自己ベストのマージ処理
        let mergedPersonalBest_rankMatch = existingData?.personalBest_rankMatch || {};
        if (personalBest_rankMatch !== undefined) {
            // 日付ごとの自己ベストをマージ（新しい値が大きい場合は更新）
            if (typeof personalBest_rankMatch === 'object' && personalBest_rankMatch !== null) {
                Object.keys(personalBest_rankMatch).forEach(dateString => {
                    const newDistance = personalBest_rankMatch[dateString];
                    const existingDistance = mergedPersonalBest_rankMatch[dateString] || 0;
                    if (newDistance > existingDistance) {
                        mergedPersonalBest_rankMatch[dateString] = newDistance;
                    }
                });
            }
        }
        
        const trophyData = {
            userId,
            unlockedTrophies: unlockedTrophies !== undefined ? unlockedTrophies : (existingData?.unlockedTrophies || []),
            collectedShibou: collectedShibou !== undefined ? collectedShibou : (existingData?.collectedShibou || []),
            playCount: playCount !== undefined ? playCount : (existingData?.playCount || 0),
            rankCounts: rankCounts !== undefined ? rankCounts : (existingData?.rankCounts || {}),
            personalBest_normal: personalBest_normal !== undefined ? Math.max(personalBest_normal, existingData?.personalBest_normal || 0) : (existingData?.personalBest_normal || 0),
            personalBest_rankMatch: mergedPersonalBest_rankMatch,
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

