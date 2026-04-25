const express = require('express');
const router = express.Router();
const { enviarMensagemParaAgente} = require('../services/agenteIA');
const authMiddleware = require('../middleware/auth');

router.post("/enviar-mensagem-agente", authMiddleware, async(req, res) => {
    try {
        const { mensagem, nomeModulo, idModulo, sessionId } = req.body;
        
        if (!mensagem || !nomeModulo || !idModulo || !sessionId)  {
            return res.status(400).json({error: 'Parâmetros necessários estão ausentes!'});
        }

        const dados = await enviarMensagemParaAgente(mensagem, nomeModulo ,idModulo, sessionId);

        if (!dados) return res.status(400).json({ error: 'Erro ao fazer enviar mensagem para o Agente de IA'})

        return res.status(200).json({ message: 'Mensagem enviada com sucesso', dados })

    } catch (error) {
        console.error(error);
        return res.status(500).json({message: 'Erro ao enviar mensagem para o agente de IA'});
    }
})

module.exports = router