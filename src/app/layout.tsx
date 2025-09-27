'use client';
import React from 'react';
import './globals.css';
import { AntdRegistry } from '@ant-design/nextjs-registry';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { store, persistor } from '@/lib/redux/store';
import { Spin } from 'antd';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Provider store={store}>
          <PersistGate loading={<Spin size="large" />} persistor={persistor}>
            <AntdRegistry>
              {children}
            </AntdRegistry>
          </PersistGate>
        </Provider>
      </body>
    </html>
  );
}
