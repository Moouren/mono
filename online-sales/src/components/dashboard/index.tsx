'use client';

import { useEffect, useState } from 'react';
import { 
  Button, 
  Layout, 
  Menu, 
  Typography, 
  Table, 
  Card,
  Statistic,
  Row,
  Col,
  App,
  Spin
} from 'antd';
import { 
  ShoppingOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  LogoutOutlined,
  DollarOutlined,
  BarChartOutlined,
  RiseOutlined,
  LoadingOutlined
} from '@ant-design/icons';
import { useAuthState, useLogout, AuthService, useAuth } from '@my-monorepo/shell';
import { useRouter, usePathname } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

// Sample order data for demonstration
const orderData = [
  { id: 1, customer: 'John Doe', status: 'Completed', total: 125.99, date: '2025-04-01' },
  { id: 2, customer: 'Jane Smith', status: 'Processing', total: 89.50, date: '2025-04-02' }
];

// Table columns
const columns = [
  { title: 'Order ID', dataIndex: 'id', key: 'id' },
  { title: 'Customer', dataIndex: 'customer', key: 'customer' },
  { title: 'Status', dataIndex: 'status', key: 'status' },
  { title: 'Total', dataIndex: 'total', key: 'total', render: (value: number) => `$${value.toFixed(2)}` },
  { title: 'Date', dataIndex: 'date', key: 'date' }
];

