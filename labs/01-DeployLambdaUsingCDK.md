# Lab 01: Deploy Lambda Using CDK - TV Actors CRUD API

## Overview
In this lab, you'll build a complete CRUD (Create, Read, Update, Delete) API for managing TV actors using AWS CDK and TypeScript. This lab is designed to teach you CDK fundamentals by separating concerns: first you'll build and test the Lambda logic, then deploy it with CDK infrastructure.


**Prerequisites:** Basic Lambda experience, Node.js knowledge  
**Learning Objectives:**
- Understand CDK project structure and commands
- Build TypeScript Lambda functions with CRUD operations
- Test Lambda functions locally before deployment
- Deploy infrastructure using CDK L2 constructs
- Work with API Gateway, Lambda, and DynamoDB integration

## Lab Structure

This lab follows a progressive approach:
1. **Scaffold CDK Project** - Get familiar with CDK structure
2. **Build Lambda CRUD Logic** - Focus on TypeScript Lambda development
3. **Test Locally** - Debug and validate your code
4. **Deploy with CDK** - Add infrastructure and deploy

## Part 1: Project Setup (15 minutes)

### Step 1.1: Initialize Your CDK Project

Create a new directory for your lab:

```powershell
mkdir tv-actors-api
cd tv-actors-api
```

Initialize a new CDK TypeScript project:

```powershell
npx cdk init app --language typescript
```

### Step 1.2: Install Additional Dependencies

Your Lambda will need AWS SDK v3, Lambda types, and Vitest for testing:

```powershell
# Production dependencies
npm install @aws-sdk/client-dynamodb @aws-sdk/lib-dynamodb @types/aws-lambda

# Development dependencies for testing
npm install --save-dev vitest @vitest/ui @types/node
```

### Step 1.3: Explore the Project Structure

Take a moment to understand the generated structure:

```
tv-actors-api/
├── bin/
│   └── tv-actors-api.ts          # CDK app entry point
├── lib/
│   └── tv-actors-api-stack.ts    # Your main stack
├── src/                          # Create this - Lambda source code
├── test/
├── cdk.json                      # CDK configuration
├── package.json                  # Dependencies
└── tsconfig.json                 # TypeScript config
```

### Step 1.4: Setup Vitest Configuration

Add test scripts to your `package.json`. Update the scripts section:

```json
{
  "scripts": {
    "build": "tsc",
    "watch": "tsc -w",
    "test": "vitest",
    "test:watch": "vitest --watch",
    "test:ui": "vitest --ui",
    "cdk": "cdk"
  }
}
```

Create a `vitest.config.ts` file in your project root:

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'node',
    globals: true,
    coverage: {
      reporter: ['text', 'json', 'html']
    }
  }
});
```

### Step 1.5: Verify CDK Installation

Test your CDK setup:

```powershell
npm run build
npx cdk ls
```

You should see your stack name listed.

## Part 2: Build the Lambda CRUD Logic (45 minutes)

### Step 2.1: Define the Actor Data Model

Create the Lambda source directory and main handler file:

```powershell
mkdir src
New-Item src/index.ts
```

**TODO:** Add the following TypeScript interface and imports to `src/index.ts`:

```typescript
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, UpdateCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

// Initialize DynamoDB client
const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

// Define the Actor interface
interface Actor {
  id: string;
  name: string;
  age?: number;
  nationality?: string;
  knownFor?: string[];  // Array of shows/movies they're known for
  isActive?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

// TODO: Add your CRUD controller class here
```

### 🧪 **Test-Driven Development: Create Your First Tests**

Before implementing the CRUD operations, let's set up tests. Create `src/actors.test.ts`:

```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';

// We'll mock the DynamoDB client
vi.mock('@aws-sdk/lib-dynamodb', () => ({
  DynamoDBDocumentClient: {
    from: vi.fn(() => ({
      send: vi.fn()
    }))
  },
  ScanCommand: vi.fn(),
  GetCommand: vi.fn(),
  PutCommand: vi.fn(),
  UpdateCommand: vi.fn(),
  DeleteCommand: vi.fn()
}));

vi.mock('@aws-sdk/client-dynamodb', () => ({
  DynamoDBClient: vi.fn()
}));

// Helper function to create mock API Gateway events
function createMockEvent(
  method: string,
  resource: string,
  pathParameters: any = null,
  body: any = null
): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    resource: resource,
    path: resource.replace(/{[^}]+}/g, pathParameters?.id || ''),
    pathParameters,
    queryStringParameters: null,
    headers: {},
    multiValueHeaders: {},
    requestContext: {} as any,
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false,
    stageVariables: null,
    multiValueQueryStringParameters: null
  };
}

