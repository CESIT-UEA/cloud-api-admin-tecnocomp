const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connect');

const UsuarioVideo = sequelize.define('UsuarioVideo', {
  id: {
    type: DataTypes.INTEGER,
    primaryKey: true,
    autoIncrement: true,
  },
  id_aluno: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Alunos',
      key: 'id_aluno',  
    },
  },
  id_video: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Videos', 
      key: 'id',
    },
  },
  completo: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'usuarioVideo',
  timestamps: false,
});

module.exports = UsuarioVideo;
