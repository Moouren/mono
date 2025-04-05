
import { useState, useEffect, useRef } from 'react';
import { 
  Table, 
  Input, 
  Button, 
  Row, 
  Col, 
  Typography, 
  Pagination, 
  Space,
  Select,
  Radio,
  Card,
  RadioChangeEvent
} from 'antd';
import { SearchOutlined, PlusOutlined, ReloadOutlined } from '@ant-design/icons';
import { 
  CrudListContainerProps, 
  QueryParams,
  DEFAULT_LIMIT,
  DEFAULT_PAGE,
  DEFAULT_SORT_FIELD,
  DEFAULT_SORT_DIRECTION,
} from './types';

const { Title } = Typography;
const { Option } = Select;

/**
 * CrudListContainer - A reusable component for displaying and managing list views of entities
 * 
 * This component handles:
 * - Fetching and displaying data in a table
 * - Pagination
 * - Sorting
 * - Searching
 * - Filtering
 * - Navigation to detail and create views
 */
export function CrudListContainer<T extends object>({
  resource,
  entityName,
  columns,
  disableSearch = false,
  statesForFiltering,
  defaultPayload = {},
  additionalPayload = {},
  withSorting = false,
  sortFields = [],
  additionalPathname,
  customFilters: CustomFilters,
  rowKey = 'id'
}: CrudListContainerProps<T>) {
  // Get page from URL if available
  const locationPage = new URLSearchParams(window.location.search).get('page');
  const pageFromUrl = locationPage ? +locationPage : DEFAULT_PAGE;
  
  // Component state
  const [loading, setLoading] = useState<boolean>(false);
  const [entries, setEntries] = useState<T[]>([]);
  const [currentPage, setCurrentPage] = useState<number>(pageFromUrl);
  const [totalItems, setTotalItems] = useState<number>(0);
  const [searchValue, setSearchValue] = useState<string>('');
  const [filterValue, setFilterValue] = useState<string>('');
  const [customFilterValue, setCustomFilterValue] = useState<any>({});
  const [sortField, setSortField] = useState<string | undefined>(
    defaultPayload.sortField || DEFAULT_SORT_FIELD
  );
  const [sortDirection, setSortDirection] = useState<string | undefined>(
    defaultPayload.sortDirection || DEFAULT_SORT_DIRECTION
  );
  
  // Reference for tracking if component is mounted
  const isMounted = useRef(true);
  
  // Effect to update isMounted ref on unmount
  useEffect(() => {
    return () => {
      isMounted.current = false;
    };
  }, []);
  
  // Load data on mount and when dependencies change
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    currentPage, 
    searchValue, 
    filterValue, 
    sortField, 
    sortDirection,
    customFilterValue
  ]);
  
  // Update URL when page changes
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('page', currentPage.toString());
      window.history.replaceState({}, '', url.toString());
    }
  }, [currentPage]);
  
  // Reset to page 1 when search, filter, or sort changes
  useEffect(() => {
    setCurrentPage(1);
  }, [searchValue, filterValue, sortField, sortDirection, customFilterValue]);
  
  // Fetch data from the resource
  async function fetchData() {
    if (!isMounted.current) return;
    
    setLoading(true);
    
    try {
      // Set up the API pathname if provided
      if (additionalPathname && resource.config) {
        resource.config.additionalPathname = additionalPathname;
      }
      
      // Calculate the offset based on current page
      const offset = (currentPage - 1) * DEFAULT_LIMIT;
      
      // Prepare the payload for the API
      const payload: Partial<QueryParams> = {
        limit: DEFAULT_LIMIT,
        offset,
        sortField,
        sortDirection,
        ...additionalPayload,
        ...customFilterValue
      };
      
      // Add search query if not empty
      if (searchValue) {
        payload.query = searchValue;
      }
      
      // Add filter state if not empty
      if (filterValue) {
        payload.state = filterValue;
      }
      
      // Fetch the data
      const response = await resource.getEntries(payload);
      
      if (isMounted.current) {
        setEntries(response.items || []);
        setTotalItems(response.total || 0);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      // You could add notification here
    } finally {
      if (isMounted.current) {
        setLoading(false);
      }
    }
  }
  
  // Navigate to detail view
  function handleRowClick(record: T) {
    if (!resource.getDetailLink) return;
    
    const link = resource.getDetailLink(record);
    if (link) {
      window.location.href = link;
    }
  }
  
  // Navigate to create view
  function handleCreateClick() {
    if (!resource.getCreateLink) return;
    
    const link = resource.getCreateLink();
    if (link) {
      window.location.href = link;
    }
  }
  
  // Handle search input change
  function handleSearch(value: string) {
    setSearchValue(value.trim());
  }
  
  // Handle filter selection
  function handleFilter(value: string) {
    setFilterValue(value);
  }
  
  // Handle custom filter
  function handleCustomFilter(value: any) {
    setCustomFilterValue(value);
  }
  
  // Handle sort field change
  function handleSortChange(value: string) {
    setSortField(value);
  }
  
  // Handle sort direction change
  function handleSortDirectionChange(e: RadioChangeEvent) {
    setSortDirection(e.target.value);
  }
  
  // Prepare table props
  const tableProps = {
    rowKey,
    loading,
    dataSource: entries,
    columns,
    pagination: false,
    onRow: (record: T) => ({
      onClick: () => handleRowClick(record),
      style: { cursor: resource.getDetailLink ? 'pointer' : 'default' }
    })
  };
  
  return (
    <Card>
      <Space direction="vertical" style={{ width: '100%' }} size="large">
        <Row justify="space-between" align="middle">
          <Col>
            <Title level={4}>
              {resource.entityName || entityName}
              {loading && <span style={{ marginLeft: 10 }}>Loading...</span>}
            </Title>
          </Col>
          <Col>
            <Space>
              {!disableSearch && (
                <Input
                  placeholder="Search..."
                  prefix={<SearchOutlined />}
                  onChange={(e) => handleSearch(e.target.value)}
                  style={{ width: 200 }}
                  allowClear
                />
              )}
              
              {statesForFiltering && statesForFiltering.length > 0 && (
                <Select
                  placeholder="Filter by state"
                  style={{ width: 150 }}
                  onChange={handleFilter}
                  allowClear
                >
                  {statesForFiltering.map((state) => (
                    <Option key={state} value={state}>
                      {state}
                    </Option>
                  ))}
                </Select>
              )}
              
              {withSorting && sortFields.length > 0 && (
                <>
                  <Select
                    placeholder="Sort by"
                    style={{ width: 150 }}
                    onChange={handleSortChange}
                    defaultValue={sortField}
                  >
                    {sortFields.map((field) => (
                      <Option key={field.value} value={field.value}>
                        {field.label}
                      </Option>
                    ))}
                  </Select>
                  
                  <Radio.Group
                    onChange={handleSortDirectionChange}
                    defaultValue={sortDirection}
                  >
                    <Radio.Button value="asc">Asc</Radio.Button>
                    <Radio.Button value="desc">Desc</Radio.Button>
                  </Radio.Group>
                </>
              )}
              
              <Button
                icon={<ReloadOutlined />}
                onClick={fetchData}
              >
                Refresh
              </Button>
              
              {resource.getCreateLink && (
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleCreateClick}
                >
                  Create
                </Button>
              )}
            </Space>
          </Col>
        </Row>
        
        {CustomFilters && (
          <CustomFilters onFilter={handleCustomFilter} />
        )}
        
        <Table {...tableProps} />
        
        <Row justify="end">
          <Pagination
            current={currentPage}
            total={totalItems}
            pageSize={DEFAULT_LIMIT}
            onChange={(page) => setCurrentPage(page)}
            showSizeChanger={false}
            showTotal={(total) => `Total ${total} items`}
          />
        </Row>
      </Space>
    </Card>
  );
}

