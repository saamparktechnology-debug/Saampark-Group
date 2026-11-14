const pool = require('../config/db');

const productModel = {
  async create(data) {
    const [result] = await pool.execute(
      `INSERT INTO products (company_id, name, sku, barcode, category_id, brand_id, unit_id, type, description, purchase_price, selling_price, tax_percent, opening_stock, current_stock, minimum_stock, maximum_stock, warehouse_id, has_batch, has_serial, image_url, status)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [data.company_id, data.name, data.sku || null, data.barcode || null, data.category_id || null,
       data.brand_id || null, data.unit_id || null, data.type || 'goods', data.description || null,
       data.purchase_price || 0, data.selling_price || 0, data.tax_percent || 0,
       data.opening_stock || 0, data.current_stock || 0, data.minimum_stock || 0,
       data.maximum_stock || 0, data.warehouse_id || null, data.has_batch || 0,
       data.has_serial || 0, data.image_url || null, data.status || 'active']
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute(
      `SELECT p.*, c.name as category_name, b.name as brand_name, u.name as unit_name, u.short_name as unit_short_name
       FROM products p
       LEFT JOIN product_categories c ON p.category_id = c.id
       LEFT JOIN brands b ON p.brand_id = b.id
       LEFT JOIN units u ON p.unit_id = u.id
       WHERE p.id = ?`, [id]
    );
    return rows[0] || null;
  },

  async findByCompany(company_id, { search, category_id, brand_id, status, page = 1, limit = 50 } = {}) {
    let query = 'SELECT p.*, c.name as category_name, b.name as brand_name FROM products p LEFT JOIN product_categories c ON p.category_id = c.id LEFT JOIN brands b ON p.brand_id = b.id WHERE p.company_id = ?';
    const params = [company_id];
    if (search) { query += ' AND (p.name LIKE ? OR p.sku LIKE ? OR p.barcode LIKE ?)'; params.push(`%${search}%`, `%${search}%`, `%${search}%`); }
    if (category_id) { query += ' AND p.category_id = ?'; params.push(category_id); }
    if (brand_id) { query += ' AND p.brand_id = ?'; params.push(brand_id); }
    if (status) { query += ' AND p.status = ?'; params.push(status); }
    const offset = (page - 1) * limit;
    query += ` ORDER BY p.name LIMIT ${parseInt(limit)} OFFSET ${parseInt(offset)}`;
    const [rows] = await pool.execute(query, params);
    const [count] = await pool.execute('SELECT COUNT(*) as total FROM products WHERE company_id = ?', [company_id]);
    return { data: rows, total: count[0].total, page, limit };
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE products SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM products WHERE id = ?', [id]);
    return true;
  },

  async getLowStock(company_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM products WHERE company_id = ? AND current_stock <= minimum_stock AND status = "active" ORDER BY current_stock ASC', [company_id]
    );
    return rows;
  }
};

const productCategoryModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO product_categories (company_id, name, parent_id, image_url, description) VALUES (?, ?, ?, ?, ?)',
      [data.company_id, data.name, data.parent_id || null, data.image_url || null, data.description || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM product_categories WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute(
      `SELECT pc.*, (SELECT COUNT(*) FROM products p WHERE p.category_id = pc.id) as product_count
       FROM product_categories pc WHERE pc.company_id = ? ORDER BY pc.name`, [company_id]
    );
    return rows;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE product_categories SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM product_categories WHERE id = ?', [id]);
    return true;
  }
};

const brandModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO brands (company_id, name, logo_url, description) VALUES (?, ?, ?, ?)',
      [data.company_id, data.name, data.logo_url || null, data.description || null]
    );
    return result.insertId;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute(
      `SELECT b.*, (SELECT COUNT(*) FROM products p WHERE p.brand_id = b.id) as product_count
       FROM brands b WHERE b.company_id = ? ORDER BY b.name`, [company_id]
    );
    return rows;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE brands SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM brands WHERE id = ?', [id]);
    return true;
  }
};

const unitModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO units (company_id, name, short_name, base_unit_id, conversion_factor) VALUES (?, ?, ?, ?, ?)',
      [data.company_id, data.name, data.short_name, data.base_unit_id || null, data.conversion_factor || 1]
    );
    return result.insertId;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute('SELECT * FROM units WHERE company_id = ? ORDER BY name', [company_id]);
    return rows;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE units SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM units WHERE id = ?', [id]);
    return true;
  }
};

const warehouseModel = {
  async create(data) {
    const [result] = await pool.execute(
      'INSERT INTO warehouses (company_id, name, code, address, city, manager_id) VALUES (?, ?, ?, ?, ?, ?)',
      [data.company_id, data.name, data.code || null, data.address || null, data.city || null, data.manager_id || null]
    );
    return result.insertId;
  },

  async findById(id) {
    const [rows] = await pool.execute('SELECT * FROM warehouses WHERE id = ?', [id]);
    return rows[0] || null;
  },

  async findByCompany(company_id) {
    const [rows] = await pool.execute(
      `SELECT w.*, (SELECT COUNT(*) FROM stock s WHERE s.warehouse_id = w.id) as product_count
       FROM warehouses w WHERE w.company_id = ? ORDER BY w.name`, [company_id]
    );
    return rows;
  },

  async update(id, data) {
    const fields = [];
    const values = [];
    for (const [key, val] of Object.entries(data)) {
      if (val !== undefined) { fields.push(`${key} = ?`); values.push(val); }
    }
    if (fields.length === 0) return false;
    values.push(id);
    await pool.execute(`UPDATE warehouses SET ${fields.join(', ')} WHERE id = ?`, values);
    return true;
  },

  async delete(id) {
    await pool.execute('DELETE FROM warehouses WHERE id = ?', [id]);
    return true;
  }
};

const stockModel = {
  async getStock(product_id, warehouse_id) {
    const [rows] = await pool.execute(
      'SELECT * FROM stock WHERE product_id = ? AND warehouse_id = ?', [product_id, warehouse_id]
    );
    return rows[0] || null;
  },

  async updateStock(product_id, warehouse_id, quantity, batch_number = null) {
    const existing = await this.getStock(product_id, warehouse_id);
    if (existing) {
      await pool.execute(
        'UPDATE stock SET quantity = quantity + ? WHERE id = ?', [quantity, existing.id]
      );
    } else {
      await pool.execute(
        'INSERT INTO stock (product_id, warehouse_id, quantity, batch_number) VALUES (?, ?, ?, ?)',
        [product_id, warehouse_id, quantity, batch_number]
      );
    }
  },

  async transfer(from_warehouse_id, to_warehouse_id, product_id, quantity) {
    const conn = await pool.getConnection();
    try {
      await conn.beginTransaction();
      await conn.execute('UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ? AND quantity >= ?',
        [quantity, product_id, from_warehouse_id, quantity]);
      const [toStock] = await conn.execute('SELECT * FROM stock WHERE product_id = ? AND warehouse_id = ?',
        [product_id, to_warehouse_id]);
      if (toStock.length > 0) {
        await conn.execute('UPDATE stock SET quantity = quantity + ? WHERE id = ?', [quantity, toStock[0].id]);
      } else {
        await conn.execute('INSERT INTO stock (product_id, warehouse_id, quantity) VALUES (?, ?, ?)',
          [product_id, to_warehouse_id, quantity]);
      }
      await conn.commit();
      return true;
    } catch (err) { await conn.rollback(); throw err; } finally { conn.release(); }
  },

  async adjust(warehouse_id, product_id, quantity, adjustment_type) {
    if (adjustment_type === 'add') {
      await pool.execute('UPDATE stock SET quantity = quantity + ? WHERE product_id = ? AND warehouse_id = ?',
        [Math.abs(quantity), product_id, warehouse_id]);
    } else {
      await pool.execute('UPDATE stock SET quantity = quantity - ? WHERE product_id = ? AND warehouse_id = ?',
        [Math.abs(quantity), product_id, warehouse_id]);
    }
  },

  async getByWarehouse(company_id, warehouse_id) {
    const [rows] = await pool.execute(
      `SELECT s.*, p.name as product_name, p.sku, p.barcode FROM stock s
       JOIN products p ON s.product_id = p.id
       WHERE p.company_id = ? AND s.warehouse_id = ? ORDER BY p.name`, [company_id, warehouse_id]
    );
    return rows;
  }
};

module.exports = { productModel, productCategoryModel, brandModel, unitModel, warehouseModel, stockModel };
