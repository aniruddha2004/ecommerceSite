const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User routes
router.get('/', userController.home);
router.get('/products', userController.products);
router.get('/orders', userController.myOrders);
router.get('/login', userController.login);
router.post('/login', userController.processLogin);
router.get('/register', userController.register);
router.post('/register', userController.processRegister);
router.get('/logout', userController.logout);
router.post('/cart/add/:productId', userController.addToCart);           // Add to cart
router.get('/cart', userController.viewCart);                            // View cart
router.post('/cart/update/:productId', userController.updateQuantity);   // Update quantity
router.post('/cart/remove/:productId', userController.removeFromCart);
router.get('/checkout', userController.checkout);       // Display checkout page
router.post('/checkout', userController.placeOrder);    // Handle placing the order



module.exports = router;
