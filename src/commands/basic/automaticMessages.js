import Command from '../../structures/Command';
import { discordError } from '../../structures/messages';
import { config } from '../../main';
import { uncapitalize, jkDistance } from '../../utils';

const reactionsNumbers = ['1⃣', '2⃣', '3⃣', '4⃣', '5⃣', '6⃣', '7⃣', '8⃣', '9⃣', '🔟'];

class AutomaticMessages extends Command {
  constructor() {
    super('Automatic Messages');
    this.aliases = ['automaticmessage', 'automaticmessages', 'automsg', 'auto_msg', 'auto-msg', 'auto'];
    this.usage = 'automsg <nom du message>';
    this.examples = ['automsg asktoask'];
  }

  async execute(message, args) {
    const arg = args.join(' ');
    const { messages } = this.config;

    if (args.length === 0) {
      const allMessages = Object.keys(this.config.messages).join(', ');
      message.channel.send(discordError(this.config.noArg.replace('%s', `\`${allMessages}\``), message));
      return;
    }

    for (const autoMessage of Object.values(messages)) {
      if (autoMessage.templates.some(elt => elt === arg || `${elt}-pv` === arg)) {
        if (arg.includes('-pv') && autoMessage.pvContent) {
          try {
            for (const chunk of autoMessage.pvContent) await message.member.send(chunk);
            message.react('✅').catch(console.error);
          } catch (e) {
            message.react('❌').catch(console.error);
            message.reply(config.messages.errors.privatemessage);
          }
        } else {
          message.channel.send(autoMessage.content);
        }
        return;
      }
    }

    const matches = [];

    for (const msg of Object.values(messages)) {
      for (const elt of msg.templates) {
        if (jkDistance(arg, elt) >= this.config.similarity) matches.push(elt);
        break;
      }
    }

    if (matches.length === 0) {
      const errorMsg = await message.channel.send(discordError(this.config.invalidMessage, message));
      errorMsg.delete({ timeout: 10000 });
    } else {
      const messagesList = matches.map(elt => uncapitalize(elt.replace(/ /g, ''))).join('`, `.automsg ');
      const suggestion = await message.channel.send(this.config.cmdSuggestion.replace('%c', args.join('')).replace('%m', messagesList));

      if (matches.length === 1) suggestion.react('✅');
      else for (let i = 0; i < reactionsNumbers.length && i < matches.length; i++) await suggestion.react(reactionsNumbers[i]);

      const collector = suggestion
        .createReactionCollector((reaction, user) => !user.bot
            && user.id === message.author.id
            && (reaction.emoji.name === '✅' || reactionsNumbers.includes(reaction.emoji.name)))
        .once('collect', (reaction) => {
          collector.stop();
          suggestion.delete();
          const index = reaction.emoji.name === '✅' ? 0 : reactionsNumbers.indexOf(reaction.emoji.name);
          return this.execute(message, [matches[index]]);
        });
    }
  }
}

export default AutomaticMessages;
