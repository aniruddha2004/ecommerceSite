// controllers/userController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Product = require('../models/Product');
const Cart = require('../models/Cart');

const home = (req, res) => {
  res.render('home');
};

const products = async (req, res) => {
  try {
    const products = await Product.find({});
    res.render('products', { products, user: req.session.user });
  } catch (error) {
    res.status(500).send("Error retrieving products");
  }
};

const addProductForm = (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.redirect('/login');
  }
  res.render('addProduct');
};

const addProduct = async (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.redirect('/login');
  }
  const { name, description, price, imageUrl } = req.body;
  try {
    const newProduct = new Product({ name, description, price, imageUrl });
    await newProduct.save();
    res.redirect('/products');
  } catch (error) {
    res.status(500).send("Error adding product");
  }
};

// Delete a product (for Admins only)
const deleteProduct = async (req, res) => {
  if (!req.session.user || !req.session.user.isAdmin) {
    return res.redirect('/login');
  }
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.redirect('/products');
  } catch (error) {
    res.status(500).send("Error deleting product");
  }
};

const myOrders = (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  res.render('order');
};

const login = (req, res) => {
  res.render('login');
};

const register = (req, res) => {
  res.render('register');
};

const processLogin = async (req, res) => {
  const { username, password } = req.body;
  console.log("Login processing triggered");

  try {
    const user = await User.findOne({ username }); // Assuming Mongoose is being used
    if (user) {
      const isPasswordValid = await bcrypt.compare(password, user.password); // bcrypt.compare returns a Promise
      if (isPasswordValid) {
        req.session.user = { id: user._id, username: user.username, isAdmin: user.isAdmin };
        console.log("Login Successful");
        return res.render('home', { user: req.session.user });
      }
    }
    res.render('login', { error: 'Invalid username or password' });
  } catch (error) {
    console.error("Error during login:", error);
    res.render('login', { error: 'An error occurred during login' });
  }
};




const processRegister = async (req, res) => {
  const { username, password, isAdmin } = req.body; // Assume isAdmin is passed for role
  console.log("Registration processing triggered");

  try {
    // Hash the password
    const saltRounds = 10; // Number of hashing rounds
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create the user
    const newUser = new User({
      username,
      password: hashedPassword,
      isAdmin: isAdmin || false
    });

    await newUser.save();
    console.log("Registration Successful");
    res.redirect('/login'); // Redirect to login after successful registration
  } catch (error) {
    console.error("Error during registration:", error);
    res.render('register', { error: 'An error occurred during registration' });
  }
};

// controllers/userController.js
const logout = (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.redirect('/');
    }
    res.clearCookie('connect.sid');  // Clears the session cookie
    res.redirect('/login');
  });
};

// Add a product to the user's cart
const addToCart = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');
  
  const userId = req.session.user.id;
  const productId = req.params.productId;

  try {
    let cart = await Cart.findOne({ user: userId });

    if (cart) {
      const itemIndex = cart.items.findIndex(item => item.product.toString() === productId);
      
      if (itemIndex > -1) {
        cart.items[itemIndex].quantity += 1;
      } else {
        cart.items.push({ product: productId, quantity: 1 });
      }
    } else {
      cart = new Cart({ user: userId, items: [{ product: productId, quantity: 1 }] });
    }

    await cart.save();
    res.redirect('/products');
  } catch (error) {
    res.status(500).send("Error adding to cart");
  }
};

// View the user's cart
const viewCart = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const userId = req.session.user.id;

  try {
    const cart = await Cart.findOne({ user: userId }).populate('items.product');
    res.render('cart', { cart, user: req.session.user });
  } catch (error) {
    res.status(500).send("Error retrieving cart");
  }
};

// Update the quantity of a cart item
const updateQuantity = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const userId = req.session.user.id;
  const productId = req.params.productId;
  const { quantity } = req.body;

  try {
    const cart = await Cart.findOne({ user: userId });
    const item = cart.items.find(item => item.product.toString() === productId);

    if (item) {
      item.quantity = quantity;
      await cart.save();
    }

    res.redirect('/cart');
  } catch (error) {
    res.status(500).send("Error updating cart");
  }
};

// Remove an item from the cart
const removeFromCart = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const userId = req.session.user.id;
  const productId = req.params.productId;

  try {
    const cart = await Cart.findOne({ user: userId });
    cart.items = cart.items.filter(item => item.product.toString() !== productId);
    await cart.save();

    res.redirect('/cart');
  } catch (error) {
    res.status(500).send("Error removing from cart");
  }
};


module.exports = {
  home,
  products,
  myOrders,
  login,
  processLogin,
  register,
  processRegister,
  logout,
  addProductForm,
  addProduct,
  deleteProduct,
  addToCart,
  viewCart,
  updateQuantity,
  removeFromCart,
};
