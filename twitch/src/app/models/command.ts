import { ChatUserstate, Client } from "tmi.js";

export class Command {
  usage: string;
  execute: (twitchClient : Client, channel : string, tags : object, message : string) => void;
  modsOnly: boolean;
  broadcasterOnly: boolean;

  constructor(
    usage: string,
    execute: (twitchClient : Client, channel : string, tags : ChatUserstate, message : string) => void,
    modsOnly: boolean = false,
    broadcasterOnly: boolean = false,
  ) {
    this.usage = usage;
    this.execute = execute;
    this.modsOnly = modsOnly;
    this.broadcasterOnly = broadcasterOnly;
  }

  isCommand = (message: string) => {
    return message === this.usage || message.startsWith(`${this.usage} `);
  }
};
