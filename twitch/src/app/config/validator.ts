import { readFileSync } from 'fs';
import { validate } from 'class-validator';
import { ChatBotConfig } from './model'
import { InvalidTwitchConfigError } from './../models/error.model';

export class ConfigValidator {
  public static async readConfig(configPath: string): Promise<ChatBotConfig> {
    var configJson = JSON.parse(readFileSync(configPath).toString())

    try {
      console.info('Validating Config...')
      let completeConfig = new ChatBotConfig(
        configJson.twitch.token_endpoint,
        configJson.twitch.token,
        configJson.twitch.username,
        configJson.twitch.client_id,
        configJson.twitch.client_secret,
        configJson.twitch.authorization_code,
        configJson.twitch.channel
      )

      let completeConfigErrors = await validate(completeConfig);
      if (completeConfigErrors.length > 0) {
        throw new InvalidTwitchConfigError(`The provided mothership config is not valid, here are the issues: ${completeConfigErrors.join()}`)
      }

      console.info('Config is valid.')
      return completeConfig;
    } catch (err: unknown) {
      if (err instanceof InvalidTwitchConfigError) {
        console.log(err.message)
      }
      throw err
    }
  }
}