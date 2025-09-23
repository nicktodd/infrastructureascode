import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as path from 'path';
import { CrudService } from './constructs/crud-service';

export class L3CrudStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Use our custom L3 construct which encapsulates the entire CRUD service
    const tvShowsService = new CrudService(this, 'TVShowsCrudService', {
      entityName: 'TVShows',
      tableName: 'TVShows-L3',
      apiPath: 'tvshows',
      lambdaCodePath: path.join(__dirname, '../src/lambda-l3'),
      stageName: 'prod',
      enableAdvancedFeatures: true
    });

    // Output the API URL - reusing the apiUrl property from our construct
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: tvShowsService.apiUrl,
      description: 'URL of the API (L3 Custom Construct)'
    });
  }
}