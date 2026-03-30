const {
  Modulo,
  Topico,
  VideoUrls,
  SaibaMais,
  Referencias,
  Exercicios,
  Alternativas,
  Usuario,
  FichaTecnica,
  Equipe,
  ReferenciaModulo,
  Vantagem,
  Membro,
  Aluno,
  UsuarioModulo,
} = require("../models");

const bcrypt = require("bcrypt");
const topicoService = require("../services/topico");
const usuarioService = require("../services/usuario");
const { randomUUID } = require("crypto");
const { Op, fn, col } = require("sequelize");
const { findOwnedResource, updateOwnedResource } = require('../helpers/ownership.helper');

async function criarModulo({
  nome_modulo,
  video_inicial,
  ebookUrlGeral,
  nome_url,
  usuario_id,
  filesDoModulo
}) {
  try {
    const uuid = randomUUID();

    const modulo = await Modulo.create({
      nome_url,
      nome_modulo,
      ebookUrlGeral,
      video_inicial,
      usuario_id,
      uuid,
      filesDoModulo
    });

    return modulo;
  } catch (error) {
    console.error("Erro ao criar módulo:", error);
    throw new Error("Erro ao criar o módulo");
  }
}

async function listarModulosPaginados(pagina = 1, quantidadeItens = 3) {
  try {
    const limit = quantidadeItens
    const offset = (pagina - 1) * limit
    const modulos = await Modulo.findAll({ offset, limit });
    return modulos;
  } catch (error) {
    console.error("Erro ao listar módulos:", error);
    throw new Error("Erro ao listar módulos");
  }
}

async function infoPaginacaoModulos(quantidadeItens) {
  try {
    const limit = quantidadeItens;
    const totalRegistros = await Modulo.count();
    const totalPaginas = Math.ceil(totalRegistros / limit);
    
    return { totalPaginas, totalRegistros }
  } catch (error) {
    console.error('Erro ao buscar informações dos módulos', error)
    throw new Error('Erro ao buscar informações dos módulos')
  }
}


async function obterModuloPorId(id, user) {
  try {
    return await findOwnedResource(Modulo, id, user);
  } catch (error) {
    console.error("Erro ao buscar módulo:", error);
    throw error;
  }
}


async function infoModulosPorUsuario(idUsuario) {
  try {
    const limit = 3; 
    const totalRegistros = await Modulo.count({
      where: { usuario_id: idUsuario } 
    });

    const totalPaginas = Math.ceil(totalRegistros / limit);

    return { totalPaginas, totalRegistros };
  } catch (error) {
    console.error('Erro ao buscar informações dos módulos por usuário', error);
    throw new Error('Erro ao buscar informações dos módulos por usuário');
  }
}


async function listarModulosTemplates() {
  try {
    const modulos = await Modulo.findAll({
      where: { template: 1 },
    });
    return modulos;
  } catch (error) {
    console.error("Erro ao listar templates:", error);
    throw new Error("Erro ao listar templates");
  }
}

async function obterModulosPaginadosPorUsuario(usuarioId, pagina = 1) {
  try {
    const limit = 3
    const offset = (pagina - 1) * limit

    const modulos = await Modulo.findAll({
      where: { usuario_id: usuarioId },
      offset,
      limit
    });

    return modulos;
  } catch (error) {
    console.error("Erro ao obter módulos por usuário:", error);
    throw new Error("Erro ao obter módulos por usuário.");
  }
}



async function atualizarModulo(id, dadosAtualizados, user) {
  try {
    const modulo = await updateOwnedResource(
      Modulo,
      id,
      user,
      dadosAtualizados
    );

    return modulo; 
  } catch (error) {
    console.error("Erro ao atualizar módulo:", error);
    throw error;
  }
}

async function deletarModulo(idAdm, senhaAdm, idExcluir) {
  try {
    const admin = await Usuario.findOne({ where: { id: idAdm, tipo: "adm" } });

    if (admin) {
      
      const senhaCorreta = await bcrypt.compare(senhaAdm, admin.senha)

      if (!senhaCorreta) {
        const error = new Error("Senha incorreta")
        error.status = 401
        
        throw error
      }

      const modulo = await Modulo.findByPk(idExcluir, {
        include: [{ model: Topico, as: "Topicos" }],
      });

      if (!modulo) {
        const error = new Error("Módulo não encontrado");
        error.status = 404;
        throw error;
      }

      await modulo.destroy();
      return true;
    } else {
      const verificaModulo = await usuarioService.verificaModuloEhDoUsuario(
        idAdm,
        idExcluir
      );
        if (!verificaModulo) {
          const error = new Error("Sem permissão");
          error.status = 403;
          throw error;
      }

        if (verificaModulo) {
          const modulo = await Modulo.findByPk(idExcluir, {
            include: [{ model: Topico, as: "Topicos" }],
          });

          if (!modulo) {
            const error = new Error("Módulo não encontrado");
            error.status = 404;
            throw error;
          }

          await modulo.destroy();
          return true;
      } else {
        return false;
      }
    }
  } catch (error) {
    console.error("Erro ao deletar módulo:", error);
    throw error;
  }
}

async function atualizarStatusPublicacao(id, publicar, user) {
  try {
    const modulo = await findOwnedResource(Modulo, id, user);

    if (!modulo) return null;

    modulo.publicado = publicar;
    await modulo.save();

    return modulo;
  } catch (error) {
    console.error("Erro ao atualizar status de publicação:", error);
    throw error;
  }
}

