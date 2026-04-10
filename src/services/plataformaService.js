const { PlataformaRegistro, Usuario } = require("../models");
const bcrypt = require("bcrypt");
const usuarioService = require('../services/usuario')
const { findOwnedResource, updateOwnedResource } = require("../helpers/ownership.helper");

async function criarPlataforma({
  plataformaUrl,
  plataformaNome,
  idCliente,
  usuario_id,
  temaTipo,
  customPrimaria,
  customSecundaria,
  customTerciaria,
  customQuartenaria,
  customQuintenaria,
}) {
  try {
    const novaPlataforma = await PlataformaRegistro.create({
      plataformaUrl,
      plataformaNome,
      idCliente,
      usuario_id: parseInt(usuario_id),
      temaTipo,
      customPrimaria: temaTipo === "customizado" ? customPrimaria : null,
      customSecundaria: temaTipo === "customizado" ? customSecundaria : null,
      customTerciaria: temaTipo === "customizado" ? customTerciaria : null,
      customQuartenaria: temaTipo === "customizado" ? customQuartenaria : null,
      customQuintenaria: temaTipo === "customizado" ? customQuintenaria : null,
    });

    return novaPlataforma;
  } catch (error) {
    console.error("Erro ao criar plataforma:", error);
    throw new Error("Erro ao criar a plataforma");
  }
}


async function listarPlataformasPaginadas(pagina = 1) {
  try {
    const limit = 2
    const offset = (pagina - 1) * limit
    const plataformas = await PlataformaRegistro.findAll({ offset, limit });
    return plataformas;
  } catch (error) {
    console.error("Erro ao listar plataformas:", error);
    throw new Error("Erro ao listar plataformas");
  }
}

async function obterPlataformaPorId(id, user) {
  try {
    const plataforma = await findOwnedResource(PlataformaRegistro, id, user);

    return plataforma; 
  } catch (error) {
    console.error("Erro ao buscar plataforma por ID:", error);
    throw error;
  }
}

async function obterPlataformasPaginadasPorUsuario(usuarioId, pagina = 1) {
  try {
    const limit = 2; 
    const offset = (pagina - 1) * limit
    const plataformas = await PlataformaRegistro.findAll({
      where: { usuario_id: usuarioId },
      offset,
      limit
    });

    return plataformas;
  } catch (error) {
    console.error("Erro ao obter plataformas por usuário:", error);
    throw new Error("Erro ao obter plataformas por usuário.");
  }
}

async function atualizarPlataforma(id, dadosAtualizados, user) {
  try {
    const plataforma = await updateOwnedResource(
      PlataformaRegistro,
      id,
      user,
      dadosAtualizados
    );

    if (!plataforma) return null;

    const {
      temaTipo,
      customPrimaria,
      customSecundaria,
      customTerciaria,
      customQuartenaria,
      customQuintenaria,
    } = dadosAtualizados;

    const isCustom = temaTipo === "customizado";

    await plataforma.update({
      customPrimaria: isCustom ? customPrimaria : null,
      customSecundaria: isCustom ? customSecundaria : null,
      customTerciaria: isCustom ? customTerciaria : null,
      customQuartenaria: isCustom ? customQuartenaria : null,
      customQuintenaria: isCustom ? customQuintenaria : null,
    });

    return plataforma;
  } catch (error) {
    console.error("Erro ao atualizar plataforma:", error);
    throw error;
  }
}


async function deletarPlataforma(idUsuario, idExcluir) {
  try {

    const admin = await Usuario.findOne({ where: { id: idUsuario, tipo: "adm" } });

    if (admin) {
      
      const plataforma = await PlataformaRegistro.findByPk(idExcluir);
      if (!plataforma) {
        const error = new Error("Plataforma não encontrada");
        error.status = 404;
        throw error;
      }

      await plataforma.destroy();
      return true;

    } else {

      const plataformaDoProfessor = await usuarioService.verificaPlataformaEhDoUsuario(
        idUsuario,
        idExcluir
      );

      if (!plataformaDoProfessor) {
        const error = new Error("Sem permissão");
        error.status = 403;
        throw error;
      }

      const plataforma = await PlataformaRegistro.findByPk(idExcluir);
      if (!plataforma) {
        const error = new Error("Plataforma não encontrada");
        error.status = 404;
        throw error;
      }

      await plataforma.destroy();
      return true;
    }

  } catch (error) {
    if (error.name === "SequelizeForeignKeyConstraintError") {
      const fkError = new Error("PLATAFORMA_COM_ALUNOS");
      fkError.status = 400;
      throw fkError;
    }

    console.error("Erro ao deletar plataforma:", error);
    throw error;
  }
}

async function infoPaginacaoPlataformas() {
  try {
    const limit = 2;
    const totalRegistros = await PlataformaRegistro.count();
    const totalPaginas = Math.ceil(totalRegistros / limit);
    
    return { totalPaginas, totalRegistros }
  } catch (error) {
    console.error('Erro ao buscar informações das plataformas', error)
    throw new Error('Erro ao buscar informações das plataformas')
  }
}

async function infoPlataformasPorUsuario(idUsuario){
  try {
    const limit = 2; 
    const totalRegistros = await PlataformaRegistro.count({
      where: { usuario_id: idUsuario } 
    });

    const totalPaginas = Math.ceil(totalRegistros / limit);

    return { totalPaginas, totalRegistros };
  } catch (error) {
    console.error('Erro ao buscar informações das plataformas por usuário', error)
    throw new Error('Erro ao buscar informações das plataformas por usuário')
  }
}

module.exports = {
  criarPlataforma,
  listarPlataformasPaginadas,
  obterPlataformaPorId,
  atualizarPlataforma,
  deletarPlataforma,
  obterPlataformasPaginadasPorUsuario,
  infoPaginacaoPlataformas,
  infoPlataformasPorUsuario
};
