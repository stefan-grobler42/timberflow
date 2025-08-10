// Products API Module
class ProductsAPI {
  constructor() {
    this.baseUrl = '/api/products';
    this.cache = new Map();
    this.cacheTimeout = 5 * 60 * 1000; // 5 minutes
  }
  
  async getAll() {
    const cacheKey = 'products_all';
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log('ProductsAPI: Returning cached products');
        return cached.data;
      }
    }
    
    try {
      const response = await fetch(this.baseUrl);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      console.log(`ProductsAPI: Loaded ${data.length} products`);
      return data;
      
    } catch (error) {
      console.warn('ProductsAPI: Failed to fetch products, using fallback data:', error);
      
      // Fallback sample data for development
      const fallbackData = [
        {
          id: 1,
          name: 'Steel Roofing Sheet',
          sku: 'SRS-001',
          price: 250.00,
          description: 'High-quality corrugated steel roofing sheet',
          category: 'Roofing Materials',
          unitOfMeasure: 'Each',
          active: true,
          createdDate: '2024-01-15T10:30:00Z',
          modifiedDate: '2024-08-10T14:20:00Z'
        },
        {
          id: 2,
          name: 'Cedar Shingles',
          sku: 'CS-002',
          price: 180.50,
          description: 'Premium cedar wood shingles for natural roofing',
          category: 'Roofing Materials',
          unitOfMeasure: 'Square Metre',
          active: true,
          createdDate: '2024-02-10T09:15:00Z',
          modifiedDate: '2024-07-22T11:30:00Z'
        },
        {
          id: 3,
          name: 'Aluminum Gutters',
          sku: 'AG-003',
          price: 75.25,
          description: 'Durable aluminum guttering system',
          category: 'Guttering',
          unitOfMeasure: 'Metre',
          active: true,
          createdDate: '2024-03-05T14:45:00Z',
          modifiedDate: '2024-08-01T16:10:00Z'
        },
        {
          id: 4,
          name: 'Roof Insulation',
          sku: 'RI-004',
          price: 45.00,
          description: 'Thermal roof insulation material',
          category: 'Insulation',
          unitOfMeasure: 'Square Metre',
          active: true,
          createdDate: '2024-01-20T08:20:00Z',
          modifiedDate: '2024-06-15T12:45:00Z'
        },
        {
          id: 5,
          name: 'Flashing Kit',
          sku: 'FK-005',
          price: 120.75,
          description: 'Complete roof flashing kit with fasteners',
          category: 'Hardware',
          unitOfMeasure: 'Kit',
          active: true,
          createdDate: '2024-04-12T11:30:00Z',
          modifiedDate: '2024-08-05T10:20:00Z'
        }
      ];
      
      return fallbackData;
    }
  }
  
  async getById(productId) {
    const cacheKey = `product_${productId}`;
    
    // Check cache first
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      if (Date.now() - cached.timestamp < this.cacheTimeout) {
        console.log(`ProductsAPI: Returning cached product ${productId}`);
        return cached.data;
      }
    }
    
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`);
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Cache the result
      this.cache.set(cacheKey, {
        data: data,
        timestamp: Date.now()
      });
      
      console.log(`ProductsAPI: Loaded product ${productId}`);
      return data;
      
    } catch (error) {
      console.warn(`ProductsAPI: Failed to fetch product ${productId}, using fallback:`, error);
      
      // Try to find in cached products first
      const allProducts = await this.getAll();
      const product = allProducts.find(p => p.id == productId);
      
      if (product) {
        return product;
      }
      
      throw new Error(`Product ${productId} not found`);
    }
  }
  
  async create(productData) {
    try {
      const response = await fetch(this.baseUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...productData,
          createdDate: new Date().toISOString(),
          modifiedDate: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Clear cache to force refresh
      this.clearCache();
      
      console.log('ProductsAPI: Created new product:', data.id);
      return data;
      
    } catch (error) {
      console.warn('ProductsAPI: Failed to create product, simulating:', error);
      
      // Simulate creation for development
      const newProduct = {
        ...productData,
        id: Date.now(),
        createdDate: new Date().toISOString(),
        modifiedDate: new Date().toISOString()
      };
      
      console.log('ProductsAPI: Simulated product creation:', newProduct.id);
      return newProduct;
    }
  }
  
  async update(productId, productData) {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          ...productData,
          modifiedDate: new Date().toISOString()
        })
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      const data = await response.json();
      
      // Clear cache to force refresh
      this.clearCache();
      
      console.log(`ProductsAPI: Updated product ${productId}`);
      return data;
      
    } catch (error) {
      console.warn(`ProductsAPI: Failed to update product ${productId}, simulating:`, error);
      
      // Simulate update for development
      const updatedProduct = {
        ...productData,
        id: productId,
        modifiedDate: new Date().toISOString()
      };
      
      console.log(`ProductsAPI: Simulated product update ${productId}`);
      return updatedProduct;
    }
  }
  
  async delete(productId) {
    try {
      const response = await fetch(`${this.baseUrl}/${productId}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }
      
      // Clear cache to force refresh
      this.clearCache();
      
      console.log(`ProductsAPI: Deleted product ${productId}`);
      return true;
      
    } catch (error) {
      console.warn(`ProductsAPI: Failed to delete product ${productId}, simulating:`, error);
      
      // Simulate delete for development
      console.log(`ProductsAPI: Simulated product deletion ${productId}`);
      return true;
    }
  }
  
  clearCache() {
    this.cache.clear();
    console.log('ProductsAPI: Cache cleared');
  }
  
  // Search products
  async search(query) {
    const products = await this.getAll();
    const searchTerm = query.toLowerCase();
    
    return products.filter(product => 
      product.name.toLowerCase().includes(searchTerm) ||
      (product.sku && product.sku.toLowerCase().includes(searchTerm)) ||
      (product.category && product.category.toLowerCase().includes(searchTerm)) ||
      (product.description && product.description.toLowerCase().includes(searchTerm))
    );
  }
  
  // Get products by category
  async getByCategory(category) {
    const products = await this.getAll();
    return products.filter(product => 
      product.category && product.category.toLowerCase() === category.toLowerCase()
    );
  }
  
  // Get active products only
  async getActive() {
    const products = await this.getAll();
    return products.filter(product => product.active);
  }
}

// Create global instance
window.ProductsAPI = new ProductsAPI();

console.log('ProductsAPI: Module loaded');