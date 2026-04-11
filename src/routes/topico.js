const express = require('express');
const topicoService = require('../services/topico');
const router = express.Router();
const authMiddleware = require('../middleware/auth');
const authorizeRole = require('../middleware/authorizeRole');
const multer = require('multer');
const moduloService = require('../services/modulo');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const { validarPDF } = require('../utils/validarPDF');
const { montarUrlArquivo } = require('../utils/montarURL');
const { validarConfirmacao } = require('../utils/validarConfirmacao');

const storageTopico = multer.diskStorage({
  destination: async (req, file, cb) => {
    try {
      const { id_modulo } = req.body;
      
      const modulo = await moduloService.obterModuloPorId(id_modulo, req.user);

      if (!modulo){
        return cb(new Error('Módulo não encontrado'), null);
      }

      const pastaId = modulo.filesDoModulo;

      const uploadPath = path.join(process.env.FILE_PATH, pastaId);

      fs.mkdirSync(uploadPath, { recursive: true });
      
      req.pastaId = pastaId

      cb(null, uploadPath);
    } catch (err) {
      cb(err, null)
    }
  },
  filename: (req, file, cb) => {
    const extensao = path.extname(file.originalname).toLowerCase();
    const nomeArquivo = crypto.randomUUID();
    
    cb(null, `${nomeArquivo}${extensao}`);
  }
})

const uploadTopico = multer({
  storage: storageTopico,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();

    if (file.mimetype !== "application/pdf" || ext !== ".pdf") {
      return cb(new Error("Apenas PDFs são permitidos"));
    }

    cb(null, true);
  }
});


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

    topico.map(topico => {
        topico.ebookUrlGeral = montarUrlArquivo(topico.ebookUrlGeral)
    })

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
router.post(
  '/topicos', 
  authMiddleware,
  authorizeRole(['adm','professor']),
  async (req, res) => {
    uploadTopico.single('file')(req, res, async(err) => {
      if (err) {
        if (req.pastaId) {
          const pastaPath = path.join(process.env.FILE_PATH, req.pastaId);

          if (fs.existsSync(pastaPath)) {
            fs.rmSync(pastaPath, { recursive: true, force: true });
          }
        }

        if (err instanceof multer.MulterError) {

          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'O arquivo excede o tamanho máximo permitido (10MB).'
            });
          }

          return res.status(400).json({ error: err.message });
        }

      return res.status(500).json({ error: 'Erro no upload do arquivo.' });
    }
    try {
      const dadosTopico = req.body;

      dadosTopico.videoUrls = JSON.parse(dadosTopico.videoUrls || '[]');
      dadosTopico.saibaMais = JSON.parse(dadosTopico.saibaMais || '[]');
      dadosTopico.exercicios = JSON.parse(dadosTopico.exercicios || '[]');

      if (!dadosTopico.id_modulo || !dadosTopico.nome_topico) {
        return res.status(400).json({ error: 'Campos obrigatórios estão ausentes' });
      }

      let caminhoArquivo = null;

      if (req.file){
        if (!validarPDF(req.file.path)){
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Arquivo inválido'})
        }

        caminhoArquivo = path.join(req.pastaId, req.file.filename);

      }

      const novoTopico = await topicoService.criarTopico({...dadosTopico, ebookUrlGeral: caminhoArquivo});
      res.status(201).json(novoTopico);
    } catch (error) {
      console.error('Erro ao criar tópico:', error);
      // rollback
        if (req.file?.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {}
        }
      res.status(400).json({ error: error.message });
    }
  })  
 }
);

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
router.put(
  '/topico/:id', 
  authMiddleware,
  authorizeRole(['adm','professor']), 
  async (req, res) => {
    uploadTopico.single('file')(req, res, async(err) => {
      if (err) {
         // limpa arquivo temporário se existir
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }

        if (err instanceof multer.MulterError) {

          if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
              error: 'O arquivo excede o tamanho máximo permitido (10MB).'
            });
          }

          return res.status(400).json({ error: err.message });
        }

      return res.status(500).json({ error: 'Erro no upload do arquivo.' });
    }
    try {
      const { id } = req.params;

      const videoUrls = JSON.parse(req.body.videoUrls || '[]');
      const saibaMais = JSON.parse(req.body.saibaMais || '[]');
      const exercicios = JSON.parse(req.body.exercicios || '[]');

      const dadosAtualizados = {
          ...req.body,
          videoUrls,
          saibaMais,
          exercicios
      };

      const topicoAtual = await topicoService.obterTopicoPorId(id, req.user);

      if (!topicoAtual) {
        return res.status(404).json({ error: 'Tópico não encontrado' });
      }

      let caminhoArquivo = topicoAtual.ebookUrlGeral;

      if (req.file){
        
        if (!validarPDF(req.file.path)){
          fs.unlinkSync(req.file.path)
          return res.status(400).json({ error: 'Arquivo inválido'})
        }

        // caminho relativo novo
        caminhoArquivo = path.join(req.pastaId, req.file.filename);

        // deletar arquivo antigo
        if (topicoAtual.ebookUrlGeral) {
          const caminhoAntigo = path.join(process.env.FILE_PATH, topicoAtual.ebookUrlGeral);

          if (fs.existsSync(caminhoAntigo)){
            fs.unlinkSync(caminhoAntigo)
          }
        }
      }

      const topico = await topicoService.editarTopico(id, {
            ...dadosAtualizados,
            ebookUrlGeral: caminhoArquivo
      }, req.user);

      if (!topico) {
        return res.status(404).json({ error: 'Tópico não encontrado' });
      }

      res.status(200).json(topico);
    } catch (error) {
      console.error('Erro ao editar tópico:', error);

      if (req.file?.path) {
          try {
            fs.unlinkSync(req.file.path);
          } catch (e) {}
      }

        res.status(500).json({ error: error.message });
      }
    }
  )
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
    const { idUsuario, palavraConfirmacao } = req.query;

    const topico = await topicoService.obterTopicoPorId(id, req.user);

    if (!topico) {
      return res.status(404).json({ error: 'Tópico não encontrado' });
    }

    const isValido = validarConfirmacao(palavraConfirmacao, topico.nome_topico);

    if (!isValido){
      return res.status(400).json({ error: 'Confirmação inválida' })
    }

    const caminhoArquivo = topico.ebookUrlGeral;

    await topicoService.excluirTopico(id, idUsuario);

    if (caminhoArquivo) {
      const caminhoCompleto = path.join(process.env.FILE_PATH, caminhoArquivo);

      if (fs.existsSync(caminhoCompleto)) {
        fs.unlinkSync(caminhoCompleto);
      }
    }
    
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

      topico.ebookUrlGeral = montarUrlArquivo(topico.ebookUrlGeral);
      console.log(topico)
      return res.status(200).json(topico);
    } catch (error) {
      console.error('Erro ao obter tópico:', error);
      return res.status(500).json({ error: 'Erro ao obter tópico' });
    }
  }
);

module.exports = router;
