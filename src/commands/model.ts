import { filesize } from 'filesize';
import {
  ChatInputCommandInteraction,
  EmbedBuilder,
  SlashCommandBuilder
} from 'discord.js';

import { changeModel, getActiveModel, listModels } from '../modules/llm.js';
import { getLogger } from '../modules/logging.js';

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

  await interaction.deferReply({ ephemeral: true });

  switch (subcommand) {
    case 'list': {
      const activeModel = getActiveModel();
      const models = await listModels();

      const modelList = models.map(({ name, size }) => ({
        name: name === activeModel ? `**${name}**` : name,
        value: filesize(size, { round: 0 })
      }));

      await interaction.editReply({
        embeds: [
          new EmbedBuilder({
            description: `There are ${models.length} total models cached (active model is in bold).`,
            fields: modelList
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
