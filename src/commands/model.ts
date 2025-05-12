import { filesize } from 'filesize';
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  MessageFlags,
  SlashCommandBuilder
} from 'discord.js';

import { getLogger } from '../modules/logging.js';
import { changeModel, listModels } from '../modules/llm.js';

const log = getLogger('model');

export const data = new SlashCommandBuilder()
  .setName('model')
  .setDescription('Inspect or modify the LLM settings')
  .addSubcommand((cmd) =>
    cmd.setName('list').setDescription('List the active and available models')
  )
  .addSubcommand((cmd) =>
    cmd
      .setName('change')
      .setDescription('Changes the active model')
      .addStringOption((opt) =>
        opt
          .setName('model')
          .setDescription('The new model to use')
          .setRequired(true)
      )
  );

export const handler = async (interaction: ChatInputCommandInteraction) => {
  const { options } = interaction;
  const subcommand = options.getSubcommand(true);

  await interaction.deferReply({ flags: [MessageFlags.Ephemeral] });

  switch (subcommand) {
    case 'list': {
      const models = await listModels();
      const fields = models.map(({ id, name, size, vram }) => ({
        name: `${name} (${id})`,
        value: `Size: ${filesize(size, { round: 0 })} VRAM: ${filesize(vram, { exponent: 3, round: 0 })}`
      }));

      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            description: `There are ${models.length} total models cached.`,
            fields: fields
          })
        ]
      });
      break;
    }
    case 'change':
      try {
        const newModel = options.getString('model', true);

        await interaction.editReply(`:hourglass: Loading ${newModel}...`);
        await changeModel(newModel);
        await interaction.editReply(`:white_check_mark: ${newModel} loaded!`);
      } catch (error) {
        log.error(error.message);
        log.error(error.stack);
        await interaction.editReply(':x: Failed to load new model!');
      }
      break;
  }
};
