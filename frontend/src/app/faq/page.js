"use client";

import { useState } from "react";
import { Breadcrumb, BreadcrumbItem, HomeBreadcrumb } from '../../design-system/components/ui/Breadcrumb';
import { SearchInput } from '../../design-system/components/ui/Input';
import Button from '../../design-system/components/ui/Button/Button';
import { FAQ } from '../../design-system/components/ui/FAQ';
import { FAQContact } from '../../design-system/components/ui/Contact';

const faqData = [
  {
    category: "Artist Search",
    questions: [
      {
        question: "How do I search for tattoo artists?",
        answer:
          "Use our search page to filter artists by style, location, and keywords. You can also explore artists using our interactive map feature.",
      },
      {
        question: "What tattoo styles can I filter by?",
        answer:
          "We support filtering by 17 different styles including Geometric, Dotwork, Watercolor, Neotraditional, Blackwork, Minimalism, Japanese, Newschool, Traditional, Realism, Tribal, Illustrative, Lettering, Sketch, Floral, Anime, and Fineline.",
      },
      {
        question: "Can I search by location?",
        answer:
          "Yes! You can search by city, state, or use our map feature to find artists in specific areas. Our location-based search helps you find artists near you.",
      },
    ],
  },
  {
    category: "Artist Profiles",
    questions: [
      {
        question: "How are artist profiles created?",
        answer:
          "Artist profiles are aggregated from publicly available information including social media profiles, portfolio websites, and professional directories.",
      },
      {
        question: "What if an artist's portfolio isn't available?",
        answer:
          "If portfolio images aren't available, we'll display a 'Portfolio not available' message but still provide links to the artist's social media and contact information.",
      },
      {
        question: "How can artists update their information?",
        answer:
          "Artists can use our delisting form to request updates to their profile or removal from our directory. We respect artists' wishes regarding their online presence.",
      },
    ],
  },
  {
    category: "Data Privacy",
    questions: [
      {
        question: "What information do you collect?",
        answer:
          "We collect minimal information necessary for our services, including search queries and location preferences. We do not collect personal identification information unless voluntarily provided.",
      },
      {
        question: "Do you share my data with third parties?",
        answer:
          "No, we do not sell or share your personal data with third parties. Your information is used solely to improve our services and provide better search results.",
      },
      {
        question: "How can I delete my data?",
        answer:
          "Contact us at privacy@tattoofinder.com to request access, modification, or deletion of any data we may have collected about you.",
      },
    ],
  },
  {
    category: "General Usage",
    questions: [
      {
        question: "Is TattooFinder free to use?",
        answer:
          "Yes! TattooFinder is completely free for users searching for tattoo artists. There are no fees to browse profiles or use our search features.",
      },
      {
        question: "How often is the artist database updated?",
        answer:
          "We continuously update our artist database to ensure accuracy and completeness. New artists are regularly added, and existing profiles are updated as needed.",
      },
      {
        question: "Can I book appointments through TattooFinder?",
        answer:
          "We don't handle bookings directly. Instead, we provide links to artists' social media and websites where you can contact them directly to inquire about appointments.",
      },
    ],
  },
];

export const dynamic = 'force-dynamic';

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");

  const handleClearSearch = () => {
    setSearchTerm("");
  };

  const isFiltered = searchTerm.trim() !== "";

  return (
    <div className="min-h-screen bg-[var(--background-secondary)] px-6 py-8">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb Navigation */}
        <div className="mb-6">
          <Breadcrumb>
            <HomeBreadcrumb />
            <BreadcrumbItem current>FAQ</BreadcrumbItem>
          </Breadcrumb>
        </div>

        {/* Page Header */}
        <header className="text-center mb-8">
          <h1 className="text-[var(--typography-heading-1-size)] font-weight-[var(--typography-heading-1-weight)] line-height-[var(--typography-heading-1-line-height)] text-[var(--text-primary)] mb-4">
            Frequently Asked Questions
          </h1>
          <p className="text-[var(--typography-body-large-size)] text-[var(--text-secondary)] max-w-2xl mx-auto">
            Find answers to common questions about using TattooFinder, searching for artists, and managing your privacy.
          </p>
        </header>

        {/* Search Section */}
        <div className="mb-8">
          <div className="flex items-center gap-3">
            <div className="flex-1">
              <SearchInput
                placeholder="Search FAQs..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                size="lg"
                aria-label="Search frequently asked questions"
              />
            </div>
            {isFiltered && (
              <Button
                variant="outline"
                size="lg"
                onClick={handleClearSearch}
                aria-label="Clear search"
              >
                Clear
              </Button>
            )}
          </div>
          {isFiltered && (
            <p className="text-[var(--typography-body-small-size)] text-[var(--text-secondary)] mt-2">
              Showing results for &quot;{searchTerm}&quot;
            </p>
          )}
        </div>

        {/* FAQ Content */}
        <div className="mb-12">
          <FAQ 
            categories={faqData}
            searchTerm={searchTerm}
            iconType="chevron"
            allowMultipleOpen={true}
          />
        </div>

        {/* Contact Information */}
        <div className="max-w-md mx-auto">
          <FAQContact />
        </div>
      </div>
    </div>
  );
}
