import {
  ButtonInteraction,
  Events,
  GuildMember,
  Interaction
} from 'discord.js';

import { getLogger } from '../modules/logging.js';
import { queueTask } from '../modules/queue.js';
import { extendAnswer } from '../modules/llm.js';
import { createUserEmbed } from '../modules/discord.js';

const log = getLogger('buttons');

export const eventHandlers = {
  [Events.InteractionCreate]: async (interaction: Interaction) => {
    if (!(interaction instanceof ButtonInteraction)) {
      return;
    }

    const buttonInteraction = interaction as ButtonInteraction;

    await buttonInteraction.deferReply();

    const { member, user, customId } = buttonInteraction;

    if (!(member instanceof GuildMember)) {
      return;
    }

    log.info(`Handling button click with ID ${customId}`);

    const idSegments = customId.split(':');
    const [verb] = idSegments;

    switch (verb) {
      case 'extend': {
        const [, id] = idSegments;
        const result = await queueTask(
          extendAnswer(id, 'Continue where you left off.', 256)
        );

        await buttonInteraction.editReply({
          embeds: [
            createUserEmbed(member, user, `**${prompt}**\n${result.response}`)
          ]
        });
        break;
      }
      case 'queue': {
        // todo: this
        break;
      }
      default:
        await buttonInteraction.editReply({
          content: 'Unknown button clicked!'
        });
        break;
    }
  }
};
