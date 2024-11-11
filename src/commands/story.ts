import {
  ChatInputCommandInteraction,
  GuildMember,
  SlashCommandBuilder,
  TextChannel,
  ThreadAutoArchiveDuration
} from 'discord.js';

import { discord as config } from '../modules/config.js';
import { getLogger } from '../modules/logging.js';
import { getNextContributor } from '../modules/queue.js';
import { beginStory, extendStory } from '../modules/llm.js';
import { createSystemEmbed, createUserEmbed } from '../modules/discord.js';
import { slugify } from '../utils/index.js';

const log = getLogger('story');

export const data = new SlashCommandBuilder()
  .setName('story')
  .setDescription('Manage the active story')
  .addSubcommand((subCmd) =>
    subCmd
      .setName('begin')
      .setDescription('Starts a story with a given name and prompt')
      .addStringOption((opt) =>
        opt
          .setName('name')
          .setDescription('Name of the story')
          .setRequired(true)
      )
      .addStringOption((opt) =>
        opt.setName('prompt').setDescription('World prompt').setRequired(true)
      )
  )
  .addSubcommand((subCmd) =>
    subCmd
      .setName('extend')
      .setDescription('Adds to the story')
      .addStringOption((opt) =>
        opt
          .setName('story')
          .setDescription('The story to extend')
          .setAutocomplete(true)
          .setRequired(true)
      )
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
    subCmd.setName('list').setDescription('Lists the saved stories')
  );

export const handler = async (interaction: ChatInputCommandInteraction) => {
  try {
    if (interaction.channel.id !== config.storyChannelId) {
      return await interaction.reply('Wrong channel!');
    }

    await interaction.deferReply({ ephemeral: true });

    const { options, user } = interaction;
    const member = interaction.member as GuildMember;
    const subCmd = options.getSubcommand(true);

    switch (subCmd) {
      case 'begin': {
        const storyName = options.getString('name', true);
        const prompt = options.getString('prompt', true);

        await interaction.editReply(`Starting "${storyName}"...`);

        const story = await beginStory(prompt);
        const textChannel = interaction.channel as TextChannel;
        const threadName = slugify(storyName);
        const thread = await textChannel.threads.create({
          name: threadName,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
          reason: storyName
        });

        await thread.send({
          embeds: [
            createUserEmbed(member, user, prompt),
            createSystemEmbed(story.response)
          ]
        });
        break;
      }
      case 'extend': {
        if (user.id !== getNextContributor()) {
          return await interaction.editReply('Its not your turn!');
        }

        const storyName = options.getString('story', true);
        const storyText = options.getString('text', true);

        await interaction.editReply(`Extending "${storyName}"...`);

        const result = await extendStory(
          storyName,
          storyText,
          options.getNumber('tokens', false)
        );
        const textChannel = interaction.channel as TextChannel;
        const thread = textChannel.threads.resolve(slugify(storyName));

        await thread.send({
          embeds: [
            createUserEmbed(member, user, storyText),
            createSystemEmbed(result.response)
          ]
        });
        break;
      }
      case 'end':
      case 'list':
        await interaction.editReply('To be implemented!');
        break;
      default:
        await interaction.editReply('Unknown subcommand!');
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
