import createCache from '@emotion/cache';
import { prefixer } from 'stylis';
import rtlPlugin from 'stylis-plugin-rtl';
import { CacheProvider } from '@emotion/react';
import { ConfigProvider } from 'antd';
import React, { ReactNode } from 'react';
import ar_EG from 'antd/lib/locale/ar_EG';

// Create rtl cache
const rtlCache = createCache({
  key: 'muirtl',
  stylisPlugins: [prefixer, rtlPlugin],
});

interface RtlProviderProps {
  children: ReactNode;
  theme?: {
    colorPrimary?: string;
    [key: string]: any;
  };
}

export const RtlProvider: React.FC<RtlProviderProps> = ({ 
  children,
  theme = {
    colorPrimary: '#1890ff',
  }
}) => {
  return (
    <CacheProvider value={rtlCache}>
      <ConfigProvider
        direction="rtl"
        locale={ar_EG}
        theme={{
          token: theme,
        }}
      >
        {children}
      </ConfigProvider>
    </CacheProvider>
  );
};

