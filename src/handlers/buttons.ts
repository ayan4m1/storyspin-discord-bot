import {
  AutocompleteInteraction,
  ButtonInteraction,
  Events,
  Interaction
} from 'discord.js';

import { extendAnswer } from '../modules/llm.js';
import { getLogger } from '../modules/logging.js';
import { enqueueContributor } from '../modules/cache.js';
import { createSystemEmbed } from '../modules/discord.js';

const log = getLogger('handler');

const handleButton = async (interaction: ButtonInteraction) => {
  try {
    // todo: destructure "member, user" here
    const { customId } = interaction;
    const [verb, uuid] = customId.split(/:/);

    await interaction.deferReply();

    if (!verb || !uuid) {
      throw new Error('Invalid verb/uuid/parameter!');
    }

    switch (verb) {
      case 'extend': {
        const result = await extendAnswer(uuid);

        await interaction.channel.send({
          embeds: [createSystemEmbed(result.response)]
        });
        await interaction.editReply('Extended!');
        break;
      }
      case 'queue':
        enqueueContributor(interaction.channelId, interaction.user.id);
        await interaction.editReply('Queued!');
        break;
    }
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
    if (interaction.deferred || interaction.replied) {
      await interaction.editReply('Failed to respond to button click...');
    } else {
      await interaction.reply('Failed to respond to button click...');
    }
  }
};

const handleAutocomplete = async (interaction: AutocompleteInteraction) => {
  try {
    // if (interaction.commandName === 'story') {
    //   const stories = await getStoryMapping();
    //   await interaction.respond(
    //     Object.entries(stories).map(([id, name]) => ({
    //       name: name,
    //       value: id
    //     }))
    //   );
    // }
  } catch (error) {
    log.error(error.message);
    log.error(error.stack);
    if (!interaction.responded) {
      await interaction.respond([]);
    }
  }
};

export const eventHandlers = {
  [Events.InteractionCreate]: async (interaction: Interaction) => {
    if (interaction.isButton()) {
      return handleButton(interaction);
    } else if (interaction.isAutocomplete()) {
      return handleAutocomplete(interaction);
    }
  }
};
