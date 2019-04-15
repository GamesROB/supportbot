const send = require('../modules/webhooksender')
const updateMessageByID = require('../../db/interfaces/postgres/update').updateMessageByID
const getMessage = require('../../db/interfaces/postgres/read').getMessageById

module.exports = {
  name: 'messageUpdate',
  type: 'on',
  handle: async (newMessage, oldMessage) => {
    if (!newMessage.channel.guild || !newMessage.author) return
    if (newMessage.author.id === global.bot.user.id) return
    const member = newMessage.channel.guild.members.get(newMessage.author.id)
    oldMessage = await getMessage(newMessage.id)
    if (!oldMessage) return
    if (newMessage.author.bot) {
      if (global.bot.global.guildSettingsCache[newMessage.channel.guild.id].isLogBots()) await processMessage(newMessage, oldMessage)
    } else if (newMessage.content !== oldMessage.content) {
      await processMessage(newMessage, oldMessage)
    }
    async function processMessage (newMessage, oldMessage) {
      const messageUpdateEvent = {
        guildID: newMessage.channel.guild.id,
        eventName: 'messageUpdate',
        embed: {
          author: {
            name: `${newMessage.author.username}#${newMessage.author.discriminator} ${member.nick ? `(${member.nick})` : ''}`,
            icon_url: newMessage.author.avatarURL
          },
          description: `**${newMessage.author.username}#${newMessage.author.discriminator}** ${member.nick ? `(${member.nick})` : ''} updated their message in: ${newMessage.channel.name}.`,
          fields: [{
            name: 'Channel',
            value: `<#${newMessage.channel.id}> (${newMessage.channel.name})\n[Go To Message](https://discordapp.com/channels/${newMessage.channel.guild.id}/${newMessage.channel.id}/${newMessage.id})`
          }, {
            name: 'Now',
            value: `${newMessage.cleanContent.replace(/\"/g, '"').replace(/`/g, '')}`
          }, {
            name: 'Previously',
            value: `${oldMessage.content.replace(/\"/g, '"').replace(/`/g, '')}`
          }, {
            name: 'ID',
            value: `\`\`\`ini\nUser = ${newMessage.author.id}\nMessage = ${newMessage.id}\`\`\``
          }],
          color: 15084269
        }
      }
      await send(messageUpdateEvent)
      await updateMessageByID(newMessage.id, newMessage.content)
    }
  }
}
