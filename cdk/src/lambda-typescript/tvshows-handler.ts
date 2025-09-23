import { DynamoDB } from 'aws-sdk';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';

/**
 * TVShows CRUD Lambda handler (TypeScript implementation)
 * This is a TypeScript version that could be used with L3 constructs
 */

// Define the TVShow interface
interface TVShow {
  id: string;
  title: string;
  genre?: string;
  year?: number;
  seasons?: number;
  rating?: number;
  createdAt?: string;
  updatedAt?: string;
}

// Controller class for handling TV Show operations
class TVShowsController {
  private tableName: string;
  private dynamoDB: DynamoDB.DocumentClient;

  constructor(tableName: string) {
    this.tableName = tableName;
    this.dynamoDB = new DynamoDB.DocumentClient();
  }

  // List all TV shows
  async listAll(): Promise<APIGatewayProxyResult> {
    const data = await this.dynamoDB.scan({
      TableName: this.tableName
    }).promise();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.Items)
    };
  }

  // Get a TV show by ID
  async getById(id: string): Promise<APIGatewayProxyResult> {
    const data = await this.dynamoDB.get({
      TableName: this.tableName,
      Key: { id }
    }).promise();
    
    if (!data.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'TV Show not found' })
      };
    }
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data.Item)
    };
  }
  // Create a new TV show
  async create(show: Partial<TVShow>): Promise<APIGatewayProxyResult> {
    // Initialize a proper TVShow object
    const newShow: TVShow = {
      id: show.id || Date.now().toString(),
      title: show.title || 'Untitled Show'
    };
      // Add metadata and copy other properties
    const now = new Date().toISOString();
    newShow.createdAt = now;
    newShow.updatedAt = now;
    newShow.genre = show.genre;
    newShow.year = show.year;
    newShow.seasons = show.seasons;
    newShow.rating = show.rating;
    
    await this.dynamoDB.put({
      TableName: this.tableName,
      Item: newShow
    }).promise();
      return {
      statusCode: 201,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newShow)
    };
  }
  // Update a TV show
  async update(id: string, show: Partial<TVShow>): Promise<APIGatewayProxyResult> {
    // First check if the item exists
    const existingData = await this.dynamoDB.get({
      TableName: this.tableName,
      Key: { id }
    }).promise();
    
    if (!existingData.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'TV Show not found' })
      };
    }
    
    // Update the item
    show.id = id; // Ensure ID matches path parameter
    show.createdAt = (existingData.Item as TVShow).createdAt;
    show.updatedAt = new Date().toISOString();
    
    await this.dynamoDB.put({
      TableName: this.tableName,
      Item: show
    }).promise();
    
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(show)
    };
  }

  // Delete a TV show
  async delete(id: string): Promise<APIGatewayProxyResult> {
    // Check if the item exists first
    const existingData = await this.dynamoDB.get({
      TableName: this.tableName,
      Key: { id }
    }).promise();
    
    if (!existingData.Item) {
      return {
        statusCode: 404,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'TV Show not found' })
      };
    }
    
    await this.dynamoDB.delete({
      TableName: this.tableName,
      Key: { id }
    }).promise();
    
    return {
      statusCode: 204,
      headers: { 'Content-Type': 'application/json' },
      body: ''
    };
  }
}

// Main handler function
export async function handler(event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> {
  console.log('Event:', JSON.stringify(event));
  
  try {
    const tableName = process.env.TABLE_NAME!;
    const controller = new TVShowsController(tableName);
    
    const { httpMethod: method, path } = event;
    
    // Route the request based on HTTP method and path
    switch(true) {
      case method === 'GET' && path === '/tvshows':
        return await controller.listAll();
        
      case method === 'GET' && !!event.pathParameters?.id:
        return await controller.getById(event.pathParameters.id);
        
      case method === 'POST' && path === '/tvshows':
        const createData: TVShow = JSON.parse(event.body || '{}');
        return await controller.create(createData);
        
      case method === 'PUT' && !!event.pathParameters?.id:
        const updateData: TVShow = JSON.parse(event.body || '{}');
        return await controller.update(event.pathParameters.id, updateData);
        
      case method === 'DELETE' && !!event.pathParameters?.id:
        return await controller.delete(event.pathParameters.id);
        
      default:
        return {
          statusCode: 400,
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ message: 'Invalid request' })
        };
    }
  } catch (error) {
    console.error('Error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        message: 'Internal server error',
        error: error instanceof Error ? error.message : String(error)
      })
    };
  }
}
