import * as cdk from 'aws-cdk-lib';
import { Template } from 'aws-cdk-lib/assertions';
import { StaticSiteStack } from '../lib/StaticSiteStack';
import * as dotenv from 'dotenv';
import * as path from 'path';

// .envファイルのパスを指定して読み込む
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

test('Snapshot Test', () => {
  const app = new cdk.App();
  
  // WHEN
  const stack = new StaticSiteStack(app, 'MyTestStack', {
    env: {
      account: process.env.CDK_DEFAULT_ACCOUNT,
      region: process.env.CDK_DEFAULT_REGION,
    },
  });
  
  // THEN
  const template = Template.fromStack(stack);
  
  // スナップショットを作成して比較
  expect(template.toJSON()).toMatchSnapshot();
});