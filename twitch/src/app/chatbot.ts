;import axios from 'axios'
import tmi, { Client } from 'tmi.js';

import { TwitchTokenDetails } from './models/twitchTokenDetails.models';
import { ChatBotConfig } from './config/model';
import { TwitchTokenResponseValidator } from './utils/TwitchTokenResponseValidator';

import { BOT_FIGHT_COMMAND, FROOTY_COMMAND, HELLO_COMMAND, ORE_COMMAND, SLAY_COMMAND, TEST_COMMAND, TIN_COMMAND, WELCOME_COMMAND } from './commands/simple';
import { AGENT_COMMAND, clearAgentsDone } from './commands/agent';
import { RANDOM_SO_COMMAND } from './commands/shoutout';
import { ADD_TASK_COMMAND, DISABLE_TASK_COMMAND, ENABLE_TASK_COMMAND, GET_TASKS_COMMAND, taskCommandsEnabled } from './commands/tasks';

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
    this.twitchClient.on('clearchat', (channel) => {
      clearAgentsDone(channel);
    });

    this.twitchClient.on('message', (channel, tags, message, self) => {
      if (self) return;

      const commands = [
        TEST_COMMAND,
        HELLO_COMMAND,
        WELCOME_COMMAND,
        FROOTY_COMMAND,
        ORE_COMMAND,
        SLAY_COMMAND,
        TIN_COMMAND,
        BOT_FIGHT_COMMAND,
        AGENT_COMMAND,
        RANDOM_SO_COMMAND,
        ENABLE_TASK_COMMAND,
        DISABLE_TASK_COMMAND,
      ];

      if (taskCommandsEnabled[channel]) {
        commands.push(ADD_TASK_COMMAND, GET_TASKS_COMMAND);
      }

      for (const command of commands) {
        if (command.isCommand(message)) {
          const username = tags.username ?? 'blank';
          const isMod = tags.mod || tags.badges?.broadcaster;
      
          console.info({ channel, username, message })

          if (command.modsOnly && !isMod) {
            this.twitchClient.say(channel, `Only moderators can use this command :]`);
            return;
          }
          if (command.broadcasterOnly && !tags.badges?.broadcaster) {
            this.twitchClient.say(channel, `Only the broadcaster can use this command :]`);
            return;
          }

          command.execute(this.twitchClient, channel, tags, message);
          return;
        }
      }
    });
  }
}
