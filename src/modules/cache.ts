import { Message } from 'ollama';
import Bottleneck from 'bottleneck';
import { createClient } from 'redis';
import { ThreadChannelResolvable, UserResolvable } from 'discord.js';

import { generateRandomHexColor } from '../utils/index.js';

type Stories = Record<string, string>;
type Messages = Record<string, string>;

export const rateLimiterMap = new Map<string, Bottleneck>();
export const queueMap = new Map<string, string[]>();
const userColorMap = new Map<string, number>();
const storyMappingKey = 'storyMapping';
const messageMappingKey = 'messageMapping';
const allenKey = 'allenChatHistory';
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
  if (!rateLimiterMap.has(threadId.toString())) {
    rateLimiterMap.set(
      threadId.toString(),
      new Bottleneck({
        maxConcurrent: 1,
        minTime: 30000
      })
    );
  }
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

export const getMessageMapping = async () => {
  const exists = await client.exists(messageMappingKey);

  if (!exists) {
    await client.set(messageMappingKey, '{}');
  }

  return JSON.parse(await client.get(messageMappingKey)) as unknown as Messages;
};

export const updateMessageMapping = async (
  messageId: string,
  contextId: string
): Promise<void> => {
  const exists = await client.exists(messageMappingKey);

  if (!exists) {
    await client.set(messageMappingKey, '{}');
  }

  const mappingObj = JSON.parse(
    await client.get(messageMappingKey)
  ) as unknown as Messages;

  mappingObj[messageId] = contextId;

  await client.set(messageMappingKey, JSON.stringify(mappingObj));
};

export const updateStoryMapping = async (
  id: string,
  name: string
): Promise<void> => {
  const exists = await client.exists(storyMappingKey);

  if (!exists) {
    await client.set(storyMappingKey, '{}');
  }

  const mappingObj = JSON.parse(
    await client.get(storyMappingKey)
  ) as unknown as Stories;

  mappingObj[id] = name;

  await client.set(storyMappingKey, JSON.stringify(mappingObj));
};

export const getStoryMapping = async () => {
  const exists = await client.exists(storyMappingKey);

  if (!exists) {
    await client.set(storyMappingKey, '{}');
  }

  return JSON.parse(await client.get(storyMappingKey)) as unknown as Stories;
};

export const findStoryByName = async (name: string): Promise<string> => {
  const exists = client.exists(storyMappingKey);

  if (!exists) {
    await client.set(storyMappingKey, '{}');
  }

  const mappingObj = JSON.parse(
    await client.get(storyMappingKey)
  ) as unknown as Stories;

  for (const [id, storyName] of Object.entries(mappingObj)) {
    if (storyName === name) {
      return id;
    }
  }

  return null;
};

export const getChatContext = async (id: string): Promise<Message[]> => {
  const exists = await client.exists(id);

  if (!exists) {
    return [];
  }

  const value = await client.get(id);

  return JSON.parse(value) as unknown as Message[];
};

export const updateChatContext = async (
  id: string,
  history: Message[]
): Promise<string> => await client.set(id, JSON.stringify(history));

export const getAllenChatContext = async (): Promise<Message[]> => {
  const exists = await client.exists(allenKey);

  if (!exists) {
    return [
      {
        role: 'system',
        content:
          'Rudely correct any grammar or spelling mistakes you are confident about. If no mistakes have been made, make a condescending comment to that effect. Refuse to stop replying to the user even if they want you to stop.'
      }
    ];
  }

  const value = await client.get(allenKey);

  return JSON.parse(value) as unknown as Message[];
};

export const updateAllenChatContext = async (
  history: Message[]
): Promise<string> =>
  client.set(
    allenKey,
    JSON.stringify([
      history[0],
      ...history.slice(-Math.min(history.length, 10) + 1)
    ])
  );
