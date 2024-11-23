// controllers/userController.js
const User = require('../models/User');
const Product = require('../models/Product');
const Order = require('../models/Order');
  
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

  const viewAllOrders = async (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.redirect('/login');
    }
  
    try {
      const orders = await Order.find({})
        .populate('user', 'username') // Include user information
        .populate('items.product');  // Include product details
  
      res.render('adminOrders', { orders, user: req.session.user });
    } catch (error) {
      console.error("Error loading all orders:", error);
      res.status(500).send("Error loading all orders");
    }
  };

  const updateOrderStatus = async (req, res) => {
    if (!req.session.user || !req.session.user.isAdmin) {
      return res.redirect('/login');
    }
  
    const { orderId } = req.params;
    const { status } = req.body; // The new status
  
    try {
      const order = await Order.findById(orderId);
      if (!order) {
        return res.status(404).send("Order not found");
      }
  
      order.status = status; // Update the status
      await order.save();
  
      res.redirect('/admin/orders'); // Redirect back to the all orders page
    } catch (error) {
      console.error("Error updating order status:", error);
      res.status(500).send("Error updating order status");
    }
  };

  module.exports = {
    addProductForm,
    addProduct,
    deleteProduct,
    viewAllOrders,
    updateOrderStatus,
  };