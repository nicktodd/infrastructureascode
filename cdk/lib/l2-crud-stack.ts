import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as path from 'path';

export class L2CrudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // L2 DynamoDB Table
    const table = new dynamodb.Table(this, 'TVShowsTable', {
      tableName: 'TVShows-L2',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY // For demo purposes
    });    // L2 Lambda Function
    const lambdaFunction = new lambda.Function(this, 'TVShowsCrudFunction', {
      functionName: 'TVShows-CRUD-L2',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda-l2')), // Using L2-specific implementation
      environment: {
        TABLE_NAME: table.tableName
      }
    });

    // Grant permissions - much simpler with L2 constructs
    table.grantReadWriteData(lambdaFunction);

    // L2 API Gateway REST API
    const api = new apigateway.RestApi(this, 'TVShowsApi', {
      restApiName: 'TVShows-API-L2',
      description: 'TV Shows CRUD API using L2 constructs',
      deployOptions: {
        stageName: 'prod'
      }
    });

    // L2 API Gateway Integration
    const tvShowsIntegration = new apigateway.LambdaIntegration(lambdaFunction);

    // L2 API Gateway Resources
    const tvShows = api.root.addResource('tvshows');
    tvShows.addMethod('GET', tvShowsIntegration);
    tvShows.addMethod('POST', tvShowsIntegration);

    const tvShow = tvShows.addResource('{id}');
    tvShow.addMethod('GET', tvShowsIntegration);
    tvShow.addMethod('PUT', tvShowsIntegration);
    tvShow.addMethod('DELETE', tvShowsIntegration);

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `${api.url}tvshows`,
      description: 'URL of the API (L2 Constructs)'
    });
  }
}
