import { ArrowRight, Mic, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactLenis } from 'lenis/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomeTestimonials } from "@/components/sections/HomeTestimonials";
import { LandingHeroTitle } from "@/components/sections/LandingHeroTitle";
import { OnboardingDecision } from "@/components/onboarding/OnboardingDecision";

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


export default function Landing() {
  return (
    <ReactLenis root>
      <div className="min-h-screen">
        <Header />
      
        {/* Hero Section */}
      <section
        className="relative overflow-hidden bg-cover bg-center"
        style={{
          backgroundImage: "url('/images/backgrounds/library-hero.jpg')",
        }}
      >
        {/* The warm overlay lives INSIDE this section only */}
        <div className="overlay-warm" />

        {/* Content sits above overlays */}
        <div className="relative z-10 py-16 sm:py-24 md:py-28">
          <LandingHeroTitle />
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mt-8">
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
      </section>

        {/* Onboarding Decision Section */}
        <OnboardingDecision />

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

        {/* Testimonials */}
        <HomeTestimonials />

        {/* Gallery Section */}
        <section className="py-16 md:py-20 bg-background">
          <div className="container mx-auto px-4 mb-12">
            <div className="max-w-3xl mx-auto text-center">
              <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
                Stories That Come to Life
              </h2>
              <p className="text-lg text-muted-foreground">
                See how families are preserving their precious memories through our platform.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 max-w-7xl mx-auto">
            <figure className="col-span-1 row-span-2">
              <img src="https://images.unsplash.com/photo-1718838541476-d04e71caa347?w=800&auto=format&fit=crop" alt="Family story moment" className="w-full h-full object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="https://images.unsplash.com/photo-1715432362539-6ab2ab480db2?w=800&auto=format&fit=crop" alt="Memory preservation" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="https://images.unsplash.com/photo-1718601980986-0ce75101d52d?w=800&auto=format&fit=crop" alt="Storytelling session" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
            <figure className="row-span-2">
              <img src="/images/gallery/vintage-watch.jpg" alt="Vintage pocket watch with family photo" className="w-full h-full object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="/images/gallery/photo-album.jpg" alt="Photo album with memories" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="/images/gallery/vintage-album.jpg" alt="Hands holding vintage photo album" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="/images/gallery/boy-with-dog.jpg" alt="Boy walking with dog" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="/images/gallery/sharing-memories.jpg" alt="Couple sharing old photographs" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="/images/gallery/photo-box.jpg" alt="Box of vintage photographs" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="/images/gallery/family-field.jpg" alt="Family walking in a field at sunset" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
            <figure>
              <img src="/images/gallery/family-joy.jpg" alt="Joyful family moment in a field" className="w-full h-48 md:h-56 object-cover rounded-lg" />
            </figure>
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
    </ReactLenis>
  );
}