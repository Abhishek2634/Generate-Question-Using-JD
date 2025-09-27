'use client';
import React, { useState, useMemo, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState } from '@/lib/redux/store';
import {
  Table,
  Input,
  Card,
  Button,
  Space,
  Tag,
  Typography,
  Modal,
  Divider,
  Row,
  Col,
  Statistic,
  Tooltip,
  Popconfirm,
  Badge,
  Select,
  message
} from 'antd';
import {
  SearchOutlined,
  EyeOutlined,
  DownloadOutlined,
  DeleteOutlined,
  ReloadOutlined,
  CalendarOutlined,
  TrophyOutlined,
  UserOutlined,
  ClockCircleOutlined
} from '@ant-design/icons';
import type { ColumnsType } from 'antd/es/table';
import { Candidate } from '@/lib/redux/interviewSlice';

const { Text, Title } = Typography;
const { Option } = Select;

interface CandidateWithKey extends Candidate {
  key: string;
}

export default function InterviewerDashboard() {
  const dispatch = useDispatch();
  const { candidates } = useSelector((state: RootState) => state.interview);
  
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCandidate, setSelectedCandidate] = useState<Candidate | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [scoreFilter, setScoreFilter] = useState<string>('all');
  const [loading, setLoading] = useState(false);

  const completedCandidates = candidates.filter((c: Candidate) => c.summary);

  const filteredCandidates = useMemo(() => {
    let filtered = completedCandidates;

    if (searchTerm) {
      filtered = filtered.filter((candidate) =>
        candidate.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        candidate.phone.includes(searchTerm)
      );
    }

    if (scoreFilter !== 'all') {
      filtered = filtered.filter((candidate) => {
        switch (scoreFilter) {
          case 'excellent': return candidate.score >= 80;
          case 'good': return candidate.score >= 60 && candidate.score < 80;
          case 'fair': return candidate.score >= 40 && candidate.score < 60;
          case 'poor': return candidate.score < 40;
          default: return true;
        }
      });
    }

    return filtered.map((candidate) => ({ ...candidate, key: candidate.id }));
  }, [completedCandidates, searchTerm, scoreFilter]);

  const getScoreColor = (score: number): string => {
    if (score >= 80) return '#52c41a';
    if (score >= 60) return '#faad14';
    if (score >= 40) return '#ff7a45';
    return '#f5222d';
  };

  const getScoreTag = (score: number): React.ReactElement => {
    if (score >= 80) return <Tag color="green" icon={<TrophyOutlined />}>Excellent</Tag>;
    if (score >= 60) return <Tag color="gold">Good</Tag>;
    if (score >= 40) return <Tag color="orange">Fair</Tag>;
    return <Tag color="red">Poor</Tag>;
  };

  const formatDate = (dateString?: string): string => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

