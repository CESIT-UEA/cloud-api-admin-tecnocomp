const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connect");

const UsuarioModulo = sequelize.define(
  "UsuarioModulo",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    id_aluno: {
      type: DataTypes.STRING,
      allowNull: false,
      references: {
        model: "Alunos",
        key: "id_aluno",
      },
    },
    id_modulo: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: "Modulos",
        key: "id",
      },
    },
    nota: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    progresso: {
      type: DataTypes.FLOAT,
      defaultValue: 0,
    },
    ativo: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    url_retorno: {
      type: DataTypes.TEXT,
    },
    avaliacao: {
      type: DataTypes.INTEGER,
    },
    comentario: {
      type: DataTypes.TEXT,
    },
  },
  {
    tableName: "usuarioModulo",
    timestamps: false,
  }
);

module.exports = UsuarioModulo;
