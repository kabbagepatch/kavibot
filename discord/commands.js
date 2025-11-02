import util from 'util';
import { getAgentChoices } from './game.js';
import { capitalize, DiscordRequest } from './utils.js';

const CHAT_INPUT = 1;
const STRING = 3;
const INTEGER = 4;
const BOOLEAN = 5;
const USER = 6;
const CHANNEL = 7;

export async function SyncGuildCommands(appId, guildId, existingCommands, updatedCommands) {
  if (guildId === '' || appId === '') return;

  console.log(`\nSyncing guild ${guildId}`)

  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const installedCommands = await res.data;
    const existingCommandNames = existingCommands.map(c => c.name);
    for (const cmd of installedCommands) {
      if (!existingCommandNames.includes(cmd.name)) {
        console.log(`Deleting unused command: "${cmd.name}"`);
        await RemoveGuildCommand(appId, guildId, cmd.id);
        console.log(`Deleted "${cmd.name}"`);
      }
    }
  } catch (err) {
    console.error(util.inspect(err.response.data, {showHidden: false, depth: null, colors: true}))
  }

  for (const cmd of updatedCommands) {
    console.log(`Installing "${cmd.name}"`);
    await InstallGuildCommand(appId, guildId, cmd);
    console.log(`Installed "${cmd.name}"`);
  }
}

export async function InstallGuildCommand(appId, guildId, command) {
  // API endpoint to get and post guild commands
  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  try {
    await DiscordRequest(endpoint, { method: 'POST', data: command });
  } catch (err) {
    console.error(util.inspect(err.response.data, {showHidden: false, depth: null, colors: true}))
  }
}

export async function RemoveGuildCommand(appId, guildId, commandId) {
  const endpoint = `applications/${appId}/guilds/${guildId}/commands/${commandId}`;
  try {
    await DiscordRequest(endpoint, { method: 'DELETE' });
  } catch (err) {
    console.error(util.inspect(err.response.data, {showHidden: false, depth: null, colors: true}))
  }
}


function createCommandChoices() {
  const choices = getAgentChoices();
  return choices.map(choice => ({
    name: capitalize(choice),
    value: choice.toLowerCase(),
  }));
}

export const HELLO_COMMAND = {
  name: 'hello',
  description: 'Say hi!',
  type: CHAT_INPUT,
}

export const FLOW_COMMAND = {
  name: 'flow',
  description: 'Tell me something about our Queen Flow',
  type: CHAT_INPUT,
}

export const GAME_COMMAND = {
  name: 'game',
  description: 'Select a random Steam game from this channel\'s recent messages',
  type: CHAT_INPUT,
  options: [
    {
      type: BOOLEAN,
      name: 'fullfetch',
      description: 'Ignore any caches and force a full read of the channel. This may cause timeouts or slow responses'
    }
  ]
}

export const TIME_COMMAND = {
  name: 'time',
  description: 'Converts date and time to Discord timestamp',
  type: CHAT_INPUT,
  options: [
    {
      type: STRING,
      name: 'date',
      description: 'One or more comma-separated dates in format MM/dd/YYYY h:MM am/pm Or Day h:MM am/pm',
      required: true,
    },
    {
      type: STRING,
      name: 'timezone',
      description: 'Timezone (optional)',
    },
  ]
}

export const WEEKLY_COMMAND = {
  name: 'week',
  description: 'Weekly Schedule using Discord timestamps',
  type: CHAT_INPUT,
  options: [
    {
      type: STRING,
      name: 'date',
      description: 'One or more comma-separated dates in format MM/dd/YYYY HH:MM Or Day HH:MM, and game',
      required: true,
    },
    {
      type: STRING,
      name: 'timezone',
      description: 'Timezone (optional)',
    },
  ]
}

export const CHALLENGE_COMMAND = {
  name: 'challenge',
  description: 'Challenge to a match of valorant agent battles',
  type: CHAT_INPUT,
  options: [
    {
      type: STRING,
      name: 'agent',
      description: 'Choose your Agent',
      required: true,
      choices: createCommandChoices(),
    },
    {
      type: USER,
      name: 'target',
      description: 'User to challange',
    },
  ],
}

export const REMINDER_COMMAND = {
  name: 'remind',
  description: 'Add a daily reminder',
  type: CHAT_INPUT,
  options: [
    {
      type: STRING,
      name: 'keyword',
      description: 'Keyword(s) for the reminder. Example: laundry or buy groceries',
      required: true,
    },
    {
      type: STRING,
      name: 'description',
      description: 'Detailed description of the reminder',
    },
    {
      type: USER,
      name: 'user',
      description: 'User to send reminder to. By default, current user',
    },
    {
      type: CHANNEL,
      name: 'channel',
      description: 'Channel to send reminder to. By default, current channel',
    },
    {
      type: INTEGER,
      name: 'csthour',
      description: 'The hour of day to send the reminder. Note: Must be in CST. By default, 10, for 10 am CST',
    },
    {
      type: STRING,
      name: 'cronexpression',
      description: 'The exact UTC cron expression for your reminders. See https://crontab.guru for details',
    },
    {
      type: INTEGER,
      name: 'nreminders',
      description: 'Total Number of reminders to send. By default, 1',
    },
  ]
}

export const SHOW_REMINDERS_COMMAND = {
  name: 'showreminders',
  description: 'Show the daily reminders',
  type: CHAT_INPUT,
  options: [
    {
      type: USER,
      name: 'user',
      description: 'User to get the reminders of',
    },
  ],
}


export const STOP_REMINDER_COMMAND = {
  name: 'stopreminder',
  description: 'Stop a daily reminder',
  type: CHAT_INPUT,
  options: [
    {
      type: STRING,
      name: 'keyword',
      description: 'The reminder keyword that you chose',
      required: true,
    },
    {
      type: USER,
      name: 'user',
      description: 'User that the reminder is sent to',
    },
  ],
}

export const STUPID_COUNTER = {
  name: 'stupidcount',
  description: 'Someone said stupid. Count it!',
  type: CHAT_INPUT,
  options: [
    {
      type: USER,
      name: 'user',
      description: 'User who said stupid',
    },
  ],
}

export const SHOW_STUPID_COUNTS = {
  name: 'showstupidcount',
  description: 'Show stupid counts',
  type: CHAT_INPUT,
}

export const RESET_STUPID_COUNTERS = {
  name: 'resetstupidcounts',
  description: 'Reset all stupid counts',
  type: CHAT_INPUT,
}
