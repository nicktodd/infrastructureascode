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

class ActorsController {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }

  // GET /actors - List all actors
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

  // GET /actors/{id} - Get actor by ID
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

  // POST /actors - Create new actor
  async create(actor: Partial<Actor>): Promise<APIGatewayProxyResult> {
    try {
      // Validate required fields
      if (!actor.id || !actor.name) {
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'id and name are required fields' })
        };
      }

      // Check if actor already exists
      const existingActor = await dynamoDB.send(new GetCommand({
        TableName: this.tableName,
        Key: { id: actor.id }
      }));

      if (existingActor.Item) {
        return {
          statusCode: 409,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Actor with id ${actor.id} already exists` })
        };
      }

      // Create actor with timestamps
      const now = new Date().toISOString();
      const newActor: Actor = {
        id: actor.id,
        name: actor.name,
        age: actor.age,
        nationality: actor.nationality,
        knownFor: actor.knownFor || [],
        isActive: actor.isActive ?? true,
        createdAt: now,
        updatedAt: now
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: newActor
      });

      await dynamoDB.send(command);

      return {
        statusCode: 201,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(newActor)
      };
    } catch (error) {
      console.error('Error creating actor:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Failed to create actor' })
      };
    }
  }

  // PUT /actors/{id} - Update actor
  async update(id: string, updates: Partial<Actor>): Promise<APIGatewayProxyResult> {
    try {
      // Check if actor exists
      const existingActor = await dynamoDB.send(new GetCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      if (!existingActor.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Actor with id ${id} not found` })
        };
      }

      // Remove fields that shouldn't be updated
      const { id: updateId, createdAt, ...allowedUpdates } = updates;
      
      // Add updated timestamp
      const updatedActor = {
        ...existingActor.Item,
        ...allowedUpdates,
        updatedAt: new Date().toISOString()
      };

      const command = new PutCommand({
        TableName: this.tableName,
        Item: updatedActor
      });

      await dynamoDB.send(command);

      return {
        statusCode: 200,
        headers: {
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        },
        body: JSON.stringify(updatedActor)
      };
    } catch (error) {
      console.error('Error updating actor:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Failed to update actor' })
      };
    }
  }

  // DELETE /actors/{id} - Delete actor
  async delete(id: string): Promise<APIGatewayProxyResult> {
    try {
      // Check if actor exists
      const existingActor = await dynamoDB.send(new GetCommand({
        TableName: this.tableName,
        Key: { id }
      }));

      if (!existingActor.Item) {
        return {
          statusCode: 404,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: `Actor with id ${id} not found` })
        };
      }

      const command = new DeleteCommand({
        TableName: this.tableName,
        Key: { id }
      });

      await dynamoDB.send(command);

      return {
        statusCode: 204,
        headers: {
          'Access-Control-Allow-Origin': '*'
        },
        body: ''
      };
    } catch (error) {
      console.error('Error deleting actor:', error);
      return {
        statusCode: 500,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Failed to delete actor' })
      };
    }
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event, null, 2));
  
  const tableName = process.env.TABLE_NAME;
  if (!tableName) {
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'TABLE_NAME environment variable not set' })
    };
  }

  const controller = new ActorsController(tableName);
  
  try {
    const { httpMethod: method, resource, pathParameters } = event;
    const actorId = pathParameters?.id;

    // Route requests based on method and path
    switch (`${method}:${resource}`) {
      case 'GET:/actors':
        return await controller.listAll();
        
      case 'GET:/actors/{id}':
        if (!actorId) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Actor ID is required' })
          };
        }
        return await controller.getById(actorId);
        
      case 'POST:/actors':
        const createData = JSON.parse(event.body || '{}');
        return await controller.create(createData);
        
      case 'PUT:/actors/{id}':
        if (!actorId) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Actor ID is required' })
          };
        }
        const updateData = JSON.parse(event.body || '{}');
        return await controller.update(actorId, updateData);
        
      case 'DELETE:/actors/{id}':
        if (!actorId) {
          return {
            statusCode: 400,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ message: 'Actor ID is required' })
          };
        }
        return await controller.delete(actorId);
        
      default:
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ 
            message: `Unsupported operation: ${method} ${resource}` 
          })
        };
    }
    
  } catch (error) {
    console.error('Handler error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ message: 'Internal server error' })
    };
  }
};
