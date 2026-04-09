const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connect');


const UsuarioTemporario = sequelize.define('usuarioTemporario', {
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
    allowNull: false,
  },
  tipo: {
    type: DataTypes.ENUM('adm', 'professor'),
    allowNull: false,
  },
  verificationCode: {
    type: DataTypes.STRING
  },
  expiresAt: {
    type: DataTypes.DATE
  },
  lastSentAt: {
    type: DataTypes.DATE
  }
}, {
    tableName: 'usuariotemporario',
    timestamps: false
})


module.exports = UsuarioTemporario;