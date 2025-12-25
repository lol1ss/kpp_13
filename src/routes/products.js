const express = require('express');
const router = express.Router();
const { 
  validateRequest,
  productValidation,
  sanitizeInput,
  preventNoSQLInjection,
  objectIdValidation,
  paginationValidation
} = require('../middleware/validationMiddleware');

let products = [
  {
    id: '1',
    name: 'Телефон',
    description: 'Смартфон з високою продуктивністю',
    price: 15000,
    category: 'electronics',
    quantity: 10,
    createdAt: new Date().toISOString()
  },
  {
    id: '2',
    name: 'Книга',
    description: 'Цікава книга про програмування',
    price: 500,
    category: 'books',
    quantity: 25,
    createdAt: new Date().toISOString()
  }
];

router.get('/',
  sanitizeInput,
  preventNoSQLInjection,
  (req, res) => {
    try {
      res.status(200).json({
        success: true,
        count: products.length,
        products
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при отриманні продуктів',
        error: error.message
      });
    }
  }
);

router.get('/:id',
  sanitizeInput,
  preventNoSQLInjection,
  (req, res) => {
    try {
      const product = products.find(p => p.id === req.params.id);
      
      if (!product) {
        return res.status(404).json({
          success: false,
          message: 'Продукт не знайдений'
        });
      }
      
      res.status(200).json({
        success: true,
        product
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при отриманні продукту',
        error: error.message
      });
    }
  }
);

router.post('/',
  sanitizeInput,
  preventNoSQLInjection,
  validateRequest(productValidation),
  (req, res) => {
    try {
      const newProduct = {
        id: (products.length + 1).toString(),
        ...req.body,
        createdAt: new Date().toISOString()
      };
      
      products.push(newProduct);
      
      res.status(201).json({
        success: true,
        message: 'Продукт успішно створений',
        product: newProduct
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при створенні продукту',
        error: error.message
      });
    }
  }
);

router.put('/:id',
  sanitizeInput,
  preventNoSQLInjection,
  validateRequest(productValidation),
  (req, res) => {
    try {
      const productIndex = products.findIndex(p => p.id === req.params.id);
      
      if (productIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Продукт не знайдений'
        });
      }
      
      const updatedProduct = {
        ...products[productIndex],
        ...req.body,
        updatedAt: new Date().toISOString()
      };
      
      products[productIndex] = updatedProduct;
      
      res.status(200).json({
        success: true,
        message: 'Продукт успішно оновлений',
        product: updatedProduct
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при оновленні продукту',
        error: error.message
      });
    }
  }
);

router.delete('/:id',
  sanitizeInput,
  preventNoSQLInjection,
  (req, res) => {
    try {
      const productIndex = products.findIndex(p => p.id === req.params.id);
      
      if (productIndex === -1) {
        return res.status(404).json({
          success: false,
          message: 'Продукт не знайдений'
        });
      }
      
      const deletedProduct = products.splice(productIndex, 1)[0];
      
      res.status(200).json({
        success: true,
        message: 'Продукт успішно видалений',
        product: deletedProduct
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        message: 'Помилка при видаленні продукту',
        error: error.message
      });
    }
  }
);

module.exports = router;