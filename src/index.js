require('dotenv').config();

const app = require('./app');
const { sequelize } = require('./db/connect');
const bcrypt = require('bcrypt');
const { Usuario } = require('./models');
const cron = require('node-cron');
const { UsuarioTemporario } = require('./models');
const { Op } = require('sequelize');

const PORT = 8001;

// limpa os registros de usuários temporários a cada 30 minutos
cron.schedule('*/30 * * * *', async ()=>{
    try {
      const deleted = await UsuarioTemporario.destroy({
          where: {
            expiresAt: {
              [Op.lt]: new Date()
            }
          }
      })
      console.log(`Cron: ${deleted} registro(s) expirados removidos.`);
    } catch (error) {
      console.error('Erro ao executar cron job:', error);
    }
})

// Inicializa o servidor e cria um administrador padrão se não existir
const setup = async () => {

  const adminExists = await Usuario.findOne({ where: { tipo: 'adm' } });
  if (!adminExists) {
    const hashedPassword = await bcrypt.hash('admin123', 10); 
    await Usuario.create({
      username: 'Adm',
      email: 'adm@admin.com',
      senha: hashedPassword,
      tipo: 'adm'
    });
    console.log('Administrador padrão criado com sucesso.');
  }
  app.listen(PORT, '0.0.0.0', () => {
  console.log(`Servidor rodando na porta ${PORT}`);
  });

};

setup();


