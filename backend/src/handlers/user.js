const DatabaseAdapterFactory = require('../adapters/DatabaseAdapterFactory');
const User = require('../models/User');
const { generateToken, hashPassword, verifyPassword, getUserIdFromRequest } = require('../utils/auth');
const { successResponse, errorResponse, unauthorizedResponse } = require('../utils/response');
const { generateUserId, validateUserId, normalizeUserId } = require('../utils/userId');

/**
 * ユーザーログイン
 * ユーザーID（5文字の大文字英数字）とパスワードでログイン
 */
async function login(event) {
    try {
        console.log('Login request received:', {
            hasBody: !!event.body,
            bodyLength: event.body ? event.body.length : 0
        });
        
        const db = DatabaseAdapterFactory.create();
        
        let body;
        try {
            body = JSON.parse(event.body || '{}');
        } catch (parseError) {
            console.error('JSON parse error:', parseError);
            return errorResponse(400, 'Invalid JSON in request body', parseError);
        }
        
        const { userId, password } = body;

        if (!userId || !password) {
            return errorResponse(400, 'User ID and password are required');
        }

        // ユーザーIDを正規化
        const normalizedUserId = normalizeUserId(userId);
        if (!normalizedUserId) {
            return errorResponse(400, 'User ID must be 5 characters of uppercase letters and numbers');
        }

        // ユーザーIDでユーザーを取得
        console.log('Fetching user:', normalizedUserId);
        const userData = await db.getUser(normalizedUserId);
        if (!userData) {
            console.log('User not found:', normalizedUserId);
            return unauthorizedResponse('Invalid user ID or password');
        }

        console.log('Verifying password for user:', normalizedUserId);
        const isValid = await verifyPassword(password, userData.passwordHash);
        if (!isValid) {
            console.log('Password verification failed for user:', normalizedUserId);
            return unauthorizedResponse('Invalid user ID or password');
        }

        const user = new User(userData);
        const token = generateToken(user.userId, user.userId); // ユーザーIDをusernameとしても使用

        return successResponse({
            user: user.toPublicJSON(),
            token
        });
    } catch (error) {
        console.error('Login error:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            error: error
        });
        return errorResponse(500, 'Internal server error', error);
    }
}

/**
 * ユーザー登録
 * ユーザーID（5文字の大文字英数字）とパスワードで登録
 * ユーザーIDが指定されていない場合は自動生成
 */
async function register(event) {
    try {
        const db = DatabaseAdapterFactory.create();
        const body = JSON.parse(event.body || '{}');
        let { userId, password, email } = body;

        if (!password) {
            return errorResponse(400, 'Password is required');
        }

        // ユーザーIDが指定されていない場合は自動生成
        if (!userId) {
            // 重複しないユーザーIDを生成（最大10回試行）
            let attempts = 0;
            let normalizedUserId = null;
            do {
                const generated = generateUserId();
                const existing = await db.getUser(generated);
                if (!existing) {
                    normalizedUserId = generated;
                    break;
                }
                attempts++;
            } while (attempts < 10);
            
            if (!normalizedUserId) {
                return errorResponse(500, 'Failed to generate unique user ID. Please try again.');
            }
            userId = normalizedUserId;
        } else {
            // ユーザーIDを正規化
            const normalized = normalizeUserId(userId);
            if (!normalized) {
                return errorResponse(400, 'User ID must be 5 characters of uppercase letters and numbers');
            }
            userId = normalized;
        }

        // 既存ユーザーをチェック
        const existingUser = await db.getUser(userId);
        if (existingUser) {
            return errorResponse(409, 'User ID already exists');
        }

        const passwordHash = await hashPassword(password);

        const userData = {
            userId,
            username: userId, // ユーザーIDをusernameとしても使用
            email: email || null,
            passwordHash,
            createdAt: new Date().toISOString()
        };

        await db.saveUser(userData);

        const user = new User(userData);
        const token = generateToken(user.userId, user.userId);

        return successResponse({
            user: user.toPublicJSON(),
            token
        }, 201);
    } catch (error) {
        console.error('Register error:', {
            message: error.message,
            name: error.name,
            stack: error.stack,
            error: error
        });
        return errorResponse(500, 'Internal server error', error);
    }
}

/**
 * ユーザー情報取得
 */
async function getUser(event) {
    try {
        const userId = getUserIdFromRequest(event);
        if (!userId) {
            return unauthorizedResponse('Invalid or missing token');
        }

        const db = DatabaseAdapterFactory.create();
        const userData = await db.getUser(userId);
        
        if (!userData) {
            return errorResponse(404, 'User not found');
        }

        const user = new User(userData);
        return successResponse(user.toPublicJSON());
    } catch (error) {
        console.error('Get user error:', error);
        return errorResponse(500, 'Internal server error', error);
    }
}

// Lambda関数のエントリーポイント
module.exports.login = async (event) => {
    return await login(event);
};

module.exports.register = async (event) => {
    return await register(event);
};

module.exports.getUser = async (event) => {
    return await getUser(event);
};

