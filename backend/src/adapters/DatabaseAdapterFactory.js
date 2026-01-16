const DynamoDBAdapter = require('./DynamoDBAdapter');
const JsonFileAdapter = require('./JsonFileAdapter');

/**
 * データベースアダプタファクトリー
 * 環境変数に基づいて適切なアダプタを返す
 */
class DatabaseAdapterFactory {
    static create() {
        const adapterType = process.env.DB_ADAPTER || 'dynamodb';
        
        switch (adapterType.toLowerCase()) {
            case 'dynamodb':
                return new DynamoDBAdapter();
            case 'json':
            case 'jsonfile':
                return new JsonFileAdapter(process.env.JSON_DATA_DIR || './data');
            default:
                throw new Error(`Unknown database adapter type: ${adapterType}`);
        }
    }
}

module.exports = DatabaseAdapterFactory;

