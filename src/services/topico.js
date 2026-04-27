const {
  Usuario,
  Topico,
  VideoUrls,
  SaibaMais,
  Referencias,
  Exercicios,
  Alternativas,
  Modulo,
} = require("../models");
const { sequelize } = require("../db/connect");
const videoUrlsService = require("./videoUrlsService");
const saibaMaisService = require("./saibaMaisService");
const exerciciosService = require("./exerciciosService");
const { validarTopico } = require("../utils/validarTopico");
const bcrypt = require("bcrypt");
const usuarioService = require('../services/usuario')
const { findOwnedResource, updateOwnedResource } = require('../helpers/ownership.helper');

async function obterTopicoCompletoPaginadosPorModulo(idModulo, pagina = 1, user) {
  try {

    // valida dono do módulo
    const modulo = await findOwnedResource(Modulo, idModulo, user);
    if (!modulo) return null;

    const limit = 3
    const offset = (pagina - 1) * limit

    return await Topico.findAll({
      where: { id_modulo: idModulo },
      offset,
      limit,
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
    });
  } catch (error) {
    console.error("Erro ao obter tópicos completos:", error);
    throw error;
  }
}


async function obterTopicoCompletoPorModulo(idModulo) {
  try {
    return await Topico.findAll({
      where: { id_modulo: idModulo },
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
    });
  } catch (error) {
    console.error("Erro ao obter tópicos completos:", error);
    throw error;
  }
}

async function criarTopico(dadosTopico) {
  const erros = validarTopico(dadosTopico);
  if (erros.length > 0) {
    throw new Error(`Validação falhou: ${erros.join("; ")}`);
  }

  try {
    const {
      nome_topico,
      id_modulo,
      ebookUrlGeral,
      textoApoio,
      videoUrls,
      saibaMais,
      exercicios,
    } = dadosTopico;

    const novoTopico = await Topico.create({
      nome_topico,
      id_modulo,
      ebookUrlGeral,
      textoApoio,
    });

    if (videoUrls)
      await videoUrlsService.criarVideoUrls(novoTopico.id, videoUrls);
    if (saibaMais)
      await saibaMaisService.criarSaibaMais(novoTopico.id, saibaMais);
    // if (referencias)
    //   await referenciasService.criarReferencias(novoTopico.id, referencias);
    if (exercicios)
      await exerciciosService.criarExercicios(novoTopico.id, exercicios);

    return novoTopico;
  } catch (error) {
    console.error("Erro ao criar Tópico:", error);
    throw new Error("Erro ao criar Tópico");
  }
}

async function excluirTopico(id, idUsuario) {
  const transaction = await sequelize.transaction();

  try {
    const usuario = await Usuario.findByPk(idUsuario);

    if (!usuario) {
      throw new Error("Usuário não encontrado");
    }

    const topico = await Topico.findByPk(id, {
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
      transaction,
    });

    if (!topico) {
      throw new Error("Tópico não encontrado");
    }

    // se não for adm, verifica se o usuário é dono do tópico
    if (usuario.tipo !== "adm"){
      const verificaTopico = await usuarioService.verificaTopicoEhDoUsuario(idUsuario, id);

      if (!verificaTopico) {
        throw new Error("Sem permissão");
      }  
    }
    
    
    // Exclui VideoUrls
    for (const video of topico.VideoUrls) {
      await video.destroy({ transaction });
    }

    // Exclui SaibaMais
    for (const saibaMais of topico.SaibaMais) {
      await saibaMais.destroy({ transaction });
    }

    // Exclui Referencias
    for (const referencia of topico.Referencias) {
      await referencia.destroy({ transaction });
    }

    // Exclui Exercícios e Alternativas
    for (const exercicio of topico.Exercicios) {
      for (const alternativa of exercicio.Alternativas) {
        await alternativa.destroy({ transaction });
      }
      await exercicio.destroy({ transaction });
    }

    // Exclui o tópico
    await topico.destroy({ transaction });

    await transaction.commit();
    return true;

  } catch (error) {
    await transaction.rollback();
    console.error("Erro ao excluir tópico:", error);
    throw error;
  }
}

