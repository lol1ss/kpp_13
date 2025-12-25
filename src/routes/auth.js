const express = require('express');
const router = express.Router();
const userModel = require('../data/users');
const { 
  validateRequest, 
  registerValidation,
  sanitizeInput,
  preventNoSQLInjection 
} = require('../middleware/validationMiddleware');
const { generateToken } = require('../utils/tokenGenerator');

router.post('/login',
  sanitizeInput,
  preventNoSQLInjection,
  async (req, res) => {
    try {
      const { email, password } = req.body;

      if (!email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Email та пароль обов\'язкові'
        });
      }

      const user = userModel.findWithPassword(email);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Невірний email або пароль'
        });
      }

      const isPasswordValid = await userModel.verifyPassword(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({
          success: false,
          message: 'Невірний email або пароль'
        });
      }

      const token = generateToken(user.id);
      userModel.saveToken(user.id, token);

      const { password: _, ...userWithoutPassword } = user;

      res.status(200).json({
        success: true,
        message: 'Успішний вхід',
        token,
        user: userWithoutPassword
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при вході',
        error: error.message
      });
    }
  }
);

router.post('/register', 
  sanitizeInput,
  preventNoSQLInjection,
  validateRequest(registerValidation), 
  async (req, res) => {
    try {
      const { username, email, password } = req.body;
      
      const existingUser = userModel.findByEmail(email);
      if (existingUser) {
        return res.status(409).json({
          success: false,
          message: 'Користувач з таким email вже існує'
        });
      }
      
      const existingUsername = userModel.findByUsername(username);
      if (existingUsername) {
        return res.status(409).json({
          success: false,
          message: 'Користувач з таким іменем вже існує'
        });
      }
      
      const newUser = await userModel.create({
        username,
        email,
        password
      });
      
      const token = generateToken(newUser.id);
      userModel.saveToken(newUser.id, token);
      
      res.status(201).json({
        success: true,
        message: 'Користувач успішно зареєстрований',
        token,
        user: newUser
      });
      
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при реєстрації',
        error: error.message
      });
    }
  }
);

router.post('/logout',
  sanitizeInput,
  (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (token) {
        userModel.removeToken(token);
      }

      res.status(200).json({
        success: true,
        message: 'Успішний вихід'
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при виході',
        error: error.message
      });
    }
  }
);

router.get('/profile',
  sanitizeInput,
  preventNoSQLInjection,
  async (req, res) => {
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];

      if (!token) {
        return res.status(401).json({
          success: false,
          message: 'Токен відсутній'
        });
      }

      const user = userModel.findByToken(token);
      if (!user) {
        return res.status(401).json({
          success: false,
          message: 'Користувач не знайдений або токен недійсний'
        });
      }

      res.status(200).json({
        success: true,
        user
      });

    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при отриманні профілю',
        error: error.message
      });
    }
  }
);

module.exports = router;