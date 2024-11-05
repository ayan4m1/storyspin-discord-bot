import { join } from 'path';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

const llama = await getLlama();
const model = await llama.loadModel({
  modelPath: join('/', 'models', 'capybarahermes-2.5-mistral-7b.Q8_0.gguf')
});
const context = await model.createContext({
  contextSize: {
    min: 512,
    max: 16384
  }
});
const session = new LlamaChatSession({
  contextSequence: context.getSequence()
});

export const extendStory = async (prompt, tokens = 512) => {
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
