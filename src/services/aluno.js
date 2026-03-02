const { Aluno, UsuarioModulo, UsuarioTopico, UsuarioVideo, Modulo, Topico, VideoUrls } = require('../models');

async function listarAlunos(filtros = {}, page = 1, limit = 4) {
  try {
    const where = {};

    if (filtros.nome) {
      where.nome = filtros.nome;
    }

    if (filtros.email) {
      where.email = filtros.email;
    }

    const temFiltro = Object.keys(where).length > 0;

    const options = { where };

    if (!temFiltro) {
      const offset = (page - 1) * limit;
      options.limit = limit;
      options.offset = offset;
    }

    return await Aluno.findAll(options);
  } catch (error) {
    console.error('Erro ao listar alunos:', error);
    throw new Error('Erro ao listar alunos');
  }
}

async function getAlunoById(id_aluno) {
  try {
    return await Aluno.findByPk(id_aluno);
  } catch (error) {
    console.error('Erro ao buscar aluno:', error);
    throw new Error('Erro ao buscar aluno');
  }
}

async function infoPaginacaoAlunos() {
  try {
    const limit = 4;
    const totalRegistros = await Aluno.count();
    const totalPaginas = Math.ceil(totalRegistros / limit);
    
    return { totalPaginas, totalRegistros }
  } catch (error) {
    console.error('Erro ao buscar informações dos aluno', error)
    throw new Error('Erro ao buscar informações dos alunos')
  }
}

async function atualizarAluno(id_aluno, novosDados) {
  try {
    const aluno = await Aluno.findByPk(id_aluno);
    if (!aluno) return null;

    await aluno.update(novosDados);
    return aluno;
  } catch (error) {
    console.error('Erro ao atualizar aluno:', error);
    throw new Error('Erro ao atualizar aluno');
  }
}

async function deletarAluno(id_aluno) {
  try {
    await UsuarioModulo.destroy({ where: { id_aluno } });
    await UsuarioTopico.destroy({ where: { id_aluno } });
    await UsuarioVideo.destroy({ where: { id_aluno } });

    // Depois apaga o aluno
    const aluno = await Aluno.findByPk(id_aluno);
    console.log(aluno)
    if (!aluno) return null;

    await aluno.destroy();
    return true;
  } catch (error) {
    console.error('Erro ao deletar aluno:', error);
    throw new Error('Erro ao deletar aluno');
  }
}

// Obter progresso detalhado de um aluno individual
async function getProgressoAluno(id_aluno) {
  try {
    // Buscar aluno
    const aluno = await Aluno.findByPk(id_aluno);
    if (!aluno) return null;

    // Buscar progresso nos módulos
    const modulos = await UsuarioModulo.findAll({
      where: { id_aluno },
      include: [{
        model: Modulo,
        attributes: ['id', 'titulo'],
      }],
    });

    // Buscar progresso nos tópicos
    const topicos = await UsuarioTopico.findAll({
      where: { id_aluno },
      include: [{
        model: Topico,
        attributes: ['id', 'titulo', 'id_modulo'],
      }],
    });

    // Buscar progresso nos vídeos
    const videos = await UsuarioVideo.findAll({
      where: { id_aluno: id_aluno },
      include: [{
        model: VideoUrls,
        attributes: ['id', 'titulo', 'id_topico'],
      }],
    });

    return {
      aluno,
      modulos,
      topicos,
      videos,
    };
  } catch (error) {
    console.error('Erro ao buscar progresso do aluno:', error);
    throw new Error('Erro ao buscar progresso do aluno');
  }
}

module.exports = {
  listarAlunos,
  getAlunoById,
  atualizarAluno,
  deletarAluno,
  getProgressoAluno,
  infoPaginacaoAlunos
};
