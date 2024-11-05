import {
  connectBot,
  getDirectMessageChannel,
  registerCommandsAndHandlers,
  syncCommands
} from './modules/discord.js';
import { getLogger } from './modules/logging.js';
import { dequeue, getNextContributor } from './modules/queue.js';

const log = getLogger('index');

(async () => {
  await syncCommands();
  await registerCommandsAndHandlers();

  const client = await connectBot();
  const guilds = [...client.guilds.cache.values()];

  log.info(`Bot is connected to ${guilds.length} servers!`);

  setInterval(async () => {
    dequeue();

    if (!getNextContributor()) {
      return;
    }

    const channel = getDirectMessageChannel(getNextContributor());

    await channel.send(
      "It's your turn! Use /story extend in the #llm channel!"
    );
  }, 120000);
})();
