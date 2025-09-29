"use client";

import { useState, useEffect } from "react";
import Card, { CardHeader, CardTitle, CardDescription, CardContent } from "../../design-system/components/ui/Card/Card";
import Button from "../../design-system/components/ui/Button/Button";
import { Skeleton } from "../../design-system/components/ui/Skeleton/Skeleton";

export const dynamic = "force-dynamic";

// Mock data for status page
const mockServices = [
  { id: 'api', name: 'API Gateway', status: 'operational', uptime: '99.9%', responseTime: '245ms' },
  { id: 'db', name: 'Database', status: 'operational', uptime: '99.8%', responseTime: '12ms' },
  { id: 'search', name: 'Search Engine', status: 'degraded', uptime: '98.5%', responseTime: '1.2s' },
  { id: 'cdn', name: 'CDN & Images', status: 'operational', uptime: '99.9%', responseTime: '89ms' },
  { id: 'auth', name: 'Authentication', status: 'maintenance', uptime: '99.7%', responseTime: '156ms' }
];

const mockIncidents = [
  {
    id: 1,
    title: 'Search Performance Degradation',
    severity: 'Minor',
    status: 'Investigating',
    time: '2m ago'
  },
  {
    id: 2,
    title: 'Scheduled Authentication Maintenance',
    severity: 'Maintenance',
    status: 'Scheduled',
    time: '1h ago'
  }
];

const mockMetrics = {
  uptime: '99.7%',
  totalRequests: '2.4M',
  avgResponseTime: '287ms',
  errorRate: '0.02%',
  activeUsers: '1,247'
};

export default function StatusPage() {
  const [loading, setLoading] = useState(true);
  const [subscribed, setSubscribed] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    // Simulate loading
    const timer = setTimeout(() => {
      setLoading(false);
    }, 1000);

    return () => clearTimeout(timer);
  }, []);

  const handleSubscribe = async () => {
    setSubscribing(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setSubscribed(!subscribed);
    setSubscribing(false);
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'operational': return 'text-green-600';
      case 'degraded': return 'text-yellow-600';
      case 'maintenance': return 'text-blue-600';
      default: return 'text-red-600';
    }
  };

  const getOverallStatus = () => {
    const hasIssues = mockServices.some(service => service.status !== 'operational');
    return hasIssues ? 'Some Systems Degraded' : 'All Systems Operational';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-12 px-4">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-4">System Status</h1>
            <p className="text-gray-600">Real-time status and performance metrics for the Tattoo Artist Directory</p>
          </div>
          
          <div className="grid gap-6">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-20 w-full" data-testid="skeleton" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">System Status</h1>
          <p className="text-gray-600 mb-6">Real-time status and performance metrics for the Tattoo Artist Directory</p>
          
          <div className="inline-flex items-center px-4 py-2 rounded-lg bg-white border">
            <div className={`w-3 h-3 rounded-full mr-2 ${getOverallStatus().includes('Degraded') ? 'bg-yellow-500' : 'bg-green-500'}`}></div>
            <span className="font-medium">{getOverallStatus()}</span>
          </div>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-8">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{mockMetrics.uptime}</div>
              <div className="text-sm text-gray-600">Uptime</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{mockMetrics.totalRequests}</div>
              <div className="text-sm text-gray-600">Total Requests</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{mockMetrics.avgResponseTime}</div>
              <div className="text-sm text-gray-600">Avg Response</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{mockMetrics.errorRate}</div>
              <div className="text-sm text-gray-600">Error Rate</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4 text-center">
              <div className="text-2xl font-bold text-gray-900">{mockMetrics.activeUsers}</div>
              <div className="text-sm text-gray-600">Active Users</div>
            </CardContent>
          </Card>
        </div>

        {/* Services Status */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Services</h2>
          <div className="space-y-4">
            {mockServices.map((service) => (
              <Card key={service.id}>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div className={`w-3 h-3 rounded-full mr-3 ${
                        service.status === 'operational' ? 'bg-green-500' :
                        service.status === 'degraded' ? 'bg-yellow-500' :
                        service.status === 'maintenance' ? 'bg-blue-500' : 'bg-red-500'
                      }`}></div>
                      <div>
                        <h3 className="font-medium text-gray-900">{service.name}</h3>
                        <p className={`text-sm capitalize ${getStatusColor(service.status)}`}>
                          {service.status === 'operational' ? 'Operational' :
                           service.status === 'degraded' ? 'Degraded' :
                           service.status === 'maintenance' ? 'Maintenance' : 'Down'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm text-gray-600">
                        <span>Uptime: </span>
                        <span>{service.uptime}</span>
                      </div>
                      <div className="text-sm text-gray-600">
                        <span>Response: </span>
                        <span>{service.responseTime}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Recent Incidents</h2>
          <div className="space-y-4">
            {mockIncidents.map((incident) => (
              <Card key={incident.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-medium text-gray-900 mb-1">{incident.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className={`px-2 py-1 rounded text-xs font-medium ${
                          incident.severity === 'Minor' ? 'bg-yellow-100 text-yellow-800' :
                          incident.severity === 'Maintenance' ? 'bg-blue-100 text-blue-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {incident.severity}
                        </span>
                        <span>{incident.status}</span>
                      </div>
                    </div>
                    <span className="text-sm text-gray-500">{incident.time}</span>
                  </div>
                  {incident.title.includes('Scheduled') && (
                    <div className="mt-2 text-sm text-gray-600">
                      <strong>Scheduled:</strong> Tomorrow at 2:00 AM UTC
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        {/* Subscription */}
        <Card>
          <CardContent className="p-6 text-center">
            <h3 className="font-medium text-gray-900 mb-2">Stay Updated</h3>
            <p className="text-gray-600 mb-4">Get notified about service updates and incidents</p>
            <Button 
              onClick={handleSubscribe}
              loading={subscribing}
              variant={subscribed ? "secondary" : "primary"}
            >
              {subscribed ? 'Unsubscribe' : 'Subscribe to Updates'}
            </Button>
            {subscribed && (
              <p className="text-sm text-green-600 mt-2">You're subscribed to status updates</p>
            )}
          </CardContent>
        </Card>

        {/* Footer Links */}
        <div className="mt-8 text-center space-x-6 text-sm">
          <a href="#" className="text-blue-600 hover:text-blue-800">Support Center</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">API Documentation</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">Service Level Agreement</a>
          <a href="#" className="text-blue-600 hover:text-blue-800">RSS Feed</a>
        </div>
      </div>
    </div>
  );
}
