const express = require("express");
const templateService = require("../services/templates");
const authMiddleware = require("../middleware/auth");
const router = express.Router();
const authorizeRole = require('../middleware/authorizeRole');

/**
 * @swagger
 * /api/templates:
 *   get:
 *     summary: Lista todos os templates disponíveis
 *     tags: [Template]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de templates retornada com sucesso
 *       500:
 *         description: Erro ao listar templates
 */
router.get("/templates", authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const templates = await templateService.listarTemplates();
    res.status(200).json(templates);
  } catch (error) {
    console.error("Erro ao listar templates:", error);
    res.status(500).json({ error: "Erro ao listar templates" });
  }
});

/**
 * @swagger
 * /api/templates/{id}:
 *   get:
 *     summary: Obtém os detalhes de um template pelo ID
 *     tags: [Template]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Template encontrado
 *       404:
 *         description: Template não encontrado
 *       500:
 *         description: Erro ao buscar template
 */
router.get("/templates/:id", authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const { id } = req.params;
    const template = await templateService.obterTemplatePorId(id);

    if (!template) {
      return res.status(404).json({ error: "Template não encontrado" });
    }

    res.status(200).json(template);
  } catch (error) {
    console.error("Erro ao buscar template:", error);
    res.status(500).json({ error: "Erro ao buscar template" });
  }
});

/**
 * @swagger
 * /api/templates/clonar/{id}:
 *   post:
 *     summary: Clona um template e cria um novo módulo associado ao usuário
 *     tags: [Template]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Template clonado com sucesso
 *       404:
 *         description: Template não encontrado
 *       500:
 *         description: Erro ao clonar template
 */
router.post("/templates/clonar/:id", authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const { id } = req.params;
    const usuarioId = req.user.id;
    const novoModulo = await templateService.clonarTemplate(id, usuarioId);

    if (!novoModulo) {
      return res.status(404).json({ error: "Template não encontrado" });
    }

    res.status(201).json(novoModulo);
  } catch (error) {
    console.error("Erro ao clonar template:", error);
    res.status(500).json({ error: "Erro ao clonar template" });
  }
});

/**
 * @swagger
 * /api/template/modulo/{id}:
 *   patch:
 *     summary: Atualiza o status de template de um módulo
 *     tags: [Template]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - template
 *             properties:
 *               template:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status de template atualizado com sucesso
 *       400:
 *         description: Campo "template" obrigatório
 *       404:
 *         description: Módulo não encontrado
 *       500:
 *         description: Erro ao atualizar status
 */
router.patch("/template/modulo/:id", authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { template } = req.body;

    if (template === undefined) {
      return res
        .status(400)
        .json({ error: 'O campo "template" é obrigatório' });
    }

    const moduloAtualizado = await templateService.atualizarStatusTemplate(
      id,
      template
    );

    if (!moduloAtualizado) {
      return res.status(404).json({ error: "Módulo não encontrado" });
    }

    res.status(200).json(moduloAtualizado);
  } catch (error) {
    console.error("Erro ao atualizar status de template:", error);
    res.status(500).json({ error: "Erro ao atualizar status de template" });
  }
});

module.exports = router;
