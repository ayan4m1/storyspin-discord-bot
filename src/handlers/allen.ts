import { Events, Message, TextChannel } from 'discord.js';

import { discord as config } from '../modules/config.js';
import { answerAllen } from '../modules/llm.js';
import { getLogger } from '../modules/logging.js';

const log = getLogger('allen');

export const eventHandlers = {
  [Events.MessageCreate]: async (message: Message) => {
    if (
      !message.channel.isTextBased() ||
      message.author.id !== config.allenUserId
    ) {
      return;
    }

    const textChannel = message.channel as TextChannel;

    await textChannel.sendTyping();

    const response = await answerAllen(message.content);

    log.info(`Responding to Allen with: ${response.response}`);
    await textChannel.send({
      content: response.response,
      reply: {
        messageReference: message.id
      }
    });
  }
};
