import { createClient } from 'redis';

const client = createClient({
  url: 'redis://cache'
});

await client.connect();

export const getValue = (key: string) => {
  return client.get(key);
};
