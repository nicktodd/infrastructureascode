# TV Actors API Solution

This is the complete solution for Lab 01: Deploy Lambda Using CDK.

## Solution Overview

This solution demonstrates:
- **TypeScript Lambda functions** with full CRUD operations
- **Test-Driven Development** using Vitest with comprehensive mocking
- **AWS CDK L2 constructs** for infrastructure as code
- **API Gateway integration** with proper routing
- **DynamoDB operations** using AWS SDK v3
- **Local testing** capabilities with unit and integration tests
- **Error handling** and input validation
- **CORS support** for web applications

## Project Structure

```
tv-actors-api-solution/
├── bin/
│   └── tv-actors-api-solution.ts    # CDK app entry point
├── lib/
│   └── tv-actors-api-solution-stack.ts # CDK stack definition
├── src/
│   ├── index.ts                     # Lambda handler (complete solution)
│   ├── actors.test.ts               # Comprehensive Vitest unit tests
│   └── test-local.ts                # Local integration testing harness
├── vitest.config.ts                 # Vitest configuration
├── cdk.json                         # CDK configuration
├── package.json                     # Dependencies and scripts
└── tsconfig.json                    # TypeScript configuration
```

## Quick Start

### Prerequisites
- Node.js 18.x or later
- AWS CLI configured
- AWS CDK CLI installed

### Installation

```powershell
# Install dependencies
npm install

# Build TypeScript
npm run build

# Verify CDK setup
npx cdk ls
```

### Testing

The solution includes comprehensive testing at multiple levels:

#### Unit Tests with Vitest
```powershell
# Run all unit tests
npm test

# Run tests in watch mode (reruns on file changes)
npm run test:watch

# Run tests with UI (web interface)
npm run test:ui
```

#### Integration Testing
```powershell
# Run the local integration test harness
npx ts-node src/test-local.ts
```

This will run through all CRUD operations and error scenarios without requiring AWS resources.

### Deployment

```powershell
# Deploy the stack
npx cdk deploy

# Note the API URL from the output
```

### Testing the Deployed API

Use the API URL from the deployment output:

```powershell
$apiUrl = "https://your-api-id.execute-api.region.amazonaws.com/prod"

# Test the endpoints
Invoke-RestMethod -Uri "$apiUrl/actors" -Method GET

# Create an actor
$actor = @{
  id = "bryan-cranston"
  name = "Bryan Cranston"
  age = 67
  nationality = "American"
  knownFor = @("Breaking Bad", "Malcolm in the Middle")
  isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$apiUrl/actors" -Method POST -Body $actor -ContentType "application/json"
```

## Solution Features

### 1. Complete CRUD Operations

- **GET /actors** - List all actors
- **GET /actors/{id}** - Get actor by ID
- **POST /actors** - Create new actor
- **PUT /actors/{id}** - Update existing actor
- **DELETE /actors/{id}** - Delete actor

### 2. Comprehensive Testing Strategy

- **Unit Tests**: Full coverage with Vitest and mocking
- **Integration Tests**: End-to-end testing harness
- **Test-Driven Development**: Red-Green-Refactor workflow
- **Continuous Testing**: Watch mode for rapid feedback
- **Mocking**: DynamoDB client mocking for isolated testing

### 3. Error Handling

- Input validation
- Proper HTTP status codes
- Detailed error messages
- Resource existence checking

### 4. TypeScript Features

- Strong typing with interfaces
- Proper error handling
- Modern async/await patterns
- AWS SDK v3 integration

### 5. CDK Best Practices

- L2 constructs usage
- Proper IAM permissions
- Environment variables
- Stack outputs
- Removal policies for cleanup

### 6. API Gateway Integration

- REST API with proper routing
- CORS support
- Lambda proxy integration
- Path parameter handling

## Key Implementation Details

### Actor Data Model

```typescript
interface Actor {
  id: string;              // Required: Unique identifier
  name: string;            // Required: Actor's name
  age?: number;            // Optional: Actor's age
  nationality?: string;    // Optional: Actor's nationality
  knownFor?: string[];     // Optional: Array of shows/movies
  isActive?: boolean;      // Optional: Whether actor is currently active
  createdAt?: string;      // Auto-generated: Creation timestamp
  updatedAt?: string;      // Auto-generated: Last update timestamp
}
```

### DynamoDB Table Design

- **Table Name**: TVActors
- **Partition Key**: id (string)
- **Billing Mode**: Pay-per-request
- **Removal Policy**: DESTROY (for easy cleanup)

### Lambda Function Configuration

