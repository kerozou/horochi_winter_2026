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
            ...(error && { error: error.message || error })
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

