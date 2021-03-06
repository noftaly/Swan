import Command from '../../structures/Command';
import { discordError } from '../../structures/messages';
import { toTimestamp } from '../../utils';
import Moderation from '../../structures/Moderation';
import SanctionManager from '../../structures/SanctionManager';

class Ban extends Command {
  constructor() {
    super('Ban');
    this.aliases = ['ban', 'sdb'];
    this.usage = 'ban <@mention | ID> <durée> [<raison>]';
    this.examples = ['ban @Uneo7 5j Mouahaha'];
    this.permissions = ['Staff'];
  }

  async execute(message, args) {
    const victim = SanctionManager.getMember(message, args[0]);
    if (!victim) return message.channel.send(discordError(this.config.missingUserArgument, message));
    if (!args[1]) return message.channel.send(discordError(this.config.missingTimeArgument, message));
    if (!args[2]) return message.channel.send(discordError(this.config.missingReasonArgument, message));
    if (victim.id === message.author.id) return message.channel.send(discordError(this.config.unableToSelfBan, message));
    if (victim.roles.highest.position >= message.member.roles.highest.position) return message.channel.send(discordError(this.config.userTooPowerful, message));

    const reason = args.splice(2).join(' ') || this.config.noReasonSpecified;
    const duration = toTimestamp(args[1]) === -1 ? -1 : toTimestamp(args[1]) / 1000;

    Moderation.ban(victim, reason, duration, message.author, this.config, message, message.guild);
  }
}

export default Ban;
