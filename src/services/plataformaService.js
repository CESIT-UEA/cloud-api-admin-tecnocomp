const { PlataformaRegistro, Usuario } = require("../models");
const bcrypt = require("bcrypt");

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

async function obterPlataformaPorId(id) {
  try {
    const plataforma = await PlataformaRegistro.findByPk(id);
    return plataforma;
  } catch (error) {
    console.error("Erro ao buscar plataforma por ID:", error);
    throw new Error("Erro ao buscar plataforma por ID");
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

async function atualizarPlataforma(id, dadosAtualizados) {
  try {
    const plataforma = await PlataformaRegistro.findByPk(id);
    if (!plataforma) return null;

    const {
      temaTipo,
      customPrimaria,
      customSecundaria,
      customTerciaria,
      customQuartenaria,
      customQuintenaria,
    } = dadosAtualizados;

    await plataforma.update({
      ...dadosAtualizados,
      customPrimaria: temaTipo === "customizado" ? customPrimaria : null,
      customSecundaria: temaTipo === "customizado" ? customSecundaria : null,
      customTerciaria: temaTipo === "customizado" ? customTerciaria : null,
      customQuartenaria: temaTipo === "customizado" ? customQuartenaria : null,
      customQuintenaria: temaTipo === "customizado" ? customQuintenaria : null,
    });

    return plataforma;
  } catch (error) {
    console.error("Erro ao atualizar plataforma:", error);
    throw new Error("Erro ao atualizar plataforma");
  }
}


async function deletarPlataforma(idAdm, senhaAdm, idExcluir) {
  try {
    const admin = await Usuario.findOne({ where: { id: idAdm, tipo: "adm" } });
    if (!admin || !(await bcrypt.compare(senhaAdm, admin.senha))) {
      return false;
    }

    const plataforma = await PlataformaRegistro.findByPk(idExcluir);
    if (!plataforma) {
      return false;
    }

    await plataforma.destroy();
    return true;
  } catch (error) {
    console.error("Erro ao deletar plataforma:", error);
    throw new Error("Erro ao deletar plataforma");
  }
}

async function infoPaginacaoPlataformas() {
  try {
    const limit = 3;
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
    const limit = 3; 
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
