const fs = require('fs');
const path = require('path');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const usersFilePath = path.join(__dirname, 'users.json');
const tokensFilePath = path.join(__dirname, 'tokens.json');

// Завантаження даних з файлів
const loadData = (filePath) => {
  try {
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error(`Помилка завантаження файлу ${filePath}:`, error.message);
  }
  return [];
};

// Збереження даних у файли
const saveData = (filePath, data) => {
  try {
    fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf8');
  } catch (error) {
    console.error(`Помилка збереження файлу ${filePath}:`, error.message);
  }
};

// Завантаження початкових даних
let users = loadData(usersFilePath);
let tokens = loadData(tokensFilePath);

// Ініціалізація адміністратора при першому запуску
const initializeAdmin = () => {
  const adminExists = users.some(user => user.email === 'admin@example.com');
  if (!adminExists) {
    const hashedPassword = bcrypt.hashSync('Admin123!', 10);
    const adminUser = {
      id: crypto.randomUUID(),
      username: 'admin',
      email: 'admin@example.com',
      password: hashedPassword,
      role: 'admin',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    };
    users.push(adminUser);
    saveData(usersFilePath, users);
    console.log('✅ Адміністратор створений: admin@example.com / Admin123!');
  }
};

initializeAdmin();

const userModel = {
  // Створення нового користувача
  create: async (userData) => {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const newUser = {
      id: crypto.randomUUID(),
      username: userData.username,
      email: userData.email,
      password: hashedPassword,
      role: 'user',
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    
    users.push(newUser);
    saveData(usersFilePath, users);
    
    const { password, ...userWithoutPassword } = newUser;
    return userWithoutPassword;
  },
  
  // Пошук користувача за email
  findByEmail: (email) => {
    const user = users.find(u => u.email === email && u.isActive);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Пошук користувача за ID
  findById: (id) => {
    const user = users.find(u => u.id === id && u.isActive);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Пошук повного об'єкта користувача (з паролем)
  findWithPassword: (email) => {
    return users.find(u => u.email === email && u.isActive);
  },
  
  // Отримання всіх користувачів
  getAll: () => {
    return users.filter(u => u.isActive).map(user => {
      const { password, ...userWithoutPassword } = user;
      return userWithoutPassword;
    });
  },
  
  // Збереження токена
  saveToken: (userId, token) => {
    tokens = tokens.filter(t => t.userId !== userId);
    tokens.push({
      userId,
      token,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 години
    });
    saveData(tokensFilePath, tokens);
  },
  
  // Пошук користувача за токеном
  findByToken: (token) => {
    const tokenRecord = tokens.find(t => t.token === token && new Date(t.expiresAt) > new Date());
    if (!tokenRecord) return null;
    
    return userModel.findById(tokenRecord.userId);
  },
  
  // Видалення токена
  removeToken: (token) => {
    tokens = tokens.filter(t => t.token !== token);
    saveData(tokensFilePath, tokens);
  },
  
  // Перевірка пароля
  verifyPassword: async (plainPassword, hashedPassword) => {
    return await bcrypt.compare(plainPassword, hashedPassword);
  },
  
  // Оновлення користувача
  update: (id, updateData) => {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return null;
    
    users[userIndex] = {
      ...users[userIndex],
      ...updateData,
      updatedAt: new Date().toISOString()
    };
    
    if (updateData.password) {
      users[userIndex].password = bcrypt.hashSync(updateData.password, 10);
    }
    
    saveData(usersFilePath, users);
    
    const { password, ...userWithoutPassword } = users[userIndex];
    return userWithoutPassword;
  },
  
  // Видалення користувача
  delete: (id) => {
    const userIndex = users.findIndex(u => u.id === id);
    if (userIndex === -1) return false;
    
    users[userIndex].isActive = false;
    users[userIndex].updatedAt = new Date().toISOString();
    
    saveData(usersFilePath, users);
    return true;
  },
  
  // Пошук за іменем користувача
  findByUsername: (username) => {
    const user = users.find(u => u.username === username && u.isActive);
    if (!user) return null;
    
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  },
  
  // Очищення застарілих токенів
  cleanupTokens: () => {
    const now = new Date();
    const activeTokens = tokens.filter(t => new Date(t.expiresAt) > now);
    
    if (activeTokens.length !== tokens.length) {
      tokens = activeTokens;
      saveData(tokensFilePath, tokens);
    }
  }
};

// Очищення токенів кожну годину
setInterval(() => {
  userModel.cleanupTokens();
}, 60 * 60 * 1000);

module.exports = userModel;