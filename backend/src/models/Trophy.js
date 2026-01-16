/**
 * トロフィーモデル
 */
class Trophy {
    constructor(data) {
        this.userId = data.userId;
        this.unlockedTrophies = data.unlockedTrophies || [];
        this.collectedShibou = data.collectedShibou || [];
        this.playCount = data.playCount || 0;
        this.rankCounts = data.rankCounts || {};
        this.updatedAt = data.updatedAt;
    }

    /**
     * JSONに変換
     */
    toJSON() {
        return {
            userId: this.userId,
            unlockedTrophies: this.unlockedTrophies,
            collectedShibou: this.collectedShibou,
            playCount: this.playCount,
            rankCounts: this.rankCounts,
            updatedAt: this.updatedAt || new Date().toISOString()
        };
    }
}

module.exports = Trophy;

