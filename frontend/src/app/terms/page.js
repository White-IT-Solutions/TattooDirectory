"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import Card, {
  CardHeader,
  CardTitle,
  CardContent,
} from "../../design-system/components/ui/Card/Card";
import Button from "../../design-system/components/ui/Button/Button";
import Breadcrumb, {
  BreadcrumbItem,
  HomeBreadcrumb,
} from "../../design-system/components/ui/Breadcrumb/Breadcrumb";

// Terms of Service data structure
const termsData = {
  lastUpdated: "2024-09-20",
  version: "2.1",
  effectiveDate: "2024-10-01",
  sections: [
    {
      id: "acceptance",
      title: "Acceptance of Terms",
      content: `By accessing and using the TattooFinder website and services, you accept and agree to be bound by the terms and provision of this agreement. If you do not agree to abide by the above, please do not use this service.

These terms constitute a legally binding agreement between you and TattooFinder. Your continued use of our services indicates your acceptance of these terms and any future modifications.`,
    },
    {
      id: "license",
      title: "Use License",
      content: `Permission is granted to temporarily use TattooFinder for personal, non-commercial transitory viewing only. This is the grant of a license, not a transfer of title, and under this license you may not:`,
      list: [
        "modify or copy the materials",
        "use the materials for any commercial purpose or for any public display",
        "attempt to reverse engineer any software contained on the website",
        "remove any copyright or other proprietary notations from the materials",
      ],
      additionalContent: `This license shall automatically terminate if you violate any of these restrictions and may be terminated by TattooFinder at any time. Upon terminating your viewing of these materials or upon the termination of this license, you must destroy any downloaded materials in your possession whether in electronic or printed format.`,
    },
    {
      id: "conduct",
      title: "User Conduct",
      content: `Users agree to use the service responsibly and not to engage in any activity that could harm the service, other users, or third parties. This includes but is not limited to: providing false information, attempting to access unauthorized areas, or using the service for illegal purposes.

You are responsible for maintaining the confidentiality of your account information and for all activities that occur under your account. You agree to notify us immediately of any unauthorized use of your account.`,
    },
    {
      id: "intellectual-property",
      title: "Intellectual Property Rights",
      content: `All content on TattooFinder, including but not limited to images, text, graphics, logos, and software, is the property of TattooFinder or its content suppliers and is protected by copyright and other intellectual property laws.

The compilation of all content on this site is the exclusive property of TattooFinder and protected by copyright laws. All software used on this site is the property of TattooFinder or its software suppliers and protected by copyright laws.`,
    },
    {
      id: "privacy",
      title: "Privacy and Data Protection",
      content: `Your privacy is important to us. Our Privacy Policy explains how we collect, use, and protect your information when you use our services. By using TattooFinder, you agree to the collection and use of information in accordance with our Privacy Policy.

We implement appropriate security measures to protect your personal information against unauthorized access, alteration, disclosure, or destruction.`,
    },
    {
      id: "disclaimers",
      title: "Disclaimers",
      content: `The information on this website is provided on an 'as is' basis. To the fullest extent permitted by law, TattooFinder excludes all representations, warranties, conditions and other terms which might otherwise be implied by statute, common law or the law of equity.

TattooFinder does not warrant that the service will be uninterrupted, timely, secure, or error-free. We do not warrant the accuracy or completeness of any information provided by third parties, including artist profiles and portfolio content.`,
    },
    {
      id: "liability",
      title: "Limitations of Liability",
      content: `In no event shall TattooFinder or its suppliers be liable for any damages (including, without limitation, damages for loss of data or profit, or due to business interruption) arising out of the use or inability to use the materials on TattooFinder's website.

Our total liability to you for all damages, losses, and causes of action shall not exceed the amount paid by you, if any, for accessing this site.`,
    },
    {
      id: "termination",
      title: "Termination",
      content: `We may terminate or suspend your account and bar access to the service immediately, without prior notice or liability, under our sole discretion, for any reason whatsoever and without limitation, including but not limited to a breach of the Terms.

If you wish to terminate your account, you may simply discontinue using the service. All provisions of the Terms which by their nature should survive termination shall survive termination.`,
    },
    {
      id: "governing-law",
      title: "Governing Law",
      content: `These terms and conditions are governed by and construed in accordance with the laws of England and Wales, and any disputes relating to these terms and conditions will be subject to the exclusive jurisdiction of the courts of England and Wales.

If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions shall remain in full force and effect.`,
    },
    {
      id: "changes",
      title: "Changes to Terms",
      content: `TattooFinder reserves the right to revise these terms of service at any time without notice. By using this website, you are agreeing to be bound by the then current version of these terms of service.

We will notify users of any material changes to these terms by posting a notice on our website or by email. Your continued use of the service after such modifications constitutes acceptance of the updated terms.`,
    },
    {
      id: "contact",
      title: "Contact Information",
      content: `If you have any questions about these Terms of Service, please contact us at:

Email: legal@tattoofinder.com
Address: 123 Legal Street, Terms City, TC 12345
Phone: +44 (0) 20 1234 5678

We aim to respond to all inquiries within 48 hours during business days.`,
    },
  ],
};

