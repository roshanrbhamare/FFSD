import express from "express";
import { db } from "../config/db.js";
import isAuthenticated from "../middleware]/isAuthenticated.js";

const router = express.Router();

// 🔹 GET Create Product Page
router.get("/create", isAuthenticated, (req, res) => {
  return res.render("seller/Product/index.ejs", { title: "Create Product", role: req.role });
});

// 🔹 POST Create Product (SQLite Insert)
router.post("/create", isAuthenticated, async (req, res) => {
  try {
    console.log("/create post");
    const { title, price, description, category, image } = req.body;
    const userId = req.userId;

    if (!title || !price || !description || !category || !image) {
      return res.json({ message: "All fields are required" });
    }

    // Insert product into SQLite
    db.run(
      `INSERT INTO products (sellerId, title, price, description, category, image) VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, title, price, description, category, image],
      function (err) {
        if (err) {
          console.error(err);
          return res.json({ message: "Database error" });
        }
       // return res.redirect("/api/v1/product");
       res.redirect("/api/v1/product/")
      }
    );
  } catch (error) {
    console.log(error);
    return res.json({ message: "Server error" });
  }
});

// 🔹 GET Listed Products for Seller
router.get("/", isAuthenticated, (req, res) => {
  try {
    const userId = req.userId;

    db.all(
      `SELECT * FROM products WHERE sellerId = ?`,
      [userId],
      (err, productListed) => {
        if (err) {
          console.error(err);
          return res.json({ message: "Database error" });
        }

        return res.render("seller/listedProduct/index.ejs", {
          title: "Listed Product",
          role: req.role,
          productListed,
        });
      }
    );
  } catch (error) {
    res.json({ message: "Internal error" });
  }
});

// 🔹 GET Specific Product by ID
router.get("/:id", (req, res) => {
  const productId = req.params.id;

  db.get(`SELECT * FROM products WHERE id = ?`, [productId], (err, product) => {
    if (err || !product) {
      console.error(err);
      return res.json({ message: "No such product" });
    }

    res.render("product/index.ejs", {
      title: "Product page",
      product,
      filteredProducts: product,
      role: req.role,
    });
  });
});

export default router;
