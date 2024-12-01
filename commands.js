import util from 'util';
import { getAgentChoices } from './game.js';
import { capitalize, DiscordRequest } from './utils.js';

const CHAT_INPUT = 1;
const STRING = 3;
const BOOLEAN = 5;
const USER = 6;
const CHANNEL = 7;

export async function SyncGuildCommands(appId, guildId, commands) {
  if (guildId === '' || appId === '') return;

  const endpoint = `applications/${appId}/guilds/${guildId}/commands`;
  try {
    const res = await DiscordRequest(endpoint, { method: 'GET' });
    const existingCommands = await res.data;
    const commandNames = commands.map(c => c.name);
    for (const cmd of existingCommands) {
      if (!commandNames.includes(cmd.name)) {
        console.log(`Deleting unused command: "${cmd.name}"`);
        await RemoveGuildCommand(appId, guildId, cmd.id);
        console.log(`Deleted "${cmd.name}"`);
      }
    }

  } catch (err) {
    console.error(util.inspect(err.response.data, {showHidden: false, depth: null, colors: true}))
  }

  commands.forEach((cmd) => {
    console.log(`Installing "${cmd.name}"`);
    InstallGuildCommand(appId, guildId, cmd);
    console.log(`Installed "${cmd.name}"`);
  });
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
  description: 'Add a daily reminder for Bwi',
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
      description: 'User to send reminder to',
    },
    {
      type: CHANNEL,
      name: 'channel',
      description: 'Channel to send reminder to',
    },
  ]
}

export const STOP_REMINDER_COMMAND = {
  name: 'stopremind',
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
