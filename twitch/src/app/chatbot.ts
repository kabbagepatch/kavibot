;import axios from 'axios'
import tmi, { Client } from 'tmi.js';

import { TwitchTokenDetails } from './models/twitchTokenDetails.models';
import { ChatBotConfig } from './config/model';
import { TwitchTokenResponseValidator } from './utils/TwitchTokenResponseValidator';

import { COMMANDS_COMMAND, BOT_FIGHT_COMMAND, FROOTY_COMMAND, HELLO_COMMAND, ORE_COMMAND, SLAY_COMMAND, TEST_COMMAND, TIN_COMMAND, WELCOME_COMMAND } from './commands/simple';
import { AGENT_COMMAND, clearAgentsDone } from './commands/agent';
import { RANDOM_SO_COMMAND } from './commands/shoutout';
import { NOW_COMMAND, TASK_COMMAND, COMPLETE_TASK_COMMAND, DISABLE_TASK_COMMAND, ENABLE_TASK_COMMAND, GET_TASKS_COMMAND, REMOVE_TASK_COMMAND, taskCommandsEnabled, SOON_COMMAND, LATER_COMMAND, CLEAR_COMMAND } from './commands/tasks';
import { cp } from 'fs';
import { READING_COMMAND, SET_AUDIOBOOK_COMMAND, SET_BOOK_COMMAND } from './commands/reading';

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
        COMMANDS_COMMAND,
        TEST_COMMAND,
        HELLO_COMMAND,
        WELCOME_COMMAND,
        FROOTY_COMMAND,
        ORE_COMMAND,
        SLAY_COMMAND,
        TIN_COMMAND,
        READING_COMMAND,
        SET_BOOK_COMMAND,
        SET_AUDIOBOOK_COMMAND,
        BOT_FIGHT_COMMAND,
        AGENT_COMMAND,
        RANDOM_SO_COMMAND,
        ENABLE_TASK_COMMAND,
        DISABLE_TASK_COMMAND,
      ];

      if (taskCommandsEnabled[channel]) {
        commands.push(NOW_COMMAND, TASK_COMMAND, SOON_COMMAND, LATER_COMMAND, GET_TASKS_COMMAND, COMPLETE_TASK_COMMAND, REMOVE_TASK_COMMAND, CLEAR_COMMAND);
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

          if (COMMANDS_COMMAND.isCommand(message)) {
            const commandList = commands
              .filter(cmd => !cmd.modsOnly || isMod)
              .filter(cmd => !cmd.broadcasterOnly)
              .map(cmd => cmd.usage)
              .join(', ');
            this.twitchClient.say(channel, `Available commands: ${commandList}`);
          } else {
            command.execute(this.twitchClient, channel, tags, message);
          }
          return;
        }
      }
    });
  }
}
