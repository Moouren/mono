'use client';

import { useState, useEffect } from 'react';
import { CrudListContainer, CrudColumn, CustomFiltersProps } from '@my-monorepo/shell';
import productService, { Product } from '../../services/product.service';
import { Select, Slider, Space, Button, Card, Row, Col, Typography, InputNumber, App } from 'antd';

const { Title } = Typography;
const { Option } = Select;

// Define your columns - updated to match the Fake Store API response
const columns: CrudColumn<Product>[] = [
  {
    title: 'Image',
    dataIndex: 'image',
    render: (image) => (
      <img 
        src={image} 
        alt="Product" 
        style={{ width: 50, height: 50, objectFit: 'contain' }} 
      />
    ),
  },
  {
    title: 'Title',
    dataIndex: 'title', // Changed from 'name' to 'title' to match API
    sorter: true,
    sortParameter: 'title',
    searchKey: 'title', // Enable searching by title
    ellipsis: true,
  },
  {
    title: 'Price',
    dataIndex: 'price',
    sorter: true,
    sortParameter: 'price',
    render: (price) => `$${price.toFixed(2)}`,
    width: 100,
  },
  {
    title: 'Category',
    dataIndex: 'category',
    filterParameter: 'category',
    width: 150,
  },
  {
    title: 'Rating',
    dataIndex: 'rating',
    sorter: true,
    sortParameter: 'rating.rate',
    render: (rating) => `${rating.rate} (${rating.count} reviews)`,
    width: 150,
  },
  {
    title: 'Stock',
    dataIndex: 'stock',
    sorter: true,
    sortParameter: 'stock',
    width: 100,
  },
  {
    title: 'Created At',
    dataIndex: 'createdAt',
    sorter: true,
    sortParameter: 'createdAt',
    render: (date) => new Date(date).toLocaleDateString(),
    width: 120,
  }
];

// Define sort fields
const sortFields = [
  { label: 'Title', value: 'title' },
  { label: 'Price (Low to High)', value: 'price' },
  { label: 'Price (High to Low)', value: 'price-desc' },
  { label: 'Rating', value: 'rating.rate' },
  { label: 'Created Date', value: 'createdAt' }
];

// Custom filter component
const ProductFilters: React.FC<CustomFiltersProps> = ({ onFilter }) => {
  const { message } = App.useApp();
  const [categories, setCategories] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 1000]);
  const [ratingMin, setRatingMin] = useState<number>(0);
  
  // Load categories from API
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const fetchedCategories = await productService.getCategories();
        setCategories(fetchedCategories);
      } catch (error) {
        message.error('Failed to load categories');
        console.error('Error loading categories:', error);
      }
    };
    
    loadCategories();
  }, [message]);
  
  // Apply filters
  const handleApplyFilters = () => {
    const filters: Record<string, any> = {};
    
    if (selectedCategory) {
      filters.category = selectedCategory;
    }
    
    filters.priceMin = priceRange[0];
    filters.priceMax = priceRange[1];
    
    if (ratingMin > 0) {
      filters.ratingMin = ratingMin;
    }
    
    onFilter(filters);
  };
  
  // Reset filters
  const handleResetFilters = () => {
    setSelectedCategory('');
    setPriceRange([0, 1000]);
    setRatingMin(0);
    onFilter({});
  };
  
  return (
    <Card style={{ marginBottom: 16 }}>
      <Title level={5}>Filter Products</Title>
      <Row gutter={[16, 16]}>
        <Col xs={24} sm={12} md={6}>
          <div>Category</div>
          <Select
            style={{ width: '100%' }}
            value={selectedCategory}
            onChange={setSelectedCategory}
            allowClear
            placeholder="Select category"
          >
            {categories.map(category => (
              <Option key={category} value={category}>
                {category.charAt(0).toUpperCase() + category.slice(1)}
              </Option>
            ))}
          </Select>
        </Col>
        
        <Col xs={24} sm={12} md={8}>
          <div>Price Range</div>
          <Row>
            <Col span={20}>
              <Slider
                range
                min={0}
                max={1000}
                value={priceRange}
                onChange={(value) => setPriceRange(value as [number, number])}
              />
            </Col>
            <Col span={4} style={{ paddingLeft: 12 }}>
              ${priceRange[0]} - ${priceRange[1]}
            </Col>
          </Row>
        </Col>
        
        <Col xs={24} sm={12} md={4}>
          <div>Min Rating</div>
          <Space>
            <InputNumber
              min={0}
              max={5}
              value={ratingMin}
              onChange={(value) => setRatingMin(value as number)}
            />
            <span>out of 5</span>
          </Space>
        </Col>
        
        <Col xs={24} sm={12} md={6}>
          <div style={{ marginBottom: 8 }}>Actions</div>
          <Space>
            <Button type="primary" onClick={handleApplyFilters}>
              Apply Filters
            </Button>
            <Button onClick={handleResetFilters}>
              Reset
            </Button>
          </Space>
        </Col>
      </Row>
    </Card>
  );
};

// Updated ProductsPage
export default function ProductsPage() {
  // Add a state to manage loading of sort fields
  
  return (
    <div style={{ padding: '24px' }}>
      <CrudListContainer
        entityName="Products"
        columns={columns}
        resource={productService}
        withSorting
        sortFields={sortFields}
        customFilters={ProductFilters}
      />
    </div>
  );
}