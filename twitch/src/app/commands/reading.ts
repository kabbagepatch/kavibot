import { Client, ChatUserstate } from 'tmi.js';

import { Command } from '../models/command';

let book = 'Butter by Asako Yuzuki';
let audiobook = 'The Return of the King by J.R.R. Tolkien';
let read = 35;

export const READING_COMMAND = new Command(
  '!reading',
  (twitchClient: Client, channel: string, tags : ChatUserstate) => {
    if (tags.username === 'kavisherlock') {
      let output = '';
      if (book) {
        output += `I\'m currently reading ${book} 📖 `;
      }
      if (audiobook) {
        output += `I\'m currently listening to ${audiobook} 🎧 `;
      }
      if (!book && !audiobook) {
        output = 'I\'m not currently reading anything :(';
      }
      twitchClient.say(channel, output);
    }
  }
);

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

export const READING_GOAL_COMMAND = new Command(
  '!readinggoal',
  (twitchClient: Client, channel: string, tags : ChatUserstate) => {
    if (tags.username === 'kavisherlock') {
      const output = `I've read ${read} books this year so far 📚 My goal is 52!`;
      twitchClient.say(channel, output);
    }
  }
);

export const SET_BOOKS_READ_COMMAND = new Command(
  '!setbooksread',
  (twitchClient: Client, channel: string, tags : ChatUserstate, message: string) => { 
    if (tags.username === 'kavisherlock') {
      const booksRead = parseInt(message.split(' ')[1], 10);
      if (booksRead && !isNaN(booksRead)) {
        read = booksRead;
        twitchClient.say(channel, `Books read set to: ${booksRead}`);
      } else {
        twitchClient.say(channel, 'Please provide a valid number of books read.');
      }
    }
  },
  true,
);
