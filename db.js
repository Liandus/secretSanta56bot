const {Sequelize,} = require('sequelize');
module.exports = new Sequelize('telega56', 'root', 'root', {host: '46.148.239.235', port: '6432', dialect: 'postgres'})