describe('TV Actors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TABLE_NAME = 'TestActors';
  });

  // TODO: Add your tests here as you implement each method
  // We'll add these incrementally
});
```

**Run your tests** to make sure the setup works:

```powershell
npm test
```

You should see "No test files found" or the describe block running (even though it's empty).

### Step 2.2: Create the CRUD Controller (Test-Driven Development)

We'll implement each CRUD operation incrementally, writing tests first, then the implementation.

#### 2.2.1: Implement `listAll()` - List All Actors

**First, add the test** to your `src/actors.test.ts` inside the describe block:

```typescript
describe('TV Actors API', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    process.env.TABLE_NAME = 'TestActors';
  });

  describe('listAll', () => {
    it('should return empty actors list when table is empty', async () => {
      // TODO: Import your handler when you create it
      // const { handler } = await import('./index');
      
      // Mock DynamoDB scan to return empty results
      const mockSend = vi.fn().mockResolvedValue({
        Items: [],
        Count: 0
      });
      
      // TODO: Mock the DynamoDB client and test the listAll functionality
      // For now, this test will fail - implement it after creating your controller
    });

    it('should return list of actors when table has data', async () => {
      // TODO: Add test for non-empty results
    });
  });
});
```

**Run the test** to see it fail (Red):
```powershell
npm test
```

**Now implement** the ActorsController class and `listAll()` method in `src/index.ts`:

```typescript
class ActorsController {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // Implement listAll() - GET /actors
  async listAll(): Promise<APIGatewayProxyResult> {
    try {
      const command = new ScanCommand({
        TableName: this.tableName
      });

      const result = await dynamoDB.send(command);
      
      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify({
          actors: result.Items || [],
          count: result.Count || 0
        })
      };
    } catch (error) {
      console.error('Error listing actors:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Failed to retrieve actors' })
      };
    }
  }

  // TODO: Implement the other CRUD methods
}
```

**Update your test** to actually test the implementation:

```typescript
// Add this import at the top of your test file
import * as AWS from '@aws-sdk/lib-dynamodb';

