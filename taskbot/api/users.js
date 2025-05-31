const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.get = async (event) => {
  const channel = event.pathParameters.channel;

  try {
    const activeUsers = await getUsers(channel);
    return successResponse({
      activeUsers,
      message: 'Users retrieved successfully',
    });
  } catch (error) {
    console.error(error);
    return errorResponse(500, error);
  }
}

exports.add = async (event) => {
  const channel = event.pathParameters.channel;
  const data = JSON.parse(event.body);
  if (!data || !data.user?.trim()) {
    return missingDataErrorResponse;
  }

  try {
    let activeUsers = await getUsers(channel);
    const newUser = data.user.trim().toLowerCase();
    if (!activeUsers.includes(newUser)) {
      activeUsers.push(newUser);
    }

    await updateUsers(channel, activeUsers);
    return successResponse({
      activeUsers,
      message: 'User added successfully',
    }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(500, error);
  }
}

exports.clear = async (event) => {
  const channel = event.pathParameters.channel;

  try {
    const tableName = 'taskbot-api-ChannelsTable';
    const deleteParams = {
      TableName: tableName,
      Key: { channel },
    };
    await dynamoDB.delete(deleteParams).promise();
    return successResponse({
      message: 'Users cleared successfully',
    });
  } catch (error) {
    console.error(error);
    return errorResponse(500, error);
  }
}

const getUsers = async (channel) => {
  const tableName = 'taskbot-api-ChannelsTable';

  try {
    const getParams = {
      TableName: tableName,
      Key: { channel },
    };
    const result = await dynamoDB.get(getParams).promise();
    let activeUsers = [];
    if (result.Item && result.Item.activeUsers) {
      activeUsers = JSON.parse(result.Item.activeUsers);
    }
    return activeUsers;
  } catch (error) {
    console.error(error);
    throw new Error('Could not retrieve active users');
  }
}

const updateUsers = async (channel, activeUsers) => {
  const tableName = 'taskbot-api-ChannelsTable';

  try {
    const updateParams = {
      TableName: tableName,
      Key: { channel },
      UpdateExpression: 'SET activeUsers = :activeUsers',
      ExpressionAttributeValues: {
        ':activeUsers': JSON.stringify(activeUsers),
      },
    };
    await dynamoDB.update(updateParams).promise();
  } catch (error) {
    console.error(error);
    throw new Error('Could not update activeUsers');
  }
}

const getHeaders = (contentType) => ({
  'Content-Type': contentType,
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'OPTIONS,POST,GET',
  'Access-Control-Allow-Headers': 'Content-Type',
  'Access-Control-Allow-Credentials': true,
});

const successResponse = (body, statusCode=200) => ({
  statusCode,
  headers: getHeaders('application/json'),
  body: JSON.stringify(body),
});

const errorResponse = (statusCode, error) => ({
  statusCode,
  headers: getHeaders('application/json'),
  body: JSON.stringify({ error: error.message }),
});

const missingDataErrorResponse = {
  statusCode: 400,
  headers: getHeaders('text/plain'),
  body: 'Missing input data',
}