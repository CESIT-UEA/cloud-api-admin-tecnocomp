require('dotenv').config();
const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const fs = require('fs');
const https = require('https');
const { sequelize } = require('./db/connect');
const { Usuario } = require('./models');
const path = require('path')

const authRoutes = require('./routes/auth');
const plataformaRoutes = require('./routes/plataforma');
const moduloRoutes = require('./routes/modulo');
const usersRoutes = require('./routes/users');
const topicoRoutes = require('./routes/topico');
const templateRoutes = require('./routes/templates');
const fichaTecnicaRoutes = require('./routes/fichaTecnica');
const equipeRoutes = require('./routes/equipe');
const membroRoutes = require('./routes/membro');
const vantagemRoutes = require('./routes/vantagem');
const referenciasModuloRoutes = require('./routes/referenciaModulo');
const alunoRoutes = require('./routes/aluno');
const autoRegister = require('./routes/autoRegister')
const forgotPassword = require('./routes/forgotPassword')
const exercicioRoutes = require('./routes/exercicios')

const app = express();
const PORT = 8001;
const SECRET_KEY = 'your_secret_key'; 
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');

const cron = require('node-cron')

const { UsuarioTemporario } = require('./models')
const { Op } =  require('sequelize')


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


let sslOptions;

if (process.env.PRODUCAO_VARIAVEL == 'true') {
  sslOptions = {
    key: fs.readFileSync("/certs/uea.edu.br.key"),
    cert: fs.readFileSync("/certs/uea.edu.br.fullchain.crt"),
  }; 
}

app.use((req, res, next) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  next();
});
app.use(express.json());
app.use(express.urlencoded({ extended: true }))
app.use(
  cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true,
  })
);

// app.use('/ebooks', express.static(process.env.FILE_PATH))

app.use('/ebooks', express.static(process.env.FILE_PATH, {
  setHeaders: (res, filePath) => {
    if (path.extname(filePath) === '.pdf') {
      res.setHeader('Content-Type', 'application/pdf');
    }
  }
}));

// Rotas
app.use('/auth', authRoutes);
app.use('/api', plataformaRoutes);
app.use('/api', moduloRoutes);
app.use('/api', usersRoutes);
app.use('/api', topicoRoutes);
app.use('/api', templateRoutes);
app.use('/api', fichaTecnicaRoutes);
app.use('/api', equipeRoutes);
app.use('/api', membroRoutes);
app.use('/api', vantagemRoutes);
app.use('/api', referenciasModuloRoutes);
app.use('/api', alunoRoutes);
app.use('/api', autoRegister);
app.use('/api', forgotPassword)
app.use('/api', exercicioRoutes);
app.use('/api', autoRegister);



app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));
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

module.exports = app;
