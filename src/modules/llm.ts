import { v4 } from 'uuid';
import { basename } from 'path';
import { globby } from 'globby';
import {
  ChatHistoryItem,
  getLlama,
  LlamaChatSession,
  resolveModelFile
} from 'node-llama-cpp';

import { llm as config } from './config.js';
import {
  findStoryByName,
  getAllenChatContext,
  getChatContext,
  updateAllenChatContext,
  updateChatContext
} from './cache.js';

type LlamaResponseMeta = {
  responseText: string;
  stopReason:
    | 'abort'
    | 'maxTokens'
    | 'eogToken'
    | 'stopGenerationTrigger'
    | 'functionCalls'
    | 'customStopTrigger';
};

type QuestionResponse = {
  id: string;
  response: string;
};

type StoryResponse = {
  id: string;
  input: string;
  response: string;
};

type ModelInfo = {
  name: string;
  size: number;
};

const llama = await getLlama();
let model = await llama.loadModel({
  modelPath: await resolveModelFile(config.modelFile),
  gpuLayers: config.gpuLayers
});

const promptOptions = {
  temperature: config.sampling.temperature,
  topK: config.sampling.topK,
  topP: config.sampling.topP,
  repeatPenalty: {
    frequencyPenalty: config.tokenRepeatPenalty,
    penalizeNewLine: false
  }
};

const createChatSession = async (chatHistory?: ChatHistoryItem[]) => {
  const context = await model.createContext({ flashAttention: true });
  const session = new LlamaChatSession({
    contextSequence: context.getSequence()
  });

  if (chatHistory) {
    session.setChatHistory(chatHistory);
  }

  return session;
};

const trimResponse = (response: LlamaResponseMeta): void => {
  if (
    /\[INST\]/.test(response.responseText) &&
    /\[\/INST\]/.test(response.responseText)
  ) {
    response.responseText = response.responseText.slice(
      response.responseText.indexOf('[INST]') + 6,
      response.responseText.indexOf('[/INST]')
    );
  }

  if (
    response.stopReason === 'maxTokens' &&
    response.responseText.includes('.')
  ) {
    response.responseText = response.responseText.substring(
      0,
      response.responseText.lastIndexOf('.')
    );
  }

  if (/\n+[0-9]$/.test(response.responseText)) {
    response.responseText = response.responseText.replace(/\n+[0-9]$/, '');
  }

  if (!response.responseText.endsWith('.')) {
    response.responseText += '.';
  }
};

export const getActiveModel = () => basename(model.filename, '.gguf');

export const listModels = async (): Promise<ModelInfo[]> => {
  const files = await globby('/root/.node-llama-cpp/models/*.gguf', {
    objectMode: true,
    stats: true
  });

  return files.map(({ path, stats }) => {
    const file = basename(path, '.gguf');

    return {
      name: file,
      size: stats.size
    };
  });
};

export const changeModel = async (modelName: string) => {
  model = await llama.loadModel({
    modelPath: await resolveModelFile(
      modelName.endsWith('.gguf') ? modelName : `${modelName}.gguf`
    ),
    gpuLayers: config.gpuLayers
  });
};

export const askQuestion = async (
  question: string,
  systemPrompt: string = 'You are a helpful assistant. Provide the user with answers to their questions.',
  tokens: number = 256
): Promise<QuestionResponse> => {
  const id = v4();
  const chatSession = await createChatSession([
    {
      type: 'system',
      text: systemPrompt
    }
  ]);
  const response = await chatSession.promptWithMeta(question, {
    ...promptOptions,
    seed: Math.random() * Number.MAX_SAFE_INTEGER,
    maxTokens: tokens
  });

  trimResponse(response);

  await updateChatContext(id, chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    response: response.responseText
  };
};

export const beginStory = async (
  input: string,
  tokens: number = 256
): Promise<StoryResponse> => {
  const id = v4();
  const chatSession = await createChatSession([]);
  const response = await chatSession.promptWithMeta(
    `Please act as a storyteller. Provide a beginning for the following story: ${input}`,
    {
      ...promptOptions,
      seed: Math.random() * Number.MAX_SAFE_INTEGER,
      maxTokens: tokens
    }
  );

  trimResponse(response);

  await updateChatContext(id, chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    input,
    response: response.responseText
  };
};

export const extendAnswer = async (
  id: string,
  input: string,
  tokens: number = 128
): Promise<StoryResponse> => {
  const chatHistory = await getChatContext(id);
  const chatSession = await createChatSession(chatHistory);
  const response = await chatSession.promptWithMeta(input, {
    ...promptOptions,
    seed: Math.random() * Number.MAX_SAFE_INTEGER,
    maxTokens: tokens
  });

  trimResponse(response);

  await updateChatContext(id, chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    input,
    response: response.responseText
  };
};

export const extendStory = async (
  storyName: string,
  input: string,
  tokens: number = 128
): Promise<StoryResponse> => {
  const id = await findStoryByName(storyName);
  const chatHistory = await getChatContext(id);
  const chatSession = await createChatSession(chatHistory);
  const response = await chatSession.promptWithMeta(input, {
    ...promptOptions,
    seed: Math.random() * Number.MAX_SAFE_INTEGER,
    maxTokens: tokens
  });

  trimResponse(response);

  await updateChatContext(id, chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    input,
    response: response.responseText
  };
};

export const answerAllen = async (input: string): Promise<QuestionResponse> => {
  const id = v4();
  const chatHistory = await getAllenChatContext();
  const chatSession = await createChatSession(chatHistory);
  const response = await chatSession.promptWithMeta(input, {
    ...promptOptions,
    seed: Math.random() * Number.MAX_SAFE_INTEGER,
    maxTokens: 128
  });

  trimResponse(response);

  await updateAllenChatContext(chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    response: response.responseText
  };
};
