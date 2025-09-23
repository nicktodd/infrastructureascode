import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as iam from 'aws-cdk-lib/aws-iam';
import * as fs from 'fs';
import * as path from 'path';

export class L1CrudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // L1 DynamoDB Table
    const table = new dynamodb.CfnTable(this, 'TVShowsTable', {
      tableName: 'TVShows-L1',
      keySchema: [
        { attributeName: 'id', keyType: 'HASH' }
      ],
      attributeDefinitions: [
        { attributeName: 'id', attributeType: 'S' }
      ],
      billingMode: 'PAY_PER_REQUEST'
    });

    // L1 IAM Role for Lambda
    const lambdaRole = new iam.CfnRole(this, 'LambdaExecutionRole', {
      roleName: 'TVShows-Lambda-Role-L1',
      assumeRolePolicyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Principal: { Service: 'lambda.amazonaws.com' },
          Action: 'sts:AssumeRole'
        }]
      },
      managedPolicyArns: [
        'arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole'
      ]
    });

    // L1 IAM Policy for DynamoDB access
    const dynamoPolicy = new iam.CfnPolicy(this, 'DynamoDBAccessPolicy', {
      policyName: 'TVShows-DynamoDB-Access-L1',
      policyDocument: {
        Version: '2012-10-17',
        Statement: [{
          Effect: 'Allow',
          Action: [
            'dynamodb:PutItem',
            'dynamodb:GetItem',
            'dynamodb:UpdateItem',
            'dynamodb:DeleteItem',
            'dynamodb:Scan',
            'dynamodb:Query'
          ],
          Resource: table.attrArn
        }]
      },
      roles: [lambdaRole.ref]
    });    // Get the Lambda function code from our source directory
    const lambdaCodeDir = path.join(__dirname, '../src/lambda-l1');
    const lambdaCodePath = path.join(lambdaCodeDir, 'index.js');

    // L1 Lambda Function
    const lambdaFunction = new lambda.CfnFunction(this, 'TVShowsCrudFunction', {
      functionName: 'TVShows-CRUD-L1',
      handler: 'index.handler',
      runtime: 'nodejs18.x',
      role: lambdaRole.attrArn,
      code: {
        zipFile: fs.readFileSync(lambdaCodePath, 'utf8')
      },
      environment: {
        variables: {
          TABLE_NAME: table.ref
        }
      }
    });

    // Lambda depends on policy being attached
    lambdaFunction.addDependency(dynamoPolicy);

    // L1 API Gateway Rest API
    const api = new apigateway.CfnRestApi(this, 'TVShowsApi', {
      name: 'TVShows-API-L1',
      endpointConfiguration: {
        types: ['REGIONAL']
      }
    });

    // L1 API Gateway Resource for /tvshows
    const tvShowsResource = new apigateway.CfnResource(this, 'TVShowsResource', {
      restApiId: api.ref,
      parentId: api.attrRootResourceId,
      pathPart: 'tvshows'
    });

    // API Gateway Lambda permission
    const lambdaPermission = new lambda.CfnPermission(this, 'ApiGatewayInvokeLambda', {
      action: 'lambda:InvokeFunction',
      functionName: lambdaFunction.ref,
      principal: 'apigateway.amazonaws.com',
      sourceArn: cdk.Fn.join('', [
        'arn:aws:execute-api:',
        this.region,
        ':',
        this.account,
        ':',
        api.ref,
        '/*/*'
      ])
    });

    // L1 API Gateway Methods
    const lambdaIntegration = {
      type: 'AWS_PROXY',
      integrationHttpMethod: 'POST',
      uri: cdk.Fn.join('', [
        'arn:aws:apigateway:',
        this.region,
        ':lambda:path/2015-03-31/functions/',
        lambdaFunction.attrArn,
        '/invocations'
      ])
    };

    // GET /tvshows
    const getTVShowsMethod = new apigateway.CfnMethod(this, 'GetTVShowsMethod', {
      restApiId: api.ref,
      resourceId: tvShowsResource.ref,
      httpMethod: 'GET',
      authorizationType: 'NONE',
      integration: lambdaIntegration
    });

    // POST /tvshows
    const postTVShowMethod = new apigateway.CfnMethod(this, 'PostTVShowMethod', {
      restApiId: api.ref,
      resourceId: tvShowsResource.ref,
      httpMethod: 'POST',
      authorizationType: 'NONE',
      integration: lambdaIntegration
    });

    // L1 API Gateway Resource for /tvshows/{id}
    const tvShowResource = new apigateway.CfnResource(this, 'TVShowResource', {
      restApiId: api.ref,
      parentId: tvShowsResource.ref,
      pathPart: '{id}'
    });

    // GET /tvshows/{id}
    const getTVShowMethod = new apigateway.CfnMethod(this, 'GetTVShowMethod', {
      restApiId: api.ref,
      resourceId: tvShowResource.ref,
      httpMethod: 'GET',
      authorizationType: 'NONE',
      integration: lambdaIntegration,
      requestParameters: {
        'method.request.path.id': true
      }
    });

    // PUT /tvshows/{id}
    const putTVShowMethod = new apigateway.CfnMethod(this, 'PutTVShowMethod', {
      restApiId: api.ref,
      resourceId: tvShowResource.ref,
      httpMethod: 'PUT',
      authorizationType: 'NONE',
      integration: lambdaIntegration,
      requestParameters: {
        'method.request.path.id': true
      }
    });

    // DELETE /tvshows/{id}
    const deleteTVShowMethod = new apigateway.CfnMethod(this, 'DeleteTVShowMethod', {
      restApiId: api.ref,
      resourceId: tvShowResource.ref,
      httpMethod: 'DELETE',
      authorizationType: 'NONE',
      integration: lambdaIntegration,
      requestParameters: {
        'method.request.path.id': true
      }
    });

    // L1 API Gateway Deployment
    const deployment = new apigateway.CfnDeployment(this, 'ApiDeployment', {
      restApiId: api.ref,
      description: 'Production deployment',
      stageName: 'prod'
    });

    // Deployment depends on all methods
    deployment.addDependency(getTVShowsMethod);
    deployment.addDependency(postTVShowMethod);
    deployment.addDependency(getTVShowMethod);
    deployment.addDependency(putTVShowMethod);
    deployment.addDependency(deleteTVShowMethod);

    // Output the API URL
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: cdk.Fn.join('', [
        'https://',
        api.ref,
        '.execute-api.',
        this.region,
        '.amazonaws.com/prod/tvshows'
      ]),
      description: 'URL of the API (L1 Constructs)'
    });
  }
}
