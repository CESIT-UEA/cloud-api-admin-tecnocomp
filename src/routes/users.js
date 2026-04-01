const express = require("express");
const router = express.Router();
const userService = require("../services/usuario");
const moduloService = require("../services/modulo");
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');

/**
 * @swagger
 * /api/listar-usuarios:
 *   get:
 *     summary: Lista todos os usuários
 *     tags: [Usuário]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de usuários retornada
 *       400:
 *         description: Erro na requisição
 */
router.get("/listar-usuarios", authMiddleware,authorizeRole(['adm']), async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    if (isNaN(page) || page < 1) page = 1;
    const users = await userService.getDadosUserPaginados(page);
    const infoUsers = await userService.infoPaginacaoUsuarios(); 
    res.status(200).json({ users, infoUsers });
  } catch (error) {
    console.error(error);
    res.status(400).json({ error: error.message });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   get:
 *     summary: Obtém um usuário por ID
 *     tags: [Usuário]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do usuário
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Usuário encontrado
 *       404:
 *         description: Usuário não encontrado
 *       500:
 *         description: Erro interno
 */
router.get("/users/:id", authMiddleware,authorizeRole(['adm']), async (req, res) => {
  try {
    const { id } = req.params;
    const user = await userService.getDadosUserById(id);
    if (!user) {
      return res.status(404).json({ message: "Usuário não encontrado" });
    }
    res.status(200).json(user);
  } catch (error) {
    console.error("Erro ao buscar usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

/**
 * @swagger
 * /api/users/{id}:
 *   put:
 *     summary: Atualiza dados de um usuário (Admin)
 *     tags: [Usuário]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do usuário a ser atualizado
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
 *               - idAdm
 *               - senhaAdm
 *               - username
 *               - email
 *               - tipo
 *             properties:
 *               idAdm:
 *                 type: integer
 *               senhaAdm:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *               tipo:
 *                 type: string
 *     responses:
 *       200:
 *         description: Usuário atualizado
 *       401:
 *         description: Não autorizado
 *       500:
 *         description: Erro interno
 */
router.put("/users/:id", authMiddleware,authorizeRole(['adm']), async (req, res) => {
  try {
    const { idAdm, senhaAdm, username, email, tipo } = req.body;
    const idEditar = req.params.id;
    const result = await userService.updateUser(idAdm, senhaAdm, username, email, tipo, idEditar);

    if (result === false) {
      return res.status(401).json({ message: "Usuário não autorizado" });
    }

    res.status(200).json({ message: "Usuário atualizado com sucesso" });
  } catch (error) {
    console.error("Erro ao atualizar usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor" });
  }
});

/**
 * @swagger
 * /api/users:
 *   delete:
 *     summary: Exclui um usuário (Admin)
 *     tags: [Usuário]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - idAdm
 *               - senhaAdm
 *               - idExcluir
 *             properties:
 *               idAdm:
 *                 type: integer
 *               senhaAdm:
 *                 type: string
 *               idExcluir:
 *                 type: integer
 *     responses:
 *       200:
 *         description: Usuário excluído
 *       403:
 *         description: Permissão negada
 *       500:
 *         description: Erro interno
 */
router.delete("/users", authMiddleware,authorizeRole(['adm']), async (req, res) => {
  try {
    const { idAdm, senhaAdm, idExcluir } = req.body;
    const result = await userService.deleteUser(idAdm, senhaAdm, idExcluir);

    if (result === false) {
      return res.status(403).json({ message: "Permissão negada ou dados inválidos." });
    }

    res.status(200).json({ message: `Usuário com ID ${idExcluir} excluído com sucesso.` });
  } catch (error) {
    console.error("Erro ao excluir usuário:", error);
    res.status(500).json({ message: "Erro interno do servidor." });
  }
});

/**
 * @swagger
 * /api/users/{id}/self:
 *   patch:
 *     summary: Atualiza dados do próprio usuário (perfil)
 *     tags: [Usuário]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         description: ID do próprio usuário
 *         required: true
 *         schema:
 *           type: integer
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               senhaAtual:
 *                 type: string
 *               novaSenha:
 *                 type: string
 *               username:
 *                 type: string
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado
 *       401:
 *         description: Senha incorreta ou não autorizado
 *       500:
 *         description: Erro ao atualizar perfil
 */
router.patch('/users/:id/self', authMiddleware,authorizeRole(['adm','professor']), async (req, res) => {
  try {
    const { id } = req.params;
    const { senhaAtual, novaSenha, username, email } = req.body;

    const resultado = await userService.atualizarPerfil(id, { senhaAtual, novaSenha, username, email });

    console.log(resultado)
    if (!resultado.sucesso) {
      return res.status(401).json({ error: "Senha incorreta ou Não Autorizado" });
    }

    res.json({ message: resultado.mensagem });
  } catch (error) {
    console.error('Erro ao atualizar perfil:', error);
    res.status(500).json({ error: 'Erro ao atualizar perfil.' });
  }
});

router.get("/templates", authMiddleware,authorizeRole(['professor', 'adm']), async (req, res) => {
  try {
    const templates = await moduloService.listarModulosTemplates();
    res.status(200).json(templates);
  } catch (error) {
    console.error("Erro ao listar templates:", error);
    res.status(500).json({ error: "Erro ao listar templates" });
  }
});
module.exports = router;