- **Runtime**: Node.js 18.x
- **Handler**: index.handler
- **Timeout**: 30 seconds
- **Memory**: 256 MB
- **Environment Variables**: TABLE_NAME

## Testing Strategy

### Unit Testing with Vitest
The `src/actors.test.ts` file provides comprehensive unit testing:
- **Mocking**: DynamoDB client fully mocked for isolation
- **Coverage**: All CRUD operations and error paths tested
- **Fast Feedback**: Tests run in milliseconds without AWS
- **Watch Mode**: Continuous testing during development
- **Type Safety**: Full TypeScript support in tests

### Integration Testing
The `src/test-local.ts` file provides integration testing:
- Mocks API Gateway events
- Tests complete request/response flow
- Validates error scenarios
- No AWS resources required

### End-to-End Testing
After deployment, use the PowerShell script:
- Real AWS services (API Gateway, Lambda, DynamoDB)
- Complete infrastructure validation
- Network and permissions testing

## Common Issues and Solutions

### 1. TypeScript Compilation Errors
```powershell
# Clean build
rm -rf lib/
npm run build
```

### 2. CDK Deployment Issues
```powershell
# Check differences
npx cdk diff

# Bootstrap if needed (first time)
npx cdk bootstrap
```

### 3. Lambda Function Errors
- Check CloudWatch logs
- Verify environment variables
- Test function in AWS Console

### 4. API Gateway Issues
- Verify resource paths match Lambda routing logic
- Check CORS configuration
- Test individual methods

## Performance Considerations

### Lambda Optimizations
- Connection reuse with DynamoDB client
- Proper error handling to avoid timeouts
- Minimal cold start impact

### DynamoDB Optimizations
- Pay-per-request billing for variable workloads
- Single-table design with partition key
- Proper error handling for capacity issues

## Security Features

### IAM Permissions
- Least privilege principle
- Lambda execution role with minimal DynamoDB permissions
- No public access to DynamoDB table

### Input Validation
- Required field validation
- Type checking
- Sanitization of user inputs

### CORS Configuration
- Configurable origins
- Proper preflight handling
- Security headers

## Cleanup

Remove all AWS resources:

```powershell
npx cdk destroy
```

## Extension Ideas

### For Advanced Students

1. **Add input validation middleware**
2. **Implement pagination for list operations**
3. **Add search and filtering capabilities**
4. **Include comprehensive logging**
5. **Add authentication with Cognito**
6. **Implement caching with ElastiCache**
7. **Add monitoring and alerting**
8. **Create CI/CD pipeline**

## Testing Best Practices Demonstrated

### Test-Driven Development (TDD) Approach
This solution demonstrates the Red-Green-Refactor cycle:

1. **🔴 Red**: Write failing tests first
   ```powershell
   # Tests fail initially - no implementation yet
   npm test
   ```

2. **🟢 Green**: Write minimal code to make tests pass
   ```powershell
   # Implement just enough to pass the test
   npm test  # Now passes
   ```

3. **🔵 Refactor**: Improve code while keeping tests green
   ```powershell
   # Clean up code, tests still pass
   npm test  # Still passes after refactoring
   ```

### Mocking Strategy
- **DynamoDB Client**: Fully mocked to avoid AWS calls during testing
- **API Gateway Events**: Mock event objects for isolated Lambda testing
- **Environment Variables**: Test configuration without real infrastructure

### Test Organization
- **Unit Tests**: Individual method testing with mocks
- **Integration Tests**: Full request/response cycle testing
- **Error Path Testing**: Comprehensive error scenario coverage
- **Edge Case Testing**: Boundary conditions and validation

## Learning Outcomes

After studying this solution, students should understand:

1. **Test-Driven Development** - Writing tests before implementation
2. **Vitest Framework** - Modern testing with TypeScript support
3. **Mocking Strategies** - Isolating code under test from dependencies
4. **CDK Project Structure** - How to organize CDK TypeScript projects
5. **Lambda Development** - Building serverless functions with TypeScript
6. **API Gateway Integration** - Creating REST APIs with Lambda
7. **DynamoDB Operations** - NoSQL database operations with AWS SDK
8. **Error Handling** - Proper error handling in serverless applications
9. **Testing Strategies** - Local and integration testing approaches
10. **Infrastructure as Code** - Managing AWS resources through code
11. **Security Best Practices** - IAM permissions and input validation

---

This solution provides a solid foundation for building serverless CRUD APIs with AWS CDK and TypeScript. Students can use it as a reference implementation and extend it with additional features as they learn more advanced concepts.
