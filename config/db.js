import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./database.sqlite');

// Create User table
db.run(`CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  firstname TEXT NOT NULL,
  lastname TEXT NOT NULL,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT CHECK(role IN ('user', 'seller')) NOT NULL,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP
)`);

// Create Product table
db.run(`CREATE TABLE IF NOT EXISTS products (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sellerId INTEGER,
  title TEXT NOT NULL,
  price REAL NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL,
  image TEXT NOT NULL,
  ratingCount INTEGER DEFAULT 0,
  stock INTEGER DEFAULT 1,
  createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (sellerId) REFERENCES users(id)
)`);

// Create User-Product relationship table
db.run(`CREATE TABLE IF NOT EXISTS user_products (
  userId INTEGER,
  productId INTEGER,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (productId) REFERENCES products(id)
)`);

// Create Cart table
db.run(`CREATE TABLE IF NOT EXISTS cart (
  userId INTEGER,
  productId INTEGER,
  quantity INTEGER DEFAULT 0,
  FOREIGN KEY (userId) REFERENCES users(id),
  FOREIGN KEY (productId) REFERENCES products(id)
)`);

// Create Reviewers table
db.run(`CREATE TABLE IF NOT EXISTS reviewers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  productId INTEGER,
  userId INTEGER,
  rating INTEGER DEFAULT 0,
  FOREIGN KEY (productId) REFERENCES products(id),
  FOREIGN KEY (userId) REFERENCES users(id)
)`);

export { db };