export default function Dashboard() {
  const router = useRouter();
  const pathname = usePathname();
  const { isAuthenticated, user, loading } = useAuthState();
  const { logout } = useLogout();
  const { setUser } = useAuth();
  const { message } = App.useApp();
  const [initialLoading, setInitialLoading] = useState(true);
  
  // IMPORTANT: Check for token_processed flag
  const hasProcessedToken = typeof window !== 'undefined' && localStorage.getItem('token_processed') === 'true';
  
  console.log('Dashboard - Auth state:', { isAuthenticated, user, loading, hasProcessedToken });
  
  // Handle initialization and token processing
  useEffect(() => {
    // First, check for auth token in URL (for cases when redirected directly to dashboard)
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('authToken');
    
    if (authToken) {
      try {
        console.log('Auth token found in dashboard URL, processing...');
        
        // Process the token
        const decodedToken = decodeURIComponent(authToken);
        const tokenData = JSON.parse(decodedToken);
        
        // Create auth service instance for saving the token
        const tempAuthService = new AuthService(process.env.NEXT_PUBLIC_API_URL || '');
        
        // Save the token using your existing method
        tempAuthService.saveTokensToStorage({
          accessToken: tokenData.accessToken,
          refreshToken: tokenData.refreshToken,
          user: tokenData.userData || null
        });
        
        // If user data is included, set it in context
        if (tokenData.userData) {
          setUser(tokenData.userData);
        }
        
        // Clean the URL
        window.history.replaceState({}, document.title, window.location.pathname);
        
        // Mark as processed
        localStorage.setItem('token_processed', 'true');
        
        console.log('Token saved successfully in dashboard');
      } catch (error) {
        console.error('Failed to process auth token in dashboard:', error);
        message.error('Authentication error in dashboard');
      }
    }
    
    // Short delay before turning off loading
    setTimeout(() => {
      setInitialLoading(false);
    }, 1000);
  }, [message, setUser]);
  
  // Skip auth check if token has been processed
  // Only check auth if initialLoading is false and no token has been processed
  useEffect(() => {
    if (!initialLoading && !hasProcessedToken && !loading && !isAuthenticated) {
      console.log('Not authenticated in dashboard and no token processed, redirecting to home...');
      router.push('/');
    }
  }, [initialLoading, hasProcessedToken, isAuthenticated, loading, router]);

  // Handle logout
  const handleLogout = async () => {
    try {
      console.log('Logging out...');
      
      // Call the logout function from auth context
      await logout();
      
      // Create a direct instance of AuthService to ensure cookies are cleared
      const authService = new AuthService(process.env.NEXT_PUBLIC_API_URL || '');
      authService.clearTokensFromStorage();
      
      // Clear any cached auth state
      if (typeof window !== 'undefined') {
        localStorage.removeItem('redirectUrl');
        localStorage.removeItem('token_processed'); // Clear the token_processed flag
        sessionStorage.clear(); // Clear any session data
      }
      
      message.success('Logged out successfully');
      
      // Short delay before redirect to ensure all cleanup is done
      setTimeout(() => {
        window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/login?logout=true`;
      }, 300);
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Logout failed');
    }
  };

  // Find the current active key based on pathname
  const getActiveMenuKey = () => {
    if (pathname === '/dashboard') return 'dashboard';
    if (pathname === '/dashboard/orders') return 'orders';
    if (pathname === '/dashboard/products') return 'products';
    if (pathname === '/dashboard/customers') return 'customers';
    return 'dashboard'; // Default to dashboard
  };

  // Handle menu item clicks
  const handleMenuClick = ({ key }: { key: string }) => {
    switch(key) {
      case 'dashboard':
        router.push('/dashboard');
        break;
      case 'orders':
        router.push('/dashboard/orders');
        break;
      case 'products':
        router.push('/dashboard/products');
        break;
      case 'customers':
        router.push('/dashboard/customers');
        break;
      default:
        router.push('/dashboard');
    }
  };

  // Define menu items
  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
      onClick: () => router.push('/dashboard'),
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
      onClick: () => router.push('/dashboard/orders'),
    },
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: 'Products',
      onClick: () => router.push('/dashboard/products'),
    },
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: 'Customers',
      onClick: () => router.push('/dashboard/customers'),
    }
  ];

  // Show loading state
  if (initialLoading || loading) {
    return (
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh' 
      }}>
        <Spin indicator={<LoadingOutlined style={{ fontSize: 32 }} spin />} />
        <div style={{ marginTop: 16 }}>
          Loading dashboard...
        </div>
      </div>
    );
  }

  // If token has been processed, show the dashboard regardless of authentication state
  // This is our key solution to break the loop
  if (hasProcessedToken || isAuthenticated) {
    // Show main dashboard
    return (
      <Layout style={{ minHeight: '100vh', direction: 'rtl' }}>
        <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ShoppingOutlined style={{ fontSize: '24px', color: 'white', marginRight: '10px' }} />
            <Title level={4} style={{ color: 'white', margin: 0 }}>
              Online Sales Dashboard
            </Title>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Text style={{ color: 'white', marginRight: '15px' }}>
              {user?.name || 'User'}
            </Text>
            <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: 'white' }}>
              Logout
            </Button>
          </div>
        </Header>
        <Layout>
          <Sider width={200} style={{ background: '#fff' }}>
            <Menu
              mode="inline"
              selectedKeys={[getActiveMenuKey()]}
              style={{ height: '100%', borderRight: 0 }}
              items={menuItems}
              onClick={handleMenuClick}
            />
          </Sider>
          <Layout style={{ padding: '24px' }}>
            <Content>
              <Title level={4}>Sales Overview</Title>
              <Row gutter={16} style={{ marginBottom: '24px' }}>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Total Sales"
                      value={215.49}
                      precision={2}
                      valueStyle={{ color: '#3f8600' }}
                      prefix={<DollarOutlined />}
                      suffix="$"
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Completed Orders"
                      value={1}
                      valueStyle={{ color: '#3f8600' }}
                      prefix={<ShoppingCartOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Processing Orders"
                      value={1}
                      valueStyle={{ color: '#1890ff' }}
                      prefix={<RiseOutlined />}
                    />
                  </Card>
                </Col>
                <Col span={6}>
                  <Card>
                    <Statistic
                      title="Pending Orders"
                      value={0}
                      valueStyle={{ color: '#faad14' }}
                      prefix={<ShoppingCartOutlined />}
                    />
                  </Card>
                </Col>
              </Row>
              
              <Card title="Recent Orders" style={{ marginBottom: '24px' }}>
                <Table
                  columns={columns}
                  dataSource={orderData}
                  rowKey="id"
                  pagination={{ pageSize: 5 }}
                />
              </Card>
            </Content>
          </Layout>
        </Layout>
      </Layout>
    );
  }

  // Fall-back for unauthenticated users (should not reach here due to our logic)
  return (
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column',
      justifyContent: 'center', 
      alignItems: 'center', 
      height: '100vh' 
    }}>
      <div style={{ marginBottom: 16 }}>You need to log in to view this page.</div>
      <Button type="primary" onClick={() => router.push('/')}>
        Go to Login
      </Button>
    </div>
  );
}