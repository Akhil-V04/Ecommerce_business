import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';
import mysql from 'mysql2/promise';
import { initialProducts, initialOrders } from './seedData.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const DB_FILE = path.join(DATA_DIR, 'database.json');

class DatabaseAdapter {
  constructor() {
    this.mode = 'json'; // 'json' | 'postgres' | 'mysql'
    this.pgPool = null;
    this.mysqlPool = null;
  }

  async initialize() {
    const dbType = (process.env.DB_TYPE || '').toLowerCase();
    const hasPostgres = dbType === 'postgres' || !!process.env.DATABASE_URL;
    const hasMySQL = dbType === 'mysql' || !!process.env.MYSQL_URL || !!process.env.MYSQL_HOST;

    if (hasPostgres) {
      try {
        const pool = new pg.Pool({
          connectionString: process.env.DATABASE_URL || 'postgresql://postgres:postgres@localhost:5432/srinivasa_silks',
          ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
        });
        await pool.query('SELECT 1');
        this.pgPool = pool;
        this.mode = 'postgres';
        console.log('✓ Successfully connected to PostgreSQL database');
        await this.initPostgresSchema();
        return;
      } catch (err) {
        console.warn('⚠️  PostgreSQL connection failed, falling back to embedded JSON database:', err.message);
      }
    }

    if (hasMySQL) {
      try {
        const pool = mysql.createPool(
          process.env.MYSQL_URL || {
            host: process.env.MYSQL_HOST || 'localhost',
            user: process.env.MYSQL_USER || 'root',
            password: process.env.MYSQL_PASSWORD || '',
            database: process.env.MYSQL_DATABASE || 'srinivasa_silks',
            waitForConnections: true,
            connectionLimit: 10
          }
        );
        const [rows] = await pool.query('SELECT 1');
        this.mysqlPool = pool;
        this.mode = 'mysql';
        console.log('✓ Successfully connected to MySQL database');
        await this.initMySQLSchema();
        return;
      } catch (err) {
        console.warn('⚠️  MySQL connection failed, falling back to embedded JSON database:', err.message);
      }
    }

    // Default: Robust local JSON file-based database
    this.mode = 'json';
    if (!fs.existsSync(DATA_DIR)) {
      fs.mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!fs.existsSync(DB_FILE)) {
      const initialData = {
        products: initialProducts,
        orders: initialOrders,
        settings: {
          storeName: "Srinivasa Silks",
          tagline: "Authentic Kanchipuram Sarees, Pure Silks, Linings & Petticoats",
          phone: "+91 98490 12345",
          altPhone: "+91 94400 54321",
          storeAddress: "Shop #14, Royal Silk Complex, General Bazaar, Secunderabad, Hyderabad - 500003",
          deliveryNote: "We deliver across Hyderabad only via Porter / Rapido. Delivery fare charged as per app.",
          adminPasscode: "admin123"
        }
      };
      fs.writeFileSync(DB_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
      console.log('✓ Initialized embedded database with seed sarees and orders at:', DB_FILE);
    } else {
      console.log('✓ Connected to local embedded database at:', DB_FILE);
    }
  }

  readJson() {
    try {
      const raw = fs.readFileSync(DB_FILE, 'utf-8');
      return JSON.parse(raw);
    } catch (err) {
      console.error('Error reading JSON DB:', err);
      return { products: initialProducts, orders: initialOrders, settings: {} };
    }
  }

  writeJson(data) {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Error writing JSON DB:', err);
    }
  }

  // PRODUCTS
  async getProducts(filters = {}) {
    if (this.mode === 'postgres') {
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      if (filters.category && filters.category !== 'All') {
        params.push(filters.category);
        query += ` AND category = $${params.length}`;
      }
      query += ' ORDER BY created_at DESC';
      const res = await this.pgPool.query(query, params);
      return res.rows.map(this.mapPgProduct);
    } else if (this.mode === 'mysql') {
      let query = 'SELECT * FROM products WHERE 1=1';
      const params = [];
      if (filters.category && filters.category !== 'All') {
        params.push(filters.category);
        query += ' AND category = ?';
      }
      query += ' ORDER BY created_at DESC';
      const [rows] = await this.mysqlPool.query(query, params);
      return rows.map(this.mapMysqlProduct);
    } else {
      const data = this.readJson();
      let list = data.products || [];
      if (filters.category && filters.category !== 'All') {
        list = list.filter(p => p.category.toLowerCase() === filters.category.toLowerCase());
      }
      if (filters.search) {
        const q = filters.search.toLowerCase();
        list = list.filter(p =>
          p.name.toLowerCase().includes(q) ||
          p.description.toLowerCase().includes(q) ||
          p.fabric.toLowerCase().includes(q)
        );
      }
      return list;
    }
  }

