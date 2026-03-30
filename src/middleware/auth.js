const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido ou mal formatado' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (!decoded.id || !decoded.tipo){
      return res.status(401).json({ error: 'Token inválido'})
    }

    req.user = {
      id: decoded.id,
      role: decoded.tipo
    };

    next();
  } catch (error) {
    console.error('Erro na autenticação JWT');
    return res.status(401).json({ error: 'Token inválido' });
  }
};
