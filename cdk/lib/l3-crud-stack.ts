import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

export class L3CrudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // L3 DynamoDB Table
    const table = new dynamodb.Table(this, 'TVShowsTable', {
      tableName: 'TVShows-L3',
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For demo purposes
      // L3 extras - adding more features
      pointInTimeRecovery: true,
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
    });

    // L3 Lambda Function (using our enhanced code from src directory)
    const lambdaFunction = new lambda.Function(this, 'TVShowsCrudFunction', {
      functionName: 'TVShows-CRUD-L3',
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src/lambda-l3')),
      environment: {
        TABLE_NAME: table.tableName
      },
      // L3 extras - adding more features
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      description: 'Enhanced TV Shows CRUD API handler with better code organization',
      tracing: lambda.Tracing.ACTIVE,
      retryAttempts: 2
    });

    // Grant permissions
    table.grantReadWriteData(lambdaFunction);

    // L3 API Gateway - using highest level construct (LambdaRestApi)
    const api = new apigateway.LambdaRestApi(this, 'TVShowsApi', {
      restApiName: 'TVShows-API-L3',
      description: 'TV Shows CRUD API using L3 constructs',
      handler: lambdaFunction,
      proxy: false, // We want to configure the API endpoints manually
      deployOptions: {
        stageName: 'prod',
        metricsEnabled: true,
        loggingLevel: apigateway.MethodLoggingLevel.INFO
      }
    });

    // L3 API Gateway Resources (much more concise!)
    const tvShows = api.root.addResource('tvshows');
    tvShows.addMethod('GET');  // GET /tvshows
    tvShows.addMethod('POST'); // POST /tvshows
    
    const tvShow = tvShows.addResource('{id}');
    tvShow.addMethod('GET');    // GET /tvshows/{id}
    tvShow.addMethod('PUT');    // PUT /tvshows/{id}
    tvShow.addMethod('DELETE'); // DELETE /tvshows/{id}

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: `${api.url}tvshows`,
      description: 'URL of the API (L3 Constructs)'
    });
  }
}