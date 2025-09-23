#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { L1CrudStack } from '../lib/l1-crud-stack';
import { L2CrudStack } from '../lib/l2-crud-stack';
import { L3CrudStack } from '../lib/l3-crud-stack';

const app = new cdk.App();

// Create the three different stacks using different construct levels
new L1CrudStack(app, 'TVShowsL1Stack', {
  description: 'TV Shows CRUD API using L1 (CFN) constructs',
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new L2CrudStack(app, 'TVShowsL2Stack', {
  description: 'TV Shows CRUD API using L2 (AWS) constructs',
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});

new L3CrudStack(app, 'TVShowsL3Stack', {
  description: 'TV Shows CRUD API using L3 (pattern) constructs',
  // env: { account: process.env.CDK_DEFAULT_ACCOUNT, region: process.env.CDK_DEFAULT_REGION },
});