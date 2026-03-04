const { FichaTecnica, Modulo, Equipe, Membro } = require('../models');
const { listarEquipes } = require('./equipe')
const { listarMembros } = require('./membro')

async function criarFichaTecnica(modulo_id) {
  try {
    // Verifica se o módulo já possui ficha técnica
    const existente = await FichaTecnica.findOne({ where: { modulo_id } });
    if (existente) return existente;

    const ficha = await FichaTecnica.create({ modulo_id });
    return ficha;
  } catch (error) {
    console.error("Erro ao criar ficha técnica:", error);
    throw new Error("Erro ao criar ficha técnica");
  }
}

async function obterFichaPorModulo(modulo_id) {
  try {
    return await FichaTecnica.findOne({ where: { modulo_id } });
  } catch (error) {
    console.error("Erro ao buscar ficha técnica:", error);
    throw new Error("Erro ao buscar ficha técnica");
  }
}

async function deletarFichaTecnica(id) {
  try {
    const ficha = await FichaTecnica.findByPk(id);
    if (!ficha) return null;

    await ficha.destroy();
    return true;
  } catch (error) {
    console.error("Erro ao deletar ficha técnica:", error);
    throw new Error("Erro ao deletar ficha técnica");
  }
}

async function clonarFichaTecnica(modulo_id_que_vai_clonar, modulo_id_que_esta_sendo_clonado){
  try {
  
    const ficha = await obterFichaPorModulo(modulo_id_que_esta_sendo_clonado);
    if (!ficha) throw new Error('Ficha técnica a ser clonada não encontrada!')

    // criando ficha técnica clone com o id do módulo que está clonando
    const novaFichaTecnica = await criarFichaTecnica(modulo_id_que_vai_clonar);
  
    const equipesAntigas = await listarEquipes(ficha.dataValues.id)
  
    if (!equipesAntigas) return null

    let equipesCriadas
    if (equipesAntigas?.length){

      idsEquipes = equipesAntigas.map(equipes => equipes.dataValues.id)

      equipesCriadas = equipesAntigas.map(equipes => ({ 
        nome: equipes.dataValues.nome, 
        ficha_tecnica_id: novaFichaTecnica.dataValues.id 
      })
      )
      equipesCriadas = await Equipe.bulkCreate(equipesCriadas, { returning: true })
    }

    
    const mapaEquipes = {};

    equipesAntigas.forEach((equipeAntiga, index) => {
      mapaEquipes[equipeAntiga.dataValues.id] = equipesCriadas[index].dataValues.id;
    });
    
    
    let membros = await Promise.all(
      Object.keys(mapaEquipes).map(id => listarMembros(Number(id)))
    )

    const membrosSemId = membros
      .flat()
      .map(m => ({
        nome: m.dataValues.nome,
        cargo: m.dataValues.cargo,
        foto_url: m.dataValues.foto_url,
        equipe_id: mapaEquipes[m.dataValues.equipe_id]
      }));
   

    if (Array.isArray(membrosSemId) && membrosSemId.length > 0){
      await Membro.bulkCreate(membrosSemId)
    }

    return { ficha: ficha.dataValues, equipesCriadas, membros }

  } catch (error) {
    throw new Error('Erro ao retornar dados')
  }
}

module.exports = {
  criarFichaTecnica,
  obterFichaPorModulo,
  deletarFichaTecnica,
  clonarFichaTecnica
};
