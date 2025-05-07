import { Client, ChatUserstate } from 'tmi.js';

import { Command } from '../models/command';

let book = '';
let audiobook = '';

export const READING_COMMAND = new Command(
  '!reading',
  (twitchClient: Client, channel: string, tags : ChatUserstate) => {
    if (tags.username === 'kavisherlock') {
      let output = '';
      if (book) {
        output += `I\'m currently reading: ${book} 📖 `;
      }
      if (audiobook) {
        output += `I\'m currently listening to: ${audiobook} 🎧 `;
      }
      if (!book && !audiobook) {
        output = 'I\'m not currently reading anything :(';
      }
      twitchClient.say(channel, output);
    }
  }
)

export const SET_BOOK_COMMAND = new Command(
  '!setbook',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message: string) => { 
    if (tags.username === 'kavisherlock') {
      const bookTitle = message.split(' ').slice(1).join(' ');
      if (bookTitle) {
        book = bookTitle === 'none' ? '' : bookTitle;
        twitchClient.say(channel, `Book set to: ${bookTitle}`);
      } else {
        twitchClient.say(channel, 'Please provide a book title.');
      }
    }
  },
  true,
);

export const SET_AUDIOBOOK_COMMAND = new Command(
  '!setaudiobook',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message: string) => { 
    if (tags.username === 'kavisherlock') {
      const audiobookTitle = message.split(' ').slice(1).join(' ');
      if (audiobookTitle) {
        audiobook = audiobookTitle === 'none' ? '' : audiobookTitle;
        twitchClient.say(channel, `Audiobook set to: ${audiobookTitle}`);
      } else {
        twitchClient.say(channel, 'Please provide an audiobook title.');
      }
    }
  },
  true,
);
