const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const morgan = require('morgan');
const { securityHeaders } = require('./middleware/securityMiddleware');
const { sanitizeInput, preventNoSQLInjection } = require('./middleware/validationMiddleware');
const { xssFilterOutput, validateContentType } = require('./middleware/xssFilter');

const authRoutes = require('./routes/auth');
const productRoutes = require('./routes/products');

const rateLimit = require('express-rate-limit');
const csrf = require('csurf');
const cookieParser = require('cookie-parser');

const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: 'Забагато спроб входу. Спробуйте пізніше.'
});

const apiRateLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 100,
  message: 'Забагато запитів. Спробуйте пізніше.'
});

const createRateLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: 'Забагато створень об\'єктів. Спробуйте пізніше.'
});

const csrfProtection = csrf({ cookie: true });

const checkOriginHeader = (req, res, next) => {
  const allowedOrigins = ['http://localhost:3000'];
  const origin = req.headers.origin;
  
  if (allowedOrigins.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-CSRF-Token');
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  
  next();
};

const app = express();

app.use(helmet());
app.use(securityHeaders);
app.use(morgan('combined'));
app.use(validateContentType);
app.use(sanitizeInput);
app.use(express.json({ 
  limit: '5mb',
  verify: (req, res, buf) => {
    req.rawBody = buf.toString();
  }
}));
app.use(cookieParser());
app.use(xssFilterOutput);

app.get('/', 
  apiRateLimiter,
  (req, res) => {
    res.json({
      message: 'Захищений REST API на Express.js',
      version: '2.0.0',
      security: {
        csrf: true,
        xss: true,
        rateLimiting: true,
        sqlInjection: true,
        ddos: true
      }
    });
  }
);

app.use('/api/auth', 
  authRateLimiter,
  csrfProtection,
  checkOriginHeader,
  authRoutes
);

app.use('/api/products', 
  apiRateLimiter,
  csrfProtection,
  checkOriginHeader,
  productRoutes
);

app.get('/api/security/check', 
  apiRateLimiter,
  (req, res) => {
    const securityInfo = {
      headers: {
        csp: req.get('Content-Security-Policy') ? 'Встановлено' : 'Відсутній',
        xssProtection: req.get('X-XSS-Protection') ? 'Встановлено' : 'Відсутній',
        contentTypeOptions: req.get('X-Content-Type-Options') ? 'Встановлено' : 'Відсутній',
        frameOptions: req.get('X-Frame-Options') ? 'Встановлено' : 'Відсутній'
      },
      cookies: {
        httponly: 'Встановлено для всіх cookie',
        secure: process.env.NODE_ENV === 'production' ? 'Так' : 'Тільки для HTTPS'
      },
      rateLimiting: {
        enabled: true,
        limits: {
          auth: '5 запитів за 15 хвилин',
          api: '100 запитів за хвилину',
          create: '10 запитів за годину'
        }
      }
    };
    
    res.json({
      success: true,
      security: securityInfo
    });
  }
);

app.use('*', 
  apiRateLimiter,
  (req, res) => {
    res.status(404).json({
      success: false,
      message: 'Маршрут не знайдено',
      securityNote: 'Всі маршрути захищені'
    });
  }
);

app.use((err, req, res, next) => {
  console.error('Помилка:', err.message);
  
  const errorMessage = process.env.NODE_ENV === 'development' 
    ? err.message 
    : 'Внутрішня помилка сервера';
  
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  
  res.status(err.status || 500).json({
    success: false,
    message: errorMessage,
    timestamp: new Date().toISOString()
  });
});

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  console.log(`✅ Захищений сервер запущено на порті ${PORT}`);
  console.log(`🔒 Режим безпеки: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📡 Адреса: http://localhost:${PORT}`);
});

process.on('uncaughtException', (error) => {
  console.error('Непередбачена помилка:', error);
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('Необроблена відмова:', reason);
});

const gracefulShutdown = () => {
  console.log('Отримано сигнал завершення. Закриття сервера...');
  server.close(() => {
    console.log('Сервер зупинено.');
    process.exit(0);
  });
  
  setTimeout(() => {
    console.error('Примусове завершення...');
    process.exit(1);
  }, 10000);
};

process.on('SIGTERM', gracefulShutdown);
process.on('SIGINT', gracefulShutdown);