async function editarTopico(id, dadosAtualizados, user) {
  const {
    nome_topico,
    ebookUrlGeral,
    textoApoio,
    videoUrls,
    saibaMais,
    exercicios,
  } = dadosAtualizados;

  try {
   
    const topico = await Topico.findOne({
      where: { id },
      include: [
        {
          model: Modulo,
          where: user.role !== "adm" ? { usuario_id: user.id } : undefined,
          attributes: [],
        },
        { model: VideoUrls, as: "VideoUrls" },
        { model: SaibaMais, as: "SaibaMais" },
        { model: Referencias, as: "Referencias" },
        {
          model: Exercicios,
          as: "Exercicios",
          include: [{ model: Alternativas, as: "Alternativas" }],
        },
      ],
    });

    if (!topico) return null;

    
    await topico.update({ nome_topico, ebookUrlGeral, textoApoio });

    
    if (videoUrls) {
      await VideoUrls.destroy({ where: { id_topico: id } });
      for (const url of videoUrls) {
        await VideoUrls.create({ id_topico: id, url });
      }
    }

    // SaibaMais
    if (saibaMais) {
      await SaibaMais.destroy({ where: { id_topico: id } });
      for (const item of saibaMais) {
        await SaibaMais.create({
          id_topico: id,
          descricao: item.descricao,
          url: item.url,
        });
      }
    }

    // Exercícios
    if (exercicios) {
      await Exercicios.destroy({ where: { id_topico: id } });

      for (const exercicio of exercicios) {
        const novoExercicio = await Exercicios.create({
          id_topico: id,
          questao: exercicio.questao,
          resposta_esperada: exercicio.resposta_esperada,
          aberta: exercicio.isQuestaoAberta,
        });

        if (!exercicio.isQuestaoAberta) {
          for (const alternativa of exercicio.alternativas) {
            await Alternativas.create({
              id_exercicio: novoExercicio.id,
              descricao: alternativa.descricao,
              explicacao: alternativa.explicacao,
              correta: alternativa.correta,
            });
          }
        }
      }
    }

    return {
      id_modulo: topico.id_modulo,
      nome_topico: topico.nome_topico,
    };
  } catch (error) {
    console.error("Erro ao editar tópico:", error);
    throw error;
  }
}

async function obterTopicoPorId(id, user) {
  try {
    const topico = await Topico.findOne({
      where: { id },
      include: [
        {
          model: Modulo,
          where: user.role !== "adm" ? { usuario_id: user.id } : undefined,
          attributes: [], // não retornar dados do módulo
        },
        { model: VideoUrls, as: "VideoUrls" },
        { model: SaibaMais, as: "SaibaMais" },
        { model: Referencias, as: "Referencias" },
        {
          model: Exercicios,
          as: "Exercicios",
          include: [{ model: Alternativas, as: "Alternativas" }],
        },
      ],
    });

    if (!topico) return null;

    return topico;
  } catch (error) {
    console.error("Erro ao obter tópico:", error);
    throw error;
  }
}

async function clonarTopicoCompleto(topicoOriginal, idModuloNovo, novoEbookUrl) {
  try {
    const novoTopico = await Topico.create({
      nome_topico: topicoOriginal.nome_topico,
      id_modulo: idModuloNovo,
      ebookUrlGeral: novoEbookUrl,
      textoApoio: topicoOriginal.textoApoio,
    });

    if (topicoOriginal.VideoUrls?.length) {
      const videoUrls = topicoOriginal.VideoUrls.map(v => ({ id_topico: novoTopico.id, url: v.url }));
      await VideoUrls.bulkCreate(videoUrls);
    }

    if (topicoOriginal.SaibaMais?.length) {
      const saibaMais = topicoOriginal.SaibaMais.map(s => ({
        id_topico: novoTopico.id,
        descricao: s.descricao,
        url: s.url,
      }));
      await SaibaMais.bulkCreate(saibaMais);
    }

    if (topicoOriginal.Referencias?.length) {
      const referencias = topicoOriginal.Referencias.map(r => ({
        id_topico: novoTopico.id,
        caminhoDaImagem: r.caminhoDaImagem,
        referencia: r.referencia,
      }));
      await Referencias.bulkCreate(referencias);
    }

    if (topicoOriginal.Exercicios?.length) {
      for (const exercicio of topicoOriginal.Exercicios) {
        const novoExercicio = await Exercicios.create({
          id_topico: novoTopico.id,
          questao: exercicio.questao,
        });

        if (exercicio.Alternativas?.length) {
          const alternativas = exercicio.Alternativas.map(a => ({
            id_exercicio: novoExercicio.id,
            descricao: a.descricao,
            explicacao: a.explicacao,
            correta: a.correta,
          }));
          await Alternativas.bulkCreate(alternativas);
        }
      }
    }

    return novoTopico;
  } catch (error) {
    console.error("Erro ao clonar tópico completo:", error);
    throw new Error("Erro ao clonar tópico completo");
  }
}


async function infoTopicosPorModulo(idModulo){
  try {
    const limit = 3; 
    const totalRegistros = await Topico.count({
      where: { id_modulo: idModulo } 
    });

    const totalPaginas = Math.ceil(totalRegistros / limit);

    return { totalPaginas, totalRegistros };
  } catch (error) {
    console.error("Erro ao buscar informações dos tópicos de um módulo:", error);
    throw new Error("Erro ao buscar informações dos tópicos de um módulo");
  }
}

module.exports = {
  obterTopicoCompletoPaginadosPorModulo,
  criarTopico,
  editarTopico,
  excluirTopico,
  obterTopicoPorId,
  clonarTopicoCompleto,
  infoTopicosPorModulo,
  obterTopicoCompletoPorModulo
};
