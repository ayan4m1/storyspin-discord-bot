import { SlashCommandBuilder } from 'discord.js';

import { getLogger } from '../modules/logging.js';
import { extendStory } from '../modules/llm.js';

const log = getLogger('story');

export const data = new SlashCommandBuilder()
  .setName('story')
  .setDescription('Manage the active story')
  .addSubcommand((subCmd) =>
    subCmd
      .setName('reset')
      .setDescription('Resets the context of the active story')
  )
  .addSubcommand((subCmd) =>
    subCmd
      .setName('set-context')
      .setDescription('Sets the story context')
      .addStringOption((opt) =>
        opt
          .setName('context')
          .setDescription('Context to add')
          .setRequired(true)
      )
  );

export const handler = async (interaction) => {
  try {
    await interaction.deferReply();

    const { options } = interaction;
    const subCmd = options.getSubcommand(true);

    console.dir(subCmd);

    if (subCmd === 'set-context') {
      const result = await extendStory(options.getString('context', true));

      await interaction.editReply(result.responseText);
    }
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Failed to modify story...');
    } else {
      await interaction.reply('Failed to modify story...');
    }
  }
};
