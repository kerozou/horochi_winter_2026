/**
 * APIレスポンスヘルパー
 */
function successResponse(data, statusCode = 200) {
    return {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
            success: true,
            data
        })
    };
}

function errorResponse(message, statusCode = 400, error = null) {
    const response = {
        statusCode,
        headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': '*',
            'Access-Control-Allow-Headers': 'Content-Type,Authorization',
            'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS'
        },
        body: JSON.stringify({
            success: false,
            message,
            ...(error && { error: error.message })
        })
    };
    
    return response;
}

function unauthorizedResponse(message = 'Unauthorized') {
    return errorResponse(message, 401);
}

function notFoundResponse(message = 'Not found') {
    return errorResponse(message, 404);
}

module.exports = {
    successResponse,
    errorResponse,
    unauthorizedResponse,
    notFoundResponse
};

