const TelegramApi = require('node-telegram-bot-api');
const TOKEN = '5876855739:AAHX3LHy1aeOKkkl-FNX6dhlC98BsXF9Jd0';

const players =  [
    // {
    //     userId: 93753787,
    //     chatId: -896503131,
    //     userName: 'tvistept',
    //     recipientId: 12242525,
    //     recipientName: 'pizda',
    // }
]

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
    const user = msg.from.username; 
    const userId = msg.from.id; 

    if(text && text.includes('start') && type === 'group') {
        try {
            await bot.sendMessage(userId, `Привет ${user}! Жди адресата!`);
        } catch (error) {
            await bot.sendMessage(chatId, `Ты собираешься стать тайным сантой 56, для начала подружись с ботом!`, requestOptions);
        }
    }

    if(text && text.includes('start') && type === 'private') {
        if(players.find(player => player.userId === userId)) {
            await bot.sendMessage(chatId, `${user}, ты в игре! Жди 25 декабря, я пришлю тебе адресата.`, gameContinueOptions);
        } else {
            await bot.sendMessage(chatId, 
                `Привет ${user}! Ты собираешься стать тайным сантой! Нажми "Стать Сантой", чтобы записать себя в список участников игры. Ты можешь посмотреть своего адресата, когда список заполнится. Заявки принимаются до 25 декабря. Если передумал, можешь выйти из игры. 25 числа ты узнаешь своего адресата.`,
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
    if (msg.data === 'go') {
        if(players.find(player => player.userId === userId)) {
            await bot.sendMessage(userId, `${userName}, ты уже записался!`);
    
        } else {
            players.push(
                {
                    userId,
                    chatId,
                    userName,
                }
            )
        }
        await bot.sendMessage(chatId, `${userName}, ты в игре! Жди 25 декабря, я пришлю тебе адресата.`, gameContinueOptions);
    }

    if (msg.data === 'recipient') {
        const player = players.find(player => player.userId === userId);
        if(player) {
            if(player?.recipientId) {
                await bot.sendMessage(userId, `${userName}, твой адресат ${player.recipientName}!`);
            } else  {
                await bot.sendMessage(userId, `${userName}, адресата еще нет!`);
            }
        } else {
            await bot.sendMessage(userId, `${userName}, не в игре!`);
        }
    }

    if (msg.data === 'out') {
        const index = players.findIndex(player => {
            player.userId === userId
        })
        players.splice(index, 1)
        return bot.sendMessage(userId, `${userName}, очень жаль!`);
    }
})

