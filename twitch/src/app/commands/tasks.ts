import axios from 'axios';
import { ChatUserstate, Client } from 'tmi.js';

import { Command } from '../models/command';

const BASE_URL = 'https://jvs88lexu7.execute-api.us-east-1.amazonaws.com';

export const taskCommandsEnabled : { [key : string] : boolean }  = {};
const taskCache: { [key: string]: { tasks: any; timestamp: number } } = {};
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

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

const fetchTasks = async (username: string): Promise<any> => {
  const now = Date.now();

  if (taskCache[username] && now - taskCache[username].timestamp < CACHE_DURATION) {
    return taskCache[username].tasks;
  }

  try {
    const response = await axios.get(`${BASE_URL}/user/${username}/tasks`);
    taskCache[username] = {
      tasks: response.data.tasks,
      timestamp: now,
    };
    return response.data.tasks;
  } catch (error : any) {
    console.error('Error fetching tasks:', error.message);
    throw error;
  }
};

const updateTaskCache = async (username: string, tasks: any) => {
  const now = Date.now();
  taskCache[username] = {
    tasks,
    timestamp: now,
  };
};

export const ADD_TASK_COMMAND = new Command(
  '!task',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => {
    let tasksString = message.substring(6);
    if (tasksString.length < 1) {
      twitchClient.say(channel, 'Please provide a task to add.');
      return;
    }

    if (tasksString.startsWith(';')) tasksString = tasksString.substring(1);
    if (tasksString.endsWith(';')) tasksString = tasksString.substring(0, tasksString.length - 1);

    axios.post(
      `${BASE_URL}/user/${tags.username}/tasks`,
      {
        tasksString,
        addType: 'task',
      }
    ).then((response) => {
      const tasks = response.data.tasks;
      updateTaskCache(tags.username || '', tasks);
    }).catch((error) => {
      console.error('Error updating tasks:', error.message);
    });

    const newTasks = tasksString.split(';').map((task) => task.trim());
    let output = `✨ New Task: ${newTasks[0]}. `;
    if (newTasks.length > 1) {
      output += '📝 Backlog: '
      newTasks.forEach((task, index) => {
        if (index == 0) {
          return;
        } else {
          output += `🟣 ${index}: ${task} `;
        }
      });
    }

    twitchClient.say(channel, output);
  }
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

      twitchClient.say(channel, output);
    }).catch((error) => {
      console.error('Error fetching tasks:', error.message);
    });
  }
);

const handleRemoveTask = (command: string, twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => {
  const tasksString = command === 'complete' ? message.substring(6) : message.substring(8);
  fetchTasks(tags.username || '').then((taskCache) => {
    if (tasksString.length < 1) {
      if (taskCache.active) {
        axios.post(`${BASE_URL}/user/${tags.username}/tasks/0/complete`).then((response) => {
          const tasks = response.data.tasks;
          updateTaskCache(tags.username || '', tasks);
        }).catch((error) => {
          console.error(command === 'complete' ? 'Error completing tasks:' : 'Error removing tasks:' , error.message);
        });

        twitchClient.say(channel, `✨ Task ${command}d: ${taskCache.active}`);
      }
    } else {
      const completedTasks = tasksString.split(',').map((task) => parseInt(task.trim()));
      let url = `${BASE_URL}/user/${tags.username}/tasks/complete`;
      if (completedTasks.length == 1) {
        if (completedTasks[0] > taskCache.backlog.length) {
          twitchClient.say(channel, `There is no task at position [${completedTasks[0]}] in your backlog!`);
          return;
        }

        url = `${BASE_URL}/user/${tags.username}/tasks/${completedTasks[0]}/complete`;
      }
      axios.post(url, { taskIds: tasksString }).then((response) => {
        const tasks = response.data.tasks;
        updateTaskCache(tags.username || '', tasks);
        let output = `✨ Task(s) ${command}d: `;
        const completedTasks = tasksString.split(';').map((task) => parseInt(task.trim()));
        completedTasks.forEach((task) => {
          if (task === 0) {
            output += `🟣 ${taskCache.active} `;
          } else {
            output += `🟣 [${task}] ${taskCache.backlog[task - 1]} `;
          }
        });
        twitchClient.say(channel, output);
      }).catch((error) => {
        console.error(command === 'complete' ? 'Error completing tasks:' : 'Error removing tasks:', error.message);
        if (error.response?.data?.error) {
          console.error('Error response:', error.response.data.error);
          twitchClient.say(channel, error.response.data.error);
        }
      });
    }
  });
}

export const COMPLETE_TASK_COMMAND = new Command(
  '!done',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => handleRemoveTask('complete', twitchClient, channel, tags, message),
);

export const REMOVE_TASK_COMMAND = new Command(
  '!remove',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message : string) => handleRemoveTask('remove', twitchClient, channel, tags, message),
);