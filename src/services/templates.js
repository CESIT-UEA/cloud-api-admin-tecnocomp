const { Modulo, Topico } = require("../models");
const { randomUUID } = require("crypto");
const topicoService = require("../services/topico");

async function listarTemplates() {
  try {
    const templates = await Modulo.findAll({
      where: { template: true },
      attributes: ["id", "nome_modulo", "nome_url", "publicado"],
    });
    return templates;
  } catch (error) {
    console.error("Erro ao listar templates:", error);
    throw new Error("Erro ao listar templates");
  }
}

async function obterTemplatePorId(id) {
  try {
    const template = await Modulo.findByPk(id, {
      where: { template: true },
      include: [{ model: Topico }], // Inclui tópicos associados, se necessário
    });

    return template;
  } catch (error) {
    console.error("Erro ao buscar template por ID:", error);
    throw new Error("Erro ao buscar template");
  }
}

async function clonarTemplate(id, usuarioId) {
  try {
    const template = await Modulo.findOne({
      where: { id, template: true },
    });

    if (!template) {
      return null;
    }

    const topicosOriginais = await topicoService.obterTopicoCompletoPorModulo(id);
    console.log(topicosOriginais, 'tópicos originais')

    console.log(usuarioId, 'usuarioID')

    const uuid = randomUUID();
    const novoModulo = await Modulo.create({
      nome_modulo: `${template.nome_modulo} - Cópia`,
      nome_url: template.nome_url,
      ebookUrlGeral: template.ebookUrlGeral,
      video_inicial: template.video_inicial,
      publicado: false,
      usuario_id: usuarioId,
      template: false,
      uuid,
      filesDoModulo: template.filesDoModulo
    });

    for (const topico of topicosOriginais) {
      await topicoService.clonarTopicoCompleto(topico, novoModulo.id);
    }

    return novoModulo;
  } catch (error) {
    console.error("Erro ao clonar template:", error);
    throw new Error("Erro ao clonar template");
  }
}


async function atualizarStatusTemplate(id, template) {
  try {
    const modulo = await Modulo.findByPk(id);

    if (!modulo) {
      return null; // Retorna null se o módulo não for encontrado
    }

    modulo.template = template; // Define o status de template
    await modulo.save();

    return modulo; // Retorna o módulo atualizado
  } catch (error) {
    console.error("Erro ao atualizar status de template:", error);
    throw new Error("Erro ao atualizar status de template");
  }
}

module.exports = {
  listarTemplates,
  obterTemplatePorId,
  clonarTemplate,
  atualizarStatusTemplate,
};
