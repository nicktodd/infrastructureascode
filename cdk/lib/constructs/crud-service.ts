import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as path from 'path';

/**
 * Properties for the CrudService construct
 */
export interface CrudServiceProps {
  /**
   * The name of the entity this service manages
   */
  entityName: string;
  
  /**
   * The name of the DynamoDB table
   */
  tableName: string;
  
  /**
   * The path prefix for the API
   */
  apiPath: string;
  
  /**
   * The stage name for the API deployment
   * @default 'prod'
   */
  stageName?: string;
  
  /**
   * The path to the Lambda code
   */
  lambdaCodePath: string;
  
  /**
   * Whether to enable advanced features
   * @default true
   */
  enableAdvancedFeatures?: boolean;
}

/**
 * A higher-level L3 construct that creates a complete CRUD API
 * with DynamoDB, Lambda, and API Gateway components
 */
export class CrudService extends Construct {
  /**
   * The DynamoDB table
   */
  public readonly table: dynamodb.Table;
  
  /**
   * The Lambda function
   */
  public readonly handler: lambda.Function;
  
  /**
   * The API Gateway REST API
   */
  public readonly api: apigateway.RestApi;
  
  /**
   * The URL of the deployed API
   */
  public readonly apiUrl: string;

  constructor(scope: Construct, id: string, props: CrudServiceProps) {
    super(scope, id);
    
    // Create the DynamoDB table
    this.table = new dynamodb.Table(this, `${props.entityName}Table`, {
      tableName: props.tableName,
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      // Advanced features enabled by default in the L3 construct
      pointInTimeRecovery: props.enableAdvancedFeatures !== false,
      timeToLiveAttribute: 'ttl',
      encryption: dynamodb.TableEncryption.AWS_MANAGED,
      stream: props.enableAdvancedFeatures !== false ? 
        dynamodb.StreamViewType.NEW_AND_OLD_IMAGES : undefined
    });

    // Create the Lambda function
    this.handler = new lambda.Function(this, `${props.entityName}Function`, {
      functionName: `${props.entityName}-CRUD-Service`,
      runtime: lambda.Runtime.NODEJS_18_X,
      handler: 'index.handler',
      code: lambda.Code.fromAsset(props.lambdaCodePath),
      environment: {
        TABLE_NAME: this.table.tableName,
        ENTITY_NAME: props.entityName
      },
      // Advanced configuration for L3 construct
      timeout: cdk.Duration.seconds(10),
      memorySize: 256,
      description: `${props.entityName} CRUD API handler with L3 construct pattern`,
      tracing: lambda.Tracing.ACTIVE,
      retryAttempts: 2,
      logRetention: props.enableAdvancedFeatures !== false ? 
        cdk.aws_logs.RetentionDays.ONE_WEEK : undefined
    });

    // Grant table permissions to Lambda
    this.table.grantReadWriteData(this.handler);

    // Create the API Gateway
    this.api = new apigateway.RestApi(this, `${props.entityName}Api`, {
      restApiName: `${props.entityName}-API`,
      description: `${props.entityName} CRUD API using L3 pattern construct`,
      deployOptions: {
        stageName: props.stageName || 'prod',
        metricsEnabled: props.enableAdvancedFeatures !== false,
        loggingLevel: props.enableAdvancedFeatures !== false ?
          apigateway.MethodLoggingLevel.INFO : undefined,
        tracingEnabled: props.enableAdvancedFeatures !== false
      },
      defaultCorsPreflightOptions: props.enableAdvancedFeatures !== false ? {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ['Content-Type', 'Authorization']
      } : undefined
    });

    // Create API resources and methods
    const entityResource = this.api.root.addResource(props.apiPath);
    const entityIntegration = new apigateway.LambdaIntegration(this.handler);
    
    // Collection methods
    entityResource.addMethod('GET', entityIntegration);    // List all
    entityResource.addMethod('POST', entityIntegration);   // Create
    
    // Individual item methods
    const itemResource = entityResource.addResource('{id}');
    itemResource.addMethod('GET', entityIntegration);      // Get one
    itemResource.addMethod('PUT', entityIntegration);      // Update
    itemResource.addMethod('DELETE', entityIntegration);   // Delete
    
    // Store the API URL
    this.apiUrl = `${this.api.url}${props.apiPath}`;
    
    // Add CloudWatch Dashboard if advanced features are enabled
    if (props.enableAdvancedFeatures !== false) {
      this.createDashboard(props.entityName);
    }
  }
  
  /**
   * Creates a CloudWatch dashboard for monitoring this service
   */
  private createDashboard(entityName: string) {
    const dashboard = new cdk.aws_cloudwatch.Dashboard(this, `${entityName}Dashboard`, {
      dashboardName: `${entityName}-CRUD-Service-Dashboard`
    });
    
    // Add widgets for Lambda metrics
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: `${entityName} API Invocations`,
        left: [this.handler.metricInvocations()],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: `${entityName} API Errors`,
        left: [this.handler.metricErrors()],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: `${entityName} API Duration`,
        left: [this.handler.metricDuration()],
      })
    );
    
    // Add widgets for API Gateway metrics
    dashboard.addWidgets(
      new cdk.aws_cloudwatch.GraphWidget({
        title: `${entityName} API Requests`,
        left: [this.api.metricCount()],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: `${entityName} API Latency`,
        left: [this.api.metricLatency()],
      }),      new cdk.aws_cloudwatch.GraphWidget({
        title: `${entityName} API 4XX Errors`,
        left: [this.api.metricClientError()],
      }),
      new cdk.aws_cloudwatch.GraphWidget({
        title: `${entityName} API 5XX Errors`,
        left: [this.api.metricServerError()],
      })
    );
  }
}
