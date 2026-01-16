import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export interface BackendStackProps extends cdk.StackProps {
  stage?: string;
  jwtSecret?: string;
}

export class BackendStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: BackendStackProps) {
    super(scope, id, props);

    const stage = props?.stage || 'dev';
    const jwtSecret = props?.jwtSecret || 'your-secret-key-change-in-production';

    // DynamoDBテーブルを作成
    const usersTable = new dynamodb.Table(this, 'UsersTable', {
      tableName: `horochi-winter-2026-backend-users-${stage}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // 開発環境用（本番環境では削除）
    });

    const trophiesTable = new dynamodb.Table(this, 'TrophiesTable', {
      tableName: `horochi-winter-2026-backend-trophies-${stage}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const favoritesTable = new dynamodb.Table(this, 'FavoritesTable', {
      tableName: `horochi-winter-2026-backend-favorites-${stage}`,
      partitionKey: { name: 'userId', type: dynamodb.AttributeType.STRING },
      sortKey: { name: 'favoriteId', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    const rankingsTable = new dynamodb.Table(this, 'RankingsTable', {
      tableName: `horochi-winter-2026-backend-rankings-${stage}`,
      partitionKey: { name: 'rankingKey', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Lambda関数用のIAMロールを作成
    const lambdaRole = new iam.Role(this, 'LambdaExecutionRole', {
      assumedBy: new iam.ServicePrincipal('lambda.amazonaws.com'),
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('service-role/AWSLambdaBasicExecutionRole'),
      ],
    });

    // DynamoDBへのアクセス権限を付与
    usersTable.grantReadWriteData(lambdaRole);
    trophiesTable.grantReadWriteData(lambdaRole);
    favoritesTable.grantReadWriteData(lambdaRole);
    rankingsTable.grantReadWriteData(lambdaRole);

    // Lambda関数の共通設定
    const lambdaCommonProps = {
      runtime: lambda.Runtime.NODEJS_18_X,
      role: lambdaRole,
      timeout: cdk.Duration.seconds(30), // タイムアウトを30秒に設定
      memorySize: 256, // メモリサイズを256MBに設定
      environment: {
        STAGE: stage,
        DYNAMODB_TABLE_USERS: usersTable.tableName,
        DYNAMODB_TABLE_TROPHIES: trophiesTable.tableName,
        DYNAMODB_TABLE_FAVORITES: favoritesTable.tableName,
        DYNAMODB_TABLE_RANKINGS: rankingsTable.tableName,
        JWT_SECRET: jwtSecret,
        DB_ADAPTER: 'dynamodb',
        NODE_ENV: 'production',
        // AWS_REGIONはLambdaランタイムによって自動的に設定されるため、手動で設定しない
      },
      code: lambda.Code.fromAsset(path.join(__dirname, '../../../backend'), {
        exclude: ['*.md', '.git', '.gitignore', 'test', '*.test.js', '*.test.ts', 'package-lock.json'],
      }),
    };

    // ユーザー認証用Lambda関数
    const loginFunction = new lambda.Function(this, 'LoginFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-login`,
      handler: 'src/handlers/user.login',
    });

    const registerFunction = new lambda.Function(this, 'RegisterFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-register`,
      handler: 'src/handlers/user.register',
    });

    const getUserFunction = new lambda.Function(this, 'GetUserFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-getUser`,
      handler: 'src/handlers/user.getUser',
    });

    // トロフィー管理用Lambda関数
    const getTrophiesFunction = new lambda.Function(this, 'GetTrophiesFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-getTrophies`,
      handler: 'src/handlers/trophy.getTrophies',
    });

    const updateTrophiesFunction = new lambda.Function(this, 'UpdateTrophiesFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-updateTrophies`,
      handler: 'src/handlers/trophy.updateTrophies',
    });

    // お気に入り管理用Lambda関数
    const getFavoritesFunction = new lambda.Function(this, 'GetFavoritesFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-getFavorites`,
      handler: 'src/handlers/favorite.getFavorites',
    });

    const saveFavoriteFunction = new lambda.Function(this, 'SaveFavoriteFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-saveFavorite`,
      handler: 'src/handlers/favorite.saveFavorite',
    });

