const { DataTypes } = require("sequelize");
const { sequelize } = require("../db/connect");

const PlataformaRegistro = sequelize.define(
  "PlataformaRegistro",
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    plataformaUrl: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    plataformaNome: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    idCliente: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    usuario_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: "Usuarios",
        key: "id",
      },
    },
    temaTipo: {
      type: DataTypes.ENUM("padrao", "tema1", "tema2", "customizado"),
      defaultValue: "padrao",
    },
    customPrimaria: DataTypes.STRING,
    customSecundaria: DataTypes.STRING,
    customTerciaria: DataTypes.STRING,
    customQuartenaria: DataTypes.STRING,
    customQuintenaria: DataTypes.STRING,
  },
  {
    tableName: "plataformaRegistro",
    timestamps: false,
  }
);

module.exports = PlataformaRegistro;
