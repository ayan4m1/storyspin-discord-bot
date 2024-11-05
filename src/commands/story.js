import { SlashCommandBuilder } from 'discord.js';

import { getLogger } from '../modules/logging.js';
import { extendStory, resetContext, setContext } from '../modules/llm.js';
import { nextContributor } from '../modules/queue.js';

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
      .setDescription('Sets the story context (world building)')
      .addStringOption((opt) =>
        opt
          .setName('context')
          .setDescription('Context to set')
          .setRequired(true)
      )
  )
  .addSubcommand((subCmd) =>
    subCmd
      .setName('extend')
      .setDescription('Adds to the story')
      .addStringOption((opt) =>
        opt
          .setName('text')
          .setDescription('Text to add to the story')
          .setRequired(true)
      )
  )
  .addSubcommand((subCmd) =>
    subCmd
      .setName('save')
      .setDescription('Saves the current story')
      .addStringOption((opt) =>
        opt.setName('name').setDescription('The story name').setRequired(true)
      )
  )
  .addSubcommand((subCmd) =>
    subCmd
      .setName('load')
      .setDescription('Loads a saved story')
      .addStringOption((opt) =>
        opt.setName('name').setDescription('The story name').setRequired(true)
      )
  )
  .addSubcommand((subCmd) =>
    subCmd.setName('list').setDescription('Lists the saved stories')
  );

export const handler = async (interaction) => {
  try {
    await interaction.deferReply();

    const { options, user } = interaction;
    const subCmd = options.getSubcommand(true);

    switch (subCmd) {
      case 'set-context':
        await setContext(options.getString('context', true));
        await interaction.editReply('Overwrote context!');
        break;
      case 'extend': {
        if (user.id !== nextContributor) {
          return await interaction.editReply('Its not your turn!');
        }

        const result = await extendStory(options.getString('text', true));

        await interaction.editReply(result.responseText);
        break;
      }
      case 'reset':
        await resetContext();
        await interaction.editReply('Reset story!');
        break;
      case 'save':
        // todo: this
        await interaction.editReply('To be implemented!');
        break;
      case 'load':
        // todo: this
        await interaction.editReply('To be implemented!');
        break;
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
