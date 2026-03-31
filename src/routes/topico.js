const express = require('express');
const topicoService = require('../services/topico');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');

/**
 * @swagger
 * /api/topicos/{id}:
 *   get:
 *     summary: Lista todos os tópicos de um módulo
 *     tags: [Tópico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do módulo
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Lista de tópicos do módulo
 *       400:
 *         description: ID obrigatório
 *       500:
 *         description: Erro ao buscar tópicos
 */
router.get('/topicos/:id', authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const { id } = req.params;
    let page = parseInt(req.query.page)
    
    if (isNaN(page) || page < 1) page = 1;
    if (!id) {
      return res.status(400).json({ error: 'ID do módulo é obrigatório' });
    }

    const topico = await topicoService.obterTopicoCompletoPaginadosPorModulo(id, page, req.user);

    if (!topico) {
      return res.status(404).json({ error: 'Módulo não encontrado' });
    }

    const infoTopicosPorModulos = await topicoService.infoTopicosPorModulo(id);
    
    res.status(200).json({ topico, infoTopicosPorModulos});
  } catch (error) {
    console.error('Erro ao buscar tópico completo:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/topicos:
 *   post:
 *     summary: Cria um novo tópico
 *     tags: [Tópico]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - id_modulo
 *               - nome_topico
 *             properties:
 *               id_modulo:
 *                 type: integer
 *               nome_topico:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tópico criado com sucesso
 *       400:
 *         description: Campos obrigatórios ausentes
 */
router.post('/topicos', authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const dadosTopico = req.body;

    if (!dadosTopico.id_modulo || !dadosTopico.nome_topico) {
      return res.status(400).json({ error: 'Campos obrigatórios estão ausentes' });
    }
    const novoTopico = await topicoService.criarTopico(dadosTopico);
    console.log(dadosTopico)
    res.status(201).json(novoTopico);
  } catch (error) {
    console.error('Erro ao criar tópico:', error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/topico/{id}:
 *   put:
 *     summary: Edita um tópico
 *     tags: [Tópico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do tópico
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Tópico editado com sucesso
 *       500:
 *         description: Erro ao editar tópico
 */
router.put('/topico/:id', authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const { id } = req.params;
    const dadosAtualizados = req.body;

    const topico = await topicoService.editarTopico(id, dadosAtualizados, req.user);

    if (!topico) {
      return res.status(404).json({ error: 'Tópico não encontrado' });
    }

    res.status(200).json(topico);
  } catch (error) {
    console.error('Erro ao editar tópico:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/topico/{id}:
 *   delete:
 *     summary: Exclui um tópico
 *     tags: [Tópico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do tópico
 *         required: true
 *         schema:
 *           type: integer
 *       - name: idAdm
 *         in: query
 *         required: true
 *         schema:
 *           type: integer
 *       - name: senhaAdm
 *         in: query
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tópico excluído com sucesso
 *       500:
 *         description: Erro ao excluir tópico
 */
router.delete('/topico/:id', authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { idAdm, senhaAdm } = req.query;

    await topicoService.excluirTopico(id, idAdm, senhaAdm);
    console.log("Teste")
    res.status(200).json({ message: 'Tópico excluído com sucesso' });
  } catch (error) {
    console.error('Erro ao excluir tópico:', error);
    res.status(500).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/topico/{id}:
 *   get:
 *     summary: Obtém um tópico por ID
 *     tags: [Tópico]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do tópico
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Tópico encontrado
 *       404:
 *         description: Tópico não encontrado
 */
router.get(
  '/topico/:id',
  authMiddleware,
  authorizeRole(['adm','professor']),
  async (req, res) => {
    try {
      const { id } = req.params;

      const topico = await topicoService.obterTopicoPorId(id, req.user);

      if (!topico) {
        return res.status(404).json({ error: 'Tópico não encontrado' });
      }

      return res.status(200).json(topico);
    } catch (error) {
      console.error('Erro ao obter tópico:', error);
      return res.status(500).json({ error: 'Erro ao obter tópico' });
    }
  }
);

module.exports = router;
