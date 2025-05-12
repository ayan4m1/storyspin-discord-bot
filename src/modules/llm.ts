import { v4 } from 'uuid';
import ollama, { ChatResponse, Options } from 'ollama';

import { llm as config } from './config.js';
import {
  findStoryByName,
  getAllenChatContext,
  getChatContext,
  updateAllenChatContext,
  updateChatContext
} from './cache.js';

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
  id: string;
  name: string;
  size: number;
  vram: number;
};

let modelId = config.modelId;

const getPromptOptions = (): Partial<Options> => ({
  temperature: config.sampling.temperature,
  top_k: config.sampling.topK,
  top_p: config.sampling.topP,
  seed: Math.random() * Number.MAX_SAFE_INTEGER,
  repeat_penalty: config.tokenRepeatPenalty,
  penalize_newline: false
});

const trimResponse = ({
  done_reason,
  message: { content }
}: ChatResponse): void => {
  if (/\[INST\]/.test(content) && /\[\/INST\]/.test(content)) {
    content = content.slice(
      content.indexOf('[INST]') + 6,
      content.indexOf('[/INST]')
    );
  }

  if (done_reason === 'maxTokens' && content.includes('.')) {
    content = content.substring(0, content.lastIndexOf('.'));
  }

  if (/\n+[0-9]$/.test(content)) {
    content = content.replace(/\n+[0-9]$/, '');
  }

  if (!content.endsWith('.')) {
    content += '.';
  }
};

export const listModels = async (): Promise<ModelInfo[]> => {
  const { models } = await ollama.list();

  return models.map(({ model, name, size, size_vram }) => ({
    id: model,
    name,
    size,
    vram: size_vram
  }));
};

export const changeModel = async (newModelId: string) => {
  modelId = newModelId;

  const stream = await ollama.pull({
    model: modelId,
    stream: true
  });

  for await (const part of stream) {
    console.log(part.status);
  }
};

export const askQuestion = async (
  question: string,
  systemPrompt: string = 'You are a helpful assistant. Provide the user with answers to their questions.'
): Promise<QuestionResponse> => {
  const id = v4();
  const chatHistory = [
    {
      role: 'system',
      content: systemPrompt
    },
    {
      role: 'user',
      content: question
    }
  ];
  const response = await ollama.chat({
    model: modelId,
    options: getPromptOptions(),
    messages: chatHistory
  });

  trimResponse(response);

  chatHistory.push(response.message);

  await updateChatContext(id, chatHistory);

  return {
    id,
    response: response.message.content
  };
};

export const beginStory = async (input: string): Promise<StoryResponse> => {
  const id = v4();
  const chatHistory = [
    {
      role: 'user',
      content: `Please act as a storyteller. Provide a beginning for the following story: ${input}`
    }
  ];
  const response = await ollama.chat({
    model: modelId,
    options: getPromptOptions(),
    messages: chatHistory
  });

  trimResponse(response);

  chatHistory.push(response.message);

  await updateChatContext(id, chatHistory);

  return {
    id,
    input,
    response: response.message.content
  };
};

export const extendAnswer = async (
  id: string,
  input: string
): Promise<StoryResponse> => {
  const chatHistory = await getChatContext(id);

  chatHistory.push({
    role: 'user',
    content: input
  });

  const response = await ollama.chat({
    model: modelId,
    options: getPromptOptions(),
    messages: chatHistory
  });

  trimResponse(response);

  await updateChatContext(id, chatHistory);

  return {
    id,
    input,
    response: response.message.content
  };
};

export const extendStory = async (
  storyName: string,
  input: string
): Promise<StoryResponse> => {
  const id = await findStoryByName(storyName);
  const chatHistory = await getChatContext(id);

  chatHistory.push({
    role: 'user',
    content: input
  });

  const response = await ollama.chat({
    model: modelId,
    options: getPromptOptions(),
    messages: chatHistory
  });

  trimResponse(response);

  chatHistory.push(response.message);

  await updateChatContext(id, chatHistory);

  return {
    id,
    input,
    response: response.message.content
  };
};

export const answerAllen = async (input: string): Promise<QuestionResponse> => {
  const id = v4();
  const chatHistory = await getAllenChatContext();

  chatHistory.push({
    role: 'user',
    content: input
  });

  const response = await ollama.chat({
    model: modelId,
    options: getPromptOptions(),
    messages: chatHistory
  });

  trimResponse(response);

  await updateAllenChatContext(chatHistory);

  return {
    id,
    response: response.message.content
  };
};
