const express = require("express");
const moduloService = require("../services/modulo");
const topicoService = require("../services/topico");
const router = express.Router();
const authMiddleware = require("../middleware/auth");

const path = require("path");
const authorizeRole = require("../middleware/authorizeRole");
const fs = require('fs')
const { validarPDF } = require('../utils/validarPDF');

const { montarUrlArquivo } = require('../utils/montarURL')
const upload = require('../config/upload');
const { validarConfirmacao } = require("../utils/validarConfirmacao");
const { isYoutubeEmbed } = require('../utils/validarEmbedYt');
const { enviarArquivoParaTreinamentoAgenteIA, excluirArquivoDeTreinamentoAgente  } = require("../services/treinamentoAgenteIA");
const crypto = require('crypto')

/**
 * @swagger
 * /api/modulo:
 *   post:
 *     summary: Cria um novo módulo
 *     tags: [Módulo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nome_modulo:
 *                 type: string
 *               video_inicial:
 *                 type: string
 *               ebookUrlGeral:
 *                 type: string
 *               nome_url:
 *                 type: string
 *               usuario_id:
 *                 type: integer
 *     responses:
 *       201:
 *         description: Módulo criado com sucesso
 *       400:
 *         description: Erro ao criar módulo
 */
router.post(
  "/modulo",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  (req, res) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {

        // limpar pasta se existir
        if (req.pastaId){
          const pastaPath = path.join(process.env.FILE_PATH, req.pastaId);

          if (fs.existsSync(pastaPath)){
            fs.rmSync(pastaPath, { recursive: true, force: true });
          }
        }

        // tratamento
        if (err.code === 'LIMIT_FILE_SIZE'){
          return res.status(400).json({ error: 'O arquivo excede o tamanho máximo permitido (10MB)'})
        }

        return res.status(400).json({ error: err.message });
      }

      try {
        const { nome_modulo, video_inicial, nome_url, usuario_id } = req.body;

        const isEmbedYt = isYoutubeEmbed(video_inicial);

        if (!isEmbedYt){
          return res.status(400).json({ error: 'O link deve ser um link incorporado do YouTube (embed)' })
        }

        if (!req.file) {
          return res.status(400).json({ error: 'Arquivo é obrigatório' });
        }

        if (!validarPDF(req.file.path)) {
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: 'Arquivo inválido' });
        }

        const caminhoRelativo = path.join(req.pastaId, req.file.filename);

        const modulo = await moduloService.criarModulo({
          nome_modulo,
          video_inicial,
          ebookUrlGeral: caminhoRelativo,
          nome_url,
          usuario_id,
          filesDoModulo: req.pastaId
        });

        await enviarArquivoParaTreinamentoAgenteIA(nome_modulo, modulo.id , req.file)

        res.status(201).json({ modulo });

      } catch (error) {
        if (req.file?.path) {
          fs.unlinkSync(req.file.path);
        }

        console.error("Erro ao criar módulo:", error);
        res.status(400).json({ error: error.message });
      }
    });
  }
);

/**
 * @swagger
 * /api/modulos:
 *   get:
 *     summary: Lista todos os módulos
 *     tags: [Módulo]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lista de módulos
 *       500:
 *         description: Erro ao listar módulos
 */
router.get(
  "/modulos",
  authMiddleware,
  authorizeRole(["adm"]),
  async (req, res) => {
    try {
      let page = parseInt(req.query.page)
      let quantidadeItens = parseInt(req.query.quantidadeItens)
      if (isNaN(page) || page < 1) page = 1;
      if (isNaN(quantidadeItens) || quantidadeItens < 0) quantidadeItens = 3

      const modulos = await moduloService.listarModulosPaginados(page, quantidadeItens);
      const infoModulos = await moduloService.infoPaginacaoModulos(quantidadeItens);
      
      const modulosFormatados = modulos.map(modulo => ({
      ...modulo.dataValues,
      ebookUrlGeral: montarUrlArquivo(modulo.ebookUrlGeral)
    }));

      res.status(200).json({ modulos: modulosFormatados, infoModulos });
    } catch (error) {
      console.error("Erro ao listar módulos:", error);
      res.status(500).json({ error: "Erro ao listar módulos" });
    }
  }
);



/**
 * @swagger
 * /api/modulos/{id}:
 *   put:
 *     summary: Atualiza um módulo
 *     tags: [Módulo]
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
 *     responses:
 *       200:
 *         description: Módulo atualizado
 *       404:
 *         description: Módulo não encontrado
 */
