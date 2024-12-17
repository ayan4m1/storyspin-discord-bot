import { Events, Message, MessageType, TextChannel } from 'discord.js';

import { queueTask } from '../modules/queue.js';
import { extendAnswer } from '../modules/llm.js';
import { getLogger } from '../modules/logging.js';
import { createUserEmbed } from '../modules/discord.js';
import { getMessageMapping, updateMessageMapping } from '../modules/cache.js';

const log = getLogger('reply');

export const eventHandlers = {
  [Events.MessageCreate]: async (message: Message) => {
    if (message.type !== MessageType.Reply) {
      return;
    }

    const messageMap = await getMessageMapping();

    if (!messageMap[message.id]) {
      return;
    }

    if (!message.channel.isTextBased()) {
      return;
    }

    const { id, author: user, member } = message;

    log.info(`User replied to message ${message.id}`);

    const contextId = messageMap[id];
    const result = await queueTask(extendAnswer(contextId, message.content));

    const reply = await (message.channel as TextChannel).send({
      embeds: [
        createUserEmbed(member, user, `**${prompt}**\n${result.response}`)
      ]
    });

    await updateMessageMapping(reply.id, result.id);
  }
};
