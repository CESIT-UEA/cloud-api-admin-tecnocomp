const express = require('express');
const { enviarCodigoEmail, gerarCodigoEmail } = require('../utils/validarEmail');
const { createUser } = require('../services/usuario');
const { Usuario, UsuarioTemporario } = require('../models');
const router = express.Router();

router.post('/autoRegister', async (req, res)=>{
  try{
    const { nome, email, senha } = req.body;

    const emailExistente = await Usuario.findOne({where: { email }});
    if (emailExistente) {
      return res.status(400).json({ message: "Este E-mail já está sendo utilizado.", sucess: false });
    }

    await UsuarioTemporario.destroy({where: {email}})

    const {isUserTemporario, codigoEmail} = await createUser(nome, email, senha, 'professor', true)
    
    if (isUserTemporario){
        try {
          await enviarCodigoEmail(email, codigoEmail);
        } catch (err) {
          await UsuarioTemporario.destroy({ where: { email } });
          
          return res.status(500).json({
            message: 'Erro ao enviar email'
          });
      }
    }
    
    res.status(200).json({ message: `Código de verificação enviado por E-mail!`, sucess: true });
  } catch{
    res.status(400).json({message: "Erro ao enviar código para email"})
  }
})


router.post('/valida_autoRegister', async (req, res)=>{
  try {
    const {email, codigo} = req.body
    const temporario = await UsuarioTemporario.findOne({where: {email}})
    
    if (!temporario){
      return res.status(400).json({ message: 'Nenhum cadastro pendente encontrado' });
    }

    const usuario = temporario.dataValues

    if (usuario.verificationCode !== codigo){
      return res.status(400).json({ message: 'Código inválido' });
    }

    if (usuario.expiresAt < new Date()){
      return res.status(400).json({ message: 'Código expirado' });
    }

    await createUser(usuario.username, usuario.email, usuario.senha, usuario.tipo, false)
    await UsuarioTemporario.destroy({where: {email}})

    res.status(201).json({ message: 'Usuário criado com sucesso!' });
  } catch (error) {
      console.error(error);
      res.status(500).json({ message: 'Erro interno' });
  }

})


router.post('/reenviar_codigo', async (req, res) => {
  try {

    const { email } = req.body;

    if (!email){
      return res.status(400).json({ message: 'Email é obrigatório!' })
    }

    const temporario = await UsuarioTemporario.findOne({ where: { email } });

    if (!temporario) {
      return res.status(400).json({ message: 'Nenhum cadastro pendente encontrado' });
    }

    const now = Date.now();
    const lastSent = temporario.lastSentAt ? new Date(temporario.lastSentAt.replace(' ', 'T') + 'Z').getTime() : null;
    const diff = now - lastSent;
    
    if (temporario.lastSentAt && diff < 60000){
      return res.status(429).json({ message: `Aguarde ${Math.ceil((60000 - diff)/1000)} segundos para reenviar o código` })
    }

    const codigoEmail = gerarCodigoEmail()
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

     try {
      await enviarCodigoEmail(email, codigoEmail);
    } catch (err) {
      return res.status(500).json({
        message: 'Erro ao enviar email'
      });
    }

    await UsuarioTemporario.update(
      {
        verificationCode: codigoEmail,
        expiresAt: expiresAt,
        lastSentAt: new Date() 
      },
      { where: { email } }
    )

    res.status(200).json({ message: 'Novo código enviado com sucesso!' });

  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Erro ao reenviar código' });
  }
})


module.exports = router;