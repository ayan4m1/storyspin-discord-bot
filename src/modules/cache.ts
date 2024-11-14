import { createClient } from 'redis';
import { ChatHistoryItem } from 'node-llama-cpp';

const mappingKey = 'storyMapping';
const client = createClient({
  url: 'redis://cache'
});

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
