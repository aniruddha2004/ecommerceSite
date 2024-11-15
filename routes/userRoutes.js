const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');

// User routes
router.get('/', userController.home);
router.get('/products', userController.products);
router.get('/orders', userController.myOrders);
router.get('/cart', userController.cart);
router.get('/login', userController.login);
router.post('/login', userController.processLogin);
router.get('/register', userController.register);
router.post('/register', userController.processRegister);
router.get('/logout', userController.logout);
router.get('/products/add', userController.addProductForm);  // Show add product form
router.post('/products/add', userController.addProduct);      // Handle add product form submission
router.post('/products/delete/:id', userController.deleteProduct); // Handle product deletion

module.exports = router;
