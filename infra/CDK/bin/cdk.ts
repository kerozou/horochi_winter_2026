#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { StaticSiteStack } from '../lib/StaticSiteStack';
import * as dotenv from 'dotenv';
import * as path from 'path';

// ルートディレクトリの.envファイルを読み込む
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const app = new cdk.App();

new StaticSiteStack(app, 'StaticSiteStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});