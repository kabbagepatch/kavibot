const AWS = require('aws-sdk');
const dynamoDB = new AWS.DynamoDB.DocumentClient();

exports.get = async (event) => {
  const username = event.pathParameters.username;

  try {
    const tasks = await getTasks(username);
    return successResponse({
      tasks,
      message: 'Tasks retrieved successfully',
    });
  } catch (error) {
    console.error(error);
    return errorResponse(500, error);
  }
}

exports.add = async (event) => {
  const username = event.pathParameters.username;
  const data = JSON.parse(event.body);
  if (!data || !data.tasksString?.trim()) {
    return missingDataErrorResponse;
  }
  const newTasks = data.tasksString.split(';').map((task) => task.trim());

  try {
    let tasks = await getTasks(username);
    const prevActiveTask = tasks.active;
    const prevBacklog = tasks.backlog;

    if (!data.addType || data.addType === 'task') {
      tasks.active = newTasks[0];
      tasks.backlog = newTasks.slice(1);
      if (prevActiveTask) {
        tasks.backlog = tasks.backlog.concat(prevActiveTask)
      }
      if (prevBacklog && prevBacklog.length > 0) {
        tasks.backlog = tasks.backlog.concat(prevBacklog);
      }
    } else if (data.addType === 'soon') {
      tasks.backlog = prevBacklog ? newTasks.concat(prevBacklog) : newTasks;
    } else if (data.addType === 'later') {
      tasks.backlog = prevBacklog ? prevBacklog.concat(newTasks) : newTasks;
    }

    await updateTasks(username, tasks);
    return successResponse({
      tasks: getTasksObject(tasks),
      message: 'Task(s) added successfully',
    }, 201);
  } catch (error) {
    console.error(error);
    return errorResponse(500, error);
  }
}

exports.remove = async (event) => {
  const username = event.pathParameters.username;
  let taskId = parseInt(event.pathParameters.id, 10);
  if (isNaN(taskId) || taskId < 0) {
    return errorResponse(400, { message: 'Invalid task ID' });
  }

  try {
    let tasks = await getTasks(username);
    if ((!tasks.backlog && taskId > 0) || taskId >= tasks.backlog.length) {
      return errorResponse(400, { message: 'Task ID out of range' });
    }

    if (taskId == 0) {
      tasks.active = undefined;
    } else {
      tasks.backlog = tasks.backlog.filter((_, index) => (index + 1) !== taskId);
    }

    await updateTasks(username, tasks);

    return successResponse({
      tasks: getTasksObject(tasks),
      message: 'Tasks removed successfully',
    }, 204);
  } catch (error) {
    console.error(error);
    return errorResponse(500, error);
  }
}

exports.removeMultiple = async (event) => {
  const username = event.pathParameters.username;
  const data = JSON.parse(event.body || '{}');
  if (!data || !data.taskIds) {
    return missingDataErrorResponse;
  }

  const taskIds = data.taskIds.split(',').map((id) => parseInt(id.trim(), 10));
  if (taskIds.some((id) => isNaN(id) || id <= 0)) {
    return errorResponse(400, { message: 'Invalid task ID(s)' });
  }

  try {
    let tasks = await getTasks(username);
    if (!tasks.backlog || taskIds.some((id) => id >= tasks.backlog.length)) {
      return errorResponse(400, { message: 'Task ID(s) out of range' });
    }

    tasks.backlog = tasks.backlog.filter((_, index) => !taskIds.includes(index + 1));

    await updateTasks(username, tasks);

    return successResponse({
      tasks: getTasksObject(tasks),
      message: 'Tasks removed successfully',
    }, 204);
  } catch (error) {
    console.error(error);
    return errorResponse(500, error);
  }
}

exports.active = async (event) => {
  const username = event.pathParameters.username;
  const taskId = event.pathParameters.id;
  if (isNaN(taskId) || taskId <= 0) {
    return errorResponse(400, { message: 'Invalid task ID' });
  }

  try {
    const tasks = await getTasks(username);

    if (!tasks.backlog || taskId >= tasks.backlog.length) {
      return errorResponse(400, { message: 'Task ID out of range' });
    }

    const currentActiveTask = tasks.active;
    tasks.active = tasks.backlog[taskId];
    for (let i = taskId; i < tasks.backlog.length - 1; i += 1) {
      tasks.backlog[i] = tasks.backlog[i + 1];
    }
    tasks.backlog[tasks.backlog.length - 1] = currentActiveTask;

    await updateTasks(username, tasks);

    return successResponse({
      tasks: getTasksObject(tasks),
      message: 'Task activated successfully',
    });
  } catch (error) {
    console.error(error);
    return errorResponse(500, error);
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

const getTasksObject = (tasks) => {
  const backlogObject = {};
  if (tasks.backlog && tasks.backlog.length > 0) {
    tasks.backlog.forEach((task, index) => {
      backlogObject[index + 1] = task;
    });
  }
  return {
    active: tasks.active,
    backlog: backlogObject,
  };
}

const getTasks = async (username) => {
  const tableName = 'taskbot-api-UserTasksTable';

  try {
    const getParams = {
      TableName: tableName,
      Key: { username },
    };
    const result = await dynamoDB.get(getParams).promise();
    let tasks = {};
    if (result.Item && result.Item.tasks) {
      tasks = JSON.parse(result.Item.tasks);
    }
    return tasks;
  } catch (error) {
    console.error(error);
    throw new Error('Could not retrieve tasks');
  }
}

const updateTasks = async (username, tasks) => {
  const tableName = 'taskbot-api-UserTasksTable';

  try {
    const updateParams = {
      TableName: tableName,
      Key: { username },
      UpdateExpression: 'SET tasks = :tasks',
      ExpressionAttributeValues: {
        ':tasks': JSON.stringify(tasks),
      },
    };
    await dynamoDB.update(updateParams).promise();
  } catch (error) {
    console.error(error);
    throw new Error('Could not update tasks');
  }
}
