const sequelize = require('./db');
const userModel = require('./models');
const { Op } = require('sequelize');

const DISTRIBUTION_DATE = new Date(2022, 11, 25, 10, 0, 0);
const DELAY = 3600000;


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

const buttonEditWish = [
                    [{text: 'Редактировать вишлист', callback_data: 'edit'}],
                ];

const buttonContinue = [
                    [{text: 'Посмотреть адресата', callback_data: 'recipient'}],
                    [{text: 'Посмотреть вишлист адресата', callback_data: 'recWish'}],
                    [{text: 'Мой вишлист', callback_data: 'userWish'}],
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

const gameEditOptions = {
    reply_markup: JSON.stringify(
        {
            inline_keyboard: buttonEditWish
        }
    )
}

const sendMessage = async (id, message, buttons) => {
    try {
        await bot.sendMessage(id, message, buttons)
    } catch (error) {
     console.log(error, '!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');   
    }
}


const start = async () => {
    try {
        await sequelize.authenticate();
        //await sequelize.drop();
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
        }
        if ( index > 0 ) {
            accumulator.push(currentValue)
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
                await sendMessage(user.userId, `Привет ${user.userName}! твой адресат ${arr3[index].userName || arr3[index].userId}!`)
        }
        )
    }

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
        const firstName = msg.from.first_name;

        if(text && text.includes('start') && type.includes('group')) {
            try {
                const player = await userModel.findOne({where: {userId: userId}})
                console.log(player);
                if(player) {
                    if(player.recipientId) {
                           await bot.sendMessage(userId, `${userName || firstName}, ты в игре! Твой адресат ${player.recipientName}`, gameContinueOptions);
                        } else {
                            await bot.sendMessage(userId, `Привет ${userName || firstName}! Жди адресата!`);
                        }
                } else {
                    await bot.sendMessage(userId, 
                    `Привет ${userName || firstName}! Ты собираешься стать тайным сантой! Нажми "Стать Сантой", чтобы записать себя в список участников игры. Ты можешь посмотреть своего адресата, когда список заполнится. Заявки принимаются до 25 декабря. Если передумал, можешь выйти из игры. 25 числа ты узнаешь своего адресата.`,
                    gameStartOptions
                    );
                }
            } catch (error) {
                await bot.sendMessage(chatId, `Ты собираешься стать тайным сантой 56, для начала подружись с ботом!`, requestOptions);
            }
        }

        if(text && text.includes('Вишлист:') && type === 'private') {
            const player = await userModel.findOne({where: {userId: userId}})
            if(player) {
                await userModel.update({ wishList: text,}, {where: {userId: userId}});
                return sendMessage(chatId, `${userName || firstName}, я сохранил твой вишлист!`);
            }
        }

        if(text && text.includes('start') && type === 'private') {
            const player = await userModel.findOne({where: {userId: userId}})
            if(player) {
                if(new Date() > DISTRIBUTION_DATE) {
                        return sendMessage(chatId, `${userName || firstName}, ты в игре! Твой адресат ${player.recipientName}`, gameContinueOptions);
                } 
                await sendMessage(chatId, `${userName || firstName}, ты в игре! Жди 25 декабря, я пришлю тебе адресата.`, gameContinueOptions);
            } else {
                await sendMessage(chatId, 
                    `Привет ${userName || firstName}! Ты собираешься стать тайным сантой! Нажми "Стать Сантой", чтобы записать себя в список участников игры. Ты можешь посмотреть своего адресата, когда список заполнится. Заявки принимаются до 25 декабря. Если передумал, можешь выйти из игры. 25 числа ты узнаешь своего адресата.`,
                    gameStartOptions
                    );
            }
                
        }

        if(text && text.includes('count')) {
            const allUsersDb = await userModel.findAll({attributes: ['userId', 'userName']})
            const count = allUsersDb.map(user => user.dataValues).length;
            return sendMessage(chatId, `Всего участников в игре: ${count}`)    
        }
    })

    bot.on('callback_query', async msg => {
        const text = msg.text;
        const chatId = msg.message.chat.id;
        const userName = msg.from.username; 
        const userId = msg.from.id;
        const firstName = msg.from.first_name;
        const player = await userModel.findOne({where: {userId}})
        if (msg.data === 'go') {
            if(player) {
                await sendMessage(userId, `${userName || firstName}, ты уже записался!`);
        
            } else {
                await userModel.create({
                                userId,
                                chatId,
                                userName,
                                })
            }
            await sendMessage(chatId, `${userName || firstName}, ты в игре! Жди 25 декабря, я пришлю тебе адресата.`, gameContinueOptions);
        }

        if (msg.data === 'recipient') {
            if(player) {
                if(player.recipientId) {
                    await sendMessage(userId, `${userName || firstName}, твой адресат ${player.recipientName || player.recipientId}!`);
                } else  {
                    await sendMessage(userId, `${userName || firstName}, адресата еще нет!`);
                }
            } else {
                await sendMessage(userId, `${userName || firstName}, не в игре!`);
            }
        }

        if (msg.data === 'out') {
            if(new Date() > DISTRIBUTION_DATE) {
            return sendMessage(userId, `${userName || firstName}, Распределние закончено, ты не можешь покинуть игру! Иначе кто-то останется без подарка!`);    
            }
            userModel.destroy({where: {userId}})
            return sendMessage(userId, `${userName || firstName} , очень жаль!`);
        }

        if (msg.data === 'recWish') {
            if(player) {
                if(player.recipientId) {
                    const recipient = await userModel.findOne({where: {userId: player.recipientId}})
                    if (recipient.wishList) {
                        await sendMessage(userId, `${userName || firstName}, держи вишлист адресата ${player.recipientName || player.recipientId}: ${recipient.wishList}`);    
                    } else {
                        await sendMessage(userId, `${userName || firstName}, у твоего адресата ${player.recipientName || player.recipientId} еще нет вишлиста!`);
                    }
                } else  {
                    await sendMessage(userId, `${userName || firstName}, адресата еще нет!`);
                }
            } else {
                await sendMessage(userId, `${userName || firstName}, не в игре!`);
            }
        }

        if (msg.data === 'userWish') {
            if(player) {
                if(player.wishList) {
                    await sendMessage(userId, `${userName || firstName}, вот твой ${player.wishList}`, gameEditOptions);    
                } else {
                    await sendMessage(userId, `${userName || firstName}, У тебя нет вишлиста!`, gameEditOptions);
                }
            } else {
                await sendMessage(userId, `${userName || firstName}, не в игре!`);
            }
        }

        if (msg.data === 'edit') {
            if(player) {
                await sendMessage(userId, `${userName || firstName}, чтобы добавить свой список подарков, отправь его в своем в следующем сообщении, начиная со слов "Вишлист:", иначе я тебя не пойму!`);
            } else {
                await sendMessage(userId, `${userName || firstName}, не в игре!`);
            }
        }
    })

}

 start();   