router.put(
  "/modulos/:id",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  
  async (req, res) => {
    upload.single("file")(req, res, async (err) => {
      if (err) {
        // limpa pasta temporária se existir
        if (req.pastaId) {
          const pastaPath = path.join(process.env.FILE_PATH, req.pastaId);

          if (fs.existsSync(pastaPath)) {
            fs.rmSync(pastaPath, { recursive: true, force: true });
          }
        }

        if (err.code === 'LIMIT_FILE_SIZE') {
          return res.status(400).json({
            error: 'O arquivo excede o tamanho máximo permitido (10MB).'
          });
        }

        return res.status(400).json({ error: err.message });

      }

    try {
      const { id } = req.params;
      const dadosAtualizados = req.body;

      if (dadosAtualizados.video_inicial){
        const isEmbedYt = isYoutubeEmbed(dadosAtualizados.video_inicial);
        if (!isEmbedYt){
          return res.status(400).json({ error: 'O link deve ser um link incorporado do YouTube (embed)' })
        }
      }

      const moduloAtual = await moduloService.obterModuloPorId(id, req.user);

      if (!moduloAtual) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }

      // caminho do arquivo antigo, mantém se não tiver novo arquivo
      let caminhoArquivo = moduloAtual.ebookUrlGeral;

      let pastaId = moduloAtual.filesDoModulo;

      // se o arquivo existir
      if (req.file){
        // valida se o formato é PDF 
        if (!validarPDF(req.file.path)){
          fs.unlinkSync(req.file.path);
          return res.status(400).json({ error: "Arquivo inválido" });
        }

        // exclui arquivo de treinamento antigo
        try {
          await excluirArquivoDeTreinamentoAgente(moduloAtual.id);
        } catch (error) {
          console.warn("Falha ao excluir no n8n (ignorando)", error.message);
        }

        // envia novo arquivo de treinamento
        const resposta = await enviarArquivoParaTreinamentoAgenteIA(
          moduloAtual.nome_modulo,
          moduloAtual.id,
          req.file
        )

        if (!resposta) return res.status(400).json({ message: 'Erro ao atualizar arquivo de treinamento' })

        // se caminho da pasta não existir, gera um novo
        if (!pastaId) {
          pastaId = crypto.randomUUID();
        }

        const pastaDestino = path.join(process.env.FILE_PATH, pastaId);

        // cria a pasta se não existir
        fs.mkdirSync(pastaDestino, { recursive: true });

        // caminho em que a ficará o novo arquivo
        const destinoFinal = path.join(
          pastaDestino,
          req.file.filename
        );

        console.log("req.file.path:", req.file.path);
        console.log("existe origem?", fs.existsSync(req.file.path))

        if(fs.existsSync(req.file.path)){
          // move o arquivo para a pasta correta
          fs.renameSync(req.file.path, destinoFinal)
        } else {
          console.warn("Arquivo de origem não existe!")
        }

        // remove pasta temporária criada pelo multer
        const pastaTemp = path.dirname(req.file.path);
        if (fs.existsSync(pastaTemp)) {
          fs.rmSync(pastaTemp, { recursive: true, force: true });
        }

        const novoCaminhoRelativo = path.join(pastaId, req.file.filename);

        if (moduloAtual.ebookUrlGeral){
          const caminhoAntigo = path.join(process.env.FILE_PATH, moduloAtual.ebookUrlGeral)

          if (fs.existsSync(caminhoAntigo)) {
            fs.unlinkSync(caminhoAntigo);
          }
        }

        caminhoArquivo = novoCaminhoRelativo;
      }

      const moduloAtualizado = await moduloService.atualizarModulo(
        id,
        {
          ...dadosAtualizados,
          ebookUrlGeral: caminhoArquivo,
          filesDoModulo: pastaId
        },
        req.user
      );
      if (!moduloAtualizado) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }
      res.status(200).json(moduloAtualizado);
    } catch (error) {
      console.error("Erro ao atualizar módulo:", error);
      res.status(500).json({ error: "Erro ao atualizar módulo" });
    }
  })
  }
);

/**
 * @swagger
 * /api/modulos/{id}:
 *   delete:
 *     summary: Deleta um módulo
 *     tags: [Módulo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
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
 *         description: Módulo deletado
 *       404:
 *         description: Módulo não encontrado
 */
