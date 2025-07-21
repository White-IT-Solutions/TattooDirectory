import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Shield, Eye, Lock, Mail } from "lucide-react";

const Privacy = () => {
  const sections = [
    {
      icon: Eye,
      title: "Data Collection",
      content: "We collect minimal information necessary to provide our services, including search queries, location preferences, and basic usage analytics. We do not collect personal identification information unless voluntarily provided."
    },
    {
      icon: Shield,
      title: "Data Usage",
      content: "Your data is used solely to improve our artist directory services, provide personalized search results, and maintain the quality of our platform. We never sell your data to third parties."
    },
    {
      icon: Lock,
      title: "Data Security",
      content: "We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your information from unauthorized access."
    },
    {
      icon: Mail,
      title: "Contact & Control",
      content: "You have the right to access, modify, or delete your data at any time. Contact us at privacy@tattoofinder.com for any data-related requests or concerns."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Data Privacy Policy</h1>
          <p className="text-xl text-muted-foreground">
            Your privacy is important to us. Learn how we collect, use, and protect your data.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: December 2024
          </p>
        </div>

        {/* Privacy Sections */}
        <div className="grid gap-6 mb-12">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-primary rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-primary-foreground" />
                    </div>
                    {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{section.content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Detailed Policy */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Privacy Policy</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none">
            <h3 className="text-lg font-semibold text-foreground mb-3">1. Information We Collect</h3>
            <p className="text-muted-foreground mb-4">
              We collect information you provide directly to us, such as when you use our search functionality, contact us, or interact with our services. This may include search terms, location preferences, and communication records.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">2. How We Use Your Information</h3>
            <p className="text-muted-foreground mb-4">
              We use the information we collect to provide, maintain, and improve our services, respond to your requests, and communicate with you about our services.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">3. Information Sharing</h3>
            <p className="text-muted-foreground mb-4">
              We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except as described in this policy or as required by law.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">4. Data Security</h3>
            <p className="text-muted-foreground mb-4">
              We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">5. Your Rights</h3>
            <p className="text-muted-foreground mb-4">
              You have the right to access, update, or delete your personal information. You may also opt out of certain communications from us.
            </p>

            <h3 className="text-lg font-semibold text-foreground mb-3">6. Contact Information</h3>
            <p className="text-muted-foreground">
              If you have any questions about this Privacy Policy, please contact us at:
              <br />
              Email: privacy@tattoofinder.com
              <br />
              Address: 123 Privacy Street, Data City, DC 12345
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Privacy;