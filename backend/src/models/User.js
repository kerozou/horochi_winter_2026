/**
 * ユーザーモデル
 */
class User {
    constructor(data) {
        this.userId = data.userId;
        this.username = data.username;
        this.email = data.email;
        this.passwordHash = data.passwordHash;
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * パスワードハッシュを除いたユーザー情報を返す
     */
    toPublicJSON() {
        return {
            userId: this.userId,
            username: this.username,
            email: this.email,
            createdAt: this.createdAt,
            updatedAt: this.updatedAt
        };
    }

    /**
     * データベース用のJSONに変換
     */
    toDBJSON() {
        return {
            userId: this.userId,
            username: this.username,
            email: this.email,
            passwordHash: this.passwordHash,
            createdAt: this.createdAt || new Date().toISOString(),
            updatedAt: this.updatedAt || new Date().toISOString()
        };
    }
}

module.exports = User;

