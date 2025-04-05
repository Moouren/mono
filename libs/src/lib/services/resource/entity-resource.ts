// libs/shell/src/lib/services/resource/entity-resource.ts
import axios, { AxiosInstance } from 'axios';
import { QueryParams } from '../../components/crud-list/types';

/**
 * Configuration for an EntityResource
 */
export interface EntityResourceConfig {
  apiURL: string;
  entityURL: string;
  detailLink?: string;
  createLink?: string;
  entityPrimaryKey?: string;
  additionalPathname?: string;
}

/**
 * EntityResource - A base class for entity API resources
 * 
 * This class provides methods for interacting with a RESTful API
 * for a specific entity type.
 */
export class EntityResource<T> {
  protected api: AxiosInstance;
  public config: EntityResourceConfig;
  
  /**
   * Create a new EntityResource
   * @param config - Configuration for the resource
   */
  constructor(config: EntityResourceConfig) {
    this.config = {
      entityPrimaryKey: 'id',
      ...config
    };
    
    this.api = axios.create({
      baseURL: config.apiURL,
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    // Set up auth interceptor
    this.setupInterceptors();
  }
  
  /**
   * Set up request interceptors for authentication
   */
  private setupInterceptors() {
    this.api.interceptors.request.use(
      (config) => {
        // If using localStorage for auth tokens
        const tokenData = localStorage.getItem('auth_tokens');
        if (tokenData && config.headers) {
          try {
            const tokens = JSON.parse(tokenData);
            config.headers.Authorization = `Bearer ${tokens.accessToken}`;
          } catch (error) {
            console.error('Error parsing auth tokens:', error);
          }
        }
        return config;
      },
      (error) => Promise.reject(error)
    );
  }
  
  /**
   * Get the entity name from the config
   */
  get entityName(): string {
    // Extract entity name from the URL or use the URL itself
    const parts = this.config.entityURL.split('/');
    return parts[parts.length - 1].charAt(0).toUpperCase() + parts[parts.length - 1].slice(1);
  }
  
  /**
   * Get the entity API URL
   */
  getEntityUrl(): string {
    let url = this.config.entityURL;
    if (this.config.additionalPathname) {
      url = `${this.config.additionalPathname}/${url}`;
    }
    return url;
  }
  
  /**
   * Get entries from the API
   * @param params - Query parameters
   * @returns Promise with the API response
   */
  async getEntries(params: Partial<QueryParams> = {}): Promise<{ items: T[]; total: number }> {
    try {
      const response = await this.api.get(this.getEntityUrl(), { params });
      
      // Handle different API response formats
      const { data } = response;
      
      // If the API returns data in a nested structure
      if (data.items && data.total !== undefined) {
        return {
          items: data.items,
          total: data.total
        };
      }
      
      // If the API returns an array directly
      if (Array.isArray(data)) {
        return {
          items: data,
          total: data.length
        };
      }
      
      // If the API returns data with different field names
      if (data.data && (data.total !== undefined || data.count !== undefined)) {
        return {
          items: data.data,
          total: data.total || data.count
        };
      }
      
      // Fallback
      return {
        items: [],
        total: 0
      };
    } catch (error) {
      console.error('Error fetching entries:', error);
      throw error;
    }
  }
  
  /**
   * Get a detail link for an entity
   * @param record - Entity record
   * @returns URL string or undefined
   */
  getDetailLink(record: T): string | undefined {
    if (!this.config.detailLink) return undefined;
    
    // @ts-expect-error - We know the entity has an ID field
    const id = record[this.config.entityPrimaryKey || 'id'];
    return `${this.config.detailLink}/${id}`;
  }
  
  /**
   * Get the create link for this entity
   * @returns URL string or undefined
   */
  getCreateLink(): string | undefined {
    return this.config.createLink;
  }
  
  /**
   * Get a single entity by ID
   * @param id - Entity ID
   * @returns Promise with the entity
   */
  async getById(id: string | number): Promise<T> {
    try {
      const response = await this.api.get(`${this.getEntityUrl()}/${id}`);
      return response.data;
    } catch (error) {
      console.error(`Error fetching ${this.entityName} with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Create a new entity
   * @param data - Entity data
   * @returns Promise with the created entity
   */
  async create(data: Partial<T>): Promise<T> {
    try {
      const response = await this.api.post(this.getEntityUrl(), data);
      return response.data;
    } catch (error) {
      console.error(`Error creating ${this.entityName}:`, error);
      throw error;
    }
  }
  
  /**
   * Update an entity
   * @param id - Entity ID
   * @param data - Updated entity data
   * @returns Promise with the updated entity
   */
  async update(id: string | number, data: Partial<T>): Promise<T> {
    try {
      const response = await this.api.put(`${this.getEntityUrl()}/${id}`, data);
      return response.data;
    } catch (error) {
      console.error(`Error updating ${this.entityName} with ID ${id}:`, error);
      throw error;
    }
  }
  
  /**
   * Delete an entity
   * @param id - Entity ID
   * @returns Promise that resolves when the entity is deleted
   */
  async delete(id: string | number): Promise<void> {
    try {
      await this.api.delete(`${this.getEntityUrl()}/${id}`);
    } catch (error) {
      console.error(`Error deleting ${this.entityName} with ID ${id}:`, error);
      throw error;
    }
  }
}

