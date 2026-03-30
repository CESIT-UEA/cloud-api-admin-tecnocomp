module.exports = function authorizeRole(rolesPermitidas) {
  return (req, res, next) => {
    if (!req.user || !req.user.role) {
      return res.status(401).json({ mensagem: 'Usuário não autenticado' });
    }

    if (!rolesPermitidas.includes(req.user.role)) {
      return res.status(403).json({ mensagem: 'Acesso negado: permissão insuficiente' });
    }
    next();
  };
};
