import { ChatBotConfig } from './src/app/config/model';
import { ConfigValidator } from './src/app/config/validator';
import { TwitchChatBot } from './src/app/chatbot';

ConfigValidator.readConfig(('./config.json')).then((config: ChatBotConfig) => new TwitchChatBot(config).launch());
