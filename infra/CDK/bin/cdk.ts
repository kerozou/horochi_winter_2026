#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/StaticSiteStack';
import { BackendStack } from '../lib/BackendStack';
import * as dotenv from 'dotenv';
import * as path from 'path';

// ルートディレクトリの.envファイルを読み込む
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = new cdk.App();

// スタック名を環境変数から取得（デフォルトは'StaticSiteStack'）
// 別サービスで同じスタック名を使わないように、SERVICE_NAME環境変数を設定してください
// 例: SERVICE_NAME=horochi-winter-2026 の場合、スタック名は 'horochi-winter-2026-StaticSiteStack' になります
const serviceName = process.env.SERVICE_NAME || '';
const stackName = serviceName 
  ? `${serviceName}-StaticSiteStack` 
  : 'StaticSiteStack';

new StaticSiteStack(app, stackName, {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});

// バックエンドスタック
const backendStackName = serviceName
  ? `${serviceName}-BackendStack`
  : 'BackendStack';

const stage = process.env.STAGE || 'dev';
const jwtSecret = process.env.JWT_SECRET || 'your-secret-key-change-in-production';

new BackendStack(app, backendStackName, {
  stage: stage,
  jwtSecret: jwtSecret,
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION || 'ap-northeast-1',
  },
});
