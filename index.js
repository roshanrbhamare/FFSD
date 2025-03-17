import express from 'express';
const app = express();
import path from "path"
import expressLayouts from 'express-ejs-layouts'
import products from './data/products.js';
import blogPosts from "./data/blogId.json" with { type: "json" };
import userController from "./routes/user.js"
import productRouter from "./routes/product.js"

import { fileURLToPath } from 'url';
import dotenv from "dotenv";
import { title } from 'process';
import cors from "cors"
import cookieParser  from "cookie-parser";
import Product from './models/product.js';
import isAuthenticated from './middleware]/isAuthenticated.js';
import User from './models/user.js';
import { db } from './config/db.js';
dotenv.config({});

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(
  cors({
    origin: "http://localhost:8000", // Adjust this to your frontend URL
    credentials: true, // Allow cookies and authorization headers
    methods: ["GET", "POST", "PUT", "DELETE"], // Allowed methods
    allowedHeaders: ["Content-Type", "Authorization"], // Allowed headers
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(express.urlencoded({ extended: true }))
  ; app.set('view engine', 'ejs');
app.use(express.static(path.join(__dirname, "public")));
app.set('views', path.join(__dirname, 'views'));
app.use(expressLayouts);
app.set('layout', 'layouts/main');

app.use("/api/v1/user", userController);
app.use("/api/v1/product",productRouter);





app.get("/account", isAuthenticated,(req, res) => {
  res.render("account/index.ejs", { title: 'Account',role:req.role });
})

app.get("/blog/:id", isAuthenticated,(req, res) => {
  const id = parseInt(req.params.id);
  const blog = blogPosts.find(post => post.id === id);

  if (!blog) {
      return res.status(404).send("Blog post not found");
  }

  res.render("blog_post/article.ejs", {title:"Blog Article"  , blog,role:req.role });
});

app.get("/account/address", isAuthenticated,(req, res) => {
  res.render("account_address/index.ejs", { title: 'Account Address',role:req.role });
})

app.get("/product",(req,res)=>{
  res.render("seller/Product/index.ejs",{title:"Create a new Product"})
})
app.get('/product/:id', (req, res) => {
  const { id } = req.params;
  const product = products.find(product => product.id === Number(id));
  let filteredProducts = products.filter(product => product.id !== id);
  filteredProducts = filteredProducts.slice(0, 5);
  res.render('product/index.ejs', { title: 'Product page', product, filteredProducts })
});

app.get('/blog',isAuthenticated, (req, res) => res.render('blog/index.ejs', { title: 'Blog Page',role:req.role }));
app.get('/contact',isAuthenticated, (req, res) => res.render('contact/index.ejs', { title: 'Contact Page',role:req.role }));

app.get("/api/v1/admin/login",(req,res)=>{
  return res.render('admin/login/index.ejs', { title: 'login',role:"admin"})
})

app.get('/api/v1/admin/dashboard', async (req, res) => {
  try {
    db.all('SELECT * FROM users', async (err, users) => {
      if (err) return res.status(500).json({ message: 'Database error' });

      db.all('SELECT * FROM products', async (err, products) => {
        if (err) return res.status(500).json({ message: 'Database error' });

        let totalCartAmount = 0;
        let customerOrders = 0;
        let sellerOrders = 0;
        let userCount = 0;

        for (const user of users) {
          if (user.role === 'user') {
            userCount += 1;
            await new Promise((resolve) => {
              db.all('SELECT * FROM cart WHERE userId = ?', [user.id], (err, cartItems) => {
                if (!err) {
                  cartItems.forEach(cartItem => {
                    const product = products.find(p => p.id === cartItem.productId);
                    console.log(product)
                    if (product) {
                      
                      totalCartAmount += product.price * cartItem.quantity;
                    }
                  });
                  customerOrders += cartItems.length;
                }
                resolve();
              });
            });
          } else if (user.role === 'seller') {
            sellerOrders += products.filter(p => p.sellerId === user.id).length;
          }
        }

        res.render('admin/dashboard/index.ejs', {
          title: 'Dashboard',
          role: 'admin',
          totalCartAmount,
          customerOrders,
          CustomerCount: userCount,
          registeredProducts: products
        });
      });
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error' });
  }
});
app.post("/api/v1/admin/dashboard", async (req, res) => {
  try {
    const {email,password} = req.body;
    console.log(email,password)
    if(email!=="adminLogin@gmail.com"&&password!=="swiftmart"){
      res.redirect("/api/v1/user/login");
    }
console.log("jii")
    
    res.redirect("/api/v1/admin/dashboard");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

const PORT = 8000;
app.listen(PORT, () => {
  
  console.log(`Server running on http://localhost:${PORT}`)
});
