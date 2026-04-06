jest.mock('../../middleware/auth.js', () => {
  return (req, res, next) => {
    req.user = { id: 1, role: 'adm' };
    next();
  };
});

jest.mock('../../middleware/authorizeRole.js', () => {
  return () => (req, res, next) => next();
});

