import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

/**
 * TVShows CRUD Lambda handler (L1 implementation in TypeScript)
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));
  const tableName = process.env.TABLE_NAME;
  const method = event.httpMethod;
  const path = event.path;
  try {
    // GET /tvshows - List all TV shows
    if (method === 'GET' && path === '/tvshows') {
      const data = await dynamoDB.send(new ScanCommand({
        TableName: tableName!
      }));

      return {
        statusCode: 200,
        body: JSON.stringify(data.Items),
      };
    }

    // GET /tvshows/{id} - Get a specific TV show
    if (method === 'GET' && path.match(/\/tvshows\/[\w-]+/)) {
      const id = event.pathParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'ID is required' }),
        };
      }

      const data = await dynamoDB.send(new GetCommand({
        TableName: tableName!,
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

    // POST /tvshows - Create a new TV show
    if (method === 'POST' && path === '/tvshows') {
      if (!event.body) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Request body is required' }),
        };
      }

      const tvShow = JSON.parse(event.body);
      if (!tvShow.id || !tvShow.title) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'ID and title are required' }),
        };
      }

      await dynamoDB.send(new PutCommand({
        TableName: tableName!,
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

    // DELETE /tvshows/{id} - Delete a TV show
    if (method === 'DELETE' && path.match(/\/tvshows\/[\w-]+/)) {
      const id = event.pathParameters?.id;
      if (!id) {
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'ID is required' }),
        };
      }

      await dynamoDB.send(new DeleteCommand({
        TableName: tableName!,
        Key: { id },
      }));

      return {
        statusCode: 200,
        body: JSON.stringify({ message: 'TV show deleted successfully' }),
      };
    }

    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Unsupported operation' }),
    };
  }catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};
