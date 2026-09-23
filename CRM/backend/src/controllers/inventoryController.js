const { successResponse, errorResponse } = require('../utils/apiResponse');
const { productModel, productCategoryModel, brandModel, unitModel, warehouseModel, stockModel } = require('../models/inventoryModel');

const productController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const { search, category_id, brand_id, status, page, limit } = req.query;
      const result = await productModel.findByCompany(companyId, { search, category_id, brand_id, status, page: parseInt(page) || 1, limit: parseInt(limit) || 50 });
      return successResponse(res, 200, 'Products fetched', result);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const product = await productModel.findById(req.params.id);
      if (!product) return errorResponse(res, 404, 'Product not found');
      return successResponse(res, 200, 'Product fetched', product);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await productModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Product created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await productModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Product updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await productModel.delete(req.params.id);
      return successResponse(res, 200, 'Product deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getLowStock(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const products = await productModel.getLowStock(companyId);
      return successResponse(res, 200, 'Low stock products', products);
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const productCategoryController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const categories = await productCategoryModel.findByCompany(companyId);
      return successResponse(res, 200, 'Categories fetched', categories);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await productCategoryModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Category created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await productCategoryModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Category updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await productCategoryModel.delete(req.params.id);
      return successResponse(res, 200, 'Category deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const brandController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const brands = await brandModel.findByCompany(companyId);
      return successResponse(res, 200, 'Brands fetched', brands);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await brandModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Brand created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await brandModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Brand updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await brandModel.delete(req.params.id);
      return successResponse(res, 200, 'Brand deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const unitController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const units = await unitModel.findByCompany(companyId);
      return successResponse(res, 200, 'Units fetched', units);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await unitModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Unit created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await unitModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Unit updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await unitModel.delete(req.params.id);
      return successResponse(res, 200, 'Unit deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const warehouseController = {
  async getAll(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const warehouses = await warehouseModel.findByCompany(companyId);
      return successResponse(res, 200, 'Warehouses fetched', warehouses);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async getById(req, res) {
    try {
      const wh = await warehouseModel.findById(req.params.id);
      if (!wh) return errorResponse(res, 404, 'Warehouse not found');
      return successResponse(res, 200, 'Warehouse fetched', wh);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async create(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const id = await warehouseModel.create({ ...req.body, company_id: companyId });
      return successResponse(res, 201, 'Warehouse created', { id });
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async update(req, res) {
    try {
      await warehouseModel.update(req.params.id, req.body);
      return successResponse(res, 200, 'Warehouse updated');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async delete(req, res) {
    try {
      await warehouseModel.delete(req.params.id);
      return successResponse(res, 200, 'Warehouse deleted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

const stockController = {
  async getByWarehouse(req, res) {
    try {
      const companyId = req.headers['x-company-id'] || req.user?.company_id;
      const stock = await stockModel.getByWarehouse(companyId, req.params.warehouseId);
      return successResponse(res, 200, 'Stock fetched', stock);
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async transfer(req, res) {
    try {
      const { from_warehouse_id, to_warehouse_id, product_id, quantity } = req.body;
      await stockModel.transfer(from_warehouse_id, to_warehouse_id, product_id, quantity);
      return successResponse(res, 200, 'Stock transferred');
    } catch (err) { return errorResponse(res, 500, err.message); }
  },
  async adjust(req, res) {
    try {
      const { warehouse_id, product_id, quantity, adjustment_type } = req.body;
      await stockModel.adjust(warehouse_id, product_id, quantity, adjustment_type);
      return successResponse(res, 200, 'Stock adjusted');
    } catch (err) { return errorResponse(res, 500, err.message); }
  }
};

module.exports = { productController, productCategoryController, brandController, unitController, warehouseController, stockController };
