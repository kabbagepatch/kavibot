import 'dotenv/config';
import express from 'express';
import cron from 'node-cron';
import {
  InteractionType,
  InteractionResponseType,
  InteractionResponseFlags,
  MessageComponentTypes,
  ButtonStyleTypes,
} from 'discord-interactions';
import { Client, GatewayIntentBits } from 'discord.js';

import { VerifyDiscordRequest, DiscordRequest, getRandomEmoji, getDateFromInput, FULL_DAYS, getCompliment } from './utils.js';
import { getShuffledOptions, getResult } from './game.js';
import { CHALLENGE_COMMAND, HELLO_COMMAND, FLOW_COMMAND, TIME_COMMAND, WEEKLY_COMMAND, GAME_COMMAND, REMINDER_COMMAND, SyncGuildCommands, STOP_REMINDER_COMMAND, SHOW_REMINDERS_COMMAND, STUPID_COUNTER, SHOW_STUPID_COUNTS, RESET_STUPID_COUNTERS } from './commands.js';

const app = express();
const PORT = process.env.PORT || 3000;
app.use(express.json({ verify: VerifyDiscordRequest(process.env.PUBLIC_KEY) }));

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent] });

const activeGames = {};
const foundGameLinks = {};

const KAVIBOT_USER_ID = '1060455432843448360';
const BWI_USER_ID = '467323668507131904';
const KAV_USER_ID = '694510056217247795';

const activeReminders = {};

const stupidCounts = {};

/**
 * Interactions endpoint URL where Discord will send HTTP requests
 */