// Version history data
const versionHistory = [
  {
    version: "2.1",
    date: "2024-09-20",
    changes: [
      "Added privacy and data protection section",
      "Updated contact information",
      "Clarified termination procedures",
    ],
  },
  {
    version: "2.0",
    date: "2024-06-15",
    changes: [
      "Major revision for GDPR compliance",
      "Updated liability limitations",
      "Added user conduct guidelines",
    ],
  },
  {
    version: "1.5",
    date: "2024-03-10",
    changes: [
      "Updated intellectual property section",
      "Clarified use license terms",
    ],
  },
  {
    version: "1.0",
    date: "2024-01-01",
    changes: ["Initial terms of service"],
  },
];

export const dynamic = 'force-dynamic';

export default function TermsPage() {
  const [activeSection, setActiveSection] = useState("");
  const [userAcceptance, setUserAcceptance] = useState(null);
  const [showVersionHistory, setShowVersionHistory] = useState(false);

  // Smooth scrolling to sections
  const scrollToSection = (sectionId) => {
    const element = document.getElementById(sectionId);
    if (element) {
      element.scrollIntoView({
        behavior: "smooth",
        block: "start",
        inline: "nearest",
      });
      setActiveSection(sectionId);
    }
  };

  // Track which section is currently in view
  useEffect(() => {
    const handleScroll = () => {
      const sections = termsData.sections.map((section) => section.id);
      const scrollPosition = window.scrollY + 100;

      for (const sectionId of sections) {
        const element = document.getElementById(sectionId);
        if (element) {
          const { offsetTop, offsetHeight } = element;
          if (
            scrollPosition >= offsetTop &&
            scrollPosition < offsetTop + offsetHeight
          ) {
            setActiveSection(sectionId);
            break;
          }
        }
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Load user acceptance status (in real app, this would come from authentication)
  useEffect(() => {
    const acceptance = localStorage.getItem("terms-acceptance");
    if (acceptance) {
      setUserAcceptance(JSON.parse(acceptance));
    }
  }, []);

  // Handle terms acceptance
  const handleAcceptance = () => {
    const acceptance = {
      version: termsData.version,
      date: new Date().toISOString(),
      accepted: true,
    };
    localStorage.setItem("terms-acceptance", JSON.stringify(acceptance));
    setUserAcceptance(acceptance);
  };

  return (
    <div className="min-h-screen bg-[var(--background-secondary)]">
      {/* Header with breadcrumb */}
      <div className="bg-[var(--background-primary)] border-b border-[var(--border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <Breadcrumb>
            <HomeBreadcrumb />
            <BreadcrumbItem current>Terms of Service</BreadcrumbItem>
          </Breadcrumb>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
          {/* Table of Contents - Sticky Sidebar */}
          <div className="lg:col-span-1">
            <Card className="sticky top-8" elevation="medium" padding="md">
              <CardHeader>
                <CardTitle className="text-[var(--typography-heading-h4-size)] font-[var(--typography-heading-h4-weight)]">
                  Table of Contents
                </CardTitle>
              </CardHeader>
              <CardContent>
                <nav className="space-y-2">
                  {termsData.sections.map((section) => (
                    <button
                      key={section.id}
                      onClick={() => scrollToSection(section.id)}
                      className={`block w-full text-left px-3 py-2 rounded-[var(--radius)] text-sm transition-all duration-200 ${
                        activeSection === section.id
                          ? "bg-[var(--interactive-primary)] text-white"
                          : "text-[var(--text-secondary)] hover:text-[var(--interactive-primary)] hover:bg-[var(--interactive-secondary)]"
                      }`}
                    >
                      {section.title}
                    </button>
                  ))}
                </nav>

                {/* Version Info */}
                <div className="mt-6 pt-4 border-t border-[var(--border-subtle)]">
                  <div className="text-xs text-[var(--text-muted)] space-y-1">
                    <div>Version: {termsData.version}</div>
                    <div>
                      Last Updated:{" "}
                      {new Date(termsData.lastUpdated).toLocaleDateString()}
                    </div>
                    <div>
                      Effective:{" "}
                      {new Date(termsData.effectiveDate).toLocaleDateString()}
                    </div>
                  </div>

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowVersionHistory(!showVersionHistory)}
                    className="mt-2 w-full text-xs"
                  >
                    {showVersionHistory ? "Hide" : "View"} Version History
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content */}
          <div className="lg:col-span-3 space-y-6">
            {/* Header */}
            <Card elevation="low" padding="lg">
              <CardHeader>
                <CardTitle className="text-[var(--typography-heading-h1-size)] font-[var(--typography-heading-h1-weight)] text-[var(--text-primary)] mb-2">
                  Terms of Service
                </CardTitle>
                <div className="flex flex-wrap gap-4 text-sm text-[var(--text-secondary)]">
                  <span>Version {termsData.version}</span>
                  <span>•</span>
                  <span>
                    Last Updated:{" "}
                    {new Date(termsData.lastUpdated).toLocaleDateString()}
                  </span>
                  <span>•</span>
                  <span>
                    Effective:{" "}
                    {new Date(termsData.effectiveDate).toLocaleDateString()}
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--typography-body-large-size)] text-[var(--text-secondary)] leading-[var(--typography-body-large-line-height)]">
                  Please read these Terms of Service carefully before using
                  TattooFinder. These terms govern your use of our website and
                  services.
                </p>
              </CardContent>
            </Card>

            {/* User Acceptance Status */}
            {userAcceptance && (
              <Card
                elevation="low"
                padding="md"
                className="bg-[var(--feedback-success-bg)] border-[var(--feedback-success)]"
              >
                <CardContent>
                  <div className="flex items-center space-x-2 text-[var(--feedback-success)]">
                    <svg
                      className="h-5 w-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    <span className="text-sm font-medium">
                      You accepted version {userAcceptance.version} on{" "}
                      {new Date(userAcceptance.date).toLocaleDateString()}
                    </span>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Version History */}
            {showVersionHistory && (
              <Card elevation="medium" padding="md">
                <CardHeader>
                  <CardTitle className="text-[var(--typography-heading-h3-size)] font-[var(--typography-heading-h3-weight)]">
                    Version History
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {versionHistory.map((version) => (
                      <div
                        key={version.version}
                        className="border-l-2 border-[var(--interactive-primary)] pl-4"
                      >
                        <div className="flex items-center space-x-2 mb-2">
                          <span className="font-semibold text-[var(--text-primary)]">
                            Version {version.version}
                          </span>
                          <span className="text-sm text-[var(--text-muted)]">
                            {new Date(version.date).toLocaleDateString()}
                          </span>
                        </div>
                        <ul className="text-sm text-[var(--text-secondary)] space-y-1">
                          {version.changes.map((change, index) => (
                            <li
                              key={index}
                              className="flex items-start space-x-2"
                            >
                              <span className="text-[var(--interactive-primary)] mt-1">
                                •
                              </span>
                              <span>{change}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Terms Sections */}
            {termsData.sections.map((section, index) => (
              <Card
                key={section.id}
                id={section.id}
                elevation="medium"
                padding="lg"
              >
                <CardHeader>
                  <CardTitle className="text-[var(--typography-heading-h2-size)] font-[var(--typography-heading-h2-weight)] text-[var(--text-primary)]">
                    {index + 1}. {section.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="prose prose-gray max-w-none">
                    {section.content.split("\n\n").map((paragraph, pIndex) => (
                      <p
                        key={pIndex}
                        className="text-[var(--typography-body-size)] text-[var(--text-secondary)] leading-[var(--typography-body-line-height)] mb-4 last:mb-0"
                      >
                        {paragraph}
                      </p>
                    ))}

                    {section.list && (
                      <ul className="list-disc list-inside text-[var(--text-secondary)] space-y-2 my-4 ml-4">
                        {section.list.map((item, itemIndex) => (
                          <li
                            key={itemIndex}
                            className="text-[var(--typography-body-size)] leading-[var(--typography-body-line-height)]"
                          >
                            {item}
                          </li>
                        ))}
                      </ul>
                    )}

                    {section.additionalContent && (
                      <p className="text-[var(--typography-body-size)] text-[var(--text-secondary)] leading-[var(--typography-body-line-height)] mt-4">
                        {section.additionalContent}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}

            {/* Acceptance Section */}
            <Card
              elevation="high"
              padding="lg"
              className="bg-[var(--background-primary)]"
            >
              <CardHeader>
                <CardTitle className="text-[var(--typography-heading-h3-size)] font-[var(--typography-heading-h3-weight)]">
                  Terms Acceptance
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-[var(--text-secondary)] mb-6">
                  By clicking &quot;I Accept&quot; below, you acknowledge that
                  you have read, understood, and agree to be bound by these
                  Terms of Service.
                </p>

                <div className="flex flex-col sm:flex-row gap-4">
                  {!userAcceptance && (
                    <Button
                      onClick={handleAcceptance}
                      variant="primary"
                      size="lg"
                      className="flex-1"
                    >
                      I Accept These Terms
                    </Button>
                  )}

                  <Button
                    variant="outline"
                    size="lg"
                    className="flex-1"
                    onClick={() => window.print()}
                  >
                    Print Terms
                  </Button>

                  <Link href="/">
                    <Button
                      variant="secondary"
                      size="lg"
                      className="w-full sm:w-auto"
                    >
                      Return Home
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
