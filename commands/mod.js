const toolkit = require('../toolkit.js');

module.exports.run = async (client, msg, args) => {

    if(!msg.member.hasPermission('KICK_MEMBERS')) {
        return msg.channel.send("Mere mortal is trying to access godly commands pfft smh shoo");
    }

    client.indicators.usingCommand.push(msg.author.id);
    function removeID() {
        client.indicators.usingCommand = client.indicators.usingCommand.filter(user => user != msg.author.id)
    }

    switch(args[0]) {
        case 'strike': 
            await addStrike(client, msg, args);
            removeID();
            break;
        case 'unstrike': 
            await removeStrike(client, msg, args);
            removeID();
            break;
        case 'strikes':
            await checkStrikes(client, msg, args);
            removeID();
            break;
        case 'mute': 
            await mute(client, msg, args);
            removeID();
            break;
        case 'clear': 
            await clearChat(client, msg, args);
            removeID();
            break;
        default: 
            await msg.channel.send(`That was an invalid argument. Try again smh <@${msg.author.id}>`)
            removeID();
            return;
    }
}

async function clearChat(client, msg, args) {
    if(parseInt(args[1])) {
        if(parseInt(args[1]) > 30) return msg.channel.send('30 messages at a time pls :)');
        if(parseInt(args[1]) < 0) return msg.channel.send('delete a negative number of messages tf?');
        await msg.channel.bulkDelete(parseInt(args[1]));
    } else msg.channel.send('\'mod clear <number of messages>\' you gotta # of msgs pls')
}

// * strike series
async function addStrike(client, msg, args) {

    // ! strikes needed to get banned/kicked
    var maxStrikes = 20;

    if(!args[1]) return msg.channel.send('uhhh should mention which user to strike like its pretty fking obv lmaooo');
    if(msg.mentions.members.size < 1) return msg.channel.send('you gotta @ the person u wanna strike try again');
    var inc = 1/2;
    await toolkit.db.update.one(
        client, client.models.member,
        {_id: msg.mentions.members.firstKey()}, {$inc : {'strikes' : inc}, lastStrike: new Date()}, 
        true, false,
        (err) => {msg.channel.send('For some reason, could not increment strike in the database wowow pls contact program dude ;-;')},
        (doc) => {
            const strikes = doc.strikes + inc;
            var member = msg.mentions.members.first();
            var responses = client.cache.guilds.get(msg.guild.id).responses;
            if(strikes >= maxStrikes) {
                var kickResponse = responses.kick[Math.floor(Math.random() * responses.kick.length)] 
                    ? responses.kick[Math.floor(Math.random() * responses.kick.length)]
                    : `**${member.nickname ? member.nickname : member.user.username}** has been kicked!`;
                kickResponse = kickResponse.replace('<user>', `**${member.nickname ? member.nickname : member.user.username}**`);
                member.kick(`Reached ${maxStrikes} strikes.`);
                msg.channel.send(kickResponse);
                msg.channel.send(`Automatically kicked ${member.user.username} for accumulating too many strikes.`);
            }
            // custom message
            var strikeResponse = responses.strike[Math.floor(Math.random() * responses.strike.length)]
                ? responses.strike[Math.floor(Math.random() * responses.strike.length)]
                : `**${member.nickname ? member.nickname : member.user.username}** has **${strikes}** strike${strikes == 1 ? '' : 's'}`;
            strikeResponse = strikeResponse.replace('<user>', `**${member.nickname ? member.nickname : member.user.username}**`);
            msg.channel.send(strikeResponse);
            msg.channel.send(`Total strikes: **${strikes}**`);
            // msg.channel.send(`**${member.nickname ? member.nickname : member.user.username}** has **${strikes}** strike${strikes == 1 ? '' : 's'}`);
        }
    );
}
async function removeStrike(client, msg, args) {

    if(!args[1]) return msg.channel.send('What member would you like to remove a strike from');
    if(msg.mentions.members.size < 1) return msg.channel.send('uhh you gotta @ the person u wanna remove strike from try again');
    var inc = 1/2;
    await toolkit.db.update.one(
        client, client.models.member,
        {_id: msg.mentions.members.firstKey()}, {$inc : {'strikes' : -inc}}, 
        true, false,
        (err) => {msg.channel.send('For some reason, could not decrement strike in the database wowow pls contact program dude ;-;')},
        (doc) => {
            const strikes = doc.strikes - inc;
            msg.channel.send(`Removed a strike (Total Strikes: ${strikes})`); 
        }
    );
}
async function checkStrikes(client, msg, args) {
    if(msg.mentions.members.size < 1) return msg.channel.send('please mention the person you wanna check the strikes of');
    await client.models.member.find({_id: msg.mentions.members.firstKey()}, async (err, docs) => {
        if(err) return msg.channel.send('Could not check the strikes OO this isnt good pls contact nerd to fix');
        if(docs) {
            var strikes = docs[0].strikes;
            if(strikes == 0) return msg.channel.send(`No strikes mm who's a good boy :)`);
            if(strikes > 0 && strikes < 3) return msg.channel.send(`This dude got ${strikes} strike(s) oof`);
            if(strikes >= 3) return msg.channel.send(`(Strikes: ${strikes}) Ok how is this person still here tf contact admin.`);
        }
    })
}

module.exports.info = {
    name: 'mod'
}