describe('listAll', () => {
  it('should return empty actors list when table is empty', async () => {
    const { handler } = await import('./index');
    
    // Mock DynamoDB scan to return empty results
    const mockSend = vi.fn().mockResolvedValue({
      Items: [],
      Count: 0
    });
    
    vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
      send: mockSend
    } as any);

    const event = createMockEvent('GET', '/actors');
    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual({
      actors: [],
      count: 0
    });
  });
});
```

**Run the test** to see it pass (Green):
```powershell
npm test
```

#### 2.2.2: Implement `getById()` - Get Actor by ID

**Add tests** for the getById functionality:

```typescript
describe('getById', () => {
  it('should return actor when found', async () => {
    const { handler } = await import('./index');
    
    const mockActor = {
      id: 'test-actor',
      name: 'Test Actor',
      age: 30
    };
    
    const mockSend = vi.fn().mockResolvedValue({
      Item: mockActor
    });
    
    vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
      send: mockSend
    } as any);

    const event = createMockEvent('GET', '/actors/{id}', { id: 'test-actor' });
    const result = await handler(event);
    
    expect(result.statusCode).toBe(200);
    expect(JSON.parse(result.body)).toEqual(mockActor);
  });

  it('should return 404 when actor not found', async () => {
    const { handler } = await import('./index');
    
    const mockSend = vi.fn().mockResolvedValue({
      Item: undefined
    });
    
    vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
      send: mockSend
    } as any);

    const event = createMockEvent('GET', '/actors/{id}', { id: 'non-existent' });
    const result = await handler(event);
    
    expect(result.statusCode).toBe(404);
    expect(JSON.parse(result.body).message).toContain('not found');
  });
});
```

**Implement `getById()`** in your ActorsController:

```typescript
// Add this method to your ActorsController class
async getById(id: string): Promise<APIGatewayProxyResult> {
  try {
    const command = new GetCommand({
      TableName: this.tableName,
      Key: { id }
    });

    const result = await dynamoDB.send(command);
    
    if (!result.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: `Actor with id ${id} not found` })
      };
    }

    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*'
      },
      body: JSON.stringify(result.Item)
    };
  } catch (error) {
    console.error('Error getting actor:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Failed to retrieve actor' })
    };
  }
}
```

**Continue this pattern** for the remaining CRUD operations:
- `create()` - POST /actors
- `update()` - PUT /actors/{id}  
- `delete()` - DELETE /actors/{id}

💡 **TDD Workflow:**
1. **Red**: Write failing test
2. **Green**: Write minimal code to pass
3. **Refactor**: Improve code quality
4. **Repeat** for next feature

### Step 2.3: Implement the Main Handler

**TODO:** Add the main Lambda handler that routes requests:

```typescript
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));
  
  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'TABLE_NAME environment variable not set' })
    };
  }

  const controller = new ActorsController(tableName);
  
  try {
    const { httpMethod: method, path } = event;
    
    // TODO: Route requests based on method and path
    // GET /actors -> listAll()
    // GET /actors/{id} -> getById()
    // POST /actors -> create()
    // PUT /actors/{id} -> update()
    // DELETE /actors/{id} -> delete()
    
    // Return 400 for unsupported operations
    
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
```

### Implementation Hints:

- Use `event.pathParameters?.id` to get the ID from the URL path
- Parse request body with `JSON.parse(event.body || '{}')`
- Always add timestamps: `new Date().toISOString()`
- Include proper error handling for each operation
- Return appropriate HTTP status codes (200, 201, 404, 400, 500)

## Part 3: Complete Your Implementation with Tests (30 minutes)

### Step 3.1: Finish Implementing the Remaining CRUD Methods

Using the same TDD approach, implement the remaining methods. Here are test templates to get you started:

**For `create()` method:**
```typescript
describe('create', () => {
  it('should create actor with valid data', async () => {
    // TODO: Mock DynamoDB GetCommand (check if exists) and PutCommand
    // TODO: Test successful creation returns 201 status
  });

  it('should return 400 for missing required fields', async () => {
    // TODO: Test validation error handling
  });

  it('should return 409 if actor already exists', async () => {
    // TODO: Test duplicate ID handling
  });
});
```

**For `update()` and `delete()` methods:**
```typescript
describe('update', () => {
  it('should update existing actor', async () => {
    // TODO: Test successful update
  });

  it('should return 404 for non-existent actor', async () => {
    // TODO: Test update of non-existent resource
  });
});

describe('delete', () => {
  it('should delete existing actor', async () => {
    // TODO: Test successful deletion (204 status)
  });

  it('should return 404 for non-existent actor', async () => {
    // TODO: Test deletion of non-existent resource
  });
});
```

### Step 3.2: Run Your Tests Continuously

Keep your tests running while you implement:

```powershell
# Run tests in watch mode - they'll rerun as you make changes
npm run test:watch
```

### Step 3.3: Create Integration Test Harness

After implementing all methods, create `src/test-local.ts` for integration testing:

```typescript
import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock DynamoDB for local testing
process.env.TABLE_NAME = 'TVActors';

// Helper function to create mock API Gateway events
function createMockEvent(
  method: string,
  resource: string,
  pathParameters: any = null,
  body: any = null
): APIGatewayProxyEvent {
  return {
    httpMethod: method,
    resource: resource,
    path: resource.replace(/{[^}]+}/g, pathParameters?.id || ''),
    pathParameters,
    queryStringParameters: null,
    headers: {},
    multiValueHeaders: {},
    requestContext: {} as any,
    body: body ? JSON.stringify(body) : null,
    isBase64Encoded: false,
    stageVariables: null,
    multiValueQueryStringParameters: null
  };
}

async function runIntegrationTests() {
  console.log(' Running Integration Tests\n');

  // Test 1: List all actors
  const listEvent = createMockEvent('GET', '/actors');
  const listResult = await handler(listEvent);
  console.log(' List All:', listResult.statusCode, JSON.parse(listResult.body));

  // Test 2: Create actor
  const actor = { id: 'test-1', name: 'Test Actor', age: 30 };
  const createEvent = createMockEvent('POST', '/actors', null, actor);
  const createResult = await handler(createEvent);
  console.log(' Create:', createResult.statusCode, JSON.parse(createResult.body));

  // TODO: Add more integration tests
}

if (require.main === module) {
  runIntegrationTests();
}
```

Run integration tests:
```powershell
npx ts-node src/test-local.ts
```

### Step 3.4: Validate Your Implementation

**Testing Checklist:**
- [ ] All unit tests pass (`npm test`)
- [ ] All CRUD operations implemented
- [ ] Proper error handling tested
- [ ] TypeScript compiles without errors (`npm run build`)
- [ ] Integration tests pass
- [ ] Appropriate HTTP status codes returned

**Code Quality Checklist:**
- [ ] Consistent error handling patterns
- [ ] Proper TypeScript types used
- [ ] Good separation of concerns
- [ ] Clear, readable code structure

## Part 4: CDK Infrastructure (45 minutes)

### Step 4.1: Update Your Stack File

**TODO:** Replace the contents of `lib/tv-actors-api-stack.ts`:

```typescript
import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * * as apigateway from 'aws-cdk-lib/aws-apigateway';
import * as path from 'path';

