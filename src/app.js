require('dotenv').config();
const express = require('express');
const cors = require('cors');
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
const swaggerUi = require('swagger-ui-express');
const swaggerSpec = require('./config/swagger');



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

module.exports = app;