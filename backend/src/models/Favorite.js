/**
 * お気に入りモデル
 */
class Favorite {
    constructor(data) {
        this.favoriteId = data.favoriteId;
        this.userId = data.userId;
        this.name = data.name;
        this.design = data.design;
        this.placedParts = data.placedParts || [];
        this.createdAt = data.createdAt;
        this.updatedAt = data.updatedAt;
    }

    /**
     * JSONに変換
     */
    toJSON() {
        return {
            favoriteId: this.favoriteId,
            userId: this.userId,
            name: this.name,
            design: this.design,
            placedParts: this.placedParts,
            createdAt: this.createdAt || new Date().toISOString(),
            updatedAt: this.updatedAt || new Date().toISOString()
        };
    }
}

module.exports = Favorite;