export class TvActorsApiStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // TODO: Create DynamoDB table
    // - Table name: 'TVActors'
    // - Partition key: 'id' (string)
    // - Billing mode: PAY_PER_REQUEST
    // - Removal policy: DESTROY (for lab cleanup)

    // TODO: Create Lambda function
    // - Runtime: Node.js 18.x
    // - Handler: index.handler
    // - Code: from src directory
    // - Environment variable: TABLE_NAME

    // TODO: Grant Lambda permissions to DynamoDB table

    // TODO: Create API Gateway
    // - REST API
    // - Add /actors resource
    // - Add /{id} sub-resource
    // - Configure all HTTP methods

    // TODO: Add stack outputs
    // - API URL
    // - Table name
  }
}
```

### Step 4.2: Implement Infrastructure Components

Using CDK L2 constructs, implement each TODO:

**DynamoDB Table:**
```typescript
const table = new dynamodb.Table(this, 'ActorsTable', {
  // TODO: Complete the table configuration
});
```

**Lambda Function:**
```typescript
const lambdaFunction = new lambda.Function(this, 'ActorsFunction', {
  // TODO: Complete the Lambda configuration
});
```

**API Gateway:**
```typescript
const api = new apigateway.RestApi(this, 'ActorsApi', {
  // TODO: Complete the API configuration
});

// TODO: Add resources and methods
```

### Step 4.3: Deploy Your Stack

Build and deploy:

```powershell
npm run build
npx cdk synth
npx cdk deploy
```

Confirm the deployment when prompted.

## Part 5: Testing the Deployed API (20 minutes)

### Step 5.1: Test with PowerShell

After deployment, you'll get an API URL. Test your endpoints:

```powershell
# Get the API URL from the output
$apiUrl = "https://your-api-id.execute-api.region.amazonaws.com/prod"

# Test GET all actors (should return empty array initially)
Invoke-RestMethod -Uri "$apiUrl/actors" -Method GET

# Test POST create actor
$actor = @{
  id = "actor-1"
  name = "Bryan Cranston"
  age = 68
  nationality = "American"
  knownFor = @("Breaking Bad", "Malcolm in the Middle")
  isActive = $true
} | ConvertTo-Json

Invoke-RestMethod -Uri "$apiUrl/actors" -Method POST -Body $actor -ContentType "application/json"

# Test GET by ID
Invoke-RestMethod -Uri "$apiUrl/actors/actor-1" -Method GET

# Test PUT update
$update = @{
  knownFor = @("Breaking Bad", "Malcolm in the Middle", "Your Honor")
} | ConvertTo-Json

Invoke-RestMethod -Uri "$apiUrl/actors/actor-1" -Method PUT -Body $update -ContentType "application/json"
```

### Step 5.2: Verify in AWS Console

1. Check DynamoDB table has data
2. View Lambda logs in CloudWatch
3. Test API Gateway directly

## Bonus Challenges (Optional)

If you complete the lab early, try these enhancements:

### Challenge 1: Input Validation
Add comprehensive input validation:
- Name must be non-empty string
- Age must be positive number
- knownFor must be array of strings

### Challenge 2: Error Responses
Improve error handling:
- Return detailed error messages
- Add request ID for tracking
- Implement proper logging

### Challenge 3: Pagination
Add pagination to the list endpoint:
- Accept `limit` and `offset` query parameters
- Return pagination metadata

### Challenge 4: Search Functionality
Add search capability:
- Search by name (partial match)
- Filter by nationality
- Filter by active status

## Cleanup

After completing the lab:

```powershell
npx cdk destroy
```

Confirm the deletion when prompted.

## Key Learning Points

By completing this lab, you should understand:

1. **CDK Project Structure**: How CDK TypeScript projects are organized
2. **Lambda Development**: Building TypeScript Lambda functions with proper typing
3. **Local Testing**: Testing Lambda logic before deployment
4. **CDK L2 Constructs**: Using high-level AWS constructs for common resources
5. **Infrastructure as Code**: Managing AWS resources through code
6. **API Gateway Integration**: Creating REST APIs with Lambda backends
7. **DynamoDB Operations**: Performing CRUD operations with AWS SDK v3

## Troubleshooting

### Common Issues:

1. **TypeScript Compilation Errors**: Check imports and interface definitions
2. **CDK Deployment Failures**: Verify AWS credentials and permissions
3. **Lambda Timeout**: Increase timeout in function configuration
4. **CORS Issues**: Add CORS headers to responses if testing from browser
5. **DynamoDB Permissions**: Ensure Lambda has proper IAM permissions

### Getting Help:

- Check CloudWatch logs for Lambda errors
- Use `cdk diff` to see what changes will be deployed
- Test Lambda functions individually using the AWS Console

