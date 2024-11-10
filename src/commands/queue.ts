import { SlashCommandBuilder } from 'discord.js';

import { getLogger } from '../modules/logging.js';
import { queueUser } from '../modules/queue.js';
import { getValue } from '../modules/cache.js';

const log = getLogger('queue');

export const data = new SlashCommandBuilder()
  .setName('queue')
  .setDescription('Add yourself to the story queue');

export const handler = async (interaction) => {
  try {
    const queue = await getValue('test');

    console.dir(queue);

    const position = queueUser(interaction.user.id);

    if (position === -1) {
      await interaction.reply(`You are already in the queue!`);
    } else {
      await interaction.reply(`You are now #${position} in the queue!`);
    }
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Failed to queue...');
    } else {
      await interaction.reply('Failed to queue...');
    }
  }
};