router.delete(
  "/modulos/:id",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  async (req, res) => {
    try {
      // id do módulo
      const { id } = req.params;
      const { idUsuario, palavraConfirmacao } = req.query;

      
      const modulo = await moduloService.obterModuloPorId(id, req.user);

      if (!modulo){
        return res.status(404).json({ error: "Módulo não encontrado"});
      }

      const isValido = validarConfirmacao(palavraConfirmacao, modulo.nome_modulo);

      if (!isValido) {
        return res.status(400).json({ error: 'Confirmação inválida'})
      }

      const pastaPath = path.join(process.env.FILE_PATH, modulo.filesDoModulo);

      // await moduloService.deletarModulo(idAdm, senhaAdm, id);
      await moduloService.deletarModulo(idUsuario, id)

      if (fs.existsSync(pastaPath)){
        fs.rmSync(pastaPath, { recursive: true, force: true})
      }

      try {
        await excluirArquivoDeTreinamentoAgente(id);
      } catch (error) {
          console.warn("Falha ao excluir no n8n (ignorando)", error.message);
      }
    

      res.status(200).json({ message: "Módulo deletado com sucesso" });
    } catch (error) {
      console.log(error)
      res.status(error.status || 500).json({ error: error.message || "Erro ao deletar módulo" });
    }
  }
);

/**
 * @swagger
 * /api/modulos/{id}/publicar:
 *   patch:
 *     summary: Atualiza o status de publicação do módulo
 *     tags: [Módulo]
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
 *             properties:
 *               publicar:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Status atualizado
 *       404:
 *         description: Módulo não encontrado
 */
router.patch(
  "/modulos/:id/publicar",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const { publicar } = req.body;

      if (publicar === undefined) {
        return res
          .status(400)
          .json({ error: 'O campo "publicar" é obrigatório' });
      }

      const moduloAtualizado = await moduloService.atualizarStatusPublicacao(
        id,
        publicar,
        req.user
      );

      if (!moduloAtualizado) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }

      res.status(200).json(moduloAtualizado);
    } catch (error) {
      console.error("Erro ao alterar status de publicação:", error);
      res.status(500).json({ error: "Erro ao alterar status de publicação" });
    }
  }
);

/**
 * @swagger
 * /api/modulo/{id}:
 *   get:
 *     summary: Obtém um módulo por ID com seus tópicos
 *     tags: [Módulo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Módulo retornado com sucesso
 *       404:
 *         description: Módulo não encontrado
 */
router.get(
  "/modulo/:id",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      const modulo = await moduloService.obterModuloPorIdESeusTopicos(id, req.user);
      if (!modulo) {
        return res.status(404).json({ error: "Módulo não encontrado" });
      }

      modulo.ebookUrlGeral = montarUrlArquivo(modulo.ebookUrlGeral);
      modulo.Topicos.map(topico => {
        topico.ebookUrlGeral = montarUrlArquivo(topico.ebookUrlGeral)
      })

      console.log('teste' ,modulo)

      res.status(200).json(modulo);
    } catch (error) {
      console.error("Erro ao buscar módulo:", error);
      res.status(500).json({ error: "Erro ao buscar módulo: " + error });
    }
  }
);

/**
 * @swagger
 * /api/modulos/usuario/{id}:
 *   get:
 *     summary: Lista módulos por usuário
 *     tags: [Módulo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         schema:
 *           type: integer
 *         required: true
 *     responses:
 *       200:
 *         description: Módulos encontrados
 *       404:
 *         description: Nenhum módulo encontrado
 */
router.get(
  "/modulos/usuario/:id",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  async (req, res) => {
    try {
      const { id } = req.params;
      let page = parseInt(req.query.page)
      if (isNaN(page) || page < 1) page = 1;
      const modulos = await moduloService.obterModulosPaginadosPorUsuario(id, page);

      if (!modulos || modulos.length === 0) {
        return res
          .status(404)
          .json({ message: "Nenhum módulo encontrado para este usuário." });
      }

      const infoModulos = await moduloService.infoModulosPorUsuario(id);

      res.status(200).json({modulos, infoModulos });
    } catch (error) {
      console.error("Erro ao obter módulos por usuário:", error);
      res.status(500).json({ error: "Erro ao obter módulos por usuário." });
    }
  }
);

/**
 * @swagger
 * /api/modulos/upload:
 *   post:
 *     summary: Faz upload de um arquivo
 *     tags: [Módulo]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Arquivo salvo com sucesso
 *       500:
 *         description: Erro ao salvar arquivo
 */
// router.post(
//   "/modulos/upload",
//   authMiddleware,
//   upload.single("file"),
//   authorizeRole(["adm", "professor"]),
//   async (req, res) => {
//     try {
//       const nomeModulo = req.body.nomeModulo || 'sem-nome-modulo';
//       const uploadPath = path.join(process.env.FILE_PATH, nomeModulo) 

