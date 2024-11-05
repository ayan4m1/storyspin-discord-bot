import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { getLlama, LlamaChatSession } from 'node-llama-cpp';

const __dirname = dirname(fileURLToPath(import.meta.url));

const llama = await getLlama();
const model = await llama.loadModel({
  modelPath: join(
    __dirname,
    'models',
    'CapybaraHermes-2.5-Mistral-7B-GGUF',
    'capybarahermes-2.5-mistral-7b.Q8_0.gguf'
  )
});
const context = await model.createContext();
const session = new LlamaChatSession({
  contextSequence: context.getSequence()
});

const result = await session.promptWithMeta(
  "Help me understand Ohm's law, please.",
  {
    maxTokens: 512
  }
);

console.log(result.responseText);
