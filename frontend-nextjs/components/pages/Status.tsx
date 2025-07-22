import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertCircle, Clock, Bell, Activity, Database, Globe, Search } from "lucide-react";

const Status = () => {
  const currentStatus = "operational"; // operational, degraded, outage

  const services = [
    {
      name: "Website",
      status: "operational",
      icon: Globe,
      description: "Main website and user interface"
    },
    {
      name: "Search API",
      status: "operational", 
      icon: Search,
      description: "Artist search and filtering functionality"
    },
    {
      name: "Database",
      status: "operational",
      icon: Database,
      description: "Artist profiles and portfolio data"
    },
    {
      name: "Performance",
      status: "operational",
      icon: Activity,
      description: "Page load times and responsiveness"
    }
  ];

  const incidents = [
    {
      date: "2024-12-18",
      title: "Scheduled Maintenance Complete",
      status: "resolved",
      description: "Successfully completed scheduled database optimization. All services are now running normally.",
      duration: "2 hours"
    },
    {
      date: "2024-12-15",
      title: "Minor Search Delays",
      status: "resolved", 
      description: "Experienced brief delays in search results. Issue was resolved by optimizing database queries.",
      duration: "45 minutes"
    },
    {
      date: "2024-12-10",
      title: "Database Migration",
      status: "resolved",
      description: "Migrated to improved database infrastructure for better performance and reliability.",
      duration: "4 hours"
    }
  ];

  const uptime = {
    current: "99.9%",
    last30Days: "99.8%",
    last90Days: "99.7%"
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "operational": return "text-green-600";
      case "degraded": return "text-yellow-600"; 
      case "outage": return "text-red-600";
      default: return "text-gray-600";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "operational": return CheckCircle;
      case "degraded": return AlertCircle;
      case "outage": return AlertCircle;
      default: return Clock;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "operational": return <Badge className="bg-green-100 text-green-800 border-green-200">Operational</Badge>;
      case "degraded": return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Degraded</Badge>;
      case "outage": return <Badge className="bg-red-100 text-red-800 border-red-200">Outage</Badge>;
      case "resolved": return <Badge className="bg-blue-100 text-blue-800 border-blue-200">Resolved</Badge>;
      default: return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">System Status & Uptime</h1>
          <p className="text-xl text-muted-foreground">
            Real-time status of TattooFinder services and infrastructure
          </p>
        </div>

        {/* Overall Status */}
        <Card className="mb-8 border-green-200 bg-green-50/50">
          <CardContent className="p-6">
            <div className="flex items-center justify-center gap-3">
              <CheckCircle className="w-8 h-8 text-green-600" />
              <div className="text-center">
                <h2 className="text-2xl font-semibold text-green-800">All Systems Operational</h2>
                <p className="text-green-700">All services are running normally</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Services Status */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            const StatusIcon = getStatusIcon(service.status);
            return (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                        <Icon className="w-5 h-5 text-primary-foreground" />
                      </div>
                      {service.name}
                    </div>
                    <StatusIcon className={`w-5 h-5 ${getStatusColor(service.status)}`} />
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground mb-3">{service.description}</p>
                  {getStatusBadge(service.status)}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Uptime Statistics */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="w-5 h-5" />
              Uptime Statistics
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">{uptime.current}</div>
                <div className="text-muted-foreground">Current Uptime</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">{uptime.last30Days}</div>
                <div className="text-muted-foreground">Last 30 Days</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-foreground mb-2">{uptime.last90Days}</div>
                <div className="text-muted-foreground">Last 90 Days</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Incidents */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              Recent Incidents
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {incidents.map((incident, index) => (
                <div key={index} className="border-l-4 border-blue-500 pl-4 py-3 bg-muted/30 rounded-r-lg">
                  <div className="flex items-start justify-between mb-2">
                    <h3 className="font-semibold text-foreground">{incident.title}</h3>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(incident.status)}
                      <span className="text-sm text-muted-foreground">{incident.date}</span>
                    </div>
                  </div>
                  <p className="text-muted-foreground mb-2">{incident.description}</p>
                  <p className="text-sm text-muted-foreground">Duration: {incident.duration}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Subscribe to Updates */}
        <Card className="bg-gradient-subtle">
          <CardContent className="p-8 text-center">
            <Bell className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Stay Updated
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Subscribe to receive notifications about planned maintenance, incidents, and status updates.
            </p>
            <Button variant="hero" size="lg">
              <Bell className="w-5 h-5 mr-2" />
              Subscribe to Updates
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Get notified via email or SMS
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Status;