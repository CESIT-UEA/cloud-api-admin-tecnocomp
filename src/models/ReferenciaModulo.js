const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connect');

const ReferenciaModulo = sequelize.define('ReferenciaModulo', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  descricao: {
    type: DataTypes.TEXT,
    allowNull: false,
  },
  link: {
    type: DataTypes.STRING,
    allowNull: true, // opcional
  },
  modulo_id: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Modulos',
      key: 'id',
    },
  },
}, {
  tableName: 'referenciasModulo',
  timestamps: false,
});

module.exports = ReferenciaModulo;
