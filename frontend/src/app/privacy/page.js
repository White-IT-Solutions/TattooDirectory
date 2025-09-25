"use client";

import { useState } from 'react';
import Link from 'next/link';
// Simple components to avoid circular dependencies
const SimpleCard = ({ children, className, elevation, padding, ...props }) => (
  <div className={`bg-white rounded-lg border border-gray-200 shadow-sm ${className || ''}`} {...props}>
    {children}
  </div>
);

const SimpleCardHeader = ({ children, className, ...props }) => (
  <div className={`px-6 py-4 ${className || ''}`} {...props}>
    {children}
  </div>
);

const SimpleCardTitle = ({ children, className, ...props }) => (
  <h2 className={`text-xl font-semibold text-gray-900 ${className || ''}`} {...props}>
    {children}
  </h2>
);

const SimpleCardContent = ({ children, className, ...props }) => (
  <div className={`px-6 pb-6 ${className || ''}`} {...props}>
    {children}
  </div>
);

const SimpleButton = ({ children, variant = 'primary', size = 'md', onClick, className, ...props }) => (
  <button
    onClick={onClick}
    className={`inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 ${
      variant === 'primary' 
        ? 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500'
        : variant === 'outline'
        ? 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50 focus:ring-blue-500'
        : variant === 'ghost'
        ? 'text-gray-600 hover:text-gray-900 hover:bg-gray-100 focus:ring-gray-500'
        : 'bg-gray-100 text-gray-900 hover:bg-gray-200 focus:ring-gray-500'
    } ${
      size === 'sm' ? 'px-3 py-2 text-sm' : 'px-4 py-2 text-base'
    } ${className || ''}`}
    {...props}
  >
    {children}
  </button>
);

const SimpleBreadcrumb = ({ children }) => (
  <nav className="flex" aria-label="Breadcrumb">
    <ol className="flex items-center space-x-2">
      {children}
    </ol>
  </nav>
);

const SimpleBreadcrumbItem = ({ children, current }) => (
  <li className="flex items-center">
    {!current && <span className="mx-2 text-gray-400">/</span>}
    <span className={current ? 'text-gray-900 font-medium' : 'text-gray-500'}>
      {children}
    </span>
  </li>
);

const SimpleHomeBreadcrumb = () => (
  <li>
    <Link href="/" className="text-blue-600 hover:text-blue-800">
      Home
    </Link>
  </li>
);

const privacySections = [
  {
    id: "information-collection",
    title: "1. Information We Collect",
    content: [
      "We collect information you provide directly to us, such as when you use our search functionality, contact us, or interact with our services. This may include:",
      "• Search terms and location preferences",
      "• Communication records when you contact us",
      "• Usage analytics to improve our services",
      "• Technical information such as IP address and browser type",
      "We do not collect personal identification information unless voluntarily provided by you."
    ]
  },
  {
    id: "information-usage",
    title: "2. How We Use Your Information",
    content: [
      "We use the information we collect to:",
      "• Provide, maintain, and improve our artist directory services",
      "• Deliver personalized search results based on your preferences",
      "• Respond to your requests and provide customer support",
      "• Communicate with you about our services and updates",
      "• Analyze usage patterns to enhance user experience",
      "• Ensure the security and integrity of our platform",
      "We never sell your data to third parties or use it for purposes other than those described in this policy."
    ]
  },
  {
    id: "information-sharing",
    title: "3. Information Sharing and Disclosure",
    content: [
      "We do not sell, trade, or otherwise transfer your personal information to third parties without your consent, except in the following circumstances:",
      "• When required by law or legal process",
      "• To protect our rights, property, or safety",
      "• With service providers who assist in our operations (under strict confidentiality agreements)",
      "• In connection with a business transfer or acquisition",
      "We may share aggregated, non-personally identifiable information for research and analytics purposes."
    ]
  },
  {
    id: "data-security",
    title: "4. Data Security",
    content: [
      "We implement industry-standard security measures to protect your information:",
      "• Encryption of data in transit and at rest",
      "• Secure servers with regular security updates",
      "• Regular security audits and vulnerability assessments",
      "• Access controls and authentication measures",
      "• Employee training on data protection practices",
      "While we strive to protect your information, no method of transmission over the internet is 100% secure."
    ]
  },
  {
    id: "user-rights",
    title: "5. Your Rights and Choices",
    content: [
      "You have the following rights regarding your personal information:",
      "• Access: Request a copy of the personal information we hold about you",
      "• Correction: Request correction of inaccurate or incomplete information",
      "• Deletion: Request deletion of your personal information",
      "• Portability: Request transfer of your data to another service",
      "• Opt-out: Unsubscribe from marketing communications",
      "To exercise these rights, please contact us using the information provided below."
    ]
  },
  {
    id: "cookies-tracking",
    title: "6. Cookies and Tracking Technologies",
    content: [
      "We use cookies and similar technologies to:",
      "• Remember your preferences and settings",
      "• Analyze site traffic and usage patterns",
      "• Provide personalized content and advertisements",
      "• Improve site functionality and user experience",
      "You can control cookie settings through your browser preferences. Disabling cookies may affect site functionality."
    ]
  },
  {
    id: "data-retention",
    title: "7. Data Retention",
    content: [
      "We retain your information for as long as necessary to:",
      "• Provide our services to you",
      "• Comply with legal obligations",
      "• Resolve disputes and enforce agreements",
      "• Improve our services through analytics",
      "When information is no longer needed, we securely delete or anonymize it according to our data retention policies."
    ]
  },
  {
    id: "policy-updates",
    title: "8. Policy Updates",
    content: [
      "We may update this Privacy Policy from time to time to reflect:",
      "• Changes in our practices or services",
      "• Legal or regulatory requirements",
      "• Feedback from users and stakeholders",
      "We will notify you of significant changes by posting the updated policy on our website and updating the 'Last Updated' date."
    ]
  },
  {
    id: "contact-information",
    title: "9. Contact Information",
    content: [
      "If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please contact us:",
      "Email: privacy@tattoofinder.com",
      "Address: 123 Privacy Street, Data City, DC 12345",
      "Phone: +44 (0) 20 1234 5678",
      "We will respond to your inquiry within 30 days of receipt."
    ]
  }
];

