const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/connect');

const UsuarioTopico = sequelize.define('UsuarioTopico', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true,
  },
  ltiUserId: {
    type: DataTypes.STRING,
    allowNull: false,
    references: {
      model: 'Alunos',
      key: 'id_aluno',
    },
  },
  id_topico: {
    type: DataTypes.INTEGER,
    allowNull: false,
    references: {
      model: 'Topicos',
      key: 'id',
    },
  },
  nota: {
    type: DataTypes.FLOAT,
    defaultValue: 0,
  },
  encerrado: {
    type: DataTypes.BOOLEAN,
    defaultValue: false,
  },
}, {
  tableName: 'usuarioTopico',
  timestamps: false,
});

module.exports = UsuarioTopico;
