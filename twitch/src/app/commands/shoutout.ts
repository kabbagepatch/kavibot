import { ChatUserstate, Client } from 'tmi.js';

import { Command } from '../models/command';

import streamers from '../streamers.json';
const recentSOs : { [key : string] : string[] } = {
  '#bumblebwiii': ['kofu12', 'ImAllBeans', 'OneNKen', 'Shania', 'mxmtoon', 'PixiesDirt']
};
const nextSO: { [key : string] : string } = {};

const handleRandomSoCommand = (twitchClient: Client, channel: string) => {
  if (!recentSOs[channel]) recentSOs[channel] = [];
  let randomStreamer = streamers[Math.floor(Math.random() * streamers.length)];
  if (nextSO[channel]) {
    randomStreamer = nextSO[channel];
    nextSO[channel] = '';
  } else {
    while(recentSOs[channel].includes(randomStreamer)) {
      randomStreamer = streamers[Math.floor(Math.random() * streamers.length)];
    }

    if (recentSOs[channel].length >= 8) {
      recentSOs[channel].shift(); // Remove the first (oldest) element
    }
    recentSOs[channel].push(randomStreamer);
  }

  twitchClient.say(channel, `So many lovely streamers, who do we shoutout...`);
  setTimeout(() => {
    twitchClient.say(channel, `/me thinking`);
  }, 3000);
  setTimeout(() => {
    twitchClient.say(channel, `!so ${randomStreamer}`);
  }, 6000);
};

export const RANDOM_SO_COMMAND = new Command(
  '!randomso',
  handleRandomSoCommand,
  true,
);

export const SO_COMMAND = new Command(
  '!so',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message: string) => {
    let userToShoutout = message.split(' ').slice(1).join(' ');
    if (userToShoutout[0] === '@') {
      userToShoutout = userToShoutout.slice(1);
    }
    twitchClient.say(channel, `Show some love to ${userToShoutout} at https://twitch.tv/${userToShoutout} <3 !`);
  },
);

export const NEXT_SO_COMMAND = new Command(
  '!nextso',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message: string) => {
    let channelToShoutoutIn = message.split(' ')[1];
    if (channelToShoutoutIn[0] === '@') {
      channelToShoutoutIn = channelToShoutoutIn.slice(1);
    }
    let userToShoutout = message.split(' ')[2];
    if (userToShoutout[0] === '@') {
      userToShoutout = userToShoutout.slice(1);
    }
    nextSO[`#${channelToShoutoutIn}`] = userToShoutout;
    twitchClient.say(channel, `Next shoutout will be for ${userToShoutout} in ${channelToShoutoutIn} <3 !`);
  },
  true,
  true,
);
