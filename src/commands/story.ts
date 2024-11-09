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
import {
  extendStory,
  loadContext,
  resetContext,
  saveContext,
  setContext
} from '../modules/llm.js';
import { createSystemEmbed, createUserEmbed } from '../modules/discord.js';
import { slugify } from '../utils/index.js';

const log = getLogger('story');

export const data = new SlashCommandBuilder()
  .setName('story')
  .setDescription('Manage the active story')
  .addSubcommand((subCmd) =>
    subCmd.setName('end').setDescription('Stops the current story')
  )
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

        await resetContext();
        await setContext(prompt);

        const result = await extendStory(prompt, 256);
        const textChannel = interaction.channel as TextChannel;
        const threadName = slugify(storyName);
        const thread = await textChannel.threads.create({
          name: threadName,
          autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
          reason: storyName
        });

        await thread.send({
          embeds: [
            createUserEmbed(member, user, prompt),
            createSystemEmbed(result)
          ]
        });
        break;
      }
      case 'extend': {
        if (user.id !== getNextContributor()) {
          return await interaction.editReply('Its not your turn!');
        }

        await interaction.editReply('Extending story...');

        const storyName = options.getString('story', true);
        const storyText = options.getString('text', true);
        const result = await extendStory(
          storyText,
          options.getNumber('tokens', false)
        );

        const textChannel = interaction.channel as TextChannel;
        const thread = textChannel.threads.resolve(slugify(storyName));

        await thread.send({
          embeds: [
            createUserEmbed(member, user, storyText),
            createSystemEmbed(result)
          ]
        });
        break;
      }
      case 'end':
        await resetContext();
        await interaction.editReply('Story ended!');
        await interaction.channel.send({
          embeds: [createSystemEmbed('Story ended!')]
        });
        break;
      case 'save': {
        const storyName = options.getString('name', true);

        await saveContext(storyName);
        await interaction.editReply('Saved!');
        await interaction.channel.send('The story has been saved!');
        break;
      }
      case 'load': {
        const storyName = options.getString('name', true);

        // todo: get chat history so we can reply it
        await loadContext(storyName);
        await interaction.editReply('Loaded!');
        await interaction.channel.send(
          `The story "${storyName}" has been loaded!`
        );
        break;
      }
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
