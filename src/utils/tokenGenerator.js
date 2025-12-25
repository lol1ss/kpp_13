const jwt = require('jsonwebtoken');

const generateToken = (userId) => {
  const token = jwt.sign(
    { 
      userId,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60) // 24 години
    },
    process.env.JWT_SECRET || 'default_jwt_secret_key_change_in_production',
    { algorithm: 'HS256' }
  );
  
  return token;
};

const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'default_jwt_secret_key_change_in_production'
    );
    return decoded;
  } catch (error) {
    return null;
  }
};

const generateRefreshToken = (userId) => {
  const refreshToken = jwt.sign(
    { 
      userId,
      type: 'refresh',
      iat: Math.floor(Date.now() / 1000)
    },
    process.env.JWT_REFRESH_SECRET || 'default_refresh_secret_key_change_in_production',
    { expiresIn: '7d' }
  );
  
  return refreshToken;
};

module.exports = {
  generateToken,
  verifyToken,
  generateRefreshToken
};