//       console.log(nomeModulo)
//       console.log(uploadPath)

//       fs.mkdirSync(uploadPath, { recursive: true });
//       fs.writeFileSync(path.join(uploadPath, req.file.originalname), req.file.buffer);

//       res.status(200).json({
//         message: "Arquivo salvo com sucesso",
//         filePath: path.join(process.env.FILE_PATH, nomeModulo, req.file.originalname),
//         fileName: req.file.originalname,
//       });
//     } catch (error) {
//       console.error("Erro ao salvar arquivo:", error);
//       res.status(500).json({ error: "Arquivo não foi salvo" });
//     }
//   }
// );

/**
 * @swagger
 * /api/modulos/file/{name}:
 *   get:
 *     summary: Retorna um arquivo pelo nome
 *     tags: [Módulo]
 *     parameters:
 *       - name: name
 *         in: path
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Arquivo retornado
 */
router.get("/modulos/file/:modulo/:file", (req, res) => {
  const { modulo, file } = req.params;

  const safeModulo = modulo.replace(/[^a-zA-Z0-9-_]/g, '');
  const safeFile = file.replace(/[^a-zA-Z0-9-_.]/g, '');

  const filePath = path.join(process.env.FILE_PATH, safeModulo, safeFile);

  res.sendFile(filePath, (err) => {
    if (err) {
      return res.status(404).json({ error: "Arquivo não encontrado" });
    }
  });
});

/**
 * @swagger
 * /api/modulos/{id}/alunos-progresso:
 *   get:
 *     summary: Lista o progresso dos alunos de um módulo específico
 *     tags: [Módulo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - name: id
 *         in: path
 *         required: true
 *         schema:
 *           type: integer
 *       - name: nome
 *         in: query
 *         schema:
 *           type: string
 *         description: Nome do aluno (filtro opcional)
 *       - name: ativo
 *         in: query
 *         schema:
 *           type: boolean
 *         description: Filtrar por status ativo
 *       - name: progressoMin
 *         in: query
 *         schema:
 *           type: number
 *       - name: notaMin
 *         in: query
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Lista de alunos com progresso
 *       400:
 *         description: Erro ao buscar progresso
 */
router.get(
  "/modulos/:id/alunos-progresso",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  async (req, res) => {
    try {
      let page = parseInt(req.query.page)
      if (isNaN(page) || page < 1) page = 1;
      console.log(page)

      const filtros = {
        nome: req.query.nome,
        email: req.query.email,
        ativo:
          req.query.ativo !== undefined
            ? req.query.ativo === "true"
            : undefined,
        progressoMin: req.query.progressoMin,
        notaMin: req.query.notaMin,
      };

      const alunos= await moduloService.getProgressoAlunosPorModulo(
        req.params.id,
        filtros,
        page
      );
      const infoAlunos = await moduloService.infoPaginacaoAlunos(req.params.id)
      res.status(200).json({ alunos, infoAlunos});
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

/**
 * @swagger
 * /api/modulos/alunos/{id}:
 *   put:
 *     summary: Atualiza os dados de um aluno dentro de um módulo
 *     tags: [Módulo]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: ID do registro na tabela UsuarioModulo
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               nota:
 *                 type: number
 *                 description: "Nota final do aluno no módulo"
 *               progresso:
 *                 type: number
 *                 description: "Porcentagem de progresso no módulo"
 *               avaliacao:
 *                 type: integer
 *                 description: "Avaliação numérica (ex: estrelas de 1 a 5)"
 *               comentario:
 *                 type: string
 *                 description: "Comentário geral do aluno no módulo"
 *               ativo:
 *                 type: boolean
 *                 description: "Status ativo ou inativo no módulo"
 *     responses:
 *       200:
 *         description: Registro de progresso do aluno atualizado com sucesso
 *       404:
 *         description: Registro de aluno no módulo não encontrado
 *       400:
 *         description: Erro ao atualizar o registro
 */
router.put(
  "/modulos/alunos/:id",
  authMiddleware,
  authorizeRole(["adm", "professor"]),
  async (req, res) => {
    try {
      const atualizado = await moduloService.atualizarUsuarioModulo(
        req.params.id,
        req.body
      );
      if (!atualizado)
        return res
          .status(404)
          .json({ error: "Registro de aluno no módulo não encontrado" });
      res.status(200).json(atualizado);
    } catch (error) {
      res.status(400).json({ error: error.message });
    }
  }
);

module.exports = router;
