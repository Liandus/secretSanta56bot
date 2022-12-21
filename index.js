const sequelize = require('./db');
const userModel = require('./models');

const TelegramApi = require('node-telegram-bot-api');
const TOKEN = '5876855739:AAHX3LHy1aeOKkkl-FNX6dhlC98BsXF9Jd0';


const bot = new TelegramApi(TOKEN, {polling: true});

const requestOptions = {
    reply_markup: JSON.stringify(
        {
            inline_keyboard: [
                [{text: 'Начать чат', url: 'https://t.me/secretSanta56_bot'}],
            ]
        }
    )
}

const buttonStart = [
                    [{text: 'Стать Сантой!', callback_data: 'go'}],
                ];
const buttonContinue = [
                    [{text: 'Посмотреть адресата', callback_data: 'recipient'}],
                    [{text: 'Выйти из игры', callback_data: 'out'}],
                ];

const gameStartOptions = {
    reply_markup: JSON.stringify(
        {
            inline_keyboard: buttonStart
        }
    )
}

const gameContinueOptions = {
    reply_markup: JSON.stringify(
        {
            inline_keyboard: buttonContinue
        }
    )
}

const start = async () => {
    try {
        await sequelize.authenticate();
        await sequelize.sync();
    } catch (error) {
        console.log('ошибка подключения к базе');
    }
    bot.setMyCommands(
    [
        {
            command: '/start',
            description: 'Принять участие в жеребьевке' 
        },
        {
            command: '/count',
            description: 'Посмотреть количество учаcтников' 
        },

    ])


bot.on('message',async (msg) => {

    const text = msg.text;
    const chatId = msg.chat.id;
    const type = msg.chat.type;
    const userName = msg.from.username; 
    const userId = msg.from.id; 

    if(text && text.includes('start') && type === 'group') {
        try {
            await bot.sendMessage(userId, `Привет ${userName}! Жди адресата!`);
        } catch (error) {
            await bot.sendMessage(chatId, `Ты собираешься стать тайным сантой 56, для начала подружись с ботом!`, requestOptions);
        }
    }

    if(text && text.includes('start') && type === 'private') {
        const player = await userModel.findOne({where: {userId: userId}})
        console.log(player);
        if(player) {
            await bot.sendMessage(chatId, `${userName}, ты в игре! Жди 25 декабря, я пришлю тебе адресата.`, gameContinueOptions);
        } else {
            await bot.sendMessage(chatId, 
                `Привет ${userName}! Ты собираешься стать тайным сантой! Нажми "Стать Сантой", чтобы записать себя в список участников игры. Ты можешь посмотреть своего адресата, когда список заполнится. Заявки принимаются до 25 декабря. Если передумал, можешь выйти из игры. 25 числа ты узнаешь своего адресата.`,
                gameStartOptions
                );
        }
            
    }
})

bot.on('callback_query', async msg => {
    const text = msg.text;
    const chatId = msg.message.chat.id;
    const userName = msg.from.username; 
    const userId = msg.from.id;
    const player = await userModel.findOne({where: {userId}})
    console.log(player);
    if (msg.data === 'go') {
        if(player) {
            await bot.sendMessage(userId, `${userName}, ты уже записался!`);
    
        } else {
            await userModel.create({
                            userId,
                            chatId,
                            userName,
                            })
        }
        await bot.sendMessage(chatId, `${userName}, ты в игре! Жди 25 декабря, я пришлю тебе адресата.`, gameContinueOptions);
    }

    if (msg.data === 'recipient') {
        if(player) {
            if(player.recipientId) {
                await bot.sendMessage(userId, `${userName}, твой адресат ${player.recipientName}!`);
            } else  {
                await bot.sendMessage(userId, `${userName}, адресата еще нет!`);
            }
        } else {
            await bot.sendMessage(userId, `${userName}, не в игре!`);
        }
    }

    if (msg.data === 'out') {
        userModel.destroy({where: {userId}})
        return bot.sendMessage(userId, `${userName}, очень жаль!`);
    }
})

}

start();

