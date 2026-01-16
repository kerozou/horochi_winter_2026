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
        // 自己ベスト情報
        this.personalBest_normal = data.personalBest_normal || 0;
        this.personalBest_rankMatch = data.personalBest_rankMatch || {}; // { dateString: distance, ... }
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
            personalBest_normal: this.personalBest_normal,
            personalBest_rankMatch: this.personalBest_rankMatch,
            updatedAt: this.updatedAt || new Date().toISOString()
        };
    }
}

module.exports = Trophy;

