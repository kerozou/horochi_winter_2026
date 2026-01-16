const { successResponse } = require('../utils/response');

/**
 * ヘルスチェックエンドポイント
 */
async function health(event) {
    return successResponse({
        status: 'ok',
        timestamp: new Date().toISOString()
    });
}

module.exports = { health };

