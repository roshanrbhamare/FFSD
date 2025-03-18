import express from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import isAuthenticated from '../middleware]/isAuthenticated.js';
import { db } from '../config/db.js';

const router = express.Router();

router.get('/', isAuthenticated, async (req, res) => {
  try {
    db.all('SELECT * FROM products', [], (err, products) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
      }
      res.render('homepage/index.ejs', { title: 'Home', products, role: req.role });
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.get("/login", (req, res) => {
  res.render('user/login.ejs', { title: 'login', error: "", role: "admin" });
});

router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err || !user) {
        console.error(err);
        return res.redirect("/api/v1/user/login")
      }
      const isMatch = await bcrypt.compare(password, user.password);
      if (!isMatch) {
        return res.redirect("/api/v1/user/login")
      }
      const token = jwt.sign({ userId: user.id }, "JWT_SECRET", { expiresIn: "5h" });
      res.cookie("token", token, {
        httpOnly: true,
        secure: false,
        maxAge: 3600000,
      });
      res.redirect("/api/v1/user/");
    });
  } catch (error) {
    console.log(error);
    res.json({ message: "Server error" });
  }
});

router.get("/signup", (req, res) => {
  res.render('user/signup.ejs', { title: 'signup', role: "user" });
});

router.post("/signup", async (req, res) => {
  try {
    const { firstname, lastname, password, email, role } = req.body;
    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
      if (err || user) {
        console.error(err);
        return res.redirect("/api/v1/user/signup");
      }
      const hashPassword = await bcrypt.hash(password, 10);
      db.run('INSERT INTO users (firstname, lastname, password, email, role) VALUES (?, ?, ?, ?, ?)',
        [firstname, lastname, hashPassword, email, role.toLowerCase()],
        (err) => {
          if (err) {
            console.error(err);
            return res.json({ message: "Error in creating user" });
          }
          return res.redirect("/api/v1/user/login");
        });
    });
  } catch (error) {
    console.log(error);
    return res.json({ message: "Error in creating user" });
  }
});

router.get("/logout", isAuthenticated, (req, res) => {
  res.clearCookie("token");
  return res.redirect("/api/v1/user/login");
});

router.get("/cart", (req, res) => {
  res.render("cart/index.ejs", { title: "Cart", role: req.role });
});

router.post("/cart", isAuthenticated, async (req, res) => {
  try {
    const userId = req.userId;
    db.all('SELECT c.*, p.* FROM cart c JOIN products p ON c.productId = p.id WHERE c.userId = ?', [userId], (err, cart) => {
      if (err) {
        console.error(err);
        return res.status(500).json({ message: "Server error" });
      }
      res.json({ cart });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
});

router.post("/cart/add/:id", isAuthenticated, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.userId;
    db.get('SELECT * FROM products WHERE id = ?', [productId], (err, product) => {
      if (err || !product) {
        return res.json({ message: "No such product" });
      }
      db.get('SELECT * FROM cart WHERE userId = ? AND productId = ?', [userId, productId], (err, cartItem) => {
        if (err) {
          return res.json({ message: "Server error" });
        }
        if (cartItem) {
          db.run('UPDATE cart SET quantity = quantity + 1 WHERE userId = ? AND productId = ?', [userId, productId]);
        } else {
          db.run('INSERT INTO cart (userId, productId, quantity) VALUES (?, ?, 1)', [userId, productId]);
        }
        res.json({ message: "Cart updated" });
      });
    });
  } catch (error) {
    console.log(error);
    res.json({ message: "Server error" });
  }
});

router.post("/cart/remove/:id", isAuthenticated, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.userId;
    
    // Check if product exists in the cart
    db.get("SELECT * FROM cart WHERE userId = ? AND productId = ?", [userId, productId], (err, cartItem) => {
      if (err) {
        return res.json({ message: "Database error" });
      }
      if (!cartItem) {
        return res.json({ message: "Product not in cart" });
      }
      
      // Decrease quantity or remove item
      if (cartItem.quantity > 1) {
        db.run("UPDATE cart SET quantity = quantity - 1 WHERE userId = ? AND productId = ?", [userId, productId], (err) => {
          if (err) {
            return res.json({ message: "Failed to update cart" });
          }
          res.json({ message: "Product quantity decreased" });
        });
      } else {
        db.run("DELETE FROM cart WHERE userId = ? AND productId = ?", [userId, productId], (err) => {
          if (err) {
            return res.json({ message: "Failed to remove product from cart" });
          }
          res.json({ message: "Product removed from cart" });
        });
      }
    });
  } catch (error) {
    console.log(error);
    res.json({ message: "Server error" });
  }
});


router.delete("/cart/remove/:id", isAuthenticated, async (req, res) => {
  try {
    const productId = req.params.id;
    const userId = req.userId;
    
    if (!productId) {
      return res.json({ message: "No product id provided" });
    }

    // Check if product exists
    db.get("SELECT * FROM products WHERE id = ?", [productId], (err, product) => {
      if (err) {
        return res.json({ message: "Database error" });
      }
      if (!product) {
        return res.json({ message: "No such product" });
      }
      
      // Check if product exists in user's cart
      db.get("SELECT * FROM cart WHERE userId = ? AND productId = ?", [userId, productId], (err, cartItem) => {
        if (err) {
          return res.json({ message: "Database error" });
        }
        if (!cartItem) {
          return res.json({ message: "Product not in cart" });
        }
        
        // Remove product from cart
        db.run("DELETE FROM cart WHERE userId = ? AND productId = ?", [userId, productId], (err) => {
          if (err) {
            return res.json({ message: "Failed to remove product from cart" });
          }
          res.json({ message: "Updated cart" });
        });
      });
    });
  } catch (error) {
    return res.json({ message: "Server error" });
  }
});

export default router;
