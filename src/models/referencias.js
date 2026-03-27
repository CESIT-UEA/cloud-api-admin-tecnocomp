const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connect');

const Referencias = sequelize.define('Referencias', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Topicos',
      key: 'id',
    },
  },
  caminhoDaImagem: {
    type: DataTypes.TEXT,
  },
  referencia: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'referencias',
  timestamps: false,
});

module.exports = Referencias;
