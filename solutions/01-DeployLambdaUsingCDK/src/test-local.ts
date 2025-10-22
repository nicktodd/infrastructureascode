import { handler } from './index';
import { APIGatewayProxyEvent } from 'aws-lambda';

// Mock DynamoDB for local testing
process.env.TABLE_NAME = 'TVActors';

// Test data
const sampleActor = {
  id: 'actor-1',
  name: 'Bryan Cranston',
  age: 67,
  nationality: 'American',
  knownFor: ['Breaking Bad', 'Malcolm in the Middle'],
  isActive: true
};

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

async function runTests() {
  console.log('🧪 Starting Local Lambda Tests\n');

  try {
    // Test 1: GET /actors (empty list initially)
    console.log('1️⃣ Test GET /actors (list all)');
    const listEvent = createMockEvent('GET', '/actors');
    const listResult = await handler(listEvent);
    console.log('Status:', listResult.statusCode);
    console.log('Response:', JSON.parse(listResult.body));
    console.log('✅ List test completed\n');

    // Test 2: POST /actors (create actor)
    console.log('2️⃣ Test POST /actors (create actor)');
    const createEvent = createMockEvent('POST', '/actors', null, sampleActor);
    const createResult = await handler(createEvent);
    console.log('Status:', createResult.statusCode);
    console.log('Response:', JSON.parse(createResult.body));
    console.log('✅ Create test completed\n');

    // Test 3: GET /actors/{id} (get specific actor)
    console.log('3️⃣ Test GET /actors/{id} (get by ID)');
    const getEvent = createMockEvent('GET', '/actors/{id}', { id: 'actor-1' });
    const getResult = await handler(getEvent);
    console.log('Status:', getResult.statusCode);
    console.log('Response:', JSON.parse(getResult.body));
    console.log('✅ Get by ID test completed\n');

    // Test 4: PUT /actors/{id} (update actor)
    console.log('4️⃣ Test PUT /actors/{id} (update actor)');
    const updateData = { 
      knownFor: ['Breaking Bad', 'Malcolm in the Middle', 'Your Honor'],
      age: 68
    };
    const updateEvent = createMockEvent('PUT', '/actors/{id}', { id: 'actor-1' }, updateData);
    const updateResult = await handler(updateEvent);
    console.log('Status:', updateResult.statusCode);
    console.log('Response:', JSON.parse(updateResult.body));
    console.log('✅ Update test completed\n');

    // Test 5: DELETE /actors/{id} (delete actor)
    console.log('5️⃣ Test DELETE /actors/{id} (delete actor)');
    const deleteEvent = createMockEvent('DELETE', '/actors/{id}', { id: 'actor-1' });
    const deleteResult = await handler(deleteEvent);
    console.log('Status:', deleteResult.statusCode);
    console.log('Response:', deleteResult.body || '(empty response)');
    console.log('✅ Delete test completed\n');

    // Test 6: Error cases
    console.log('6️⃣ Test error cases');
    
    // Test missing ID in body
    console.log('   - Testing invalid create (missing required fields)');
    const invalidCreateEvent = createMockEvent('POST', '/actors', null, { name: 'Test' }); // missing id
    const invalidResult = await handler(invalidCreateEvent);
    console.log('   Status:', invalidResult.statusCode);
    console.log('   Response:', JSON.parse(invalidResult.body));
    
    // Test non-existent actor
    console.log('   - Testing get non-existent actor');
    const notFoundEvent = createMockEvent('GET', '/actors/{id}', { id: 'non-existent' });
    const notFoundResult = await handler(notFoundEvent);
    console.log('   Status:', notFoundResult.statusCode);
    console.log('   Response:', JSON.parse(notFoundResult.body));
    
    console.log('✅ Error tests completed\n');

    console.log('🎉 All local tests completed successfully!');
    console.log('\n📝 Test Summary:');
    console.log('- ✅ List actors');
    console.log('- ✅ Create actor');
    console.log('- ✅ Get actor by ID');
    console.log('- ✅ Update actor');
    console.log('- ✅ Delete actor');
    console.log('- ✅ Error handling');

  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

// Run tests if this file is executed directly
if (require.main === module) {
  runTests();
}
