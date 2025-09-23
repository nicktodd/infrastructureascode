# AWS CDK Construct Levels Comparison

This document compares the three implementation levels used in our TVShows CRUD API application.

## Code Complexity Comparison

| Feature | L1 (CFN) | L2 (AWS) | L3 (Patterns) |
|---------|----------|----------|---------------|
| Lines of Code | ~150 | ~50 | ~30 |
| Boilerplate Code | High | Medium | Low |
| Resource Dependencies | Manual | Automatic | Automatic |
| IAM Permissions | Manual | Helper Methods | Built-in |
| Deployment Time | Similar | Similar | Similar |

## DynamoDB Table Definition

### L1 (CFN) Implementation
```typescript
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
```

### L2 (AWS) Implementation
```typescript
const table = new dynamodb.Table(this, 'TVShowsTable', {
  tableName: 'TVShows-L2',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY 
});
```

### L3 (Pattern) Implementation
```typescript
const table = new dynamodb.Table(this, 'TVShowsTable', {
  tableName: 'TVShows-L3',
  partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
  billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
  removalPolicy: cdk.RemovalPolicy.DESTROY,
  pointInTimeRecovery: true,
  timeToLiveAttribute: 'ttl',
  encryption: dynamodb.TableEncryption.AWS_MANAGED,
  stream: dynamodb.StreamViewType.NEW_AND_OLD_IMAGES
});
```

## IAM Permission Management

### L1 (CFN) Implementation
```typescript
// IAM Role for Lambda
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

// IAM Policy for DynamoDB access
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
});
```

### L2 (AWS) Implementation
```typescript
// Just one line!
table.grantReadWriteData(lambdaFunction);
```

### L3 (Pattern) Implementation
```typescript
// Same as L2, but also includes additional permissions for advanced features
table.grantReadWriteData(lambdaFunction);
// Auto-configured stream permissions, encryption permissions, etc.
```

## API Gateway Configuration

### L1 (CFN) Implementation
```typescript
// API Gateway Rest API
const api = new apigateway.CfnRestApi(this, 'TVShowsApi', {
  name: 'TVShows-API-L1',
  endpointConfiguration: {
    types: ['REGIONAL']
  }
});

// Resource for /tvshows
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

// Lambda integration
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

// ... and many more methods and resources
```

### L2 (AWS) Implementation
```typescript
// API Gateway REST API
const api = new apigateway.RestApi(this, 'TVShowsApi', {
  restApiName: 'TVShows-API-L2',
  description: 'TV Shows CRUD API using L2 constructs',
  deployOptions: {
    stageName: 'prod'
  }
});

// API Gateway Integration
const tvShowsIntegration = new apigateway.LambdaIntegration(lambdaFunction);

// API Gateway Resources
const tvShows = api.root.addResource('tvshows');
tvShows.addMethod('GET', tvShowsIntegration);
tvShows.addMethod('POST', tvShowsIntegration);

const tvShow = tvShows.addResource('{id}');
tvShow.addMethod('GET', tvShowsIntegration);
tvShow.addMethod('PUT', tvShowsIntegration);
tvShow.addMethod('DELETE', tvShowsIntegration);
```

### L3 (Pattern) Implementation
```typescript
// API Gateway - using highest level construct (LambdaRestApi)
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
```

## When to Use Each Level

### L1 Constructs
- When you need direct access to CloudFormation properties not exposed in L2
- When migrating existing CloudFormation templates to CDK
- When working with AWS services that don't have L2 constructs yet

### L2 Constructs
- For most typical AWS resource configurations
- When you want a balance of control and convenience
- For simpler IAM permission management
- When working with well-established AWS services

### L3 Constructs
- When implementing common architectural patterns
- For rapid development of production-ready applications
- When you want built-in best practices
- For complex multi-resource configurations
