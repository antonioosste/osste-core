import { ArrowRight, Mic, BookOpen, Sparkles, ChevronLeft, ChevronRight } from "lucide-react";
import { Link } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const valueProps = [
  {
    icon: Mic,
    title: "AI-Guided Interviews",
    description: "Smart conversations that naturally draw out meaningful stories and memories with personalized follow-up questions.",
  },
  {
    icon: Sparkles,
    title: "Professional Polish", 
    description: "Transform raw recordings into beautifully written stories with AI enhancement while preserving your authentic voice.",
  },
  {
    icon: BookOpen,
    title: "Lasting Legacy",
    description: "Create heirloom-quality books that preserve family stories for future generations in multiple formats.",
  },
];

const testimonials = [
  {
    quote: "OSSTE helped me capture my grandfather's war stories before it was too late. The AI made it feel like a natural conversation.",
    author: "Sarah Chen",
    title: "Family Historian",
  },
  {
    quote: "As a busy parent, I love how easy it is to record family stories. The books we create are treasures for our children.",
    author: "Michael Rodriguez",
    title: "Father of Three",
  },
  {
    quote: "The quality of the final stories is incredible. It's like having a professional writer capture our family's voice perfectly.",
    author: "Elena Thompson", 
    title: "Grandmother",
  },
];

export default function Landing() {
  const [currentTestimonial, setCurrentTestimonial] = useState(0);

  const nextTestimonial = () => {
    setCurrentTestimonial((prev) => (prev + 1) % testimonials.length);
  };

  const prevTestimonial = () => {
    setCurrentTestimonial((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  return (
    <div className="min-h-screen relative bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/images/gallery/cozy-library.jpg")' }}>
      {/* Background overlay */}
      <div className="absolute inset-0 bg-background/60" />
      <div className="relative z-10">
        <Header />
        
        {/* Hero Section */}
        <section className="relative py-16 md:py-24 overflow-hidden">
          <div className="container mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-foreground mb-6 leading-tight">
                Capture Stories That{" "}
                <span className="text-primary">Matter</span>
              </h1>
              <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto leading-relaxed">
                Use AI-guided voice interviews to preserve precious memories, 
                family histories, and personal stories for future generations.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button size="lg" asChild>
                  <Link to="/session">
                    Start a Demo <ArrowRight className="w-4 h-4 ml-2" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" asChild>
                  <Link to="/pricing">
                    See Pricing
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* Value Cards */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Everything You Need to Preserve Stories
              </h2>
              <p className="text-lg text-muted-foreground">
                Our AI-powered platform makes it simple to conduct meaningful 
                interviews and create lasting memories.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {valueProps.map((prop, index) => (
                <Card key={index} className="text-center border-2 hover:border-primary/20 transition-all duration-300 hover:shadow-lg">
                  <CardHeader className="pb-4">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                      <prop.icon className="w-6 h-6 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{prop.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground leading-relaxed">{prop.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12 md:mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three simple steps to create beautiful family stories.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-4xl mx-auto">
              {[
                {
                  step: "Record",
                  title: "Voice Interview",
                  description: "Start a natural conversation guided by our AI interviewer.",
                  icon: Mic,
                },
                {
                  step: "Refine", 
                  title: "AI Enhancement",
                  description: "Our AI polishes your story while preserving your authentic voice.",
                  icon: Sparkles,
                },
                {
                  step: "Print",
                  title: "Beautiful Books",
                  description: "Generate professional books ready to share with family.",
                  icon: BookOpen,
                },
              ].map((item, index) => (
                <div key={index} className="text-center relative">
                  {/* Connection line for desktop */}
                  {index < 2 && (
                    <div className="hidden md:block absolute top-6 left-1/2 w-full h-0.5 bg-gradient-to-r from-primary to-primary/20 z-0" 
                         style={{ transform: 'translateX(50%)' }} />
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mx-auto mb-4">
                      <item.icon className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-2">
                      {item.step}
                    </h3>
                    <h4 className="text-lg font-medium text-foreground mb-2">
                      {item.title}
                    </h4>
                    <p className="text-muted-foreground leading-relaxed">{item.description}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Testimonials Slider */}
        <section className="py-16 md:py-20 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Trusted by Families Worldwide
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Card className="relative overflow-hidden">
                <CardContent className="p-8 md:p-12">
                  <div className="text-center">
                    <blockquote className="text-lg md:text-xl text-foreground mb-6 italic leading-relaxed">
                      "{testimonials[currentTestimonial].quote}"
                    </blockquote>
                    <div>
                      <p className="font-semibold text-foreground text-lg">
                        {testimonials[currentTestimonial].author}
                      </p>
                      <p className="text-muted-foreground">
                        {testimonials[currentTestimonial].title}
                      </p>
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center justify-center mt-8 space-x-4">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={prevTestimonial}
                      className="w-10 h-10 rounded-full p-0"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </Button>
                    
                    <div className="flex space-x-2">
                      {testimonials.map((_, index) => (
                        <button
                          key={index}
                          className={`w-2 h-2 rounded-full transition-colors ${
                            index === currentTestimonial ? 'bg-primary' : 'bg-muted-foreground/30'
                          }`}
                          onClick={() => setCurrentTestimonial(index)}
                        />
                      ))}
                    </div>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={nextTestimonial}
                      className="w-10 h-10 rounded-full p-0"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-16 md:py-20">
          <div className="container mx-auto px-4">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Start Preserving Stories Today
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                Don't let precious memories fade away. Begin capturing the stories 
                that matter most to your family.
              </p>
              <Button size="lg" asChild>
                <Link to="/session">
                  Start a Demo <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
      </div>
    </div>
  );
}