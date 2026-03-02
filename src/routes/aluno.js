const express = require('express');
const router = express.Router();
const alunoService = require('../services/aluno');
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');

/**
 * @swagger
 * tags:
 *   name: Aluno
 *   description: Gerenciamento de Alunos
 */

/**
 * @swagger
 * /api/alunos:
 *   get:
 *     summary: Lista todos os alunos (com filtros opcionais por nome e email)
 *     tags: [Aluno]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: nome
 *         in: query
 *         schema:
 *           type: string
 *         description: Nome do aluno para filtro
 *       - name: email
 *         in: query
 *         schema:
 *           type: string
 *         description: Email do aluno para filtro
 *     responses:
 *       200:
 *         description: Lista de alunos
 *       400:
 *         description: Erro ao listar alunos
 */
router.get('/alunos', authMiddleware, authorizeRole(['adm', 'professor']), async (req, res) => {
  try {
    let page = parseInt(req.query.page)
    if (isNaN(page) || page < 1) page = 1;
    console.log(page)
    const filtros = {
      nome: req.query.nome,
      email: req.query.email,
    };

    const alunos = await alunoService.listarAlunos(filtros, page);
    const infoAlunos = await alunoService.infoPaginacaoAlunos();

    console.log(alunos)

    res.status(200).json({alunos, infoAlunos});
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/alunos/{id}:
 *   get:
 *     summary: Busca um aluno específico pelo ID (ltiUserId)
 *     tags: [Aluno]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Detalhes do aluno
 *       404:
 *         description: Aluno não encontrado
 */
router.get('/alunos/:id', authMiddleware, authorizeRole(['adm', 'professor']), async (req, res) => {
  try {
    const aluno = await alunoService.getAlunoById(req.params.id);
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    res.status(200).json(aluno);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/alunos/{id}:
 *   put:
 *     summary: Atualiza os dados de um aluno
 *     tags: [Aluno]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Aluno atualizado
 *       404:
 *         description: Aluno não encontrado
 */
router.put('/alunos/:id', authMiddleware, authorizeRole(['adm', 'professor']), async (req, res) => {
  try {
    const aluno = await alunoService.atualizarAluno(req.params.id, req.body);
    console.log("ola mundo")
    console.log(aluno)
    if (!aluno) return res.status(404).json({ error: 'Aluno não encontrado' });

    res.status(200).json(aluno);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/alunos/{id}:
 *   delete:
 *     summary: Deleta um aluno (e apaga progresso em módulos, tópicos e vídeos)
 *     tags: [Aluno]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Aluno deletado
 *       404:
 *         description: Aluno não encontrado
 */
router.delete('/alunos/:id', authMiddleware, authorizeRole(['adm', 'professor']), async (req, res) => {
  try {
    const deletado = await alunoService.deletarAluno(req.params.id);
    console.log(deletado)
    if (!deletado) return res.status(404).json({ error: 'Aluno não encontrado' });

    res.status(200).json({ message: 'Aluno deletado com sucesso' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/alunos/{id}/progresso:
 *   get:
 *     summary: Obter o progresso completo de um aluno
 *     tags: [Aluno]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Progresso do aluno retornado
 *       404:
 *         description: Aluno não encontrado
 */
router.get('/alunos/:id/progresso', authMiddleware, authorizeRole(['adm', 'professor']), async (req, res) => {
  try {
    const progresso = await alunoService.getProgressoAluno(req.params.id);
    if (!progresso) return res.status(404).json({ error: 'Aluno não encontrado' });

    res.status(200).json(progresso);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

module.exports = router;
