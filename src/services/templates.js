const { Modulo, Topico } = require("../models");
const { randomUUID } = require("crypto");
const topicoService = require("../services/topico");
const { criarReferencia, listarReferenciasPorModulo } = require('./referenciaModulo');
const { obterFichaPorModulo, clonarFichaTecnica } = require('./ficha-tecnica');
const { enviarArquivoParaTreinamentoAgenteIA } = require('../services/treinamentoAgenteIA');
const fs = require("fs");
const path = require("path")

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

    const fileClonado = await clonarFileParaTemplate(template);

    const uuid = randomUUID();
    const novoModulo = await Modulo.create({
      nome_modulo: `${template.nome_modulo} - Cópia`,
      nome_url: template.nome_url,
      ebookUrlGeral: fileClonado?.caminhoRelativo || null,
      video_inicial: template.video_inicial,
      publicado: false,
      usuario_id: usuarioId,
      template: false,
      uuid,
      filesDoModulo: fileClonado?.pastaId || null
    });

    const referenciasModulo = await listarReferenciasPorModulo(template.id)
    
    if (referenciasModulo){
      referenciasModulo.map(async (referencia) => {
        await criarReferencia({
          descricao: referencia.dataValues.descricao,
          link: referencia.dataValues.link,
          modulo_id: novoModulo.id
        })
      })
    }

    const fichaTecnica = await obterFichaPorModulo(template.id);

    if (fichaTecnica) {
      await clonarFichaTecnica(novoModulo.id, template.id);
    }
    
    for (const topico of topicosOriginais) {
      await topicoService.clonarTopicoCompleto(topico, novoModulo.id);
    }

    
    if (!fileClonado || !fs.existsSync(fileClonado.caminhoAbsoluto)){
      console.warn('Arquivo não existe, pulando treinamento');
    } else {
      const fileFake = {
        path: fileClonado.caminhoAbsoluto,
        originalname: fileClonado.nomeArquivo,
        mimetype: "application/pdf"
      }

      await enviarArquivoParaTreinamentoAgenteIA(novoModulo.nome_modulo, novoModulo.id , fileFake)
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

async function clonarFileParaTemplate(template){
   // se não tiver arquivo, retorna null
    if (!template.ebookUrlGeral) {
      return null;
    }

    const pastaId = randomUUID();

    const caminhoAntigo = path.join(process.env.FILE_PATH, template.ebookUrlGeral);

    const pastaDestino = path.join(process.env.FILE_PATH, pastaId);

    // cria pasta destino
    fs.mkdirSync(pastaDestino, { recursive: true })

    const nomeArquivo = path.basename(template.ebookUrlGeral);

    const novoCaminhoAbsoluto = path.join(pastaDestino, nomeArquivo);
    const novoCaminhoRelativo = path.join(pastaId, nomeArquivo);

    // copia se existir
    if (fs.existsSync(caminhoAntigo)){
      fs.copyFileSync(caminhoAntigo, novoCaminhoAbsoluto)
    } else {
      console.warn('Arquivo do template não existe', caminhoAntigo);
      return null
    }

    return {
      pastaId,
      caminhoRelativo: novoCaminhoRelativo,
      caminhoAbsoluto: novoCaminhoAbsoluto,
      nomeArquivo
    }

}

module.exports = {
  listarTemplates,
  obterTemplatePorId,
  clonarTemplate,
  atualizarStatusTemplate,
};
