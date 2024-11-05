import { join } from 'path';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

import { llm } from './config.js';

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

export const extendStory = async (prompt, tokens = 128) => {
  return await session.promptWithMeta(prompt, {
    maxTokens: tokens
  });
};

export const setContext = async (prompt) => {
  session.setChatHistory([
    {
      type: 'system',
      text: prompt
    }
  ]);
};

export const resetContext = async () => {
  session.resetChatHistory();
};
