'use client';
import { useState } from 'react';
import { Tabs, Layout, Typography } from 'antd';
import { UserOutlined, DashboardOutlined } from '@ant-design/icons';
import IntervieweeView from '@/components/IntervieweeView';
import InterviewerDashboard from '@/components/InterviewerDashboard';

const { Header, Content } = Layout;
const { Title } = Typography;

export default function Home() {
  const [activeTab, setActiveTab] = useState('interviewee');

  const tabItems = [
    {
      key: 'interviewee',
      label: 'Interviewee',
      icon: <UserOutlined />,
      children: <IntervieweeView />,
    },
    {
      key: 'interviewer',
      label: 'Interviewer Dashboard',
      icon: <DashboardOutlined />,
      children: <InterviewerDashboard />,
    },
  ];

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Header style={{ background: '#001529', padding: '0 24px' }}>
        <Title level={3} style={{ color: 'white', margin: '16px 0' }}>
          AI-Powered Interview Assistant
        </Title>
      </Header>
      <Content style={{ padding: '24px' }}>
        <Tabs
          activeKey={activeTab}
          onChange={setActiveTab}
          items={tabItems}
          type="card"
          size="large"
        />
      </Content>
    </Layout>
  );
}
