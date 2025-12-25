const jwt = require('jsonwebtoken');
const userModel = require('../data/users');

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Токен відсутній'
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({
        success: false,
        message: 'Недійсний токен'
      });
    }

    const user = userModel.findById(decoded.userId);
    if (!user) {
      return res.status(403).json({
        success: false,
        message: 'Користувач не знайдений'
      });
    }

    req.user = user;
    next();
  });
};

const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Не авторизовано'
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: 'Недостатньо прав'
      });
    }

    next();
  };
};

module.exports = {
  authenticateToken,
  authorizeRoles
};