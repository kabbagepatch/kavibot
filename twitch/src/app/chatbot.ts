;import axios from 'axios'
import tmi, { Client } from 'tmi.js';

import { TwitchTokenDetails } from './models/twitchTokenDetails.models';
import { ChatBotConfig } from './config/model';
import { TwitchTokenResponseValidator } from './utils/TwitchTokenResponseValidator';

import agents from './agents.json';
import streamers from './streamers.json';

const agentsDone : { [key: string] : { agent : string, time : number } } = {};
const recentSOs : { [key : string] : string[] } = {};

export class TwitchChatBot {
  public twitchClient!: Client;
  private tokenDetails!: TwitchTokenDetails | { 'access_token': string };

  constructor(private config: ChatBotConfig) { }

  async launch() {
    this.tokenDetails = await this.fetchAccessToken(this.config.token);
    this.twitchClient = new tmi.Client(
      this.buildConnectionConfig(
        this.config.channel,
        this.config.username,
        this.tokenDetails.access_token
      )
    );
    this.setupBotBehavior();
    this.twitchClient.connect();
  }

  private async fetchAccessToken(existingToken : string): Promise<TwitchTokenDetails | { 'access_token': string }> {
    if (existingToken) {
      return { access_token: existingToken };
    }
    console.log('Fetching Twitch OAuth Token');
    try {
      const response = await axios.post(
        this.config.tokenEndpoint,
        {
          client_id: this.config.clientId,
          client_secret: this.config.clientSecret,
          code: this.config.authorizationCode,
          grant_type: 'authorization_code',
          redirect_url: 'http://localhost/',
          redirect_uri: 'http://localhost/',
        },
        { responseType: 'json'},
      );

      return await TwitchTokenResponseValidator.parseResponse(response.data);
    } catch(error : any) {
      console.log('Failed to get Twitch OAuth Token');
      console.log(error.data.message);
      throw error;
    }
  }

  private buildConnectionConfig(channel: string, username: string, accessToken: string) {
    return {
      options: { debug: false },
      connection: {
        secure: true,
        reconnect: true
      },
      identity: {
        username: `${username}`,
        password: `oauth:${accessToken}`
      },
      channels: ['kavisherlock', channel],
    };
  }

  private setupBotBehavior() {
    const commands = ['!test', '!welcome', '!hello', '!frooty', '!ore', '!slay', '!tin', '!reading', '!agent', '!randomso'];

    this.twitchClient.on('clearchat', (channel) => {
      const agentKeys = Object.keys(agentsDone);
      agentKeys.forEach(key => {
        if (key.includes(channel)) {
          delete agentsDone[key];
        }
      });
    });

    this.twitchClient.on('message', (channel, tags, message, self) => {
      if (self) return;

      if (commands.includes(message)) {
        const username = tags.username ?? 'blank';
        const isMod = tags.mod || tags.badges?.broadcaster;
        console.info({ channel, username, message })
        switch (message) {
          case '!test': this.twitchClient.say(channel, `bumble194Omg heyyyy`); break;

          case '!welcome': this.twitchClient.say(channel, `bumble194Omg so many cuties in chat. welcome to bwi stream`); break;

          case '!hello': this.twitchClient.say(channel, `Hello, @${username}! Welcome to the channel.`); break;

          case '!frooty': this.twitchClient.say(channel, `Things are a bit fruity around here 🌈 bumble194Uwu`); break;

          case '!ore': this.twitchClient.say(channel, `Ore what?`); break;

          case '!slay': this.twitchClient.say(channel, `slay 💅`); break;

          case '!tin': this.twitchClient.say(channel, `Like the metal 🎸🤘🔥`); break;

          case '!reading': 
            if (username === 'kavisherlock') {
              this.twitchClient.say(channel, `I'm currently reading Oathbringer by Brandon Sanderson :book: and listening to The Two Towers by J. R. R. Tolkien :headphones:`)
            }
            break;

          case '!agent':
            const agentKey = `${username}${channel}`
            if (agentKey in agentsDone && isWithinLast4Hours(agentsDone[agentKey].time)) {
              this.twitchClient.say(channel, `@${username} You already found your agent for today, ${agentsDone[agentKey].agent}`);
              return;
            }

            this.twitchClient.say(channel, `Let's find out which valorant agent you are, @${username}`);
            const agentNames = Object.keys(agents);
            const randomAgent = agentNames[Math.floor(Math.random() * agentNames.length)];
            const lines : string[] = agents[randomAgent];
            const randomLine = lines[Math.floor(Math.random() * lines.length)];
            agentsDone[agentKey] = { agent: randomAgent, time: Date.now() };
            setTimeout(() => {
              this.twitchClient.say(channel, `/me thinking`);
            }, 2000);
            setTimeout(() => {
              this.twitchClient.say(channel, `@${username} You are ${randomAgent}. ${randomLine}`);
            }, 6000);
            break;

          case '!randomso':
            if (!isMod) {
              if (username === 'AlwaysKorean') this.twitchClient.say(channel, `Nice try Roan :]`);
              else this.twitchClient.say(channel, `Only moderators can use this command :]`);
              return;
            }

            if (!recentSOs[channel]) recentSOs[channel] = [];

            let randomStreamer = streamers[Math.floor(Math.random() * streamers.length)];
            while(recentSOs[channel].includes(randomStreamer)) {
              randomStreamer = streamers[Math.floor(Math.random() * streamers.length)];
            }

            if (recentSOs[channel].length >= 5) {
              recentSOs[channel].shift(); // Remove the first (oldest) element
            }
            recentSOs[channel].push(randomStreamer);

            this.twitchClient.say(channel, `So many lovely streamers, who do we shoutout...`);
            setTimeout(() => {
              this.twitchClient.say(channel, `/me thinking`);
            }, 3000);
            setTimeout(() => {
              this.twitchClient.say(channel, `!so ${randomStreamer}`);
            }, 6000);
        }
      }
    });
  }
}

const isWithinLast4Hours = (timestamp : number) => {
  const now = Date.now();
  const twelveHoursInMs = 4 * 60 * 60 * 1000;
  return now - timestamp <= twelveHoursInMs;
}