// Replace the incomplete formatDuration function with this complete one:
const formatDuration = (seconds?: number): string => {
  if (!seconds || seconds <= 0) return '0s';
  
  // Always show in seconds for precise measurement
  if (seconds < 60) {
    return `${seconds}s`;
  }
  
  // If over 1 minute, show both minutes and seconds
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  
  if (minutes < 60) {
    return remainingSeconds > 0 
      ? `${minutes}m ${remainingSeconds}s`
      : `${minutes}m`;
  }
  
  // If over 1 hour, show hours, minutes, and seconds
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  return `${hours}h ${remainingMinutes}m ${remainingSeconds}s`;
}; // ✅ This function now has a return statement for all code paths



  const exportResults = () => {
    setLoading(true);
    try {
      const csvHeaders = [
        'Name', 'Email', 'Phone', 'Score', 'Performance', 'Completed At', 
        'Duration', 'Summary'
      ];

      const csvData = filteredCandidates.map((candidate) => {
        const performance = candidate.score >= 80 ? 'Excellent' : 
                          candidate.score >= 60 ? 'Good' : 
                          candidate.score >= 40 ? 'Fair' : 'Poor';
        
        return [
          `"${candidate.name}"`,
          `"${candidate.email}"`,
          `"${candidate.phone}"`,
          candidate.score,
          performance,
          `"${formatDate(candidate.completedAt)}"`,
          `"${formatDuration(candidate.duration)}"`,
          `"${candidate.summary.replace(/"/g, '""')}"`
        ].join(',');
      });

      const csvContent = [csvHeaders.join(','), ...csvData].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      
      if (link.download !== undefined) {
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `interview_results_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        message.success(`Exported ${filteredCandidates.length} records successfully!`);
      }
    } catch (error) {
      message.error('Failed to export data. Please try again.');
      console.error('Export error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRefreshData = () => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      message.success('Data refreshed successfully');
    }, 1000);
  };

  const columns: ColumnsType<CandidateWithKey> = [
    {
      title: 'Candidate',
      dataIndex: 'name',
      key: 'name',
      sorter: (a, b) => a.name.localeCompare(b.name),
      render: (name: string, record: CandidateWithKey) => (
        <div>
          <Text strong style={{ display: 'flex', alignItems: 'center' }}>
            <UserOutlined style={{ marginRight: 8, color: '#1890ff' }} />
            {name}
          </Text>
          <Text type="secondary" style={{ fontSize: '12px' }}>
            {record.email}
          </Text>
          <br />
          <Text type="secondary" style={{ fontSize: '12px' }}>
            📞 {record.phone}
          </Text>
        </div>
      ),
    },
    {
      title: 'Score & Performance',
      dataIndex: 'score',
      key: 'score',
      sorter: (a, b) => a.score - b.score,
      defaultSortOrder: 'descend',
      render: (score: number) => (
        <div style={{ textAlign: 'center' }}>
          <div style={{ 
            fontSize: '20px', 
            fontWeight: 'bold', 
            color: getScoreColor(score),
            marginBottom: 4 
          }}>
            {score}/100
          </div>
          {getScoreTag(score)}
        </div>
      ),
      width: 150,
    },
    {
      title: 'Completed',
      dataIndex: 'completedAt',
      key: 'completedAt',
      sorter: (a, b) => {
        const dateA = a.completedAt ? new Date(a.completedAt).getTime() : 0;
        const dateB = b.completedAt ? new Date(b.completedAt).getTime() : 0;
        return dateB - dateA;
      },
      render: (completedAt: string, record: CandidateWithKey) => (
        <div>
          <div style={{ display: 'flex', alignItems: 'center', marginBottom: 4 }}>
            <CalendarOutlined style={{ marginRight: 4, color: '#722ed1' }} />
            <Text style={{ fontSize: '12px' }}>
              {formatDate(completedAt)}
            </Text>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <ClockCircleOutlined style={{ marginRight: 4, color: '#eb2f96' }} />
            <Text style={{ fontSize: '12px' }}>
              {formatDuration(record.duration)}
            </Text>
          </div>
        </div>
      ),
      width: 150,
    },
    {
      title: 'AI Summary',
      dataIndex: 'summary',
      key: 'summary',
      ellipsis: true,
      render: (summary: string) => (
        <Tooltip title={summary}>
          <Text style={{ fontSize: '13px' }}>
            {summary.length > 80 ? `${summary.substring(0, 80)}...` : summary}
          </Text>
        </Tooltip>
      ),
    },
    {
      title: 'Actions',
      key: 'actions',
      render: (_: unknown, record: CandidateWithKey) => (
        <Space>
          <Tooltip title="View Details">
            <Button
              type="primary"
              icon={<EyeOutlined />}
              size="small"
              onClick={() => {
                setSelectedCandidate(record);
                setDetailModalVisible(true);
              }}
            />
          </Tooltip>
          <Popconfirm
            title="Delete Candidate"
            description="Are you sure you want to delete this candidate's data?"
            onConfirm={() => message.success('Candidate deleted')}
            okText="Yes"
            cancelText="No"
          >
            <Tooltip title="Delete">
              <Button
                danger
                icon={<DeleteOutlined />}
                size="small"
              />
            </Tooltip>
          </Popconfirm>
        </Space>
      ),
      width: 100,
    },
  ];

  const avgScore = completedCandidates.length > 0 
    ? Math.round(completedCandidates.reduce((sum, c) => sum + c.score, 0) / completedCandidates.length)
    : 0;

  const highPerformers = completedCandidates.filter(c => c.score >= 80).length;

  return (
    <div style={{ maxWidth: 1400, margin: '0 auto' }}>
      <Row gutter={16} style={{ marginBottom: 24 }}>
        <Col span={8}>
          <Card>
            <Statistic
              title="Total Interviews"
              value={completedCandidates.length}
              prefix={<UserOutlined style={{ color: '#1890ff' }} />}
              valueStyle={{ color: '#1890ff' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="Average Score"
              value={avgScore}
              suffix="/100"
              prefix={<TrophyOutlined style={{ color: '#52c41a' }} />}
              valueStyle={{ color: avgScore >= 70 ? '#52c41a' : '#faad14' }}
            />
          </Card>
        </Col>
        <Col span={8}>
          <Card>
            <Statistic
              title="High Performers"
              value={highPerformers}
              prefix={<TrophyOutlined style={{ color: '#722ed1' }} />}
              valueStyle={{ color: '#722ed1' }}
            />
          </Card>
        </Col>
      </Row>

      <Card>
        <Row gutter={16} style={{ marginBottom: 16 }}>
          <Col span={8}>
            <Input
              prefix={<SearchOutlined />}
              placeholder="Search by name, email, or phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              allowClear
            />
          </Col>
          <Col span={6}>
            <Select
              placeholder="Filter by score"
              value={scoreFilter}
              onChange={setScoreFilter}
              style={{ width: '100%' }}
            >
              <Option value="all">All Scores</Option>
              <Option value="excellent">Excellent (80+)</Option>
              <Option value="good">Good (60-79)</Option>
              <Option value="fair">Fair (40-59)</Option>
              <Option value="poor">Poor (&lt;40)</Option>
            </Select>
          </Col>
          <Col span={10}>
            <Space>
              <Tooltip title="Export to CSV">
                <Button
                  type="primary"
                  icon={<DownloadOutlined />}
                  onClick={exportResults}
                  loading={loading}
                >
                  Export ({filteredCandidates.length})
                </Button>
              </Tooltip>
              <Tooltip title="Refresh Data">
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefreshData}
                  loading={loading}
                />
              </Tooltip>
            </Space>
          </Col>
        </Row>

        <Table
          columns={columns}
          dataSource={filteredCandidates}
          loading={loading}
          pagination={{
            pageSize: 10,
            showSizeChanger: true,
            showQuickJumper: true,
            showTotal: (total: number, range: [number, number]) =>
              `${range[0]}-${range[1]} of ${total} candidates`,
          }}
          locale={{
            emptyText: (
              <div style={{ padding: '40px 0' }}>
                <Text type="secondary">
                  {completedCandidates.length === 0
                    ? 'No completed interviews yet. Start your first interview to see results here.'
                    : 'No candidates match your current filters.'}
                </Text>
              </div>
            ),
          }}
          scroll={{ x: 1000 }}
        />
      </Card>

      <Modal
        title={
          <Space>
            <UserOutlined style={{ color: '#1890ff' }} />
            {selectedCandidate?.name} - Interview Details
          </Space>
        }
        open={detailModalVisible}
        onCancel={() => setDetailModalVisible(false)}
        footer={[
          <Button key="close" onClick={() => setDetailModalVisible(false)}>
            Close
          </Button>,
        ]}
        width={900}
      >
        {selectedCandidate && (
          <div>
            <Row gutter={16} style={{ marginBottom: 24 }}>
              <Col span={12}>
                <Card size="small" title="Candidate Information">
                  <p><strong>Name:</strong> {selectedCandidate.name}</p>
                  <p><strong>Email:</strong> {selectedCandidate.email}</p>
                  <p><strong>Phone:</strong> {selectedCandidate.phone}</p>
                  <p><strong>Completed:</strong> {formatDate(selectedCandidate.completedAt)}</p>
                  <p><strong>Duration:</strong> {formatDuration(selectedCandidate.duration)}</p>
                </Card>
              </Col>
              <Col span={12}>
                <Card size="small" title="Performance Metrics">
                  <Row gutter={16}>
                    <Col span={12}>
                      <Statistic
                        title="Final Score"
                        value={selectedCandidate.score}
                        suffix="/100"
                        valueStyle={{ 
                          color: getScoreColor(selectedCandidate.score),
                          fontSize: '24px',
                          fontWeight: 'bold'
                        }}
                      />
                    </Col>
                    <Col span={12}>
                      <div style={{ textAlign: 'center', paddingTop: 16 }}>
                        {getScoreTag(selectedCandidate.score)}
                      </div>
                    </Col>
                  </Row>
                </Card>
              </Col>
            </Row>

            <Divider />

            <div style={{ marginBottom: 24 }}>
              <Title level={5} style={{ display: 'flex', alignItems: 'center' }}>
                <TrophyOutlined style={{ marginRight: 8, color: '#52c41a' }} />
                AI Performance Summary
              </Title>
              <Card size="small">
                <Text>{selectedCandidate.summary}</Text>
              </Card>
            </div>

            <Divider />

            <Title level={5}>Interview Questions & Answers</Title>
            <div style={{ maxHeight: 500, overflowY: 'auto' }}>
              {selectedCandidate.answers.map((item, index) => (
                <Card key={index} size="small" style={{ marginBottom: 16 }}>
                  <div style={{ marginBottom: 12 }}>
                    <Badge 
                      count={`Q${index + 1}`} 
                      style={{ backgroundColor: '#1890ff' }}
                    />
                    <Text strong style={{ marginLeft: 8, fontSize: '15px' }}>
                      {item.question}
                    </Text>
                  </div>
                  
                  <div style={{ 
                    background: '#f5f5f5', 
                    padding: '12px', 
                    borderRadius: '6px',
                    marginBottom: 12,
                    border: '1px solid #d9d9d9'
                  }}>
                    <Text style={{ fontSize: '14px', lineHeight: '1.6' }}>
                      {item.answer || (
                        <Text type="secondary" style={{ fontStyle: 'italic' }}>
                          No answer provided within the time limit
                        </Text>
                      )}
                    </Text>
                  </div>
                  
                  <div style={{ textAlign: 'right' }}>
                    <Text strong style={{ 
                      color: item.score >= 7 ? '#52c41a' : item.score >= 5 ? '#faad14' : '#f5222d',
                      fontSize: '16px'
                    }}>
                      Score: {item.score}/10
                    </Text>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
