import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as cloudfront from 'aws-cdk-lib/aws-cloudfront';
import * as origins from 'aws-cdk-lib/aws-cloudfront-origins';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as route53 from 'aws-cdk-lib/aws-route53';
import * as targets from 'aws-cdk-lib/aws-route53-targets';
import * as dotenv from 'dotenv';
import * as path from 'path';
import { Certificate } from 'aws-cdk-lib/aws-certificatemanager';

// .envファイルのパスを指定して読み込む
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

export class StaticSiteStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 環境変数の取得
    const domainName = process.env.DOMAIN_NAME!;
    const subdomainName = process.env.SUBDOMAIN_NAME!;
    const certificateArn = process.env.CERTIFICATE_ARN!;

    // S3 バケットを作成
    const siteBucket = new s3.Bucket(this, 'SiteBucket', {
      removalPolicy: cdk.RemovalPolicy.DESTROY,
    });

    // Route 53 ホストゾーンを取得
    const zone = route53.HostedZone.fromLookup(this, 'Zone', {
      domainName: domainName,
    });

    // CloudFront OAI を作成
    const oai = new cloudfront.OriginAccessIdentity(this, 'SiteOAI');

    // S3バケットポリシーを設定
    siteBucket.addToResourcePolicy(new iam.PolicyStatement({
      actions: ['s3:GetObject'],
      resources: [`${siteBucket.bucketArn}/*`],
      principals: [new iam.CanonicalUserPrincipal(oai.cloudFrontOriginAccessIdentityS3CanonicalUserId)],
    }));

    // CloudFront ディストリビューションを作成
    const distribution = new cloudfront.Distribution(this, 'SiteDistribution', {
      defaultRootObject: 'index.html',
      domainNames: [subdomainName],
      certificate: Certificate.fromCertificateArn(this, 'Certificate', certificateArn),
      defaultBehavior: {
        origin: new origins.S3Origin(siteBucket, {
          originAccessIdentity: oai,
        }),
        allowedMethods: cloudfront.AllowedMethods.ALLOW_GET_HEAD,
        cachedMethods: cloudfront.CachedMethods.CACHE_GET_HEAD,
        viewerProtocolPolicy: cloudfront.ViewerProtocolPolicy.REDIRECT_TO_HTTPS,
      },
      priceClass: cloudfront.PriceClass.PRICE_CLASS_200,
    });

    // Route 53 Aレコードを作成
    new route53.ARecord(this, 'SiteAliasRecord', {
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    });

    // Route 53 AAAAレコードを作成
    new route53.AaaaRecord(this, 'SiteAliasRecordAAAA', {
      recordName: 'www',
      target: route53.RecordTarget.fromAlias(new targets.CloudFrontTarget(distribution)),
      zone,
    });

    // S3 バケットにファイルをデプロイするためのコマンド等を出力
    // データの更新・管理がしやすいように、デプロイスクリプトをshファイルとして /frontend に分離している
    new cdk.CfnOutput(this, 'BucketName', {value: siteBucket.bucketName});
    new cdk.CfnOutput(this, 'DistributionDomainId', { value: distribution.distributionId });
  }
}