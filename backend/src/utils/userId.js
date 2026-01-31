/**
 * ユーザーID関連のユーティリティ
 */

const CHARACTERS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';

/**
 * 5文字の大文字英数字のユーザーIDを生成
 * @returns {string} 5文字の大文字英数字
 */
function generateUserId() {
    let userId = '';
    for (let i = 0; i < 5; i++) {
        const randomIndex = Math.floor(Math.random() * CHARACTERS.length);
        userId += CHARACTERS[randomIndex];
    }
    return userId;
}

/**
 * ユーザーIDの形式を検証
 * @param {string} userId - 検証するユーザーID
 * @returns {boolean} 有効な場合true
 */
function validateUserId(userId) {
    if (!userId || typeof userId !== 'string') {
        return false;
    }
    
    // 5文字であることを確認
    if (userId.length !== 5) {
        return false;
    }
    
    // 大文字英数字のみであることを確認
    const regex = /^[A-Z0-9]{5}$/;
    return regex.test(userId);
}

/**
 * ユーザーIDを正規化（大文字に変換、不要な文字を除去）
 * @param {string} userId - 正規化するユーザーID
 * @returns {string|null} 正規化されたユーザーID、無効な場合はnull
 */
function normalizeUserId(userId) {
    if (!userId || typeof userId !== 'string') {
        return null;
    }
    
    // 大文字に変換し、英数字以外を除去
    const normalized = userId.toUpperCase().replace(/[^A-Z0-9]/g, '');
    
    // 5文字に切り詰める
    if (normalized.length > 5) {
        return normalized.substring(0, 5);
    }
    
    // 5文字未満の場合はnullを返す
    if (normalized.length < 5) {
        return null;
    }
    
    return normalized;
}

module.exports = {
    generateUserId,
    validateUserId,
    normalizeUserId
};

