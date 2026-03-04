const express = require("express");
const router = express.Router();
const fichaService = require("../services/ficha-tecnica");
const authMiddleware = require("../middleware/auth");
const authorizeRole = require("../middleware/authorizeRole");
const { clonarFichaTecnica } = require('../services/ficha-tecnica')
/**
 * @swagger
 * /api/ficha-tecnica/modulo/{modulo_id}:
 *   post:
 *     summary: Cria uma ficha técnica para um módulo
 *     tags: [Ficha Técnica]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: modulo_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       201:
 *         description: Ficha técnica criada
 *       500:
 *         description: Erro ao criar ficha técnica
 */
router.post(
  "/ficha-tecnica/modulo/:modulo_id",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  async (req, res) => {
    const { modulo_id } = req.params;
    try {
      const ficha = await fichaService.criarFichaTecnica(modulo_id);
      res.status(201).json(ficha);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/ficha-tecnica/modulo/{modulo_id}:
 *   get:
 *     summary: Retorna a ficha técnica de um módulo
 *     tags: [Ficha Técnica]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: modulo_id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *     responses:
 *       200:
 *         description: Ficha técnica retornada
 *       500:
 *         description: Erro ao buscar ficha técnica
 */
router.get(
  "/ficha-tecnica/modulo/:modulo_id",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  async (req, res) => {
    const { modulo_id } = req.params;
    try {
      const ficha = await fichaService.obterFichaPorModulo(modulo_id);
      if (ficha == null) {
        return res.status(200).json("Módulo sem ficha técnica");
      }
      res.status(200).json(ficha);
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  }
);


router.post("/ficha-tecnica/:modulo_atual_id/clonar/:modulo_id",authMiddleware,
  authorizeRole(["adm", "professor"]), async (req, res)=> {
  const { modulo_atual_id , modulo_id } = req.params;
  try {
    const resultado = await clonarFichaTecnica(modulo_atual_id, modulo_id)
  
    res.status(200).json(resultado)
  } catch (error) {
    res.status(401).json({'message': 'erro ao clonar'})
  }
})


module.exports = router;
