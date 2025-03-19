import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Table, Form } from 'react-bootstrap';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js';
import api from '../utils/api';
import './AdminDashboard.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const AdminDashboard = () => {
  console.log('AdminDashboard component rendering');
  
  const [revenue, setRevenue] = useState({
    totalRevenue: { totalAmount: 0, totalPlatformFee: 0, totalCreatorAmount: 0, count: 0 },
    revenueByMethod: [],
    dailyRevenue: []
  });
  const [dateRange, setDateRange] = useState({
    startDate: new Date(new Date().setDate(new Date().getDate() - 30)).toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const fetchRevenueData = useCallback(async () => {
    try {
      console.log('Fetching revenue data with date range:', dateRange);
      setLoading(true);
      setError('');
      
      const response = await api.get('/api/admin/revenue', {
        params: dateRange
      });
      
      console.log('Revenue data received:', response.data);
      setRevenue(response.data);
    } catch (err) {
      console.error('Revenue data error details:', err.response || err);
      setError('Failed to fetch revenue data. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [dateRange]);

  useEffect(() => {
    console.log('AdminDashboard useEffect triggered');
    fetchRevenueData();
  }, [fetchRevenueData]);

  const handleDateChange = (e) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value }));
  };

  // Format currency
  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount / 100); // Convert cents to dollars
  };

  // Prepare chart data
  console.log('Preparing chart data with daily revenue:', revenue.dailyRevenue);
  const chartData = {
    labels: revenue.dailyRevenue.map(day => day._id),
    datasets: [
      {
        label: 'Platform Revenue',
        data: revenue.dailyRevenue.map(day => day.totalPlatformFee / 100),
        borderColor: 'rgba(75, 192, 192, 1)',
        backgroundColor: 'rgba(75, 192, 192, 0.2)',
        fill: true,
        tension: 0.4
      }
    ]
  };

  // Chart options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Daily Platform Revenue'
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value) => `$${value}`
        }
      }
    }
  };

  return (
    <Container className="admin-dashboard">
      <h1>Revenue Dashboard</h1>
      
      <Form className="date-range-form">
        <Row>
          <Col md={5}>
            <Form.Group>
              <Form.Label>Start Date</Form.Label>
              <Form.Control
                type="date"
                name="startDate"
                value={dateRange.startDate}
                onChange={handleDateChange}
              />
            </Form.Group>
          </Col>
          <Col md={5}>
            <Form.Group>
              <Form.Label>End Date</Form.Label>
              <Form.Control
                type="date"
                name="endDate"
                value={dateRange.endDate}
                onChange={handleDateChange}
              />
            </Form.Group>
          </Col>
        </Row>
      </Form>
      
      {loading ? (
        <p>Loading revenue data...</p>
      ) : error ? (
        <p className="error">{error}</p>
      ) : (
        <>
          <Row className="summary-cards">
            <Col md={3}>
              <Card className="summary-card">
                <Card.Body>
                  <Card.Title>Total Revenue</Card.Title>
                  <Card.Text className="amount">
                    {formatCurrency(revenue.totalRevenue.totalAmount)}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="summary-card">
                <Card.Body>
                  <Card.Title>Platform Revenue</Card.Title>
                  <Card.Text className="amount">
                    {formatCurrency(revenue.totalRevenue.totalPlatformFee)}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="summary-card">
                <Card.Body>
                  <Card.Title>Creator Payouts</Card.Title>
                  <Card.Text className="amount">
                    {formatCurrency(revenue.totalRevenue.totalCreatorAmount)}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={3}>
              <Card className="summary-card">
                <Card.Body>
                  <Card.Title>Total Transactions</Card.Title>
                  <Card.Text className="amount">
                    {revenue.totalRevenue.count}
                  </Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
          
          <Row>
            <Col md={8}>
              <Card className="chart-card">
                <Card.Body>
                  <Card.Title>Daily Platform Revenue</Card.Title>
                  <Line data={chartData} options={chartOptions} />
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="method-card">
                <Card.Body>
                  <Card.Title>Revenue by Payment Method</Card.Title>
                  <Table striped bordered hover>
                    <thead>
                      <tr>
                        <th>Method</th>
                        <th>Revenue</th>
                        <th>Transactions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenue.revenueByMethod.map(method => (
                        <tr key={method._id}>
                          <td>{method._id.charAt(0).toUpperCase() + method._id.slice(1)}</td>
                          <td>{formatCurrency(method.totalPlatformFee)}</td>
                          <td>{method.count}</td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </>
      )}
    </Container>
  );
};

export default AdminDashboard; 