import { v4 } from 'uuid';
import {
  ChatHistoryItem,
  getLlama,
  LlamaChatSession,
  resolveModelFile
} from 'node-llama-cpp';

import { llm } from './config.js';
import { findStoryByName, getChatContext, updateChatContext } from './cache.js';

type QuestionResponse = {
  id: string;
  response: string;
};

type StoryResponse = {
  id: string;
  input: string;
  response: string;
};

const llama = await getLlama();
const model = await llama.loadModel({
  modelPath: await resolveModelFile(llm.modelFile)
});

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

export const askColor = async (color: string): Promise<QuestionResponse> => {
  const id = v4();
  const chatSession = await createChatSession([
    {
      type: 'system',
      text: 'You are an expert at color matching and color coordination. Help the user build their desired palette. Provide colors in hex (e.g. #ffffff) format.'
    }
  ]);
  const response = await chatSession.prompt(
    `Help me find a color to go with ${color}`,
    {
      maxTokens: 64
    }
  );

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    response
  };
};

export const askQuestion = async (
  question: string
): Promise<QuestionResponse> => {
  const id = v4();
  const chatSession = await createChatSession([
    {
      type: 'system',
      text: 'You are a helpful assistant.'
    }
  ]);
  const response = await chatSession.prompt(question, {
    maxTokens: 256
  });

  await updateChatContext(id, chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    response
  };
};

export const extendAnswer = async (id: string): Promise<QuestionResponse> => {
  const chatHistory = await getChatContext(id);
  const chatSession = await createChatSession(chatHistory);
  const response = await chatSession.prompt(
    'Please elaborate on your previous answer.',
    { maxTokens: 128 }
  );

  // chatSession.getChatHistory().push({
  //   type: 'model',
  //   response: [response]
  // });

  await updateChatContext(id, chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    response
  };
};

export const beginStory = async (input: string): Promise<StoryResponse> => {
  const id = v4();
  // const chatHistory: ChatHistoryItem[] = [];
  const chatSession = await createChatSession([]);
  const response = await chatSession.prompt(
    `Please act as a storyteller, expanding on the following story: ${input}`,
    { maxTokens: 512 }
  );

  // chatHistory.push({
  //   type: 'user',
  //   text: input
  // });
  // chatHistory.push({
  //   type: 'model',
  //   response: [response]
  // });

  await updateChatContext(id, chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    input,
    response
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
  const response = await chatSession.prompt(input, {
    maxTokens: tokens
  });

  // chatHistory.push({
  //   type: 'user',
  //   text: input
  // });
  // chatHistory.push({
  //   type: 'model',
  //   response: [response]
  // });

  await updateChatContext(id, chatSession.getChatHistory());

  chatSession.context.dispose();
  chatSession.dispose();

  return {
    id,
    input,
    response
  };
};
