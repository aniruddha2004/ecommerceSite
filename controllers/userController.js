// controllers/userController.js
const bcrypt = require('bcrypt');
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');

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
  const { username, password, isAdmin } = req.body;

  try {
    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    const newUser = new User({
      username,
      password: hashedPassword,
      isAdmin: isAdmin || false,
      cart: [], // Initialize empty cart
    });

    await newUser.save();
    res.redirect('/login');
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

//Add a product to the user's cart
const addToCart = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const userId = req.session.user.id;
  const productId = req.params.productId;

  try {
    const user = await User.findById(userId);

    if (user) {
      user.cart.push(productId); // Add product ID to cart
      await user.save();
    }

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
    const user = await User.findById(userId);

    if (!user.cart || user.cart.length === 0) {
      return res.render('cart', { cart: [], user: req.session.user });
    }

    // Count occurrences of each product ID in the cart array
    const productCounts = {};
    user.cart.forEach(productId => {
      productCounts[productId.toString()] = (productCounts[productId.toString()] || 0) + 1;
    });

    // Fetch product details from the database
    const productIds = Object.keys(productCounts); // Extract unique product IDs
    const products = await Product.find({ _id: { $in: productIds } }); // Query database for these products

    // Map product details with quantity and subtotal
    const cart = products.map(product => {
      const quantity = productCounts[product._id.toString()];
      return {
        _id: product._id,       // Product ID for reference
        name: product.name,     // Product name
        price: product.price,   // Product price
        quantity,               // Quantity of this product
        subtotal: product.price * quantity, // Calculate subtotal
        imageUrl: product.imageUrl,
      };
    });

    res.render('cart', { cart, user: req.session.user });
  } catch (error) {
    console.error("Error retrieving cart:", error);
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
    const user = await User.findById(userId);

    // Filter out the product and add the new quantity
    user.cart = user.cart.filter(id => id.toString() !== productId);
    for (let i = 0; i < quantity; i++) {
      user.cart.push(productId);
    }

    await user.save();
    res.redirect('/cart');
  } catch (error) {
    res.status(500).send("Error updating quantity");
  }
};


// // Remove an item from the cart
const removeFromCart = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const userId = req.session.user.id;
  const productId = req.params.productId;

  try {
    const user = await User.findById(userId);

    user.cart = user.cart.filter(id => id.toString() !== productId); // Remove all occurrences
    await user.save();

    res.redirect('/cart');
  } catch (error) {
    res.status(500).send("Error removing from cart");
  }
};


const checkout = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const userId = req.session.user.id;

  try {
    const user = await User.findById(userId);

    if (!user.cart || user.cart.length === 0) {
      return res.redirect('/cart'); // Redirect to cart if it's empty
    }

    // Count occurrences of each product ID in the cart array
    const productCounts = {};
    user.cart.forEach(productId => {
      productCounts[productId.toString()] = (productCounts[productId.toString()] || 0) + 1;
    });

    // Fetch product details from the database
    const productIds = Object.keys(productCounts); // Extract unique product IDs
    const products = await Product.find({ _id: { $in: productIds } }); // Query database for these products

    // Map product details with quantity
    const cart = products.map(product => ({
      product: {
        _id: product._id,
        name: product.name,
        price: product.price,
      },
      quantity: productCounts[product._id.toString()],
    }));

    // Calculate total price
    const total = cart.reduce((sum, item) => sum + item.product.price * item.quantity, 0);

    res.render('checkout', { cart, total, user: req.session.user });
  } catch (error) {
    console.error("Error loading checkout page:", error);
    res.status(500).send("Error loading checkout page");
  }
};



const placeOrder = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const userId = req.session.user.id;

  try {
    const user = await User.findById(userId).populate('cart');
    if (!user.cart.length) return res.redirect('/cart');

    const productCounts = {};
    user.cart.forEach(product => {
      productCounts[product.id] = (productCounts[product.id] || 0) + 1;
    });

    const items = Object.entries(productCounts).map(([productId, quantity]) => ({
      product: productId,
      quantity,
    }));

    const total = items.reduce((sum, item) => {
      const product = user.cart.find(p => p.id === item.product);
      return sum + product.price * item.quantity;
    }, 0);

    const newOrder = new Order({
      user: userId,
      items,
      total,
      status: 'Pending',
      paymentMethod: 'COD',
    });

    await newOrder.save();
    user.cart = []; // Clear the cart
    await user.save();

    res.redirect('/orders');
  } catch (error) {
    res.status(500).send("Error placing order");
  }
};


const myOrders = async (req, res) => {
  if (!req.session.user) return res.redirect('/login');

  const userId = req.session.user.id;

  try {
    const orders = await Order.find({ user: userId }).populate('items.product');
    res.render('order', { orders, user: req.session.user });
  } catch (error) {
    res.status(500).send("Error loading orders");
  }
};


module.exports = {
  home,
  products,
  login,
  processLogin,
  register,
  processRegister,
  logout,
  addToCart,
  viewCart,
  updateQuantity,
  removeFromCart,
  checkout,
  placeOrder,
  myOrders,
};
