import { useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Search, MessageCircle, Mail } from "lucide-react";

const FAQ = () => {
  const [searchTerm, setSearchTerm] = useState("");

  const faqData = [
    {
      category: "Artist Search",
      questions: [
        {
          question: "How do I search for tattoo artists?",
          answer: "Use our search page to filter artists by style, location, and keywords. You can also explore artists using our interactive map feature."
        },
        {
          question: "What tattoo styles can I filter by?",
          answer: "We support filtering by 17 different styles including Geometric, Dotwork, Watercolor, Neotraditional, Blackwork, Minimalism, Japanese, Newschool, Traditional, Realism, Tribal, Illustrative, Lettering, Sketch, Floral, Anime, and Fineline."
        },
        {
          question: "Can I search by location?",
          answer: "Yes! You can search by city, state, or use our map feature to find artists in specific areas. Our location-based search helps you find artists near you."
        }
      ]
    },
    {
      category: "Artist Profiles",
      questions: [
        {
          question: "How are artist profiles created?",
          answer: "Artist profiles are aggregated from publicly available information including social media profiles, portfolio websites, and professional directories."
        },
        {
          question: "What if an artist's portfolio isn't available?",
          answer: "If portfolio images aren't available, we'll display a 'Portfolio not available' message but still provide links to the artist's social media and contact information."
        },
        {
          question: "How can artists update their information?",
          answer: "Artists can use our delisting form to request updates to their profile or removal from our directory. We respect artists' wishes regarding their online presence."
        }
      ]
    },
    {
      category: "Data Privacy",
      questions: [
        {
          question: "What information do you collect?",
          answer: "We collect minimal information necessary for our services, including search queries and location preferences. We do not collect personal identification information unless voluntarily provided."
        },
        {
          question: "Do you share my data with third parties?",
          answer: "No, we do not sell or share your personal data with third parties. Your information is used solely to improve our services and provide better search results."
        },
        {
          question: "How can I delete my data?",
          answer: "Contact us at privacy@tattoofinder.com to request access, modification, or deletion of any data we may have collected about you."
        }
      ]
    },
    {
      category: "General Usage",
      questions: [
        {
          question: "Is TattooFinder free to use?",
          answer: "Yes! TattooFinder is completely free for users searching for tattoo artists. There are no fees to browse profiles or use our search features."
        },
        {
          question: "How often is the artist database updated?",
          answer: "We continuously update our artist database to ensure accuracy and completeness. New artists are regularly added, and existing profiles are updated as needed."
        },
        {
          question: "Can I book appointments through TattooFinder?",
          answer: "We don't handle bookings directly. Instead, we provide links to artists' social media and websites where you can contact them directly to inquire about appointments."
        }
      ]
    }
  ];

  const filteredFAQ = faqData.map(category => ({
    ...category,
    questions: category.questions.filter(
      q => 
        q.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
        q.answer.toLowerCase().includes(searchTerm.toLowerCase())
    )
  })).filter(category => category.questions.length > 0);

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-foreground mb-4">Frequently Asked Questions</h1>
          <p className="text-xl text-muted-foreground">
            Find answers to common questions about using TattooFinder
          </p>
        </div>

        {/* Search */}
        <div className="mb-8">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-5 h-5" />
            <Input
              placeholder="Search FAQ..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 h-12"
            />
          </div>
        </div>

        {/* FAQ Content */}
        <div className="space-y-8">
          {filteredFAQ.map((category, categoryIndex) => (
            <Card key={categoryIndex} className="overflow-hidden">
              <div className="bg-gradient-primary p-4">
                <h2 className="text-xl font-semibold text-primary-foreground">
                  {category.category}
                </h2>
              </div>
              <CardContent className="p-0">
                <Accordion type="single" collapsible className="w-full">
                  {category.questions.map((item, questionIndex) => (
                    <AccordionItem 
                      key={questionIndex} 
                      value={`${categoryIndex}-${questionIndex}`}
                      className="border-b border-border last:border-b-0"
                    >
                      <AccordionTrigger className="px-6 py-4 text-left hover:bg-muted/50">
                        {item.question}
                      </AccordionTrigger>
                      <AccordionContent className="px-6 pb-4">
                        <p className="text-muted-foreground leading-relaxed">
                          {item.answer}
                        </p>
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Contact Support */}
        <Card className="mt-12 bg-gradient-subtle">
          <CardContent className="p-8 text-center">
            <MessageCircle className="w-12 h-12 text-primary mx-auto mb-4" />
            <h3 className="text-2xl font-semibold text-foreground mb-4">
              Still Have Questions?
            </h3>
            <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
              Can't find what you're looking for? Our support team is here to help. 
              Reach out to us and we'll get back to you as soon as possible.
            </p>
            <Button variant="hero" size="lg">
              <Mail className="w-5 h-5 mr-2" />
              Contact Support
            </Button>
            <p className="text-sm text-muted-foreground mt-4">
              Email us at: support@tattoofinder.com
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default FAQ;