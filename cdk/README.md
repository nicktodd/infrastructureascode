# AWS CDK Construct Levels Demonstration Project

This project demonstrates the three levels of AWS CDK constructs (L1, L2, and L3) by implementing the same TVShows CRUD API using each level. This approach helps to understand the differences in abstraction, code complexity, and features provided by each construct level.

## Project Overview

The application is a simple TV Shows database with a REST API providing CRUD operations:
- `GET /tvshows`: List all TV shows
- `GET /tvshows/{id}`: Get a specific TV show
- `POST /tvshows`: Create a new TV show
- `PUT /tvshows/{id}`: Update an existing TV show
- `DELETE /tvshows/{id}`: Delete a TV show

Each stack creates the same infrastructure using different CDK construct levels:

## CDK Construct Levels

### L1 Constructs (TVShowsL1Stack)

L1 constructs are direct CloudFormation resource mappings (CFN Resources). They:
- Provide maximum control and direct access to CloudFormation properties
- Require more boilerplate code and explicit configurations
- Demand a deeper understanding of AWS resource properties
- Require manual definition of IAM permissions and resource dependencies

### L2 Constructs (TVShowsL2Stack)

L2 constructs are curated AWS resources with sensible defaults. They:
- Provide better abstraction with helper methods and properties
- Require less code for common patterns
- Simplify IAM permissions with grant* methods
- Handle dependencies between resources automatically
- Support AWS best practices out of the box

### L3 Constructs (TVShowsL3Stack)

L3 constructs are high-level patterns that combine multiple resources. They:
- Implement entire architectural patterns with minimal code
- Include monitoring, scaling, and other operational features
- Enable rapid development with secure defaults
- Simplify complex resource interactions
- Handle cross-resource permissions and configuration

## Code Structure

- `lib/l1-crud-stack.ts`: L1 implementation using CFN constructs
- `lib/l2-crud-stack.ts`: L2 implementation using AWS constructs
- `lib/l3-crud-stack.ts`: L3 implementation using pattern constructs
- `src/lambda-l1/`: Lambda function code for L1 implementation
- `src/lambda-l2/`: Lambda function code for L2 implementation
- `src/lambda-l3/`: Enhanced Lambda function code for L3 implementation
- `src/lambda-typescript/`: TypeScript version of Lambda handler (for reference)

## Useful Commands

* `npm run build`   compile TypeScript to JS
* `npm run watch`   watch for changes and compile
* `npm run test`    perform the Jest unit tests
* `npx cdk deploy TVShowsL1Stack`  deploy the L1 stack to your default AWS account/region
* `npx cdk deploy TVShowsL2Stack`  deploy the L2 stack to your default AWS account/region
* `npx cdk deploy TVShowsL3Stack`  deploy the L3 stack to your default AWS account/region
* `npx cdk diff`    compare deployed stack with current state
* `npx cdk synth`   emits the synthesized CloudFormation template
