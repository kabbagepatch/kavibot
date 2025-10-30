import { Client } from 'tmi.js';

import { Command } from '../models/command';

import agents from '../agents.json';
const agentsDone : { [key: string] : { agent : string, time : number } } = {};

const isWithinLast4Hours = (timestamp : number) => {
  const now = Date.now();
  const twelveHoursInMs = 4 * 60 * 60 * 1000;
  return now - timestamp <= twelveHoursInMs;
}

const handleAgentCommand = (twitchClient: Client, channel: string, tags: any) => {
  const username = tags.username;
  const agentKey = `${username}${channel}`
  if (agentKey in agentsDone && isWithinLast4Hours(agentsDone[agentKey].time)) {
    twitchClient.say(channel, `@${username} You already found your agent for today, ${agentsDone[agentKey].agent}`);
    return;
  }

  twitchClient.say(channel, `Let's find out which valorant agent you are, @${username}`);
  const agentNames = Object.keys(agents);
  const randomAgent = agentNames[Math.floor(Math.random() * agentNames.length)];
  const lines : string[] = agents[randomAgent];
  const randomLine = lines[Math.floor(Math.random() * lines.length)];
  agentsDone[agentKey] = { agent: randomAgent, time: Date.now() };
  setTimeout(() => {
    twitchClient.say(channel, `@${username} You are ${randomAgent}. ${randomLine}`);
  }, 4000);
};

export const AGENT_COMMAND = new Command(
  '!agent',
  handleAgentCommand,
);

export const REROLL_AGENT_COMMAND = new Command(
  '!rerollagent',
  (twitchClient: Client, channel: string, tags: any, message: string) => {
    let username = message.split(' ')[1] || tags.username;
    if (username[0] === '@') {
      username = username.slice(1);
    }
    const agentKey = `${username}${channel}`
    if (agentKey in agentsDone) {
      delete agentsDone[agentKey];
      handleAgentCommand(twitchClient, channel, tags);
    } else {
      twitchClient.say(channel, `@${username} You haven't used !agent yet today! Use that first.`);
    }
  },
  true,
);

export const clearAgentsDone = (channel : string) => {
  const agentKeys = Object.keys(agentsDone);
  agentKeys.forEach(key => {
    if (key.includes(channel)) {
      delete agentsDone[key];
    }
  });
};
