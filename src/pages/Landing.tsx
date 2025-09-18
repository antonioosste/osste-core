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
    <div className="min-h-screen">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-24 md:py-32 lg:py-40 overflow-hidden bg-cover bg-center bg-no-repeat" style={{ backgroundImage: 'url("/images/backgrounds/library-hero.jpg")' }}>
        {/* Background overlay */}
        <div className="absolute inset-0 bg-background/75" />
        <div className="relative z-10">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-foreground mb-8 leading-tight tracking-tight">
                Preserve Stories<br />
                <span className="text-primary">That Last Forever</span>
              </h1>
              <p className="text-xl md:text-2xl text-muted-foreground/90 mb-12 max-w-2xl mx-auto leading-relaxed font-light">
                Transform precious memories into beautiful books with AI-guided interviews and professional storytelling.
              </p>
              <div className="flex justify-center">
                <Button size="lg" className="px-8 py-6 text-lg font-semibold" asChild>
                  <Link to="/session">
                    Start Your Story <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </section>

        {/* Value Cards */}
        <section className="py-24 md:py-32 bg-muted/20">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Everything You Need to Preserve Stories
              </h2>
              <p className="text-lg text-muted-foreground">
                Our AI-powered platform makes it simple to conduct meaningful 
                interviews and create lasting memories.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12 max-w-6xl mx-auto">
              {valueProps.map((prop, index) => (
                <Card key={index} className="text-center border-0 shadow-sm hover:shadow-md transition-all duration-300 bg-card/60 backdrop-blur-sm">
                  <CardHeader className="pb-6 pt-8">
                    <div className="flex items-center justify-center w-14 h-14 rounded-full bg-primary/10 mx-auto mb-6">
                      <prop.icon className="w-7 h-7 text-primary" />
                    </div>
                    <CardTitle className="text-xl">{prop.title}</CardTitle>
                  </CardHeader>
                  <CardContent className="pb-8">
                    <p className="text-muted-foreground leading-relaxed">{prop.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16 md:mb-20">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                How It Works
              </h2>
              <p className="text-lg text-muted-foreground">
                Three simple steps to create beautiful family stories.
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-12 lg:gap-16 max-w-5xl mx-auto">
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
                  {/* Subtle connection dots for desktop */}
                  {index < 2 && (
                    <div className="hidden md:flex absolute top-8 left-1/2 w-full justify-center z-0" 
                         style={{ transform: 'translateX(50%)' }}>
                      <div className="flex space-x-2">
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="w-1 h-1 rounded-full bg-primary/30" />
                        ))}
                      </div>
                    </div>
                  )}
                  
                  <div className="relative z-10">
                    <div className="flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground font-bold text-lg mx-auto mb-6 shadow-lg">
                      <item.icon className="w-7 h-7" />
                    </div>
                    <h3 className="text-xl font-semibold text-foreground mb-3">
                      {item.step}
                    </h3>
                    <h4 className="text-lg font-medium text-foreground mb-4">
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
        <section className="py-24 md:py-32 bg-gradient-to-b from-muted/10 to-muted/20">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-3xl mx-auto text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Trusted by Families Worldwide
              </h2>
            </div>
            
            <div className="max-w-4xl mx-auto">
              <Card className="relative overflow-hidden border-0 shadow-md bg-card/80 backdrop-blur-sm">
                <CardContent className="p-12 md:p-16">
                  <div className="text-center">
                    <blockquote className="text-xl md:text-2xl text-foreground mb-8 italic leading-relaxed font-light">
                      "{testimonials[currentTestimonial].quote}"
                    </blockquote>
                    <div className="space-y-2">
                      <p className="font-semibold text-foreground text-lg">
                        {testimonials[currentTestimonial].author}
                      </p>
                      <p className="text-muted-foreground">
                        {testimonials[currentTestimonial].title}
                      </p>
                    </div>
                  </div>
                  
                  {/* Navigation */}
                  <div className="flex items-center justify-center mt-12 space-x-6">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={prevTestimonial}
                      className="w-12 h-12 rounded-full p-0 hover:bg-primary/10"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </Button>
                    
                    <div className="flex space-x-3">
                      {testimonials.map((_, index) => (
                        <button
                          key={index}
                          className={`w-3 h-3 rounded-full transition-all duration-300 ${
                            index === currentTestimonial ? 'bg-primary scale-110' : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                          }`}
                          onClick={() => setCurrentTestimonial(index)}
                        />
                      ))}
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={nextTestimonial}
                      className="w-12 h-12 rounded-full p-0 hover:bg-primary/10"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24 md:py-32">
          <div className="container mx-auto px-6 md:px-8">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-6">
                Start Preserving Stories Today
              </h2>
              <p className="text-xl text-muted-foreground mb-12 font-light leading-relaxed">
                Don't let precious memories fade away. Begin capturing the stories 
                that matter most to your family.
              </p>
              <Button size="lg" className="px-8 py-6 text-lg font-semibold" asChild>
                <Link to="/session">
                  Start Your Story <ArrowRight className="w-5 h-5 ml-2" />
                </Link>
              </Button>
            </div>
          </div>
        </section>

        <Footer />
    </div>
  );
}