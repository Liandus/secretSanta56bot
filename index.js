const sequelize = require('./db');
const userModel = require('./models');
const { Op } = require('sequelize');

const DISTRIBUTION_DATE = new Date(2022, 11, 22, 0, 38, 0);
const DELAY = 10000;


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
            description: 'Приготовиться к игре!' 
        },
        {
            command: '/count',
            description: 'Посмотреть количество учаcтников' 
        },

    ])

    const userDistribution = async (users) => {
        let arr2 = users.sort(() => (Math.random() > .5) ? 1 : -1);

        let arr3 = arr2.reduce( (accumulator, currentValue, index, array) => {
        if (array.length === index+1) {
            accumulator.push(currentValue)
            accumulator.push(array[0])
            return accumulator
        }
        if ( index > 0 ) {
            if (accumulator?.length === 0) {
            accumulator.push(currentValue)
            return accumulator
            }
            accumulator.push(currentValue)
            return accumulator
        } 
        return accumulator
        }, [] );

        arr2.forEach(
        async(user, index) => {
            await userModel.update({ recipientId: arr3[index].userId, recipientName: arr3[index].userName}, {
            where: {
            userId: user.userId
            }
            });
            await bot.sendMessage(user.userId, `Привет ${user.userName}! твой адресат ${arr3[index].userName || arr3[index].userId}!`);
        }
        )
    }

    await userModel.update({ recipientId: null, recipientName: null}, {
        where: {
            userId: {
                        [Op.ne]: null
                    }
        }
    });

async function recurse () {
    const currentDate = new Date();
    if(currentDate < DISTRIBUTION_DATE) {
      setTimeout(() => { 
        recurse();
      }, DELAY);

    }
    else {
    const allUsersDb = await userModel.findAll({attributes: ['userId', 'userName']})
    const allUsersRaw = allUsersDb.map(user => user.dataValues);
    await userDistribution(allUsersRaw);
    }
}

recurse();

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
        if(player) {
            if(new Date() > DISTRIBUTION_DATE) {
                // const photos = await bot.getUserProfilePhotos(player.recipientId);
                // console.log(photos.photos[0][0].file_id);
                // await bot.sendPhoto(chatId, photos.photos[0][0].file_id)
                return bot.sendMessage(chatId, `${userName}, ты в игре! Твой адресат ${player.recipientName}`);
            } 
            await bot.sendMessage(chatId, `${userName}, ты в игре! Жди 25 декабря, я пришлю тебе адресата.`, gameContinueOptions);
        } else {
            await bot.sendMessage(chatId, 
                `Привет ${userName}! Ты собираешься стать тайным сантой! Нажми "Стать Сантой", чтобы записать себя в список участников игры. Ты можешь посмотреть своего адресата, когда список заполнится. Заявки принимаются до 25 декабря. Если передумал, можешь выйти из игры. 25 числа ты узнаешь своего адресата.`,
                gameStartOptions
                );
        }
            
    }

    if(text && text.includes('count')) {
        const allUsersDb = await userModel.findAll({attributes: ['userId', 'userName']})
        const count = allUsersDb.map(user => user.dataValues).length;
        return bot.sendMessage(chatId, `Всего участников в игре: ${count}`)    
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
                await bot.sendMessage(userId, `${userName}, твой адресат ${player.recipientName || player.recipientId}!`);
            } else  {
                await bot.sendMessage(userId, `${userName}, адресата еще нет!`);
            }
        } else {
            await bot.sendMessage(userId, `${userName}, не в игре!`);
        }
    }

    if (msg.data === 'out') {
        if(new Date() > DISTRIBUTION_DATE) {
        return bot.sendMessage(userId, `${userName}, Распределние закончено, ты не можешь покинуть игру!`);    
        }
        userModel.destroy({where: {userId}})
        return bot.sendMessage(userId, `${userName}, очень жаль!`);
    }
})

}

start();

