const fs = require('fs').promises;
const path = require('path');
const IDatabaseAdapter = require('./IDatabaseAdapter');

/**
 * ローカルJSONファイルアダプタ（開発用）
 */
class JsonFileAdapter extends IDatabaseAdapter {
    constructor(dataDir = './data') {
        super();
        this.dataDir = dataDir;
        this.usersFile = path.join(dataDir, 'users.json');
        this.trophiesFile = path.join(dataDir, 'trophies.json');
        this.favoritesFile = path.join(dataDir, 'favorites.json');
        this.rankingsFile = path.join(dataDir, 'rankings.json');
        this.init();
    }

    /**
     * データディレクトリとファイルを初期化
     */
    async init() {
        try {
            await fs.mkdir(this.dataDir, { recursive: true });
            
            // ファイルが存在しない場合は空の配列/オブジェクトで初期化
            try {
                await fs.access(this.usersFile);
            } catch {
                await fs.writeFile(this.usersFile, JSON.stringify({}, null, 2));
            }
            
            try {
                await fs.access(this.trophiesFile);
            } catch {
                await fs.writeFile(this.trophiesFile, JSON.stringify({}, null, 2));
            }
            
            try {
                await fs.access(this.favoritesFile);
            } catch {
                await fs.writeFile(this.favoritesFile, JSON.stringify({}, null, 2));
            }
            
            try {
                await fs.access(this.rankingsFile);
            } catch {
                await fs.writeFile(this.rankingsFile, JSON.stringify({}, null, 2));
            }
        } catch (error) {
            console.error('Error initializing JSON adapter:', error);
        }
    }

    /**
     * JSONファイルを読み込む
     */
    async readFile(filePath) {
        try {
            const data = await fs.readFile(filePath, 'utf8');
            return JSON.parse(data);
        } catch (error) {
            return {};
        }
    }

    /**
     * JSONファイルに書き込む
     */
    async writeFile(filePath, data) {
        await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf8');
    }

    /**
     * ユーザー情報を取得
     */
    async getUser(userId) {
        const users = await this.readFile(this.usersFile);
        return users[userId] || null;
    }

    /**
     * ユーザー情報を保存
     */
    async saveUser(userData) {
        const users = await this.readFile(this.usersFile);
        users[userData.userId] = {
            ...userData,
            updatedAt: new Date().toISOString()
        };
        await this.writeFile(this.usersFile, users);
        return users[userData.userId];
    }

    /**
     * ユーザー名でユーザーを検索
     */
    async getUserByUsername(username) {
        const users = await this.readFile(this.usersFile);
        for (const userId in users) {
            if (users[userId].username === username) {
                return users[userId];
            }
        }
        return null;
    }

    /**
     * トロフィーデータを取得
     */
    async getTrophies(userId) {
        const trophies = await this.readFile(this.trophiesFile);
        return trophies[userId] || null;
    }

    /**
     * トロフィーデータを保存
     */
    async saveTrophies(userId, trophyData) {
        const trophies = await this.readFile(this.trophiesFile);
        trophies[userId] = {
            ...trophyData,
            updatedAt: new Date().toISOString()
        };
        await this.writeFile(this.trophiesFile, trophies);
        return trophies[userId];
    }

    /**
     * お気に入り一覧を取得
     */
    async getFavorites(userId) {
        const favorites = await this.readFile(this.favoritesFile);
        return favorites[userId] ? Object.values(favorites[userId]) : [];
    }

    /**
     * お気に入りを保存
     */
    async saveFavorite(userId, favoriteData) {
        const favorites = await this.readFile(this.favoritesFile);
        if (!favorites[userId]) {
            favorites[userId] = {};
        }
        
        const favoriteId = favoriteData.favoriteId || `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        favorites[userId][favoriteId] = {
            ...favoriteData,
            favoriteId,
            updatedAt: new Date().toISOString()
        };
        
        await this.writeFile(this.favoritesFile, favorites);
        return favorites[userId][favoriteId];
    }

    /**
     * お気に入りを削除
     */
    async deleteFavorite(userId, favoriteId) {
        const favorites = await this.readFile(this.favoritesFile);
        if (favorites[userId] && favorites[userId][favoriteId]) {
            delete favorites[userId][favoriteId];
            await this.writeFile(this.favoritesFile, favorites);
            return true;
        }
        return false;
    }

    /**
     * ランキングを取得
     */
    async getRanking(rankingKey, limit = 10) {
        const rankings = await this.readFile(this.rankingsFile);
        if (!rankings[rankingKey] || !rankings[rankingKey].records) {
            return [];
        }
        
        const records = rankings[rankingKey].records;
        return records
            .sort((a, b) => b.distance - a.distance)
            .slice(0, limit);
    }

    /**
     * ランキングに記録を追加
     */
    async updateRanking(rankingKey, record, limit = 10) {
        const rankings = await this.readFile(this.rankingsFile);
        
        if (!rankings[rankingKey]) {
            rankings[rankingKey] = { records: [] };
        }
        
        let records = rankings[rankingKey].records || [];
        records.push(record);
        records.sort((a, b) => b.distance - a.distance);
        records = records.slice(0, limit);
        
        rankings[rankingKey] = {
            records,
            updatedAt: new Date().toISOString()
        };
        
        await this.writeFile(this.rankingsFile, rankings);
        return records;
    }
}

module.exports = JsonFileAdapter;

