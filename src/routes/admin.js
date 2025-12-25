const express = require('express');
const router = express.Router();

router.get('/dashboard',
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        message: 'Адміністративна панель',
        stats: {
          totalUsers: 0,
          totalProducts: 0,
          activeSessions: 0
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при отриманні даних',
        error: error.message
      });
    }
  }
);

module.exports = router;