app.post('/interactions', async function(req, res) {
  const { type, id, data, guild_id, channel_id } = req.body;

  /**
   * Handle verification requests
   */
  if (type === InteractionType.PING) {
    return res.send({ type: InteractionResponseType.PONG });
  }

  /**
   * Handle slash commands
   */
  if (type === InteractionType.APPLICATION_COMMAND) {
    const { name } = data;
    const options = {};
    if (data.options) {
      data.options.forEach(option => options[option.name] = option.value)
    }

    if (name === HELLO_COMMAND.name) {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: 'Omg Heyyy ' + getRandomEmoji(),
        },
      });
    }

    if (name === FLOW_COMMAND.name) {
      // Send a message into the channel where command was triggered from
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: (await getCompliment()) + ' ' + getRandomEmoji(),
        },
      });
    }

    if (name === GAME_COMMAND.name) {
      const forceFetch = data.options && data.options.length > 0 && data.options[0] ? data.options[0].value : false;
      if (forceFetch) console.log('Doing a full channel read');
      let channel;
      if (!forceFetch && client.channels.cache.has(channel_id)) {
        channel = client.channels.cache.get(channel_id);
      } else {
        try {
          console.log('Fetching channel');
          channel = await client.channels.fetch(channel_id);
        } catch (error) {
          console.error('Error fetching channel:', error);
        }
      }

      let fetchedMessages = {size: 0};
      let messages = [];
      let lastMessageId;
      if (forceFetch || !channel.messages.cache || channel.messages.cache.size === 0) {
        try {
          console.log('Fetching messages');
          do {
            fetchedMessages = await channel.messages.fetch({ limit: 100, before: lastMessageId });
            messages.push(...fetchedMessages.values());
            lastMessageId = fetchedMessages.last()?.id;
          } while (fetchedMessages.size > 0 && (!foundGameLinks[channel_id] || foundGameLinks[channel_id].size === 0 || messages.length <= 200 || forceFetch));
        } catch (error) {
          console.error('Error fetching messages:', error);
        }
      } else {
        console.log('Cached messages: ' + channel.messages.cache.size);
        messages = channel.messages.cache.values();
        messages.length = channel.messages.cache.size;
      }

      // Filter for Steam game links
      const steamLinkRegex = /https?:\/\/store\.steampowered\.com\/app\/\d+(\/?[\w-]*\/?)/g;
      let gameLinks = [];
      messages.filter(msg => msg.author.id !== KAVIBOT_USER_ID).forEach(msg => {
        const links = msg.content.match(steamLinkRegex);
        if (links) {
          gameLinks.push(...links);
        }
      });

      if (!foundGameLinks[channel_id]) {
        foundGameLinks[channel_id] = new Set();
      }
      gameLinks.forEach(link => {
        foundGameLinks[channel_id].add(link);
      })
      const allGameLinks = Array.from(foundGameLinks[channel_id]);

      console.log(`Fetched ${messages.length} messages`);
      console.log(`Filtered ${gameLinks.length} Steam links. New total: ${allGameLinks.length}`);

      if (allGameLinks.length > 0) {
        allGameLinks.push('https://playvalorant.com/en-us/');
        allGameLinks.push('https://www.fortnite.com/?lang=en-US');
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content: allGameLinks.length > 0 ? allGameLinks[Math.floor(Math.random() * allGameLinks.length)] : "No Steam games found",
        },
      });
    }

    // /time date:2023/02/08 1:30 pm est
    if (name === TIME_COMMAND.name) {
      console.log(data);
      const dateStrings = data.options[0].value;
      const timezone = data.options[1] ? data.options[1].value : null;
      const dateStringOutputs = dateStrings.split(',').map(dateString => getDateFromInput(dateString, timezone, req.body.member.user.id));
      let fullDateStrings = [];
      FULL_DAYS.forEach((day) => {
        const i = dateStringOutputs.findIndex(d => d.startsWith(day));
        if (i !== -1) {
          fullDateStrings.push(dateStringOutputs[i].split(' \\')[1] + '\n->');
        } else {
          fullDateStrings.push(`${day}\n*off*`);
        }
      });

      let content = dateStringOutputs.join('\n');
      if (req.body.member.user.id === BWI_USER_ID || req.body.member.user.id === KAV_USER_ID) {
        if (dateStringOutputs.length > 1) {
          content = fullDateStrings.join('\n\n');
        } else {
          content = content.split(' \\')[1];
        }
      } else {
        content += "\n\\*times automatically converted to your time zone\\*\n";
      }

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content, flags: 64 },
      })
    }

    // /time date:2023/02/08 1:30 pm est
    if (name === WEEKLY_COMMAND.name) {
      const dateStrings = data.options[0].value;
      const timezone = data.options[1] ? data.options[1].value : null;
      let content = "\\# :xflowmTeeHee: Weekly Schedule :xflowmSip:"
      content += "\n\\*This schedule will include all stream times, podcast releases, and Discord events going on for the week and will be updated on Sundays. Keep in mind all times are subject to change (assume +/- 30 ish mins due to my fashionably late nature). All times appear in the timezone you use on your device.\\*\n\n:BeeBounce:\n\n";
      content += dateStrings.split(',').map(dateString => getDateFromInput(dateString, timezone, req.body.member.user.id)).join('\n');

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content },
      })
    }

    if (name === STUPID_COUNTER.name) {
      const userId = options.user ?? req.body.member.user.id;
      if (!stupidCounts[userId]) {
        stupidCounts[userId] = 0;
      }
      stupidCounts[userId] += 1;
      const content = `<@${userId}> has said stupid ${stupidCounts[userId]} time(s)`;
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content },
      })
    }

    if (name === SHOW_STUPID_COUNTS.name) {
      console.log({stupidCounts});
      let content = 'Stupid counts:\n';
      Object.keys(stupidCounts).forEach(userId => {
        content += `<@${userId}>: ${stupidCounts[userId]}\n`;
      });
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content },
      })
    }

    if (name === RESET_STUPID_COUNTERS.name) {
      Object.keys(stupidCounts).forEach(key => { stupidCounts[key] = 0; });
      const content = `All stupid counters have been reset`;
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content },
      })
    }

    if (name === STOP_REMINDER_COMMAND.name) {
      const reminder = options.keyword.replace(' ', '-');
      const userId = options.user ?? req.body.member.user.id;
      const reminderKey = `${userId}-${reminder}`;
      if (activeReminders[reminderKey]) {
        activeReminders[reminderKey].task.stop();
        delete activeReminders[reminderKey];
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `Reminder, ${reminder}, removed for user`, flags: 64 },
        })
      }

      const allReminders = Object.keys(activeReminders);
      const userReminders = allReminders.filter(r => r.substring(0, r.indexOf('-')) == userId);
      const userReminderNames = userReminders.map(r => r.substring(r.indexOf('-') + 1));
      const content = userReminderNames.length > 0 ? `Reminder, ${reminder}, does not exist for user. Available reminders: ${userReminderNames.toString()}` : 'No reminders set for user';
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content, flags: 64 },
      })
    }

    if (name === SHOW_REMINDERS_COMMAND.name) {
      const userId = options.user ?? req.body.member.user.id;
      console.log({activeReminders});
      const allReminders = Object.keys(activeReminders);
      const userReminders = allReminders.filter(r => r.substring(0, r.indexOf('-')) == userId);
      const userReminderNames = userReminders.map(r => `${r.substring(r.indexOf('-') + 1)} (${activeReminders[r].nReminders - activeReminders[r].sendCount} left)`);
      const content = userReminderNames.length > 0 ? `Current reminders: ${userReminderNames.join(', ')}` : 'No reminders set for user';
      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content, flags: 64 },
      })
    }

    if (name === REMINDER_COMMAND.name) {
      const reminder = options.keyword.replace(' ', '-');
      const description = options.description ?? '';
      const userId = options.user ?? req.body.member.user.id;
      const channelId = options.channel ?? channel_id;
      const cstHour = options.csthour ?? 10;
      const cronExpression = options.cronexpression ?? `0 ${(cstHour + 6) % 24} * * *`;
      const nReminders = options.nreminders ?? 1;

      const reminderKey = `${userId}-${reminder}`;

      if (activeReminders[reminderKey]) {
        return res.send({
          type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
          data: { content: `Reminder, ${reminder}, already exists for user`, flags: 64 },
        })
      }

      let sendCount = 0; // Counter to track messages sent
      const task = cron.schedule(cronExpression, async () => {
        let channel;
        if (client.channels.cache.has(channelId)) {
          channel = client.channels.cache.get(channelId);
        } else {
          try {
            console.log('Fetching channel');
            channel = await client.channels.fetch(channelId);
          } catch (error) {
            console.error('Error fetching channel:', error);
          }
        }

        if (channel) {
          console.log('Sending message to channel');
          sendCount += 1;
          try {
            const reminderMessage = description.length > 0 ? `: ${description}` : '';
            await channel.send(`${reminder} Reminder for <@${userId}>${reminderMessage}`);
          } catch (error) {
            console.error('Error sending message to channel:', error);
          }
        }

        activeReminders[reminderKey].sendCount = sendCount;
        if (sendCount >= nReminders) {
          task.stop();
          delete activeReminders[reminderKey];
          return;
        }
      });

      activeReminders[reminderKey] = { userId, reminder, description, channelId, nReminders, cronExpression, task, sendCount };

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: { content: `Reminder ${reminder} set`, flags: 64 },
      });
    }

    if (name === CHALLENGE_COMMAND.name && id) {
      const userId = req.body.member.user.id;
      const name = data.options[0].value;
      const targetId = data.options[1] ? data.options[1].value : 'undefined';
      let content = `Valorant agent battle challenge from <@${userId}>`;
      if (targetId !== 'undefined') {
        content = `<@${targetId}>. <@${userId}> has challanged you to a Valorant agent battle`
      }

      activeGames[id] = { id: userId, name };

      return res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: {
          content,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.BUTTON,
                  custom_id: `accept_button_${req.body.id}_target_${targetId}`,
                  label: 'Accept',
                  style: ButtonStyleTypes.PRIMARY,
                },
              ],
            },
          ],
        }
      });
    }
  }

  /**
   * Handle interative component requests
   */
  if (type === InteractionType.MESSAGE_COMPONENT) {
    const userId = req.body.member.user.id;
    const componentId = data.custom_id;
    let responseData;
    let deleteOriginal;
    if (componentId.startsWith('accept_button_')) {
      const ids = componentId.split('_target_');
      const gameId = ids[0].replace('accept_button_', '');
      const targetId = ids[1];
      if (targetId != 'undefined' && targetId != userId) {
        responseData = {
          content: 'You are not the target for this challange',
          flags: InteractionResponseFlags.EPHEMERAL,
        };
      } else {
        deleteOriginal = true;
        responseData = {
          content: 'What is your Agent of choice?',
          flags: InteractionResponseFlags.EPHEMERAL,
          components: [
            {
              type: MessageComponentTypes.ACTION_ROW,
              components: [
                {
                  type: MessageComponentTypes.STRING_SELECT,
                  custom_id: `select_choice_${gameId}`,
                  options: getShuffledOptions(),
                },
              ],
            },
          ],
        };
      }
    } else if (componentId.startsWith('select_choice_')) {
      deleteOriginal = true;
      const gameId = componentId.replace('select_choice_', '');
      if (activeGames[gameId]) {
        const name = data.values[0];
        const result = getResult(activeGames[gameId], { id: userId, name });
        delete activeGames[gameId];
        responseData = { content: result };
      }
    }

    try {
      res.send({
        type: InteractionResponseType.CHANNEL_MESSAGE_WITH_SOURCE,
        data: responseData,
      });

      const endpoint = `webhooks/${process.env.APP_ID}/${req.body.token}/messages/${req.body.message.id}`;
      if (deleteOriginal) await DiscordRequest(endpoint, { method: 'DELETE' });
    } catch (err) {
      console.error('Error sending message:', err.response.data.message);
    }
  }
});

client.login(process.env.DISCORD_TOKEN);

app.listen(PORT, () => {
  console.log('Listening on port', PORT);

  const existingCommands = [
    HELLO_COMMAND,
    FLOW_COMMAND,
    CHALLENGE_COMMAND,
    TIME_COMMAND,
    GAME_COMMAND,
    REMINDER_COMMAND,
    SHOW_REMINDERS_COMMAND,
    STOP_REMINDER_COMMAND,
    STUPID_COUNTER,
    SHOW_STUPID_COUNTS,
    RESET_STUPID_COUNTERS,
  ];

  const updatedCommands = [
    TIME_COMMAND,
  ];

  SyncGuildCommands(process.env.APP_ID, process.env.GUILD_ID_BWI, existingCommands, updatedCommands);
  SyncGuildCommands(process.env.APP_ID, process.env.GUILD_ID_KAV, existingCommands, updatedCommands);
  SyncGuildCommands(process.env.APP_ID, process.env.GUILD_ID_MERU, [HELLO_COMMAND, TIME_COMMAND], []);
  SyncGuildCommands(process.env.APP_ID, process.env.GUILD_ID_NELLY, [HELLO_COMMAND, TIME_COMMAND], []);
});
