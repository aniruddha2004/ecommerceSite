const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');

router.get('/products/add', adminController.addProductForm);  // Show add product form
router.post('/products/add', adminController.addProduct);      // Handle add product form submission
router.post('/products/delete/:id', adminController.deleteProduct); // Handle product deletion
router.get('/admin/orders', adminController.viewAllOrders); // Admin: View all orders
router.post('/admin/orders/:orderId', adminController.updateOrderStatus); // Admin: Update order status

module.exports = router;