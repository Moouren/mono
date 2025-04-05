// apps/online-sales/app/services/product.service.ts
import { EntityResource } from '@my-monorepo/shell';

// Define the Product interface
export interface Product {
  id: string;
  title: string;  // Using title instead of name to match Fake Store API
  price: number;
  category: string;
  description: string;
  image: string;
  rating: {
    rate: number;
    count: number;
  };
  stock?: number;
  createdAt?: string;
}

// Create the product service using the EntityResource class
class ProductService extends EntityResource<Product> {
  // Override getEntries to use the Fake Store API
  async getEntries(params: any = {}): Promise<{ items: Product[]; total: number }> {
    try {
      // Call the Fake Store API
      const response = await fetch('https://fakestoreapi.com/products');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const products: Product[] = await response.json();
      
      // Add stock and createdAt since the API doesn't provide these
      const enhancedProducts = products.map(product => ({
        ...product,
        stock: Math.floor(Math.random() * 100) + 1, // Random stock between 1-100
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString() // Random date within ~4 months
      }));
      
      // Handle pagination
      const limit = params.limit || 10;
      const offset = params.offset || 0;
      
      // Handle search
      let filteredProducts = enhancedProducts;
      if (params.search) {
        const searchLower = params.search.toLowerCase();
        filteredProducts = filteredProducts.filter(product => 
          product.title.toLowerCase().includes(searchLower) || 
          product.description.toLowerCase().includes(searchLower) ||
          product.category.toLowerCase().includes(searchLower)
        );
      }
      
      // Handle filtering
      if (params.filters?.category) {
        filteredProducts = filteredProducts.filter(product => 
          product.category === params.filters.category
        );
      }
      
      // Handle sorting
      if (params.sortField) {
        const sortField = params.sortField as keyof Product;
        const sortDirection = params.sortDirection === 'asc' ? 1 : -1;
        
        filteredProducts.sort((a, b) => {
          if (a[sortField] < b[sortField]) return -1 * sortDirection;
          if (a[sortField] > b[sortField]) return 1 * sortDirection;
          return 0;
        });
      }
      
      // Apply pagination
      const paginatedProducts = filteredProducts.slice(offset, offset + limit);
      
      return {
        items: paginatedProducts,
        total: filteredProducts.length
      };
    } catch (error) {
      console.error('Error fetching products:', error);
      return { items: [], total: 0 };
    }
  }
  
  // Get a single product by ID
  async getById(id: string | number): Promise<Product> {
    try {
      const response = await fetch(`https://fakestoreapi.com/products/${id}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const product: Product = await response.json();
      
      // Add stock and createdAt
      return {
        ...product,
        stock: Math.floor(Math.random() * 100) + 1,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
      };
    } catch (error) {
      console.error(`Error fetching product with ID ${id}:`, error);
      throw error;
    }
  }

  // Get products by category
  async getByCategory(category: string): Promise<Product[]> {
    try {
      const response = await fetch(`https://fakestoreapi.com/products/category/${encodeURIComponent(category)}`);
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      const products: Product[] = await response.json();
      
      // Add stock and createdAt
      return products.map(product => ({
        ...product,
        stock: Math.floor(Math.random() * 100) + 1,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 10000000000)).toISOString()
      }));
    } catch (error) {
      console.error(`Error fetching products in category ${category}:`, error);
      throw error;
    }
  }

  // Get all available categories
  async getCategories(): Promise<string[]> {
    try {
      const response = await fetch('https://fakestoreapi.com/products/categories');
      
      if (!response.ok) {
        throw new Error(`API error: ${response.status}`);
      }
      
      return response.json();
    } catch (error) {
      console.error('Error fetching product categories:', error);
      throw error;
    }
  }

  // Get top selling products (simulated)
  async getTopSellingProducts(): Promise<Product[]> {
    try {
      const allProducts = await this.getEntries({ limit: 20 });
      
      // Simulate top products by sorting by rating count
      return allProducts.items
        .sort((a, b) => (b.rating?.count || 0) - (a.rating?.count || 0))
        .slice(0, 5);
    } catch (error) {
      console.error('Error fetching top selling products:', error);
      throw error;
    }
  }
}

// Create and export an instance
const productService = new ProductService({
  apiURL: 'https://fakestoreapi.com',
  entityURL: 'products',
  detailLink: '/products',
  createLink: '/products/create'
});

export default productService;