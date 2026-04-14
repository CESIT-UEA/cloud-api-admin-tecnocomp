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
  let transaction;
  try {
    transaction = await PlataformaRegistro.sequelize.transaction();

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
    }, { transaction });

    await registerPlataformaLTI(
      novaPlataforma.plataformaUrl,
      novaPlataforma.plataformaNome,
      novaPlataforma.idCliente
    );

    await transaction.commit();

    return novaPlataforma;
  } catch (error) {
    if (transaction) await transaction.rollback();
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
  let dadosAntigos;
  try {
    const plataforma = await findOwnedResource(
      PlataformaRegistro,
      id,
      user
    );

    if (!plataforma) {
      const error = new Error("Plataforma não encontrada");
      error.status = 404;
      throw error;
    }

    dadosAntigos = {
      plataformaUrl: plataforma.dataValues.plataformaUrl,
      idCliente: plataforma.dataValues.idCliente
    };

     await atualizarPlataformaLTI({
      plataformaUrl: dadosAntigos.plataformaUrl,
      idCliente: dadosAntigos.idCliente,
      novosDados: dadosAtualizados
    });

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
      ...dadosAtualizados,
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
      
      await deletarPlataformaLTI(plataforma.plataformaUrl, plataforma.idCliente)

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

      await deletarPlataformaLTI(plataforma.plataformaUrl, plataforma.idCliente)

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

async function infoPlataformasPorUsuario(idUsuario) {
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


async function registerPlataformaLTI(plataformaUrl, plataformaNome, idCliente) {
  try {
    if (!process.env.BACK_LTI) throw new Error('BACK_LTI não está definido');
    
    const response = await fetch(`${process.env.BACK_LTI}/lti/register-platform`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        plataformaUrl,
        plataformaNome,
        idCliente
      })
    });

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao registrar plataforma');
    }

    console.log('Sucesso:', data.message);
    return data;

  } catch (error) {
    console.error('Erro ao registrar plataforma LTI:', error.message);
    throw error;
  }

}


async function deletarPlataformaLTI(plataformaUrl, idCliente) {
  try {
    if (!plataformaUrl || !idCliente) throw new Error('Parâmetros obrigatórios estão ausentes!');

    const response = await fetch(
      `${process.env.BACK_LTI}/lti/remove-platform`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.INTERNAL_API_KEY
      },
      body: JSON.stringify({
        plataformaUrl,
        idCliente
      })
    })

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data.message || 'Erro ao deletar plataforma');
    }

    console.log('Sucesso:', data.message);
    return data;

  } catch (error) {
    console.error('Erro ao deletar plataforma LTI:', error.message);
    throw error;
  }
}


async function atualizarPlataformaLTI({ plataformaUrl, idCliente, novosDados }) {
  try {
    if (!plataformaUrl || !idCliente || !novosDados) {
      throw new Error("Parâmetros obrigatórios ausentes");
    }

    const response = await fetch(
      `${process.env.BACK_LTI}/lti/update-platform`,
      {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": process.env.INTERNAL_API_KEY,
        },
        body: JSON.stringify({
          plataformaUrl,
          idCliente,
          novosDados,
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(data?.message || "Erro ao atualizar plataforma");
    }

    console.log("Sucesso:", data.message);
    return data;

  } catch (error) {
    console.error("Erro ao atualizar plataforma LTI:", error.message);
    throw error;
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
