import { ChatUserstate, Client } from 'tmi.js';

import { Command } from '../models/command';
import axios from 'axios';

export const COMMANDS_COMMAND = new Command(
  '!commands',
  () => {}
);

export const TEST_COMMAND = new Command(
  '!test',
  (twitchClient: Client, channel: string) => {
    let output = 'omg heyyyy';
    if (channel === '#bumblebwiii') {
      output = 'bumble194Omghey';
    }
    twitchClient.say(channel, output)
  }
);

export const WELCOME_COMMAND = new Command(
  '!welcome',
  (twitchClient: Client, channel: string) => {
    let output = `so many cuties in chat. welcome to ${channel.slice(1)} stream`;
    if (channel === '#bumblebwiii') {
      output = `bumble194Omghey ${output} bumble194Uwu`;
    }
    twitchClient.say(channel, output);
  }
);

export const HELLO_COMMAND = new Command(
  '!hello',
  (twitchClient: Client, channel: string, tags: any) => {
    const username = tags.username;
    twitchClient.say(channel, `Hello, @${username}! Welcome to the channel.`);
  }
);

export const LURK_COMMAND = new Command(
  '!lurk',
  (twitchClient: Client, channel: string, tags: any) => {
    const username = tags.username;
    twitchClient.say(channel, `@${username} is lurking!! tysm we love you !!!`);
  }
);

export const UNLURK_COMMAND = new Command(
  '!unlurk',
  (twitchClient: Client, channel: string, tags: any) => {
    const username = tags.username;
    twitchClient.say(channel, `@${username} has come back from their long venture!!!`);
  }
);

export const FROOTY_COMMAND = new Command(
  '!frooty',
  (twitchClient: Client, channel: string) => {
    let output = 'Things are a bit fruity around here 🌈';
    if (channel === '#bumblebwiii') {
      output = `${output} bumble194Uwu`;
    }
    twitchClient.say(channel, output);
  }
);

export const ORE_COMMAND = new Command(
  '!ore',
  (twitchClient: Client, channel: string) => {
    twitchClient.say(channel, 'Ore what?');
  }
);

export const SLAY_COMMAND = new Command(
  '!slay',
  (twitchClient: Client, channel: string) => {
    twitchClient.say(channel, 'slay 💅');
  }
);

export const TIN_COMMAND = new Command(
  '!tin',
  (twitchClient: Client, channel: string) => {
    twitchClient.say(channel, 'Like the metal 🎸🤘🔥');
  }
);

export const BOT_FIGHT_COMMAND = new Command(
  '!botfight',
  (twitchClient: Client, channel: string) => {
    twitchClient.say(channel, '@StreamElements you\'re spare parts @bumblebottt more like bumble buttt');
  }
);

export const ADD_TIME_COMMAND = new Command(
  '!addtime',
  async (twitchClient: Client, channel: string, tags : ChatUserstate, message: string) => {
    const timeToAdd = parseInt(message.split(' ')[1], 10);
    let userAddingTime = message.split(' ')[2];

    addTime(twitchClient, channel, timeToAdd, userAddingTime);
  },
  true,
);

export const ADD_TIP_COMMAND = new Command(
  '!addtip',
  async (twitchClient: Client, channel: string, tags : ChatUserstate, message: string) => {
    const timeToAdd = parseInt(message.split(' ')[1], 10) * 120;
    let userAddingTime = message.split(' ')[2];

    addTime(twitchClient, channel, timeToAdd, userAddingTime);
  },
  true,
);

const addTime = async (twitchClient: Client, channel: string, seconds: number, name?: string) => {
  let url = `https://api.tangia.co/quick_action/update-subathon?k=5daa17af-3a8d-48db-89e6-038ac421eb27&seconds=${seconds}`;
  if (name) {
    if (name.startsWith('@')) {
      name = name.slice(1);
    }
    url += `&name=${name}`;
  }
  try {
    console.log(url);
    await axios.get(url);
  } catch (error) {
    console.error('Error adding time to subathon:', error);
    twitchClient.say(channel, 'There was an error adding time to the subathon. Please try again later.');
    return;
  }

  let responseMessage = `${seconds} seconds have been added to the subathon`;
  if (name) {
    responseMessage += ` thanks to ${name}`;
  }
  twitchClient.say(channel, responseMessage);
};
