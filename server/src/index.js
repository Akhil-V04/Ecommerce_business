import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import multer from 'multer';
import { db } from './db/dbAdapter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Ensure upload directory exists
const uploadsDir = path.join(__dirname, '..', 'public', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Multer storage for saree & product image uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.jpg';
    const uniqueName = `saree_${Date.now()}_${Math.round(Math.random() * 1e4)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({
  storage,
  limits: { fileSize: 8 * 1024 * 1024 } // 8MB limit
});

// Initialize Database
await db.initialize();

// HEALTH CHECK
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    store: 'Srinivasa Silks',
    dbMode: db.mode,
    timestamp: new Date().toISOString()
  });
});

// SETTINGS
app.get('/api/settings', async (req, res) => {
  try {
    const settings = await db.getSettings();
    // hide adminPasscode in public settings response
    const { adminPasscode, ...safeSettings } = settings;
    res.json(safeSettings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ADMIN LOGIN
app.post('/api/admin/login', async (req, res) => {
  try {
    const { passcode } = req.body;
    const settings = await db.getSettings();
    const correctPass = settings.adminPasscode || 'admin123';

    if (passcode === correctPass) {
      // Simple signed token/session representation
      return res.json({
        success: true,
        message: 'Admin authenticated successfully',
        token: 'srinivasa-admin-token-' + Date.now()
      });
    }
    return res.status(401).json({ success: false, message: 'Invalid Admin Passcode' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PRODUCTS ENDPOINTS
app.get('/api/products', async (req, res) => {
  try {
    const { category, search } = req.query;
    const products = await db.getProducts({ category, search });
    res.json(products);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/products/:id', async (req, res) => {
  try {
    const product = await db.getProductById(req.params.id);
    if (!product) return res.status(404).json({ error: 'Product not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  try {
    const { name, category, price, originalPrice, fabric, description, colors, inStock, stockQuantity, imageUrl } = req.body;
    if (!name || !price) {
      return res.status(400).json({ error: 'Product name and price are required' });
    }
    const newProduct = await db.createProduct({
      name,
      category: category || 'Sarees',
      price,
      originalPrice,
      fabric,
      description,
      colors,
      inStock,
      stockQuantity,
      imageUrl
    });
    res.status(201).json(newProduct);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.put('/api/products/:id', async (req, res) => {
  try {
    const updated = await db.updateProduct(req.params.id, req.body);
    if (!updated) return res.status(404).json({ error: 'Product not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  try {
    const success = await db.deleteProduct(req.params.id);
    if (!success) return res.status(404).json({ error: 'Product not found' });
    res.json({ success: true, message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// IMAGE UPLOAD (Single file or base64)
app.post('/api/upload', upload.single('image'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file uploaded' });
    }
    const relativeUrl = `/uploads/${req.file.filename}`;
    res.json({
      success: true,
      url: relativeUrl,
      filename: req.file.filename
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ORDERS ENDPOINTS
app.get('/api/orders', async (req, res) => {
  try {
    const orders = await db.getOrders();
    res.json(orders);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/orders/:id', async (req, res) => {
  try {
    const order = await db.getOrderById(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Create Order (Guest user checkout - no login required)
app.post('/api/orders', async (req, res) => {
  try {
    const {
      customerName,
      customerPhone,
      customerAltPhone,
      fulfillmentType,
      deliveryAddress,
      deliveryLandmark,
      pinCode,
      liveLocation,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod,
      deliveryNotes
    } = req.body;

    if (!customerPhone || !items || items.length === 0) {
      return res.status(400).json({ error: 'Customer phone number and items are required' });
    }

    if (fulfillmentType === 'hyderabad_delivery' && !deliveryAddress && !liveLocation) {
      return res.status(400).json({ error: 'Delivery address or live location is required for Hyderabad delivery' });
    }

    const order = await db.createOrder({
      customerName: customerName || 'Valued Customer',
      customerPhone,
      customerAltPhone,
      fulfillmentType: fulfillmentType || 'hyderabad_delivery',
      deliveryAddress,
      deliveryLandmark,
      pinCode,
      liveLocation,
      items,
      subtotal,
      deliveryFee,
      totalAmount,
      paymentMethod: paymentMethod || 'pay_on_delivery',
      deliveryNotes
    });

    res.status(201).json({
      success: true,
      message: 'Order placed successfully! We will coordinate your delivery via Rapido/Porter.',
      order
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update Order Status
app.patch('/api/orders/:id/status', async (req, res) => {
  try {
    const { orderStatus, deliveryNotes } = req.body;
    const updated = await db.updateOrderStatus(req.params.id, orderStatus, deliveryNotes);
    if (!updated) return res.status(404).json({ error: 'Order not found' });
    res.json(updated);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Delete Order (Admin function)
app.delete('/api/orders/:id', async (req, res) => {
  try {
    const success = await db.deleteOrder(req.params.id);
    if (!success) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, message: `Order ${req.params.id} deleted from database` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Clear All Orders (Admin function)
app.delete('/api/orders', async (req, res) => {
  try {
    await db.clearAllOrders();
    res.json({ success: true, message: 'All orders cleared from database' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Database Diagnostics & Health
app.get('/api/db-status', async (req, res) => {
  try {
    const products = await db.getProducts();
    const orders = await db.getOrders();
    res.json({
      status: 'online',
      activeDatabaseEngine: db.mode, // 'postgres' | 'mysql' | 'json'
      postgresAvailable: !!db.pgPool,
      mysqlAvailable: !!db.mysqlPool,
      productsCount: products.length,
      ordersCount: orders.length,
      timestamp: new Date().toISOString()
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Start Server
app.listen(PORT, () => {
  console.log(`✨ Srinivasa Silks Backend Server is running at http://localhost:${PORT}`);
  console.log(`🛍️ Products API: http://localhost:${PORT}/api/products`);
  console.log(`📦 Orders API:   http://localhost:${PORT}/api/orders`);
});
