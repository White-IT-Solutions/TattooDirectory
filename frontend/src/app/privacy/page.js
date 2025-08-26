const sections = [
  {
    title: "Data Collection",
    content:
      "We collect minimal information necessary to provide our services, including search queries, location preferences, and basic usage analytics. We do not collect personal identification information unless voluntarily provided.",
  },
  {
    title: "Data Usage",
    content:
      "Your data is used solely to improve our artist directory services, provide personalized search results, and maintain the quality of our platform. We never sell your data to third parties.",
  },
  {
    title: "Data Security",
    content:
      "We implement industry-standard security measures including encryption, secure servers, and regular security audits to protect your information from unauthorized access.",
  },
  {
    title: "Contact & Control",
    content:
      "You have the right to access, modify, or delete your data at any time. Contact us at privacy@tattoofinder.com for any data-related requests or concerns.",
  },
];

export default function TermsPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 px-6 py-12 text-black">
      <div className="max-w-2xl text-center">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Data Privacy Policy</h1>
          <p className="text-xl ">
            Your privacy is important to us. Learn how we collect, use, and
            protect your data.
          </p>
          <p className="text-sm mt-2">Last updated: December 2024</p>
        </div>

        <div className="grid gap-6 mb-12">
          {sections.map((section, index) => {
            return (
              <div className="bg-gradient-primary rounded-lg flex items-center justify-center">
                {section.title}
                <p className="text-muted-foreground leading-relaxed">
                  {section.content}
                </p>
              </div>
            );
          })}
        </div>

        <h3 className="text-lg font-semibold mb-3">
          1. Information We Collect
        </h3>
        <p className=" mb-4">
          We collect information you provide directly to us, such as when you
          use our search functionality, contact us, or interact with our
          services. This may include search terms, location preferences, and
          communication records.
        </p>

        <h3 className="text-lg font-semibold mb-3">
          2. How We Use Your Information
        </h3>
        <p className=" mb-4">
          We use the information we collect to provide, maintain, and improve
          our services, respond to your requests, and communicate with you about
          our services.
        </p>

        <h3 className="text-lg font-semibol mb-3">3. Information Sharing</h3>
        <p className=" mb-4">
          We do not sell, trade, or otherwise transfer your personal information
          to third parties without your consent, except as described in this
          policy or as required by law.
        </p>

        <h3 className="text-lg font-semibold mb-3">4. Data Security</h3>
        <p className="mb-4">
          We implement appropriate security measures to protect your personal
          information against unauthorized access, alteration, disclosure, or
          destruction.
        </p>

        <h3 className="text-lg font-semibold mb-3">5. Your Rights</h3>
        <p className="mb-4">
          You have the right to access, update, or delete your personal
          information. You may also opt out of certain communications from us.
        </p>

        <h3 className="text-lg font-semibold mb-3">6. Contact Information</h3>
        <p className="mb-3">
          If you have any questions about this Privacy Policy, please contact us
          at:
          <br />
          Email: privacy@tattoofinder.com
          <br />
          Address: 123 Privacy Street, Data City, DC 12345
        </p>
        <a
          href="/"
          className="inline-block px-6 py-2 bg-gray-900 text-white rounded-lg hover:bg-gray-700 transition"
        >
          Go Back Home
        </a>
      </div>
    </div>
  );
}
