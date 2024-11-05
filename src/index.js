import { discord as config } from './modules/config.js';
import {
  connectBot,
  syncCommands,
  getDirectMessageChannel,
  registerCommandsAndHandlers
} from './modules/discord.js';
import { getLogger } from './modules/logging.js';
import { advanceContributors, getNextContributor } from './modules/queue.js';

const log = getLogger('index');

(async () => {
  await syncCommands();
  await registerCommandsAndHandlers();

  const client = await connectBot();
  const guilds = [...client.guilds.cache.values()];

  log.info(`Bot is connected to ${guilds.length} servers!`);

  setInterval(async () => {
    advanceContributors();

    if (!getNextContributor()) {
      return;
    }

    const dmChannel = await getDirectMessageChannel(getNextContributor());

    await dmChannel.send(
      `It's your turn! Use /story extend in the <#${config.storyChannelId}> channel!`
    );
  }, 120000);
})();
