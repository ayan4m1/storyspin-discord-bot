import { v4 } from 'uuid';
import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import {
  ChatHistoryItem,
  getLlama,
  LlamaChatSession,
  resolveModelFile
} from 'node-llama-cpp';

import { llm } from './config.js';
import { getRootDirectory } from '../utils/index.js';

const llama = await getLlama();
const model = await llama.loadModel({
  modelPath: await resolveModelFile(llm.modelFile)
});
const context = await model.createContext({
  contextSize: {
    min: 256,
    max: 16384
  },
  flashAttention: true
});
const session = new LlamaChatSession({
  contextSequence: context.getSequence()
});

export const askQuestion = async (question: string, response?: string) => {
  const context = await model.createContext({
    contextSize: {
      min: 128,
      max: 4096
    },
    flashAttention: true
  });
  const oneOffSession = new LlamaChatSession({
    contextSequence: context.getSequence()
  });

  const chatHistory: ChatHistoryItem[] = [
    {
      type: 'system',
      text: 'You are a helpful assistant.'
    },
    { type: 'user', text: question }
  ];

  if (response) {
    chatHistory.push({ type: 'model', response: [response] });
  }

  oneOffSession.setChatHistory(chatHistory);

  const result = await oneOffSession.completePrompt(question, {
    maxTokens: 256
  });

  oneOffSession.dispose();
  context.dispose();

  return {
    id: v4(),
    response: result
  };
};

// export const extendQuestion = async (question: string, response: string) => {};

export const extendStory = async (prompt: string, tokens = 128) =>
  await session.prompt(prompt, {
    maxTokens: tokens
  });

export const setContext = async (prompt: string) => {
  session.setChatHistory([
    {
      type: 'system',
      text: `Please act as a storyteller, expanding on the following story: ${prompt}`
    }
  ]);
};

export const resetContext = async () => {
  session.resetChatHistory();
};

export const loadContext = async (name: string) => {
  const chatHistory = (await readFile(
    join(getRootDirectory(), 'contexts', `${name}.json`)
  )) as unknown as ChatHistoryItem[];

  session.resetChatHistory();
  session.setChatHistory(chatHistory);
};

export const saveContext = async (name: string) => {
  const chatHistory = session.getChatHistory();

  await writeFile(
    join(getRootDirectory(), 'contexts', `${name}.json`),
    JSON.stringify(chatHistory),
    'utf-8'
  );
};
