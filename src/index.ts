import { Client } from 'discord.js';
import { connectToCache } from './modules/cache.js';
import {
  connectBot,
  syncCommands,
  registerCommandsAndHandlers
} from './modules/discord.js';
import { getLogger } from './modules/logging.js';

const log = getLogger('index');

let client: Client = null;

try {
  await connectToCache();
  await syncCommands();
  await registerCommandsAndHandlers();

  client = await connectBot();
  const guilds = [...client.guilds.cache.values()];

  log.info(`Bot is connected to ${guilds.length} servers!`);
} catch (error) {
  log.error(error.message);
  log.error(error.stack);
} finally {
  if (client) {
    await client.destroy();
  }
}
