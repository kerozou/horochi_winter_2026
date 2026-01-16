const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, GetCommand, PutCommand, UpdateCommand, DeleteCommand, QueryCommand, ScanCommand } = require('@aws-sdk/lib-dynamodb');
const IDatabaseAdapter = require('./IDatabaseAdapter');

/**
 * DynamoDBアダプタ
 */
class DynamoDBAdapter extends IDatabaseAdapter {
    constructor() {
        super();
        const client = new DynamoDBClient({
            region: process.env.AWS_REGION || 'ap-northeast-1'
        });
        this.docClient = DynamoDBDocumentClient.from(client);
        this.usersTable = process.env.DYNAMODB_TABLE_USERS;
        this.trophiesTable = process.env.DYNAMODB_TABLE_TROPHIES;
        this.favoritesTable = process.env.DYNAMODB_TABLE_FAVORITES;
        this.rankingsTable = process.env.DYNAMODB_TABLE_RANKINGS;
    }

    /**
     * ユーザー情報を取得
     */
    async getUser(userId) {
        try {
            const command = new GetCommand({
                TableName: this.usersTable,
                Key: { userId }
            });
            const result = await this.docClient.send(command);
            return result.Item || null;
        } catch (error) {
            console.error('Error getting user:', error);
            throw error;
        }
    }

    /**
     * ユーザー情報を保存
     */
    async saveUser(userData) {
        try {
            const command = new PutCommand({
                TableName: this.usersTable,
                Item: {
                    userId: userData.userId,
                    username: userData.username,
                    passwordHash: userData.passwordHash,
                    email: userData.email,
                    createdAt: userData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            });
            await this.docClient.send(command);
            return userData;
        } catch (error) {
            console.error('Error saving user:', error);
            throw error;
        }
    }

    /**
     * ユーザー名でユーザーを検索
     */
    async getUserByUsername(username) {
        try {
            const command = new ScanCommand({
                TableName: this.usersTable,
                FilterExpression: 'username = :username',
                ExpressionAttributeValues: {
                    ':username': username
                }
            });
            const result = await this.docClient.send(command);
            return result.Items && result.Items.length > 0 ? result.Items[0] : null;
        } catch (error) {
            console.error('Error getting user by username:', error);
            throw error;
        }
    }

    /**
     * トロフィーデータを取得
     */
    async getTrophies(userId) {
        try {
            const command = new GetCommand({
                TableName: this.trophiesTable,
                Key: { userId }
            });
            const result = await this.docClient.send(command);
            return result.Item || null;
        } catch (error) {
            console.error('Error getting trophies:', error);
            throw error;
        }
    }

    /**
     * トロフィーデータを保存
     */
    async saveTrophies(userId, trophyData) {
        try {
            const command = new PutCommand({
                TableName: this.trophiesTable,
                Item: {
                    userId,
                    unlockedTrophies: trophyData.unlockedTrophies || [],
                    collectedShibou: trophyData.collectedShibou || [],
                    playCount: trophyData.playCount || 0,
                    rankCounts: trophyData.rankCounts || {},
                    updatedAt: new Date().toISOString()
                }
            });
            await this.docClient.send(command);
            return trophyData;
        } catch (error) {
            console.error('Error saving trophies:', error);
            throw error;
        }
    }

    /**
     * お気に入り一覧を取得
     */
    async getFavorites(userId) {
        try {
            const command = new QueryCommand({
                TableName: this.favoritesTable,
                KeyConditionExpression: 'userId = :userId',
                ExpressionAttributeValues: {
                    ':userId': userId
                }
            });
            const result = await this.docClient.send(command);
            return result.Items || [];
        } catch (error) {
            console.error('Error getting favorites:', error);
            throw error;
        }
    }

    /**
     * お気に入りを保存
     */
    async saveFavorite(userId, favoriteData) {
        try {
            const favoriteId = favoriteData.favoriteId || `fav_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
            const command = new PutCommand({
                TableName: this.favoritesTable,
                Item: {
                    userId,
                    favoriteId,
                    name: favoriteData.name,
                    design: favoriteData.design,
                    placedParts: favoriteData.placedParts || [],
                    createdAt: favoriteData.createdAt || new Date().toISOString(),
                    updatedAt: new Date().toISOString()
                }
            });
            await this.docClient.send(command);
            return { ...favoriteData, favoriteId };
        } catch (error) {
            console.error('Error saving favorite:', error);
            throw error;
        }
    }

    /**
     * お気に入りを削除
     */
    async deleteFavorite(userId, favoriteId) {
        try {
            const command = new DeleteCommand({
                TableName: this.favoritesTable,
                Key: {
                    userId,
                    favoriteId
                }
            });
            await this.docClient.send(command);
            return true;
        } catch (error) {
            console.error('Error deleting favorite:', error);
            throw error;
        }
    }

    /**
     * ランキングを取得
     */
    async getRanking(rankingKey, limit = 10) {
        try {
            const command = new GetCommand({
                TableName: this.rankingsTable,
                Key: { rankingKey }
            });
            const result = await this.docClient.send(command);
            
            if (!result.Item || !result.Item.records) {
                return [];
            }
            
            // 距離でソート（降順）してlimit件まで返す
            const sortedRecords = [...result.Item.records]
                .sort((a, b) => b.distance - a.distance)
                .slice(0, limit);
            
            return sortedRecords;
        } catch (error) {
            console.error('Error getting ranking:', error);
            throw error;
        }
    }

    /**
     * ランキングに記録を追加
     */
    async updateRanking(rankingKey, record, limit = 10) {
        try {
            // 既存のランキングを取得
            const command = new GetCommand({
                TableName: this.rankingsTable,
                Key: { rankingKey }
            });
            const result = await this.docClient.send(command);
            
            let records = [];
            if (result.Item && result.Item.records) {
                records = result.Item.records;
            }
            
            // 新しい記録を追加
            records.push(record);
            
            // 距離でソート（降順）
            records.sort((a, b) => b.distance - a.distance);
            
            // 上位limit件のみ保持
            const topRecords = records.slice(0, limit);
            
            // ランキングを更新
            const updateCommand = new PutCommand({
                TableName: this.rankingsTable,
                Item: {
                    rankingKey,
                    records: topRecords,
                    updatedAt: new Date().toISOString()
                }
            });
            await this.docClient.send(updateCommand);
            
            return topRecords;
        } catch (error) {
            console.error('Error updating ranking:', error);
            throw error;
        }
    }
}

module.exports = DynamoDBAdapter;

