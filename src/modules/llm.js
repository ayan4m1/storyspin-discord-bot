import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

const __dirname = dirname(fileURLToPath(import.meta.url));

const llama = await getLlama();
const model = await llama.loadModel({
  modelPath: join(
    __dirname,
    '..',
    '..',
    '..',
    'models',
    'capybarahermes-2.5-mistral-7b.Q8_0.gguf'
  )
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

export const extendStory = async (prompt) => {
  return await session.promptWithMeta(prompt, {
    maxTokens: 512
  });
};
