"use client";

import { useState } from "react";

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

export default function FAQPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [openQuestion, setOpenQuestion] = useState(null); // Track which question is open

  const handleToggle = (questionId) => {
    setOpenQuestion((prev) => (prev === questionId ? null : questionId));
  };

  // Filter questions based on search
  const filteredData = faqData.map((category) => {
    const filteredQuestions = category.questions.filter(
      (q) =>
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    );
    return { ...category, questions: filteredQuestions };
  });

  const isFiltered = searchTerm.trim() !== "";

  return (
    <div className="min-h-screen bg-gray-50 px-6 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Frequently Asked Questions
        </h1>

        {/* Search input */}
        <div className="flex items-center gap-2 mb-8">
          <input
            type="text"
            placeholder="Search FAQs..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gray-700"
          />
          {isFiltered && (
            <button
              onClick={() => setSearchTerm("")}
              className="px-4 py-2 bg-gray-300 text-gray-700 rounded-lg hover:bg-gray-400 transition"
            >
              Clear
            </button>
          )}
        </div>

        {/* FAQ List */}
        {filteredData.map((category) => (
          <div key={category.category} className="mb-8">
            {category.questions.length > 0 && (
              <>
                <h2 className="text-xl font-semibold text-gray-800 mb-4">
                  {category.category}
                </h2>
                <div className="space-y-4">
                  {category.questions.map((q, index) => {
                    const questionId = `${category.category}-${index}`;
                    const isOpen = openQuestion === questionId;

                    return (
                      <div
                        key={index}
                        className="bg-white shadow-md rounded-lg p-4"
                      >
                        {/* Question toggle button */}
                        <button
                          onClick={() => handleToggle(questionId)}
                          className="w-full text-left flex justify-between items-center"
                        >
                          <span className="font-medium text-gray-900">
                            {q.question}
                          </span>
                          <span className="text-gray-600">
                            {isOpen ? "−" : "+"}
                          </span>
                        </button>

                        {/* Answer */}
                        {isOpen && (
                          <p className="text-gray-600 mt-3">{q.answer}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </>
            )}
          </div>
        ))}

        {/* No results message */}
        {isFiltered && filteredData.every((c) => c.questions.length === 0) && (
          <p className="text-center text-gray-600">
            No FAQs match your search.
          </p>
        )}
      </div>
    </div>
  );
}