  async getProductById(id) {
    if (this.mode === 'postgres') {
      const res = await this.pgPool.query('SELECT * FROM products WHERE id = $1', [id]);
      return res.rows[0] ? this.mapPgProduct(res.rows[0]) : null;
    } else if (this.mode === 'mysql') {
      const [rows] = await this.mysqlPool.query('SELECT * FROM products WHERE id = ?', [id]);
      return rows[0] ? this.mapMysqlProduct(rows[0]) : null;
    } else {
      const data = this.readJson();
      return (data.products || []).find(p => p.id === id) || null;
    }
  }

  async createProduct(productData) {
    const id = productData.id || `prod-${Date.now()}`;
    const product = {
      id,
      name: productData.name,
      category: productData.category || 'Sarees',
      price: Number(productData.price) || 0,
      originalPrice: productData.originalPrice ? Number(productData.originalPrice) : null,
      fabric: productData.fabric || '',
      description: productData.description || '',
      colors: Array.isArray(productData.colors) ? productData.colors : (productData.colors ? productData.colors.split(',').map(s => s.trim()) : []),
      inStock: productData.inStock !== false && productData.inStock !== 'false',
      stockQuantity: Number(productData.stockQuantity) || 10,
      imageUrl: productData.imageUrl || '/products/kanchipuram_saree.jpg',
      featured: !!productData.featured,
      createdAt: new Date().toISOString()
    };

    if (this.mode === 'postgres') {
      const q = `
        INSERT INTO products (id, name, category, price, original_price, fabric, description, colors, in_stock, stock_quantity, image_url, featured, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
        RETURNING *
      `;
      const res = await this.pgPool.query(q, [
        product.id, product.name, product.category, product.price, product.originalPrice,
        product.fabric, product.description, JSON.stringify(product.colors), product.inStock,
        product.stockQuantity, product.imageUrl, product.featured, product.createdAt
      ]);
      return this.mapPgProduct(res.rows[0]);
    } else if (this.mode === 'mysql') {
      const q = `
        INSERT INTO products (id, name, category, price, original_price, fabric, description, colors, in_stock, stock_quantity, image_url, featured, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await this.mysqlPool.query(q, [
        product.id, product.name, product.category, product.price, product.originalPrice,
        product.fabric, product.description, JSON.stringify(product.colors), product.inStock,
        product.stockQuantity, product.imageUrl, product.featured, product.createdAt
      ]);
      return product;
    } else {
      const data = this.readJson();
      data.products = [product, ...(data.products || [])];
      this.writeJson(data);
      return product;
    }
  }

  async updateProduct(id, updates) {
    if (this.mode === 'postgres') {
      const fields = [];
      const values = [];
      let i = 1;
      if (updates.name !== undefined) { fields.push(`name = $${i++}`); values.push(updates.name); }
      if (updates.category !== undefined) { fields.push(`category = $${i++}`); values.push(updates.category); }
      if (updates.price !== undefined) { fields.push(`price = $${i++}`); values.push(Number(updates.price)); }
      if (updates.originalPrice !== undefined) { fields.push(`original_price = $${i++}`); values.push(updates.originalPrice ? Number(updates.originalPrice) : null); }
      if (updates.fabric !== undefined) { fields.push(`fabric = $${i++}`); values.push(updates.fabric); }
      if (updates.description !== undefined) { fields.push(`description = $${i++}`); values.push(updates.description); }
      if (updates.colors !== undefined) {
        const cols = Array.isArray(updates.colors) ? updates.colors : updates.colors.split(',').map(s => s.trim());
        fields.push(`colors = $${i++}`);
        values.push(JSON.stringify(cols));
      }
      if (updates.inStock !== undefined) { fields.push(`in_stock = $${i++}`); values.push(Boolean(updates.inStock)); }
      if (updates.stockQuantity !== undefined) { fields.push(`stock_quantity = $${i++}`); values.push(Number(updates.stockQuantity)); }
      if (updates.imageUrl !== undefined) { fields.push(`image_url = $${i++}`); values.push(updates.imageUrl); }

      values.push(id);
      const q = `UPDATE products SET ${fields.join(', ')} WHERE id = $${i} RETURNING *`;
      const res = await this.pgPool.query(q, values);
      return res.rows[0] ? this.mapPgProduct(res.rows[0]) : null;
    } else {
      const data = this.readJson();
      const index = (data.products || []).findIndex(p => p.id === id);
      if (index === -1) return null;
      data.products[index] = { ...data.products[index], ...updates };
      this.writeJson(data);
      return data.products[index];
    }
  }

  async deleteProduct(id) {
    if (this.mode === 'postgres') {
      await this.pgPool.query('DELETE FROM products WHERE id = $1', [id]);
      return true;
    } else if (this.mode === 'mysql') {
      await this.mysqlPool.query('DELETE FROM products WHERE id = ?', [id]);
      return true;
    } else {
      const data = this.readJson();
      data.products = (data.products || []).filter(p => p.id !== id);
      this.writeJson(data);
      return true;
    }
  }

  // ORDERS
  async getOrders() {
    if (this.mode === 'postgres') {
      const res = await this.pgPool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return res.rows.map(this.mapPgOrder);
    } else if (this.mode === 'mysql') {
      const [rows] = await this.mysqlPool.query('SELECT * FROM orders ORDER BY created_at DESC');
      return rows.map(this.mapMysqlOrder);
    } else {
      const data = this.readJson();
      return (data.orders || []).sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    }
  }

  async getOrderById(id) {
    if (this.mode === 'postgres') {
      const res = await this.pgPool.query('SELECT * FROM orders WHERE id = $1', [id]);
      return res.rows[0] ? this.mapPgOrder(res.rows[0]) : null;
    } else if (this.mode === 'mysql') {
      const [rows] = await this.mysqlPool.query('SELECT * FROM orders WHERE id = ?', [id]);
      return rows[0] ? this.mapMysqlOrder(rows[0]) : null;
    } else {
      const data = this.readJson();
      return (data.orders || []).find(o => o.id === id) || null;
    }
  }

  async createOrder(orderInput) {
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const orderId = `SS-HYD-${randomSuffix}`;

    const order = {
      id: orderId,
      customerName: orderInput.customerName || 'Customer',
      customerPhone: orderInput.customerPhone,
      customerAltPhone: orderInput.customerAltPhone || '',
      fulfillmentType: orderInput.fulfillmentType || 'hyderabad_delivery', // 'hyderabad_delivery' or 'store_pickup'
      deliveryAddress: orderInput.deliveryAddress || '',
      deliveryLandmark: orderInput.deliveryLandmark || '',
      pinCode: orderInput.pinCode || '',
      liveLocation: orderInput.liveLocation || null,
      items: orderInput.items || [],
      subtotal: Number(orderInput.subtotal) || 0,
      deliveryFee: Number(orderInput.deliveryFee) || 0,
      totalAmount: Number(orderInput.totalAmount) || 0,
      paymentMethod: orderInput.paymentMethod || 'pay_on_delivery',
      paymentStatus: 'Pending',
      orderStatus: 'Pending',
      deliveryNotes: orderInput.deliveryNotes || '',
      createdAt: new Date().toISOString()
    };

    if (this.mode === 'postgres') {
      const q = `
        INSERT INTO orders (id, customer_name, customer_phone, customer_alt_phone, fulfillment_type, delivery_address, delivery_landmark, pin_code, live_location, items, subtotal, delivery_fee, total_amount, payment_method, payment_status, order_status, delivery_notes, created_at)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18)
        RETURNING *
      `;
      const res = await this.pgPool.query(q, [
        order.id, order.customerName, order.customerPhone, order.customerAltPhone,
        order.fulfillmentType, order.deliveryAddress, order.deliveryLandmark, order.pinCode,
        JSON.stringify(order.liveLocation), JSON.stringify(order.items), order.subtotal,
        order.deliveryFee, order.totalAmount, order.paymentMethod, order.paymentStatus,
        order.orderStatus, order.deliveryNotes, order.createdAt
      ]);
      return this.mapPgOrder(res.rows[0]);
    } else if (this.mode === 'mysql') {
      const q = `
        INSERT INTO orders (id, customer_name, customer_phone, customer_alt_phone, fulfillment_type, delivery_address, delivery_landmark, pin_code, live_location, items, subtotal, delivery_fee, total_amount, payment_method, payment_status, order_status, delivery_notes, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `;
      await this.mysqlPool.query(q, [
        order.id, order.customerName, order.customerPhone, order.customerAltPhone,
        order.fulfillmentType, order.deliveryAddress, order.deliveryLandmark, order.pinCode,
        JSON.stringify(order.liveLocation), JSON.stringify(order.items), order.subtotal,
        order.deliveryFee, order.totalAmount, order.paymentMethod, order.paymentStatus,
        order.orderStatus, order.deliveryNotes, order.createdAt
      ]);
      return order;
    } else {
      const data = this.readJson();
      data.orders = [order, ...(data.orders || [])];
      this.writeJson(data);
      return order;
    }
  }

  async updateOrderStatus(id, status, deliveryNotes) {
    if (this.mode === 'postgres') {
      const res = await this.pgPool.query(
        'UPDATE orders SET order_status = $1, delivery_notes = COALESCE($2, delivery_notes) WHERE id = $3 RETURNING *',
        [status, deliveryNotes || null, id]
      );
      return res.rows[0] ? this.mapPgOrder(res.rows[0]) : null;
    } else if (this.mode === 'mysql') {
      await this.mysqlPool.query(
        'UPDATE orders SET order_status = ?, delivery_notes = COALESCE(?, delivery_notes) WHERE id = ?',
        [status, deliveryNotes || null, id]
      );
      return this.getOrderById(id);
    } else {
      const data = this.readJson();
      const order = (data.orders || []).find(o => o.id === id);
      if (order) {
        order.orderStatus = status;
        if (deliveryNotes) order.deliveryNotes = deliveryNotes;
        this.writeJson(data);
      }
      return order;
    }
  }

  async deleteOrder(id) {
    if (this.mode === 'postgres') {
      await this.pgPool.query('DELETE FROM orders WHERE id = $1', [id]);
      return true;
    } else if (this.mode === 'mysql') {
      await this.mysqlPool.query('DELETE FROM orders WHERE id = ?', [id]);
      return true;
    } else {
      const data = this.readJson();
      data.orders = (data.orders || []).filter(o => o.id !== id);
      this.writeJson(data);
      return true;
    }
  }

  async clearAllOrders() {
    if (this.mode === 'postgres') {
      await this.pgPool.query('DELETE FROM orders');
      return true;
    } else if (this.mode === 'mysql') {
      await this.mysqlPool.query('DELETE FROM orders');
      return true;
    } else {
      const data = this.readJson();
      data.orders = [];
      this.writeJson(data);
      return true;
    }
  }

  // SETTINGS
  async getSettings() {
    const data = this.readJson();
    return data.settings || {};
  }

  async updateSettings(newSettings) {
    const data = this.readJson();
    data.settings = { ...data.settings, ...newSettings };
    this.writeJson(data);
    return data.settings;
  }

  // Mappers
  mapPgProduct(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : null,
      fabric: row.fabric,
      description: row.description,
      colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
      inStock: row.in_stock,
      stockQuantity: row.stock_quantity,
      imageUrl: row.image_url,
      featured: row.featured,
      createdAt: row.created_at
    };
  }

  mapPgOrder(row) {
    return {
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerAltPhone: row.customer_alt_phone,
      fulfillmentType: row.fulfillment_type,
      deliveryAddress: row.delivery_address,
      deliveryLandmark: row.delivery_landmark,
      pinCode: row.pin_code,
      liveLocation: typeof row.live_location === 'string' ? JSON.parse(row.live_location) : row.live_location,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      subtotal: Number(row.subtotal),
      deliveryFee: Number(row.delivery_fee),
      totalAmount: Number(row.total_amount),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      orderStatus: row.order_status,
      deliveryNotes: row.delivery_notes,
      createdAt: row.created_at
    };
  }

  mapMysqlProduct(row) {
    return {
      id: row.id,
      name: row.name,
      category: row.category,
      price: Number(row.price),
      originalPrice: row.original_price ? Number(row.original_price) : null,
      fabric: row.fabric,
      description: row.description,
      colors: typeof row.colors === 'string' ? JSON.parse(row.colors) : row.colors,
      inStock: Boolean(row.in_stock),
      stockQuantity: row.stock_quantity,
      imageUrl: row.image_url,
      featured: Boolean(row.featured),
      createdAt: row.created_at
    };
  }

  mapMysqlOrder(row) {
    return {
      id: row.id,
      customerName: row.customer_name,
      customerPhone: row.customer_phone,
      customerAltPhone: row.customer_alt_phone,
      fulfillmentType: row.fulfillment_type,
      deliveryAddress: row.delivery_address,
      deliveryLandmark: row.delivery_landmark,
      pinCode: row.pin_code,
      liveLocation: typeof row.live_location === 'string' ? JSON.parse(row.live_location) : row.live_location,
      items: typeof row.items === 'string' ? JSON.parse(row.items) : row.items,
      subtotal: Number(row.subtotal),
      deliveryFee: Number(row.delivery_fee),
      totalAmount: Number(row.total_amount),
      paymentMethod: row.payment_method,
      paymentStatus: row.payment_status,
      orderStatus: row.order_status,
      deliveryNotes: row.delivery_notes,
      createdAt: row.created_at
    };
  }

  async initPostgresSchema() {
    await this.pgPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        price NUMERIC(10,2) NOT NULL,
        original_price NUMERIC(10,2),
        fabric VARCHAR(255),
        description TEXT,
        colors JSONB,
        in_stock BOOLEAN DEFAULT TRUE,
        stock_quantity INT DEFAULT 10,
        image_url TEXT,
        featured BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(32) NOT NULL,
        customer_alt_phone VARCHAR(32),
        fulfillment_type VARCHAR(64) NOT NULL,
        delivery_address TEXT,
        delivery_landmark VARCHAR(255),
        pin_code VARCHAR(16),
        live_location JSONB,
        items JSONB NOT NULL,
        subtotal NUMERIC(10,2) NOT NULL,
        delivery_fee NUMERIC(10,2) DEFAULT 0,
        total_amount NUMERIC(10,2) NOT NULL,
        payment_method VARCHAR(64),
        payment_status VARCHAR(64) DEFAULT 'Pending',
        order_status VARCHAR(64) DEFAULT 'Pending',
        delivery_notes TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }

  async initMySQLSchema() {
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS products (
        id VARCHAR(64) PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        category VARCHAR(64) NOT NULL,
        price DECIMAL(10,2) NOT NULL,
        original_price DECIMAL(10,2),
        fabric VARCHAR(255),
        description TEXT,
        colors JSON,
        in_stock BOOLEAN DEFAULT TRUE,
        stock_quantity INT DEFAULT 10,
        image_url TEXT,
        featured BOOLEAN DEFAULT FALSE,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
    await this.mysqlPool.query(`
      CREATE TABLE IF NOT EXISTS orders (
        id VARCHAR(64) PRIMARY KEY,
        customer_name VARCHAR(255) NOT NULL,
        customer_phone VARCHAR(32) NOT NULL,
        customer_alt_phone VARCHAR(32),
        fulfillment_type VARCHAR(64) NOT NULL,
        delivery_address TEXT,
        delivery_landmark VARCHAR(255),
        pin_code VARCHAR(16),
        live_location JSON,
        items JSON NOT NULL,
        subtotal DECIMAL(10,2) NOT NULL,
        delivery_fee DECIMAL(10,2) DEFAULT 0,
        total_amount DECIMAL(10,2) NOT NULL,
        payment_method VARCHAR(64),
        payment_status VARCHAR(64) DEFAULT 'Pending',
        order_status VARCHAR(64) DEFAULT 'Pending',
        delivery_notes TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
    `);
  }
}

export const db = new DatabaseAdapter();
