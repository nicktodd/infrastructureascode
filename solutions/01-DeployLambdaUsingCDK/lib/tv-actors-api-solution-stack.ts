import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class TvActorsApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Create DynamoDB table for TV actors
    const table = new dynamodb.Table(this, 'ActorsTable', {
      tableName: 'TVActors',
      partitionKey: {
        name: 'id',
        type: dynamodb.AttributeType.STRING
      },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY, // For lab cleanup
    });

    // Create Lambda function
    const lambdaFunction = new lambda.Function(this, 'ActorsFunction', {
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(path.join(__dirname, '../src')),
      environment: {
        TABLE_NAME: table.tableName,
      },
      timeout: cdk.Duration.seconds(30),
      memorySize: 256,
    });

    // Grant Lambda permissions to DynamoDB table
    table.grantReadWriteData(lambdaFunction);

    // Create API Gateway
    const api = new apigateway.RestApi(this, 'ActorsApi', {
      restApiName: 'TV Actors API',
      description: 'CRUD API for managing TV actors',
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization'],
      },
    });

    // Create Lambda integration
    const lambdaIntegration = new apigateway.LambdaIntegration(lambdaFunction, {
      requestTemplates: { 'application/json': '{ "statusCode": "200" }' }
    });

    // Add /actors resource
    const actorsResource = api.root.addResource('actors');
    
    // Add methods to /actors
    actorsResource.addMethod('GET', lambdaIntegration);    // GET /actors (list all)
    actorsResource.addMethod('POST', lambdaIntegration);   // POST /actors (create)
    
    // Add /{id} sub-resource
    const actorByIdResource = actorsResource.addResource('{id}');
    
    // Add methods to /actors/{id}
    actorByIdResource.addMethod('GET', lambdaIntegration);    // GET /actors/{id}
    actorByIdResource.addMethod('PUT', lambdaIntegration);    // PUT /actors/{id}
    actorByIdResource.addMethod('DELETE', lambdaIntegration); // DELETE /actors/{id}

    // Add stack outputs
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'API Gateway URL for the TV Actors API',
    });

    new cdk.CfnOutput(this, 'TableName', {
      value: table.tableName,
      description: 'DynamoDB table name for TV actors',
    });

    new cdk.CfnOutput(this, 'LambdaFunctionName', {
      value: lambdaFunction.functionName,
      description: 'Lambda function name for actors CRUD operations',
    });
  }
}
