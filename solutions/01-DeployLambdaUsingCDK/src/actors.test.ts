import { describe, it, expect, vi, beforeEach } from 'vitest';
import { APIGatewayProxyEvent } from 'aws-lambda';
import * as AWS from '@aws-sdk/lib-dynamodb';

// Mock the DynamoDB client
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

    it('should return list of actors when table has data', async () => {
      const { handler } = await import('./index');
      
      const mockActors = [
        { id: 'actor-1', name: 'Actor One', age: 30 },
        { id: 'actor-2', name: 'Actor Two', age: 35 }
      ];
      
      const mockSend = vi.fn().mockResolvedValue({
        Items: mockActors,
        Count: 2
      });
      
      vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
        send: mockSend
      } as any);

      const event = createMockEvent('GET', '/actors');
      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      expect(JSON.parse(result.body)).toEqual({
        actors: mockActors,
        count: 2
      });
    });
  });

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

  describe('create', () => {
    it('should create actor with valid data', async () => {
      const { handler } = await import('./index');
      
      const newActor = {
        id: 'new-actor',
        name: 'New Actor',
        age: 25
      };
      
      // Mock that actor doesn't exist (for duplicate check)
      // Then mock successful creation
      const mockSend = vi.fn()
        .mockResolvedValueOnce({ Item: undefined }) // GetCommand - actor doesn't exist
        .mockResolvedValueOnce({}); // PutCommand - successful creation
      
      vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
        send: mockSend
      } as any);

      const event = createMockEvent('POST', '/actors', null, newActor);
      const result = await handler(event);
      
      expect(result.statusCode).toBe(201);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.id).toBe(newActor.id);
      expect(responseBody.name).toBe(newActor.name);
      expect(responseBody.createdAt).toBeDefined();
      expect(responseBody.updatedAt).toBeDefined();
    });

    it('should return 400 for missing required fields', async () => {
      const { handler } = await import('./index');
      
      const invalidActor = { name: 'Missing ID' }; // Missing required 'id' field
      
      const event = createMockEvent('POST', '/actors', null, invalidActor);
      const result = await handler(event);
      
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('required');
    });

    it('should return 409 if actor already exists', async () => {
      const { handler } = await import('./index');
      
      const existingActor = {
        id: 'existing-actor',
        name: 'Existing Actor'
      };
      
      // Mock that actor already exists
      const mockSend = vi.fn().mockResolvedValue({
        Item: { id: 'existing-actor', name: 'Already exists' }
      });
      
      vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
        send: mockSend
      } as any);

      const event = createMockEvent('POST', '/actors', null, existingActor);
      const result = await handler(event);
      
      expect(result.statusCode).toBe(409);
      expect(JSON.parse(result.body).message).toContain('already exists');
    });
  });

  describe('update', () => {
    it('should update existing actor', async () => {
      const { handler } = await import('./index');
      
      const existingActor = {
        id: 'update-actor',
        name: 'Original Actor',
        age: 30,
        createdAt: '2023-01-01T00:00:00.000Z'
      };
      
      const updateData = { age: 31, nationality: 'American' };
      
      // Mock that actor exists, then successful update
      const mockSend = vi.fn()
        .mockResolvedValueOnce({ Item: existingActor }) // GetCommand - actor exists
        .mockResolvedValueOnce({}); // PutCommand - successful update
      
      vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
        send: mockSend
      } as any);

      const event = createMockEvent('PUT', '/actors/{id}', { id: 'update-actor' }, updateData);
      const result = await handler(event);
      
      expect(result.statusCode).toBe(200);
      const responseBody = JSON.parse(result.body);
      expect(responseBody.age).toBe(31);
      expect(responseBody.nationality).toBe('American');
      expect(responseBody.updatedAt).toBeDefined();
      expect(responseBody.createdAt).toBe(existingActor.createdAt); // Should preserve original
    });

    it('should return 404 for non-existent actor', async () => {
      const { handler } = await import('./index');
      
      const mockSend = vi.fn().mockResolvedValue({
        Item: undefined
      });
      
      vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
        send: mockSend
      } as any);

      const event = createMockEvent('PUT', '/actors/{id}', { id: 'non-existent' }, { age: 25 });
      const result = await handler(event);
      
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toContain('not found');
    });
  });

  describe('delete', () => {
    it('should delete existing actor', async () => {
      const { handler } = await import('./index');
      
      const existingActor = { id: 'delete-actor', name: 'To Delete' };
      
      // Mock that actor exists, then successful deletion
      const mockSend = vi.fn()
        .mockResolvedValueOnce({ Item: existingActor }) // GetCommand - actor exists
        .mockResolvedValueOnce({}); // DeleteCommand - successful deletion
      
      vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
        send: mockSend
      } as any);

      const event = createMockEvent('DELETE', '/actors/{id}', { id: 'delete-actor' });
      const result = await handler(event);
      
      expect(result.statusCode).toBe(204);
      expect(result.body).toBe('');
    });

    it('should return 404 for non-existent actor', async () => {
      const { handler } = await import('./index');
      
      const mockSend = vi.fn().mockResolvedValue({
        Item: undefined
      });
      
      vi.mocked(AWS.DynamoDBDocumentClient.from).mockReturnValue({
        send: mockSend
      } as any);

      const event = createMockEvent('DELETE', '/actors/{id}', { id: 'non-existent' });
      const result = await handler(event);
      
      expect(result.statusCode).toBe(404);
      expect(JSON.parse(result.body).message).toContain('not found');
    });
  });

  describe('error handling', () => {
    it('should return 500 when TABLE_NAME is not set', async () => {
      const { handler } = await import('./index');
      
      delete process.env.TABLE_NAME;
      
      const event = createMockEvent('GET', '/actors');
      const result = await handler(event);
      
      expect(result.statusCode).toBe(500);
      expect(JSON.parse(result.body).message).toContain('TABLE_NAME');
    });

    it('should return 400 for unsupported operations', async () => {
      const { handler } = await import('./index');
      
      const event = createMockEvent('PATCH', '/actors');
      const result = await handler(event);
      
      expect(result.statusCode).toBe(400);
      expect(JSON.parse(result.body).message).toContain('Unsupported operation');
    });
  });
});
