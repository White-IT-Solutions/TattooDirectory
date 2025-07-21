import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Users, Shield, Scale } from "lucide-react";

const Terms = () => {
  const highlights = [
    {
      icon: FileText,
      title: "Acceptance of Terms",
      content: "By using TattooFinder, you agree to be bound by these Terms of Service and all applicable laws and regulations."
    },
    {
      icon: Users,
      title: "User Responsibilities",
      content: "Users must provide accurate information, respect intellectual property rights, and use the service responsibly."
    },
    {
      icon: Shield,
      title: "Limitation of Liability",
      content: "TattooFinder provides information as-is and cannot be held liable for any decisions made based on artist profiles."
    },
    {
      icon: Scale,
      title: "Governing Law",
      content: "These terms are governed by the laws of the jurisdiction where TattooFinder operates."
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Terms of Service</h1>
          <p className="text-xl text-muted-foreground">
            Legal agreement outlining the rules and guidelines for using TattooFinder.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            Last updated: December 2024
          </p>
        </div>

        {/* Key Points */}
        <div className="grid gap-6 mb-12">
          {highlights.map((item, index) => {
            const Icon = item.icon;
            return (
              <Card key={index} className="hover:shadow-elegant transition-all duration-300">
                <CardHeader>
                  <CardTitle className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-gradient-accent rounded-lg flex items-center justify-center">
                      <Icon className="w-5 h-5 text-accent-foreground" />
                    </div>
                    {item.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground leading-relaxed">{item.content}</p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Full Terms */}
        <Card>
          <CardHeader>
            <CardTitle>Complete Terms of Service</CardTitle>
          </CardHeader>
          <CardContent className="prose prose-gray max-w-none space-y-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">1. Acceptance of Terms</h3>
              <p className="text-muted-foreground">
                By accessing and using the TattooFinder website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">2. Use License</h3>
              <p className="text-muted-foreground mb-2">
                Permission is granted to temporarily use TattooFinder for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:
              </p>
              <ul className="list-disc list-inside text-muted-foreground space-y-1 ml-4">
                <li>modify or copy the materials</li>
                <li>use the materials for any commercial purpose or for any public display</li>
                <li>attempt to reverse engineer any software contained on the website</li>
                <li>remove any copyright or other proprietary notations from the materials</li>
              </ul>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">3. User Conduct</h3>
              <p className="text-muted-foreground">
                Users agree to use the service responsibly and not to engage in any activity that could harm the service, other users, or third parties. This includes but is not limited to: providing false information, attempting to access unauthorized areas, or using the service for illegal purposes.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">4. Intellectual Property Rights</h3>
              <p className="text-muted-foreground">
                All content on TattooFinder, including but not limited to images, text, graphics, logos, and software, is the property of TattooFinder or its content suppliers and is protected by copyright and other intellectual property laws.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">5. Disclaimers</h3>
              <p className="text-muted-foreground">
                The information on this website is provided on an 'as is' basis. To the fullest extent permitted by law, TattooFinder excludes all representations, warranties, conditions and other terms which might otherwise be implied by statute, common law or the law of equity.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">6. Limitations of Liability</h3>
              <p className="text-muted-foreground">
                In no event shall TattooFinder or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on TattooFinder's website.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">7. Governing Law</h3>
              <p className="text-muted-foreground">
                These terms and conditions are governed by and construed in accordance with the laws of the jurisdiction in which TattooFinder operates, and any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts in that jurisdiction.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">8. Changes to Terms</h3>
              <p className="text-muted-foreground">
                TattooFinder reserves the right to revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.
              </p>
            </div>

            <div>
              <h3 className="text-lg font-semibold text-foreground mb-3">9. Contact Information</h3>
              <p className="text-muted-foreground">
                If you have any questions about these Terms of Service, please contact us at:
                <br />
                Email: legal@tattoofinder.com
                <br />
                Address: 123 Legal Street, Terms City, TC 12345
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Terms;