import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Search, MapPin, Users, Star, Instagram, Facebook, Twitter } from "lucide-react";

const Landing = () => {
  const features = [
    {
      icon: Search,
      title: "Advanced Search",
      description: "Find artists by style, location, and more with our powerful search filters."
    },
    {
      icon: MapPin,
      title: "Map Explorer",
      description: "Discover artists near you with our interactive map interface."
    },
    {
      icon: Users,
      title: "Verified Artists",
      description: "Browse profiles of verified tattoo artists with authentic portfolios."
    },
    {
      icon: Star,
      title: "Quality Focused",
      description: "Only the best artists with proven track records and quality work."
    }
  ];

  const socialLinks = [
    { icon: Instagram, href: "#", label: "Instagram" },
    { icon: Facebook, href: "#", label: "Facebook" },
    { icon: Twitter, href: "#", label: "Twitter" }
  ];

  return (
    <div className="min-h-screen bg-gradient-subtle">
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-20 pb-32">
          <div className="text-center">
            <h1 className="text-5xl md:text-7xl font-bold text-primary-foreground mb-6 leading-tight">
              Find Your Perfect
              <br />
              <span className="bg-gradient-to-r from-accent-glow to-primary-glow bg-clip-text text-transparent">
                Tattoo Artist
              </span>
            </h1>
            <p className="text-xl md:text-2xl text-primary-foreground/90 mb-8 max-w-3xl mx-auto leading-relaxed">
              Discover talented tattoo artists in your area. Search by style, location, and portfolio to find the perfect match for your next piece.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
              <Button asChild size="xl" variant="glass" className="min-w-48">
                <Link to="/search">
                  <Search className="w-5 h-5 mr-2" />
                  Search Artists
                </Link>
              </Button>
              <Button asChild size="xl" variant="outline" className="min-w-48 bg-background/10 backdrop-blur-sm border-primary-foreground/30 text-primary-foreground hover:bg-background/20">
                <Link to="/search?view=map">
                  <MapPin className="w-5 h-5 mr-2" />
                  Explore Map
                </Link>
              </Button>
            </div>
          </div>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-20 bg-gradient-to-t from-background to-transparent"></div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-foreground mb-4">
              Why Choose TattooFinder?
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              We make it easy to connect with the right artist for your vision
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card key={index} className="group hover:shadow-elegant transition-all duration-300 transform hover:-translate-y-2 border-border/50">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 bg-gradient-primary rounded-lg flex items-center justify-center mx-auto mb-4 group-hover:shadow-glow transition-all duration-300">
                      <Icon className="w-6 h-6 text-primary-foreground" />
                    </div>
                    <h3 className="text-lg font-semibold text-foreground mb-2">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted/30">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-foreground mb-6">
            Ready to Find Your Artist?
          </h2>
          <p className="text-xl text-muted-foreground mb-8">
            Start exploring our directory of talented tattoo artists today
          </p>
          <Button asChild size="xl" variant="hero">
            <Link to="/search">
              Get Started Now
            </Link>
          </Button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-foreground text-background py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Brand */}
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <div className="w-8 h-8 bg-gradient-hero rounded-md flex items-center justify-center">
                  <span className="text-primary-foreground font-bold text-lg">T</span>
                </div>
                <span className="text-xl font-bold">TattooFinder</span>
              </div>
              <p className="text-background/70 mb-4">
                Connecting people with amazing tattoo artists worldwide.
              </p>
              <div className="flex space-x-4">
                {socialLinks.map((social, index) => {
                  const Icon = social.icon;
                  return (
                    <a
                      key={index}
                      href={social.href}
                      className="text-background/70 hover:text-background transition-colors"
                      aria-label={social.label}
                    >
                      <Icon className="w-5 h-5" />
                    </a>
                  );
                })}
              </div>
            </div>

            {/* Quick Links */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Links</h3>
              <ul className="space-y-2">
                <li><Link to="/search" className="text-background/70 hover:text-background transition-colors">Search Artists</Link></li>
                <li><Link to="/faq" className="text-background/70 hover:text-background transition-colors">FAQ</Link></li>
                <li><Link to="/status" className="text-background/70 hover:text-background transition-colors">Status & Uptime</Link></li>
              </ul>
            </div>

            {/* Legal */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Legal</h3>
              <ul className="space-y-2">
                <li><Link to="/privacy" className="text-background/70 hover:text-background transition-colors">Data Privacy</Link></li>
                <li><Link to="/terms" className="text-background/70 hover:text-background transition-colors">Terms of Service</Link></li>
              </ul>
            </div>
          </div>
          
          <div className="border-t border-background/20 mt-8 pt-8 text-center">
            <p className="text-background/70">
              © 2024 TattooFinder. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Landing;