async function obterModuloPorIdESeusTopicos(id, user) {
  try {
    const modulo = await findOwnedResource(
      Modulo,
      id,
      user,
      "usuario_id",
      [
        {
          model: Topico,
          include: [
            { model: VideoUrls, as: "VideoUrls" },
            { model: SaibaMais, as: "SaibaMais" },
            { model: Referencias, as: "Referencias" },
            {
              model: Exercicios,
              as: "Exercicios",
              include: [{ model: Alternativas, as: "Alternativas" }],
            },
          ],
        },
        {
          model: FichaTecnica,
          include: [
            { model: Equipe, as: "Equipes", include: [{ model: Membro }] },
          ],
        },
        { model: ReferenciaModulo },
        { model: Vantagem },
        {
          model: UsuarioModulo,
          where: {
            comentario: { [Op.ne]: null },
          },
          attributes: ["comentario", "avaliacao", "id_aluno", "id_modulo"],
          limit: 3,
          order: [["id", "DESC"]],
          required: false,
        },
      ]
    );

    if (!modulo) return null;

    const statsAvaliacoes = await UsuarioModulo.findOne({
      attributes: [
        [fn("AVG", col("avaliacao")), "media_avaliacao"],
        [fn("COUNT", col("avaliacao")), "quantidade_avaliacoes"],
      ],
      where: {
        id_modulo: id,
        avaliacao: { [Op.ne]: null },
      },
      raw: true,
    });

    return {
      ...modulo.toJSON(),
      mediaAvaliacoes: parseFloat(statsAvaliacoes?.media_avaliacao) || 0,
      quantidadeAvaliacoes:
        parseInt(statsAvaliacoes?.quantidade_avaliacoes) || 0,
    };
  } catch (error) {
    console.error("Erro ao buscar módulo por ID:", error);
    throw error;
  }
}

async function getProgressoAlunosPorModulo(idModulo, filtros = {}, page = 1, limit = 3) {
  try {
    const where = { id_modulo: idModulo };

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros.progressoMin !== undefined) {
      where.progresso = { [Op.gte]: parseFloat(filtros.progressoMin) };
    }

    if (filtros.notaMin !== undefined) {
      where.nota = { [Op.gte]: parseFloat(filtros.notaMin) };
    }

    const alunoWhere = {};

    if (filtros.nome) {
      alunoWhere.nome = { [Op.like]: `%${filtros.nome}%` };
    }

    if (filtros.email) {
      alunoWhere.email = { [Op.like]: `%${filtros.email}%` };
    }

    // verifica se existe QUALQUER filtro
    const temFiltro =
      Object.keys(where).length > 1 || // > 1 porque id_modulo sempre existe
      Object.keys(alunoWhere).length > 0;

    const options = {
      where,
      include: [
        {
          model: Aluno,
          where: Object.keys(alunoWhere).length > 0 ? alunoWhere : undefined,
        },
      ],
    };

    // só pagina se NÃO tiver filtro
    if (!temFiltro) {
      options.limit = limit;
      options.offset = (page - 1) * limit;
    }

    const alunosModulo = await UsuarioModulo.findAll(options);

    return alunosModulo;
  } catch (error) {
    console.error("Erro ao buscar progresso dos alunos por módulo:", error);
    throw new Error("Erro ao buscar progresso dos alunos por módulo");
  }
}


async function infoPaginacaoAlunos(idModulo, filtros = {}) {
  try {
    const limit = 4;

    const where = { id_modulo: idModulo };

    if (filtros.ativo !== undefined) {
      where.ativo = filtros.ativo;
    }

    if (filtros.progressoMin !== undefined) {
      where.progresso = { [Op.gte]: parseFloat(filtros.progressoMin) };
    }

    if (filtros.notaMin !== undefined) {
      where.nota = { [Op.gte]: parseFloat(filtros.notaMin) };
    }

    const alunoWhere = {};

    if (filtros.nome) {
      alunoWhere.nome = { [Op.like]: `%${filtros.nome}%` };
    }

    if (filtros.email) {
      alunoWhere.email = { [Op.like]: `%${filtros.email}%` };
    }

    const totalRegistros = await UsuarioModulo.count({
      where,
      include: [
        {
          model: Aluno,
          where: Object.keys(alunoWhere).length > 0 ? alunoWhere : undefined,
          required: Object.keys(alunoWhere).length > 0, // INNER JOIN quando filtra
        },
      ],
      distinct: true,
    });

    const totalPaginas = Math.ceil(totalRegistros / limit);

    return { totalPaginas, totalRegistros };
  } catch (error) {
    console.error('Erro ao buscar informações de paginação', error);
    throw new Error('Erro ao buscar informações de paginação');
  }
}

async function atualizarUsuarioModulo(id, novosDados) {
  try {
    const usuarioModulo = await UsuarioModulo.findByPk(id);
    if (!usuarioModulo) return null;

    await usuarioModulo.update(novosDados);
    return usuarioModulo;
  } catch (error) {
    console.error("Erro ao atualizar UsuarioModulo:", error);
    throw new Error("Erro ao atualizar relação aluno-módulo");
  }
}

module.exports = {
  criarModulo,
  listarModulosPaginados,
  obterModuloPorId,
  atualizarModulo,
  deletarModulo,
  atualizarStatusPublicacao,
  obterModuloPorIdESeusTopicos,
  obterModulosPaginadosPorUsuario,
  listarModulosTemplates,
  getProgressoAlunosPorModulo,
  atualizarUsuarioModulo,
  infoPaginacaoModulos,
  infoModulosPorUsuario,
  infoPaginacaoAlunos
};
