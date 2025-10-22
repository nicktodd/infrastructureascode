import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

/**
 * TVShows CRUD Lambda handler (L3 implementation in TypeScript)
 * This implementation uses a more sophisticated architecture with
 * controller pattern and router for better organization
 */

// Controller pattern - organize CRUD operations
class TVShowsController {
  private tableName: string;

  constructor(tableName: string) {
    this.tableName = tableName;
  }
  // List all TV shows
  async listAll(): Promise<APIGatewayProxyResult> {
    const data = await dynamoDB.send(new ScanCommand({
      TableName: this.tableName,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(data.Items),
    };
  }
  // Get a single TV show by ID
  async getById(id: string): Promise<APIGatewayProxyResult> {
    const data = await dynamoDB.send(new GetCommand({
      TableName: this.tableName,
      Key: { id },
    }));

    if (!data.Item) {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'TV show not found' }),
      };
    }

    return {
      statusCode: 200,
      body: JSON.stringify(data.Item),
    };
  }

  // Create a new TV show
  async create(tvShow: any): Promise<APIGatewayProxyResult> {
    if (!tvShow.id || !tvShow.title) {
      return {
        statusCode: 400,
        body: JSON.stringify({ message: 'ID and title are required' }),
      };
    }

    await dynamoDB.send(new PutCommand({
      TableName: this.tableName,
      Item: {
        id: tvShow.id,
        title: tvShow.title,
        genre: tvShow.genre || '',
        year: tvShow.year || null,
        rating: tvShow.rating || null,
        createdAt: new Date().toISOString(),
      },
    }));

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'TV show created successfully', id: tvShow.id }),
    };
  }

  // Delete a TV show by ID
  async deleteById(id: string): Promise<APIGatewayProxyResult> {
    await dynamoDB.send(new DeleteCommand({
      TableName: this.tableName,
      Key: { id },
    }));

    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'TV show deleted successfully' }),
    };
  }
}

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));
  const tableName = process.env.TABLE_NAME;

  if (!tableName) {
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Table name is not configured' }),
    };
  }

  const controller = new TVShowsController(tableName);

  try {
    const { httpMethod: method, path } = event;

    if (method === 'GET' && path === '/tvshows') {
      return await controller.listAll();
    }    if (method === 'GET' && path.match(/\/tvshows\/[\w-]+/)) {
      const id = event.pathParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'ID is required' }),
        };
      }
      return await controller.getById(id);
    }

    if (method === 'POST' && path === '/tvshows') {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Request body is required' }),
        };
      }
      
      const tvShow = JSON.parse(event.body);
      return await controller.create(tvShow);
    }

    if (method === 'DELETE' && path.match(/\/tvshows\/[\w-]+/)) {
      const id = event.pathParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'ID is required' }),
        };
      }
      return await controller.deleteById(id);
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Unsupported operation' }),
    };
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
