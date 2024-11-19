import { createClient } from 'redis';
import { ChatHistoryItem } from 'node-llama-cpp';
import { ThreadChannelResolvable, UserResolvable } from 'discord.js';

import { generateRandomHexColor } from '../utils/index.js';

const queueMap = new Map<string, string[]>();
const userColorMap = new Map<string, number>();
const mappingKey = 'storyMapping';
const client = createClient({
  url: 'redis://cache'
});

export const getCurrentContributor = (threadId: ThreadChannelResolvable) => {
  if (!queueMap.has(threadId.toString())) {
    queueMap.set(threadId.toString(), []);
  }

  return queueMap.get(threadId.toString())[0];
};

export const dequeueContributor = (threadId: ThreadChannelResolvable) => {
  if (!queueMap.has(threadId.toString())) {
    queueMap.set(threadId.toString(), []);
  }

  return queueMap.get(threadId.toString()).shift();
};

export const enqueueContributor = (
  threadId: ThreadChannelResolvable,
  userId: UserResolvable
) => {
  if (!queueMap.has(threadId.toString())) {
    queueMap.set(threadId.toString(), []);
  }

  queueMap.get(threadId.toString()).push(userId.toString());
};

export const getContributorColor = (userId: UserResolvable) => {
  if (!userColorMap.has(userId.toString())) {
    const newColor = generateRandomHexColor();

    userColorMap.set(userId.toString(), newColor);
  }

  return userColorMap.get(userId.toString());
};

export const connectToCache = () => client.connect();

export const getStoryMapping = async () => {
  const exists = await client.exists(mappingKey);

  if (!exists) {
    await client.set(mappingKey, '{}');
  }

  return JSON.parse(await client.get(mappingKey)) as unknown as object;
};

export const updateStoryMapping = async (
  id: string,
  name: string
): Promise<void> => {
  const exists = await client.exists(mappingKey);

  if (!exists) {
    await client.set(mappingKey, '{}');
  }

  const mappingObj = JSON.parse(
    await client.get(mappingKey)
  ) as unknown as object;

  mappingObj[id] = name;

  await client.set(mappingKey, JSON.stringify(mappingObj));
};

export const findStoryByName = async (name: string): Promise<string> => {
  const exists = client.exists(mappingKey);

  if (!exists) {
    await client.set(mappingKey, '{}');
  }

  const mappingObj = JSON.parse(
    await client.get(mappingKey)
  ) as unknown as object;

  for (const [id, storyName] of Object.entries(mappingObj)) {
    if (storyName === name) {
      return id;
    }
  }

  return null;
};

export const getChatContext = async (
  id: string
): Promise<ChatHistoryItem[]> => {
  const exists = await client.exists(id);

  if (!exists) {
    return [];
  }

  const value = await client.get(id);

  return JSON.parse(value) as unknown as ChatHistoryItem[];
};

export const updateChatContext = async (
  id: string,
  history: ChatHistoryItem[]
): Promise<string> => await client.set(id, JSON.stringify(history));
