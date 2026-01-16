const DatabaseAdapterFactory = require('../adapters/DatabaseAdapterFactory');
const Favorite = require('../models/Favorite');
const { getUserIdFromRequest } = require('../utils/auth');
const { successResponse, errorResponse, unauthorizedResponse, notFoundResponse } = require('../utils/response');

/**
 * お気に入り一覧取得
 */
async function getFavorites(event) {
    try {
        const userId = getUserIdFromRequest(event);
        if (!userId) {
            return unauthorizedResponse('Invalid or missing token');
        }

        const db = DatabaseAdapterFactory.create();
        const favorites = await db.getFavorites(userId);

        return successResponse(favorites.map(fav => new Favorite(fav).toJSON()));
    } catch (error) {
        console.error('Get favorites error:', error);
        return errorResponse(500, 'Internal server error', error);
    }
}

/**
 * お気に入り保存
 */
async function saveFavorite(event) {
    try {
        const userId = getUserIdFromRequest(event);
        if (!userId) {
            return unauthorizedResponse('Invalid or missing token');
        }

        const body = JSON.parse(event.body || '{}');
        const { name, design, placedParts } = body;

        if (!name || !design) {
            return errorResponse(400, 'Name and design are required');
        }

        const db = DatabaseAdapterFactory.create();
        
        const favoriteData = {
            userId,
            name,
            design,
            placedParts: placedParts || [],
            createdAt: new Date().toISOString()
        };

        const saved = await db.saveFavorite(userId, favoriteData);
        const favorite = new Favorite(saved);

        return successResponse(favorite.toJSON(), 201);
    } catch (error) {
        console.error('Save favorite error:', error);
        return errorResponse(500, 'Internal server error', error);
    }
}

/**
 * お気に入り削除
 */
async function deleteFavorite(event) {
    try {
        const userId = getUserIdFromRequest(event);
        if (!userId) {
            return unauthorizedResponse('Invalid or missing token');
        }

        const favoriteId = event.pathParameters?.id;
        if (!favoriteId) {
            return errorResponse(400, 'Favorite ID is required');
        }

        const db = DatabaseAdapterFactory.create();
        const deleted = await db.deleteFavorite(userId, favoriteId);

        if (!deleted) {
            return notFoundResponse('Favorite not found');
        }

        return successResponse({ message: 'Favorite deleted successfully' });
    } catch (error) {
        console.error('Delete favorite error:', error);
        return errorResponse(500, 'Internal server error', error);
    }
}

// Lambda関数のエントリーポイント
module.exports.getFavorites = async (event) => {
    return await getFavorites(event);
};

module.exports.saveFavorite = async (event) => {
    return await saveFavorite(event);
};

module.exports.deleteFavorite = async (event) => {
    return await deleteFavorite(event);
};

