const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connect');

const Topico = sequelize.define('Topico', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  id_modulo: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Modulos',
      key: 'id',
    },
  },
  nome_topico: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  ebookUrlGeral: {
    type: DataTypes.TEXT,
  },
  textoApoio: {
    type: DataTypes.TEXT,
  },
}, {
  tableName: 'topicos',
  timestamps: false,
});

module.exports = Topico;
