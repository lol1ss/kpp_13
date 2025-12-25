const fs = require('fs');
const path = require('path');

const securityLogStream = fs.createWriteStream(
  path.join(__dirname, '../logs/security.log'),
  { flags: 'a' }
);

const logSuspiciousRequest = (req, reason) => {
  const logEntry = {
    timestamp: new Date().toISOString(),
    ip: req.ip,
    method: req.method,
    url: req.originalUrl,
    userAgent: req.get('User-Agent'),
    reason: reason,
    body: req.body,
    query: req.query,
    params: req.params
  };

  securityLogStream.write(JSON.stringify(logEntry) + '\n');
  console.warn('Підозрілий запит:', logEntry);
};

const securityLogging = (req, res, next) => {
  const suspiciousPatterns = [
    /<script/i,
    /<\/script/i,
    /onerror=/i,
    /onload=/i,
    /javascript:/i,
    /eval\(/i,
    /union.*select/i,
    /select.*from/i,
    /insert.*into/i,
    /update.*set/i,
    /delete.*from/i,
    /drop.*table/i,
    /\$where/i,
    /\$ne/i,
    /\$gt/i,
    /\$gte/i,
    /\$lt/i,
    /\$lte/i,
    /\$in/i,
    /\$nin/i,
    /\$and/i,
    /\$or/i,
    /\$not/i,
    /\$nor/i,
    /\$exists/i,
    /\$type/i,
    /\$mod/i,
    /\$regex/i,
    /\$text/i,
    /\$expr/i,
    /\$jsonSchema/i,
    /\$all/i,
    /\$elemMatch/i,
    /\$size/i
  ];

  const checkObject = (obj) => {
    if (!obj || typeof obj !== 'object') return false;
    const str = JSON.stringify(obj).toLowerCase();
    return suspiciousPatterns.some(pattern => pattern.test(str));
  };

  let isSuspicious = false;
  let reason = '';

  if (checkObject(req.body)) {
    isSuspicious = true;
    reason = 'Підозрілі дані в тілі запиту';
  } else if (checkObject(req.query)) {
    isSuspicious = true;
    reason = 'Підозрілі дані в query параметрах';
  } else if (checkObject(req.params)) {
    isSuspicious = true;
    reason = 'Підозрілі дані в параметрах маршруту';
  }

  if (isSuspicious) {
    logSuspiciousRequest(req, reason);
  }

  next();
};

module.exports = {
  securityLogging,
  logSuspiciousRequest
};