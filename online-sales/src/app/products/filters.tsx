// Example of a custom filter component
// If you need more advanced filtering
import { Select, DatePicker, Button, Space, Form } from 'antd';
import { CustomFiltersProps } from '@my-monorepo/shell';

// Custom filter component
const ProductFilters: React.FC<CustomFiltersProps> = ({ onFilter }) => {
  const [form] = Form.useForm();
  
  const handleFilterApply = () => {
    const values = form.getFieldsValue();
    onFilter(values);
  };
  
  const handleReset = () => {
    form.resetFields();
    onFilter({});
  };
  
  return (
    <Form form={form} layout="inline">
      <Form.Item name="category" label="Category">
        <Select style={{ width: 160 }} allowClear placeholder="Select category">
          {categories.map(category => (
            <Select.Option key={category} value={category}>
              {category}
            </Select.Option>
          ))}
        </Select>
      </Form.Item>
      
      <Form.Item name="priceMin" label="Min Price">
        <input type="number" style={{ width: 100 }} />
      </Form.Item>
      
      <Form.Item name="priceMax" label="Max Price">
        <input type="number" style={{ width: 100 }} />
      </Form.Item>
      
      <Form.Item name="dateRange" label="Created">
        <DatePicker.RangePicker />
      </Form.Item>
      
      <Form.Item>
        <Space>
          <Button type="primary" onClick={handleFilterApply}>
            Apply Filters
          </Button>
          <Button onClick={handleReset}>
            Reset
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};