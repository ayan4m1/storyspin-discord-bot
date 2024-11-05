import { ActivityType } from 'discord.js';

import {
  connectBot,
  registerCommandsAndHandlers,
  syncCommands
} from './modules/discord.js';
import { getLogger } from './modules/logging.js';

const log = getLogger('index');

(async () => {
  await syncCommands();
  await registerCommandsAndHandlers();

  const client = await connectBot();
  const guilds = [...client.guilds.cache.values()];

  log.info(`Bot is connected to ${guilds.length} servers!`);
})();
