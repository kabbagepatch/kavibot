import axios from 'axios';
import { ChatUserstate, Client } from 'tmi.js';

import { Command } from '../models/command';

const BASE_URL = 'https://jvs88lexu7.execute-api.us-east-1.amazonaws.com';

export const taskCommandsEnabled : { [key : string] : boolean }  = {};
export const activeUsers: { [key: string]: string[] } = {};
const taskCache: { [key: string]: { tasks: any; timestamp: number, completed: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

const addActiveUser = (channel: string, username: string) => {
  if (channel[0] === '#') {
    channel = channel.substring(1);
  }
  if (!activeUsers[channel]) {
    activeUsers[channel] = [];
  }
  if (!activeUsers[channel].includes(username)) {
    axios.post(`${BASE_URL}/channel/${channel}/users`, { user: username }).then(() => {
      activeUsers[channel].push(username);
    }).catch((error) => {
      console.error('Error adding user:', error.message);
    });
  }
}

export const clearActiveUsers = (channel: string) => {
  if (channel[0] === '#') {
    channel = channel.substring(1);
  }
  if (!activeUsers[channel]) {
    return;
  }
  axios.delete(`${BASE_URL}/channel/${channel}/users`).then(() => {
    activeUsers[channel] = [];
  }).catch((error) => {
    console.error('Error clearing users:', error.message);
  });
}

const initializeTaskCache = (username: string) => {
  if (!taskCache[username]) {
    taskCache[username] = { tasks: {}, timestamp: Date.now(), completed: 0 };
  }
  if (!taskCache[username].tasks) {
    taskCache[username].tasks = {
      active: '',
      backlog: [],
    };
  }
}

const updateTaskCache = async (username: string, tasks: any) => {
  initializeTaskCache(username);

  const now = Date.now();
  taskCache[username].tasks = tasks;
  taskCache[username].timestamp = now;
};

const incrementCompletedTasks = (username: string, increment = 1) => {
  initializeTaskCache(username);

  taskCache[username].completed += increment;
};

const clearTasksCache = (username: string) => {
  initializeTaskCache(username);

  taskCache[username].tasks = {
    active: '',
    backlog: [],
  };
  taskCache[username].timestamp = Date.now();
  taskCache[username].completed = 0;
};

export const ENABLE_TASK_COMMAND = new Command(
  '!enabletasks',
  (twitchClient: Client, channel: string) => {
    taskCommandsEnabled[channel] = true;
    twitchClient.say(channel, 'Task commands are now enabled.');
  },
  false,
  true,
);

export const DISABLE_TASK_COMMAND = new Command(
  '!disabletasks',
  (twitchClient: Client, channel: string) => {
    taskCommandsEnabled[channel] = false;
    twitchClient.say(channel, 'Task commands are now disabled.');
  },
  false,
  true,
);

export const TASK_HELP_COMMAND = new Command(
  '!taskhelp',
  (twitchClient: Client, channel: string) => {
    const helpMessage = `
✨ Task Commands Help: ✨
!task <task> - Add a new task to the backlog. ✨
!backlog - View the current tasks in the backlog. ✨
!now <taskId> - Set a task as active. ✨
!done <taskId> - Mark a task as completed. ✨
!remove <taskId> - Remove a task from the backlog. ✨
!clear - Clear all tasks. ✨
Task ids need to be numbers. ✨
Use these commands to manage your tasks effectively!
    `;
    twitchClient.say(channel, helpMessage);
  },
);

const fetchTasks = async (username: string): Promise<any> => {
  const now = Date.now();

  if (taskCache[username] && now - taskCache[username].timestamp < CACHE_DURATION) {
    return taskCache[username].tasks;
  }

  try {
    const response = await axios.get(`${BASE_URL}/user/${username}/tasks`);
    updateTaskCache(username, response.data.tasks);
    return response.data.tasks;
  } catch (error : any) {
    console.error('Error fetching tasks:', error.message);
    throw error;
  }
};

const handleAddTasks = async (addType : string, twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => {
  let tasksString = message.substring(6);
  if (tasksString.length < 1) {
    twitchClient.say(channel, 'Please provide a task to add.');
    return;
  }

  if (tasksString.startsWith(';')) tasksString = tasksString.substring(1);
  if (tasksString.endsWith(';')) tasksString = tasksString.substring(0, tasksString.length - 1);

  const newTasks = tasksString.split(';').map((task) => task.trim());
  let output = addType === 'task' ? `✨ New Task Added: ${newTasks[0]}. ` : '✨ New Tasks Added ';
  await fetchTasks(tags.username || '');
  if (newTasks.length > 0) {
    if (addType !== 'task' || newTasks.length > 1) {
      output += '📝 Backlog: '
    }
    newTasks.forEach((task, index) => {
      let backlogIndex = 0;
      if (addType === 'soon') {
        backlogIndex = 1;
      } else if (addType === 'later') {
        backlogIndex = taskCache[tags.username || ''].tasks.backlog.length + 1;
      }
      if (index == 0 && addType === 'task') {
        return;
      } else {
        output += `🟣 [${index + backlogIndex}]: ${task} `;
      }
    });
  }
  
  axios.post(
    `${BASE_URL}/user/${tags.username}/tasks`,
    {
      tasksString,
      addType,
    }
  ).then((response) => {
    const tasks = response.data.tasks;
    updateTaskCache(tags.username || '', tasks);
    addActiveUser(channel, tags.username || '')
  }).catch((error) => {
    console.error('Error updating tasks:', error.message);
  });

  twitchClient.say(channel, output);
};

const handleActiveTask = (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => {
  const taskId = parseInt(message.substring(5));
  if (isNaN(taskId) || taskId < 0) {
    twitchClient.say(channel, 'Please provide a valid task ID.');
    return;
  }
  if (taskId === 0) {
    twitchClient.say(channel, 'Task is already active.');
    return;
  }

  axios.post(`${BASE_URL}/user/${tags.username}/tasks/${taskId}/active`).then((response) => {
    updateTaskCache(tags.username || '', response.data.tasks);
    addActiveUser(channel, tags.username || '')
    twitchClient.say(channel, `✨ Active Task: ${response.data.tasks.active}`);
  }).catch((error) => {
    console.error('Error setting active task:', error.message);
    if (error.response?.data?.error) {
      console.error('Error response:', error.response.data.error);
      twitchClient.say(channel, error.response.data.error);
    }
  });
};

const handleRemoveTask = (command: string, twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => {
  const tasksString = command === 'complete' ? message.substring(6) : message.substring(8);
  const completedTasks = (!tasksString || tasksString.length < 1 || tasksString.trim() === 'next') ? [0] : tasksString.split(',').map((task) => parseInt(task.trim()));
  let url = `${BASE_URL}/user/${tags.username}/tasks/complete`;
  if (completedTasks.length == 1) {
    url = `${BASE_URL}/user/${tags.username}/tasks/${completedTasks[0]}/complete`;
  }
  axios.post(url, { taskIds: tasksString }).then((response) => {
    const tasks = response.data.tasks;
    let output = `✨ Task(s) ${command}d: `;
    const prevTasks = taskCache[tags.username || ''].tasks;
    completedTasks.forEach((task) => {
      if (task === 0) {
        output += `🟣 ${prevTasks.active} `;
      } else {
        output += `🟣 [${task}] ${prevTasks.backlog[task - 1]} `;
      }
    });
    if (command === 'complete') {
      incrementCompletedTasks(tags.username || '', completedTasks.length);
      output += `✨ Total Completed: ${taskCache[tags.username || ''].completed}`;
    }
    updateTaskCache(tags.username || '', tasks);
    addActiveUser(channel, tags.username || '')
    twitchClient.say(channel, output);
    if (tasksString === 'next') {
      handleActiveTask(twitchClient, channel, tags, '!now 1');
    }
  }).catch((error) => {
    console.error(command === 'complete' ? 'Error completing tasks:' : 'Error removing tasks:', error.message);
    if (error.response?.data?.error) {
      console.error('Error response:', error.response.data.error);
      twitchClient.say(channel, error.response.data.error);
    }
  });
};

export const TASK_COMMAND = new Command(
  '!task',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => handleAddTasks('task', twitchClient, channel, tags, message),
)

export const SOON_COMMAND = new Command(
  '!soon',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => handleAddTasks('soon', twitchClient, channel, tags, message),
)

export const LATER_COMMAND = new Command(
  '!later',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => handleAddTasks('later', twitchClient, channel, tags, message),
)

export const GET_TASKS_COMMAND = new Command(
  '!backlog',
  (twitchClient: Client, channel: string, tags : ChatUserstate) => {
    fetchTasks(tags.username || '').then((tasks) => {
      let output = `✨ Active Task: `;
      if (tasks.active) {
        output += tasks.active;
      } else {
        output += 'No active task.';
      }

      output += `📝 Backlog: `;
      if (!tasks.backlog || tasks.backlog.length < 1) {
        output += 'No tasks in backlog.';
      } else {
        tasks.backlog.forEach((task: string, index: number) => {
          output += `🟣 [${index + 1}]: ${task} `;
        });
      }

      addActiveUser(channel, tags.username || '')

      twitchClient.say(channel, output);
    }).catch((error) => {
      console.error('Error fetching tasks:', error.message);
    });
  }
);

export const NOW_COMMAND = new Command(
  '!now',
  handleActiveTask,
);

export const COMPLETE_TASK_COMMAND = new Command(
  '!done',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => handleRemoveTask('complete', twitchClient, channel, tags, message),
);

export const REMOVE_TASK_COMMAND = new Command(
  '!remove',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => handleRemoveTask('remove', twitchClient, channel, tags, message),
);

export const CLEAR_COMMAND = new Command(
  '!clear',
  (twitchClient: Client, channel: string, tags : ChatUserstate) => {
    axios.post(`${BASE_URL}/user/${tags.username}/tasks/clear`).then(() => {
      clearTasksCache(tags.username || '');
      twitchClient.say(channel, '✨ Tasks cleared.');
    }).catch((error) => {
      console.error('Error clearing tasks:', error.message);
    });
  }
);
