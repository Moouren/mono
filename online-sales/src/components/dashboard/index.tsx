'use client';

import { useEffect } from 'react';
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
  App
} from 'antd';
import { 
  ShoppingOutlined, 
  ShoppingCartOutlined, 
  UserOutlined, 
  LogoutOutlined,
  DollarOutlined,
  BarChartOutlined,
  RiseOutlined
} from '@ant-design/icons';
import { useAuthState, useLogout, AuthService, useAuth } from '@my-monorepo/shell';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const orderData = [/* ...your data here... */];

// Table columns (as in your example)
const columns = [/* ...your columns here... */];

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuthState();
  const { logout } = useLogout();
  const { setUser } = useAuth();
  const { message } = App.useApp();
  
  console.log('Dashboard auth state:', { isAuthenticated, user });
  
  // First check for auth token in URL
  useEffect(() => {
    // Check for token in URL
    const params = new URLSearchParams(window.location.search);
    const authToken = params.get('authToken');
    console.log('authToken', authToken, params.toString());
    
    // Enhanced debugging
    console.log('Search params available:', params.toString().length > 0);
    
    if (authToken) {
      try {
        console.log('Auth token found, length:', authToken.length);
        console.log('First 50 chars of token:', authToken.substring(0, 50));
        
        // Process the token
        const decodedToken = decodeURIComponent(authToken);
        
        // Parse the token data
        try {
          const tokenData = JSON.parse(decodedToken);
          console.log('Token parsed successfully, accessToken present:', !!tokenData.accessToken);
          
          // Create auth service instance just for saving the token
          const tempAuthService = new AuthService(process.env.NEXT_PUBLIC_API_URL || '');
          
          // Validate the token structure before saving
          if (tokenData.accessToken && tokenData.refreshToken) {
            // Create dummy response to match what saveTokensToStorage expects
            const authResponse = {
              accessToken: tokenData.accessToken,
              refreshToken: tokenData.refreshToken,
              user: null // We're not passing user data for POC
            };
            
            // Save the token using your existing method
            tempAuthService.saveTokensToStorage(authResponse);
            
            // Clean the URL
            window.history.replaceState({}, document.title, window.location.pathname);
            
            console.log('Token saved successfully, reloading page');
            // Reload to apply auth state
            window.location.reload();
          } else {
            throw new Error('Invalid token structure');
          }
        } catch (parseError) {
          console.error('Error parsing token JSON:', parseError);
          console.log('Decoded but unparsable token:', decodedToken.substring(0, 100) + '...');
          throw parseError;
        }
      } catch (error) {
        console.error('Failed to process auth token:', error);
        message.error('Authentication error: Token processing failed');
        router.push('/');
      }
    }
  }, [message, router, setUser]);
  
  // Then handle auth state
  useEffect(() => {
    if (!loading && !isAuthenticated) {
      // If not authenticated, redirect to home page which will handle the auth flow
      console.log('Not authenticated, redirecting to home');
      router.push('/');
    }
  }, [isAuthenticated, loading, router]);

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
        sessionStorage.clear(); // Clear any session data
      }
      
      message.success('Logged out successfully');
      
      // Short delay before redirect to ensure all cleanup is done
      setTimeout(() => {
        // Force a hard redirect to auth app login with logout parameter
        window.location.href = `${process.env.NEXT_PUBLIC_AUTH_URL}/login?logout=true`;
      }, 300);
    } catch (error) {
      console.error('Logout error:', error);
      message.error('Logout failed');
    }
  };

  // Define menu items using the items API
  const menuItems: MenuProps['items'] = [
    {
      key: 'dashboard',
      icon: <BarChartOutlined />,
      label: 'Dashboard',
    },
    {
      key: 'orders',
      icon: <ShoppingCartOutlined />,
      label: 'Orders',
    },
    {
      key: 'products',
      icon: <ShoppingOutlined />,
      label: 'Products',
    },
    {
      key: 'customers',
      icon: <UserOutlined />,
      label: 'Customers',
    }
  ];

  // Show loading or unauthorized message
  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated || !user) {
    return <div>You are not authorized to view this page. Redirecting...</div>;
  }

  // Rest of the component (content rendering) remains the same
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
          {user?.name}
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
          defaultSelectedKeys={['dashboard']}
          style={{ height: '100%', borderRight: 0 }}
          items={menuItems}
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
                  value={''}
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
                  value={''}
                  valueStyle={{ color: '#3f8600' }}
                  prefix={<ShoppingCartOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Processing Orders"
                  value={''}
                  valueStyle={{ color: '#1890ff' }}
                  prefix={<RiseOutlined />}
                />
              </Card>
            </Col>
            <Col span={6}>
              <Card>
                <Statistic
                  title="Pending Orders"
                  value={''}
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