export const dynamic = 'force-dynamic';

export default function PrivacyPolicyPage() {
  const [activeSection, setActiveSection] = useState(null);

  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth', block: 'start' });
      setActiveSection(sectionId);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-4 sm:py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto w-full">
        {/* Breadcrumb Navigation */}
        <div className="mb-4 sm:mb-6">
          <SimpleBreadcrumb>
            <SimpleHomeBreadcrumb />
            <SimpleBreadcrumbItem current>Privacy Policy</SimpleBreadcrumbItem>
          </SimpleBreadcrumb>
        </div>

        {/* Header Section */}
        <SimpleCard className="mb-6 sm:mb-8 bg-white">
          <SimpleCardHeader className="text-center max-w-4xl mx-auto">
            <SimpleCardTitle className="text-2xl sm:text-3xl font-bold text-gray-900 mb-4 sm:mb-6">
              Privacy Policy
            </SimpleCardTitle>
            <p className="text-base sm:text-lg text-gray-700 leading-relaxed mb-4 sm:mb-6 max-w-3xl mx-auto">
              Your privacy is important to us. This policy explains how we collect, use, and protect your personal information when you use our tattoo artist directory service.
            </p>
            <div className="text-sm text-gray-600 bg-gray-100 px-4 py-2 rounded-md inline-block">
              Last updated: December 15, 2024
            </div>
          </SimpleCardHeader>
        </SimpleCard>

        <div className="grid grid-cols-1 xl:grid-cols-5 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <div className="xl:col-span-1 lg:col-span-1 order-2 lg:order-1">
            <SimpleCard className="lg:sticky lg:top-8 bg-white">
              <SimpleCardHeader>
                <SimpleCardTitle className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">
                  Table of Contents
                </SimpleCardTitle>
              </SimpleCardHeader>
              <SimpleCardContent>
                <nav className="space-y-1 sm:space-y-2">
                  {privacySections.map((section) => (
                    <SimpleButton
                      key={section.id}
                      variant="ghost"
                      size="sm"
                      onClick={() => scrollToSection(section.id)}
                      className={`w-full justify-start text-left h-auto py-2 px-3 text-xs sm:text-sm ${
                        activeSection === section.id 
                          ? 'bg-gray-100 text-purple-700 font-medium' 
                          : 'text-gray-600 hover:text-gray-900 hover:bg-gray-50'
                      }`}
                    >
                      {section.title}
                    </SimpleButton>
                  ))}
                </nav>
              </SimpleCardContent>
            </SimpleCard>
          </div>

          {/* Main Content */}
          <div className="xl:col-span-4 lg:col-span-3 space-y-4 sm:space-y-6 order-1 lg:order-2">
            {privacySections.map((section) => (
              <SimpleCard 
                key={section.id} 
                id={section.id}
                className="scroll-mt-8 bg-white"
              >
                <SimpleCardHeader>
                  <SimpleCardTitle className="text-lg sm:text-xl font-semibold text-gray-900 mb-4 sm:mb-6">
                    {section.title}
                  </SimpleCardTitle>
                </SimpleCardHeader>
                <SimpleCardContent>
                  <div className="space-y-3 sm:space-y-4 max-w-none">
                    {section.content.map((paragraph, index) => (
                      <p 
                        key={index}
                        className="text-sm sm:text-base text-gray-700 leading-relaxed"
                      >
                        {paragraph}
                      </p>
                    ))}
                  </div>
                </SimpleCardContent>
              </SimpleCard>
            ))}

            {/* Action Section */}
            <SimpleCard className="bg-purple-50 border-purple-200">
              <SimpleCardContent className="text-center max-w-2xl mx-auto">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                  Questions About This Policy?
                </h3>
                <p className="text-base text-gray-700 mb-6 leading-relaxed">
                  We&apos;re here to help. Contact us if you have any questions about how we handle your privacy.
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <SimpleButton 
                    variant="primary" 
                    size="md"
                    onClick={() => window.location.href = 'mailto:privacy@tattoofinder.com'}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Contact Privacy Team
                  </SimpleButton>
                  <Link href="/">
                    <SimpleButton 
                      variant="outline" 
                      size="md"
                      className="border-purple-600 text-purple-600 hover:bg-purple-600 hover:text-white"
                    >
                      Return Home
                    </SimpleButton>
                  </Link>
                </div>
              </SimpleCardContent>
            </SimpleCard>
          </div>
        </div>
      </div>
    </div>
  );
}
