const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connect');

const Usuario = sequelize.define('Usuario', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  username: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  email: {
    type: DataTypes.STRING,
    allowNull: false,
    unique: true,
  },
  senha: {
    type: DataTypes.STRING,
    allowNull: true,
  },
  tipo: {
    type: DataTypes.ENUM('adm', 'professor'),
    allowNull: false,
  },
  url_foto: {
    type: DataTypes.STRING,
    allowNull: true
  },
  password_reset_token: {
    type: DataTypes.STRING
  },
  password_reset_expires: {
    type: DataTypes.DATE
  }
}, {
  sequelize,
  tableName: 'usuarios',
  timestamps: false,
});

module.exports = Usuario;
