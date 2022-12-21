const sequelize = require('./db');
const {DataTypes} = require('sequelize')

const user = sequelize.define('user', {
        id: {type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true,},
        userId: {type: DataTypes.INTEGER, unique: true,},
        chatId: {type: DataTypes.INTEGER,},
        userName: {type: DataTypes.STRING,},
        recipientId: {type: DataTypes.INTEGER,},
        recipientName: {type: DataTypes.STRING, defaultValue: null},
    });
module.exports = user