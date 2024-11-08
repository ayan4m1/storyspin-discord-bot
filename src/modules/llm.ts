import { join } from 'path';
import { readFile, writeFile } from 'fs/promises';
import { ChatHistoryItem, getLlama, LlamaChatSession } from 'node-llama-cpp';

import { llm } from './config.js';
import { getRootDirectory } from '../utils/index.js';

const llama = await getLlama();
const model = await llama.loadModel({
  modelPath: join('/', 'models', llm.modelFile)
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

export const askQuestion = async (question: string) => {
  const context = await model.createContext({
    flashAttention: true
  });
  const oneOffSession = new LlamaChatSession({
    contextSequence: context.getSequence()
  });

  const result = await oneOffSession.completePrompt(question, {
    maxTokens: 512
  });

  oneOffSession.dispose();
  context.dispose();

  return result;
};

export const extendStory = async (prompt: string, tokens = 128) =>
  await session.promptWithMeta(prompt, {
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
