import { Client } from 'tmi.js';

import { Command } from '../models/command';

export const COMMANDS_COMMAND = new Command(
  '!commands',
  () => {}
);

export const TEST_COMMAND = new Command(
  '!test',
  (twitchClient: Client, channel: string) => {
    let output = `omg heyyyy`;
    if (channel === '#bumblebwiii') {
      output = `bumble194Omg heyyyy`;
    }
    twitchClient.say(channel, output)
  }
);

export const WELCOME_COMMAND = new Command(
  '!welcome',
  (twitchClient: Client, channel: string) => {
    let output = `so many cuties in chat. welcome to ${channel.slice(1)} stream`;
    if (channel === '#bumblebwiii') {
      output = `bumble194Omg ${output} bumble194Uwu`;
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