    const deleteFavoriteFunction = new lambda.Function(this, 'DeleteFavoriteFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-deleteFavorite`,
      handler: 'src/handlers/favorite.deleteFavorite',
    });

    // ランキング管理用Lambda関数
    const getRankingFunction = new lambda.Function(this, 'GetRankingFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-getRanking`,
      handler: 'src/handlers/ranking.getRanking',
    });

    const updateRankingFunction = new lambda.Function(this, 'UpdateRankingFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-updateRanking`,
      handler: 'src/handlers/ranking.updateRanking',
    });

    // ヘルスチェック用Lambda関数
    const healthFunction = new lambda.Function(this, 'HealthFunction', {
      ...lambdaCommonProps,
      functionName: `horochi-winter-2026-backend-${stage}-health`,
      handler: 'src/handlers/health.health',
    });

    // API Gateway REST APIを作成
    const api = new apigateway.RestApi(this, 'BackendApi', {
      restApiName: `horochi-winter-2026-backend-${stage}`,
      description: 'Backend API for Horochi Winter 2026',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: [
          'Content-Type',
          'Authorization',
          'X-Amz-Date',
          'X-Api-Key',
          'X-Amz-Security-Token',
        ],
        allowCredentials: false, // 認証トークンを使用する場合は true に変更
        statusCode: 200,
      },
    });

    // 認証エンドポイント
    const authResource = api.root.addResource('auth');
    
    // ログインエンドポイント
    const loginResource = authResource.addResource('login');
    const loginIntegration = new apigateway.LambdaIntegration(loginFunction, {
      proxy: true,
    });
    loginResource.addMethod('POST', loginIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    
    // 登録エンドポイント
    const registerResource = authResource.addResource('register');
    const registerIntegration = new apigateway.LambdaIntegration(registerFunction, {
      proxy: true,
    });
    registerResource.addMethod('POST', registerIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    
    // ユーザー情報取得エンドポイント
    const userResource = authResource.addResource('user');
    const getUserIntegration = new apigateway.LambdaIntegration(getUserFunction, {
      proxy: true,
    });
    userResource.addMethod('GET', getUserIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // トロフィーエンドポイント
    const trophiesResource = api.root.addResource('trophies');
    const getTrophiesIntegration = new apigateway.LambdaIntegration(getTrophiesFunction, {
      proxy: true,
    });
    trophiesResource.addMethod('GET', getTrophiesIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const updateTrophiesIntegration = new apigateway.LambdaIntegration(updateTrophiesFunction, {
      proxy: true,
    });
    trophiesResource.addMethod('PUT', updateTrophiesIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // お気に入りエンドポイント
    const favoritesResource = api.root.addResource('favorites');
    const getFavoritesIntegration = new apigateway.LambdaIntegration(getFavoritesFunction, {
      proxy: true,
    });
    favoritesResource.addMethod('GET', getFavoritesIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const saveFavoriteIntegration = new apigateway.LambdaIntegration(saveFavoriteFunction, {
      proxy: true,
    });
    favoritesResource.addMethod('POST', saveFavoriteIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const favoriteIdResource = favoritesResource.addResource('{id}');
    const deleteFavoriteIntegration = new apigateway.LambdaIntegration(deleteFavoriteFunction, {
      proxy: true,
    });
    favoriteIdResource.addMethod('DELETE', deleteFavoriteIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // ランキングエンドポイント
    const rankingsResource = api.root.addResource('rankings');
    const getRankingIntegration = new apigateway.LambdaIntegration(getRankingFunction, {
      proxy: true,
    });
    rankingsResource.addMethod('GET', getRankingIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });
    const updateRankingIntegration = new apigateway.LambdaIntegration(updateRankingFunction, {
      proxy: true,
    });
    rankingsResource.addMethod('POST', updateRankingIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // ヘルスチェックエンドポイント
    const healthResource = api.root.addResource('health');
    const healthIntegration = new apigateway.LambdaIntegration(healthFunction, {
      proxy: true,
    });
    healthResource.addMethod('GET', healthIntegration, {
      authorizationType: apigateway.AuthorizationType.NONE,
    });

    // 出力
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway endpoint URL',
    });

    new cdk.CfnOutput(this, 'UsersTableName', {
      value: usersTable.tableName,
      description: 'DynamoDB Users table name',
    });

    new cdk.CfnOutput(this, 'TrophiesTableName', {
      value: trophiesTable.tableName,
      description: 'DynamoDB Trophies table name',
    });

    new cdk.CfnOutput(this, 'FavoritesTableName', {
      value: favoritesTable.tableName,
      description: 'DynamoDB Favorites table name',
    });

    new cdk.CfnOutput(this, 'RankingsTableName', {
      value: rankingsTable.tableName,
      description: 'DynamoDB Rankings table name',
    });
  }
}

