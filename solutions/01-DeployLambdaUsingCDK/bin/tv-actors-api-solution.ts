#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { TvActorsApiStack } from '../lib/tv-actors-api-solution-stack';

const app = new cdk.App();
new TvActorsApiStack(app, 'TvActorsApiStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION,
  },
});
