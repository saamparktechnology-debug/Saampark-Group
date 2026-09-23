import { api, unwrapList } from '@/lib/api'

export const ProductService = {
  getAll: async (params) => { 
    const q = new URLSearchParams(params).toString()
    const res = await api.get(`/inventory/products?${q}`)
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/inventory/products/${id}`),
  create: async (data) => api.post('/inventory/products', data),
  update: async (id, data) => api.put(`/inventory/products/${id}`, data),
  delete: async (id) => api.delete(`/inventory/products/${id}`),
  getLowStock: async () => api.get('/inventory/products/low-stock'),
}

export const ProductCategoryService = {
  getAll: async () => {
    const res = await api.get('/inventory/categories')
    return unwrapList(res)
  },
  create: async (data) => api.post('/inventory/categories', data),
  update: async (id, data) => api.put(`/inventory/categories/${id}`, data),
  delete: async (id) => api.delete(`/inventory/categories/${id}`),
}

export const BrandService = {
  getAll: async () => {
    const res = await api.get('/inventory/brands')
    return unwrapList(res)
  },
  create: async (data) => api.post('/inventory/brands', data),
}

export const UnitService = {
  getAll: async () => {
    const res = await api.get('/inventory/units')
    return unwrapList(res)
  },
  create: async (data) => api.post('/inventory/units', data),
}

export const WarehouseService = {
  getAll: async () => {
    const res = await api.get('/inventory/warehouses')
    return unwrapList(res)
  },
  getById: async (id) => api.get(`/inventory/warehouses/${id}`),
  create: async (data) => api.post('/inventory/warehouses', data),
  update: async (id, data) => api.put(`/inventory/warehouses/${id}`, data),
  delete: async (id) => api.delete(`/inventory/warehouses/${id}`),
}

export const StockService = {
  getByWarehouse: async (warehouseId) => api.get(`/inventory/stock/${warehouseId}`),
  transfer: async (data) => api.post('/inventory/stock/transfer', data),
  adjust: async (data) => api.post('/inventory/stock/adjust', data),
}
