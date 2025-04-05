'use client';

import { Button, Layout, Menu, Typography } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuthState, useLogout } from '@my-monorepo/shell';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

export default function Dashboard() {
  const router = useRouter();
  const { user, isAuthenticated, loading } = useAuthState();
  const { logout } = useLogout();

  useEffect(() => {
    // Protection logic (replacing AuthenticatedGuard)
    if (!loading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, loading, router]);

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <Layout style={{ minHeight: '100vh', direction: 'rtl' }}>
      <Header style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ display: 'flex', alignItems: 'center' }}>
          <Title level={4} style={{ color: 'white', margin: 0 }}>
            Auth Example App
          </Title>
        </div>
        <Button type="text" icon={<LogoutOutlined />} onClick={handleLogout} style={{ color: 'white' }}>
          Logout
        </Button>
      </Header>
      <Layout>
        <Sider width={200} style={{ background: '#fff' }}>
          <Menu
            mode="inline"
            defaultSelectedKeys={['dashboard']}
            style={{ height: '100%', borderRight: 0 }}
            items={[
              { key: 'dashboard', icon: <UserOutlined />, title: 'Dashboard' },]}
          >
            
          </Menu>
        </Sider>
        <Layout style={{ padding: '24px' }}>
          <Content
            style={{
              padding: 24,
              margin: 0,
              minHeight: 280,
              background: '#fff',
            }}
          >
            <Title level={3}>Welcome, {user?.name}</Title>
            <Text>You are logged in as {user?.email}</Text>
            <div style={{ marginTop: 20 }}>
              <Text>Role: {user?.role}</Text>
            </div>
          </Content>
        </Layout>
      </Layout>
    </Layout>
  );
}