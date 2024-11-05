import { EmbedBuilder, SlashCommandBuilder } from 'discord.js';

import { getLogger } from '../modules/logging.js';
import { getContributorColor, getNextContributor } from '../modules/queue.js';
import { extendStory, resetContext, setContext } from '../modules/llm.js';

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
      .addIntegerOption((opt) =>
        opt
          .setName('tokens')
          .setDescription('Amount of text to generate')
          .setMinValue(32)
          .setMaxValue(1024)
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
      case 'set-context': {
        const context = options.getString('context', true);

        await setContext(context);
        await interaction.editReply('Initialized world!');
        await interaction.channel.send(
          new EmbedBuilder({
            author: {
              name: interaction.member.nickname ?? interaction.user.username
            },
            color: getContributorColor(interaction.user.id),
            description: context
          })
        );
        break;
      }
      case 'extend': {
        if (user.id !== getNextContributor()) {
          return await interaction.editReply('Its not your turn!');
        }

        const storyText = options.getString('text', true);
        const result = await extendStory(
          storyText,
          options.getNumber('tokens', false)
        );

        await interaction.editReply(
          new EmbedBuilder({
            author: {
              name: interaction.member.nickname ?? interaction.user.username
            },
            color: getContributorColor(interaction.user.id),
            description: storyText
          })
        );
        await interaction.channel.send(
          new EmbedBuilder({
            author: {
              name: 'StorySpin',
              icon_url:
                'https://cdn.discordapp.com/app-icons/1303161150363537508/3cccf7b784a89c14f6e475387cf5e1d1.png?size=512'
            },
            color: '#2e9fe7',
            description: result.responseText
          })
        );
        break;
      }
      case 'reset':
        await resetContext();
        await interaction.editReply('Reset story!');
        break;
      case 'save':
      case 'load':
      default:
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
