;import axios from 'axios'
import tmi, { Client } from 'tmi.js';

import { TwitchTokenDetails } from './models/twitchTokenDetails.models';
import { ChatBotConfig } from './config/model';
import { TwitchTokenResponseValidator } from './utils/TwitchTokenResponseValidator';

import { COMMANDS_COMMAND, BOT_FIGHT_COMMAND, FROOTY_COMMAND, HELLO_COMMAND, ORE_COMMAND, SLAY_COMMAND, TEST_COMMAND, TIN_COMMAND, WELCOME_COMMAND, LURK_COMMAND, UNLURK_COMMAND } from './commands/simple';
import { AGENT_COMMAND, clearAgentsDone } from './commands/agent';
import { RANDOM_SO_COMMAND, SO_COMMAND, NEXT_SO_COMMAND } from './commands/shoutout';
import { NOW_COMMAND, TASK_COMMAND, COMPLETE_TASK_COMMAND, DISABLE_TASK_COMMAND, ENABLE_TASK_COMMAND, GET_TASKS_COMMAND, REMOVE_TASK_COMMAND, taskCommandsEnabled, SOON_COMMAND, LATER_COMMAND, CLEAR_COMMAND, TASK_HELP_COMMAND, clearActiveUsers } from './commands/tasks';
import { READING_COMMAND, READING_GOAL_COMMAND, SET_AUDIOBOOK_COMMAND, SET_BOOK_COMMAND, SET_BOOKS_READ_COMMAND } from './commands/reading';
import { Command } from './models/command';

let hasJellyMessaged = false;

export class TwitchChatBot {
  public twitchClient!: Client;
  private tokenDetails!: TwitchTokenDetails | { 'access_token': string };

  constructor(private config: ChatBotConfig) { }

  async launch() {
    this.tokenDetails = await this.fetchAccessToken(this.config.token);
    this.twitchClient = new tmi.Client(
      this.buildConnectionConfig(
        this.config.channels,
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
      console.log(error?.data?.message);
      throw error;
    }
  }

  private buildConnectionConfig(channels: string[], username: string, accessToken: string) {
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
      channels: ['kavi_bot', ...channels],
    };
  }

  private setupBotBehavior() {
    const commonCommands = [
      COMMANDS_COMMAND,
      TEST_COMMAND,
      HELLO_COMMAND,
      WELCOME_COMMAND,
      SLAY_COMMAND,
    ];

    const kaviCommands = [
      FROOTY_COMMAND,
      ORE_COMMAND,
      TIN_COMMAND,
      READING_COMMAND,
      SET_BOOK_COMMAND,
      SET_AUDIOBOOK_COMMAND,
      SET_BOOKS_READ_COMMAND,
      READING_GOAL_COMMAND,
      BOT_FIGHT_COMMAND,
      AGENT_COMMAND,
      SO_COMMAND,
      RANDOM_SO_COMMAND,
      NEXT_SO_COMMAND,
      ENABLE_TASK_COMMAND,
      DISABLE_TASK_COMMAND,
      LURK_COMMAND,
      UNLURK_COMMAND,
    ];

    const bwiCommands = [
      FROOTY_COMMAND,
      ORE_COMMAND,
      TIN_COMMAND,
      READING_COMMAND,
      READING_GOAL_COMMAND,
      BOT_FIGHT_COMMAND,
      AGENT_COMMAND,
      RANDOM_SO_COMMAND,
      ENABLE_TASK_COMMAND,
      DISABLE_TASK_COMMAND,
    ];

    const merubelleCommands = [
      SO_COMMAND,
      LURK_COMMAND,
      UNLURK_COMMAND,
    ];

    const cheebuchanCommands = [
      LURK_COMMAND,
      UNLURK_COMMAND,
    ];

    const channelCommands = {
      'kavisherlock': kaviCommands,
      'kavi_bot': kaviCommands,
      'bumblebwiii': bwiCommands,
      'merubelle': merubelleCommands,
      'cheebuchan': cheebuchanCommands,
    }

    this.twitchClient.on('clearchat', (channel) => {
      clearAgentsDone(channel);
      clearActiveUsers(channel);
      hasJellyMessaged = false;
    });

    this.twitchClient.on('message', (channel, tags, message, self) => {
      if (self) return;

      const username = tags.username ?? 'blank';
      if (channel === '#bumblebwiii' && !hasJellyMessaged && username.toLowerCase() === 'jellynugget') {
        this.twitchClient.say(channel, 'Things just got a bit fruity around here 🌈');
        hasJellyMessaged = true;
      }

      let commands : Command[] = channelCommands[channel.substring(1)] || [];
      commands = [...commonCommands, ...commands];

      if (taskCommandsEnabled[channel]) {
        commands.push(TASK_HELP_COMMAND, NOW_COMMAND, TASK_COMMAND, SOON_COMMAND, LATER_COMMAND, GET_TASKS_COMMAND, COMPLETE_TASK_COMMAND, REMOVE_TASK_COMMAND, CLEAR_COMMAND);
      }

      for (const command of commands) {
        if (command.isCommand(message)) {
          const username = tags.username ?? 'blank';
          const isMod = tags.mod || tags.badges?.broadcaster;
      
          console.info({ channel, username, message })

          if (command.modsOnly && !isMod && username !== 'kavisherlock') {
            if (username === 'AlwaysKorean') {
              this.twitchClient.say(channel, 'Nice try Roan :p');
            } else {
              this.twitchClient.say(channel, `Only moderators can use this command :]`);
            }
            return;
          }
          if (command.broadcasterOnly && !tags.badges?.broadcaster) {
            this.twitchClient.say(channel, `Only the broadcaster can use this command :]`);
            return;
          }

          if (COMMANDS_COMMAND.isCommand(message)) {
            const commandList = commands
              .filter(cmd => !cmd.modsOnly || isMod)
              .filter(cmd => !cmd.broadcasterOnly || tags.badges?.broadcaster)
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
