/**
 * APIレスポンスヘルパー
 */
function successResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Max-Age': '60', // 1分
        },
        body: JSON.stringify({
            success: true,
            data
        })
    };
}

function errorResponse(statusCode = 400, message = 'Error', error = null) {
    // エラーオブジェクトを安全にシリアライズ
    let errorDetails = null;
    if (error) {
        if (typeof error === 'string') {
            errorDetails = error;
        } else if (error instanceof Error) {
            errorDetails = {
                message: error.message,
                name: error.name,
                ...(error.stack && process.env.NODE_ENV !== 'production' && { stack: error.stack })
            };
        } else {
            errorDetails = error;
        }
    }
    
    const response = {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization,X-Amz-Date,X-Api-Key,X-Amz-Security-Token',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
            'Access-Control-Max-Age': '60', // 1分
        },
        body: JSON.stringify({
            success: false,
            message,
            ...(errorDetails && { error: errorDetails })
        })
    };
    
    return response;
}

function unauthorizedResponse(message = 'Unauthorized') {
    return errorResponse(401, message);
}

function notFoundResponse(message = 'Not found') {
    return errorResponse(404, message);
}

module.exports = {
    successResponse,
    errorResponse,
    unauthorizedResponse,
    notFoundResponse
};

