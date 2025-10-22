import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient, ScanCommand, GetCommand, PutCommand, DeleteCommand } from '@aws-sdk/lib-dynamodb';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

const client = new DynamoDBClient({});
const dynamoDB = DynamoDBDocumentClient.from(client);

/**
 * TVShows CRUD Lambda handler (L2 implementation in TypeScript)
 */
export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  console.log('Event:', JSON.stringify(event));
  const tableName = process.env.TABLE_NAME;

  try {
    const { httpMethod: method, path } = event;    // Route the request to the appropriate handler
    switch (true) {
      case method === 'GET' && path === '/tvshows':
        return await listTVShows(tableName!);

      case method === 'GET' && path.match(/\/tvshows\/[\w-]+/) !== null:
        return await getTVShow(tableName!, event.pathParameters?.id!);

      case method === 'POST' && path === '/tvshows':
        return await createTVShow(tableName!, event.body);

      case method === 'DELETE' && path.match(/\/tvshows\/[\w-]+/) !== null:
        return await deleteTVShow(tableName!, event.pathParameters?.id!);

      default:
        return {
          statusCode: 400,
          body: JSON.stringify({ message: 'Unsupported operation' }),
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error' }),
    };
  }
};

const listTVShows = async (tableName: string): Promise<APIGatewayProxyResult> => {
  const data = await dynamoDB.send(new ScanCommand({
    TableName: tableName,
  }));

  return {
    statusCode: 200,
    body: JSON.stringify(data.Items),
  };
};

const getTVShow = async (tableName: string, id: string): Promise<APIGatewayProxyResult> => {
  const data = await dynamoDB.send(new GetCommand({
    TableName: tableName,
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
};

const createTVShow = async (tableName: string, body: string | null): Promise<APIGatewayProxyResult> => {
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Request body is required' }),
    };
  }

  const tvShow = JSON.parse(body);
  if (!tvShow.id || !tvShow.title) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'ID and title are required' }),
    };
  }

  await dynamoDB.send(new PutCommand({
    TableName: tableName,
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
};

const deleteTVShow = async (tableName: string, id: string): Promise<APIGatewayProxyResult> => {
  await dynamoDB.send(new DeleteCommand({
    TableName: tableName,
    Key: { id },
  }));

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'TV show deleted successfully' }),
  };
};
