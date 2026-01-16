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
        const db = DatabaseAdapterFactory.create();
        const body = JSON.parse(event.body || '{}');
        const { userId, password } = body;

        if (!userId || !password) {
            return errorResponse('User ID and password are required', 400);
        }

        // ユーザーIDを正規化
        const normalizedUserId = normalizeUserId(userId);
        if (!normalizedUserId) {
            return errorResponse('User ID must be 5 characters of uppercase letters and numbers', 400);
        }

        // ユーザーIDでユーザーを取得
        const userData = await db.getUser(normalizedUserId);
        if (!userData) {
            return unauthorizedResponse('Invalid user ID or password');
        }

        const isValid = await verifyPassword(password, userData.passwordHash);
        if (!isValid) {
            return unauthorizedResponse('Invalid user ID or password');
        }

        const user = new User(userData);
        const token = generateToken(user.userId, user.userId); // ユーザーIDをusernameとしても使用

        return successResponse({
            user: user.toPublicJSON(),
            token
        });
    } catch (error) {
        console.error('Login error:', error);
        return errorResponse('Internal server error', 500, error);
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
            return errorResponse('Password is required', 400);
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
                return errorResponse('Failed to generate unique user ID. Please try again.', 500);
            }
            userId = normalizedUserId;
        } else {
            // ユーザーIDを正規化
            const normalized = normalizeUserId(userId);
            if (!normalized) {
                return errorResponse('User ID must be 5 characters of uppercase letters and numbers', 400);
            }
            userId = normalized;
        }

        // 既存ユーザーをチェック
        const existingUser = await db.getUser(userId);
        if (existingUser) {
            return errorResponse('User ID already exists', 409);
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
        console.error('Register error:', error);
        return errorResponse('Internal server error', 500, error);
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
            return errorResponse('User not found', 404);
        }

        const user = new User(userData);
        return successResponse(user.toPublicJSON());
    } catch (error) {
        console.error('Get user error:', error);
        return errorResponse('Internal server error', 500, error);
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

