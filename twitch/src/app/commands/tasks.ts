import axios from 'axios';
import { ChatUserstate, Client } from 'tmi.js';

import { Command } from '../models/command';

const BASE_URL = 'https://jvs88lexu7.execute-api.us-east-1.amazonaws.com';

export const taskCommandsEnabled : { [key : string] : boolean }  = {}

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
    ).catch((error) => {
      console.error('Error fetching tasks:', error);
    });;

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
    axios.get(
      `${BASE_URL}/user/${tags.username}/tasks`
    ).then((response) => {
      const tasks = response.data.tasks;
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
      console.error('Error fetching tasks:', error);
    });
  }
);
