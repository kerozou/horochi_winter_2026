const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-in-production';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '7d';

/**
 * JWTトークンを生成
 * @param {string} userId - ユーザーID（5文字の大文字英数字）
 * @param {string} username - ユーザー名（通常はuserIdと同じ）
 */
function generateToken(userId, username) {
    return jwt.sign(
        { userId, username },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
    );
}

/**
 * JWTトークンを検証
 */
function verifyToken(token) {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        return null;
    }
}

/**
 * パスワードをハッシュ化
 */
async function hashPassword(password) {
    const saltRounds = 10;
    return await bcrypt.hash(password, saltRounds);
}

/**
 * パスワードを検証
 */
async function verifyPassword(password, hash) {
    return await bcrypt.compare(password, hash);
}

/**
 * リクエストからトークンを取得
 */
function getTokenFromRequest(event) {
    const authHeader = event.headers?.Authorization || event.headers?.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        return authHeader.substring(7);
    }
    return null;
}

/**
 * リクエストからユーザーIDを取得
 */
function getUserIdFromRequest(event) {
    const token = getTokenFromRequest(event);
    if (!token) {
        return null;
    }
    
    const decoded = verifyToken(token);
    return decoded ? decoded.userId : null;
}

module.exports = {
    generateToken,
    verifyToken,
    hashPassword,
    verifyPassword,
    getTokenFromRequest,
    getUserIdFromRequest
};

