import { ArrowRight, Mic, BookOpen, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { ReactLenis } from 'lenis/react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { HomeTestimonials } from "@/components/sections/HomeTestimonials";
import { LandingHeroTitle } from "@/components/sections/LandingHeroTitle";

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
        className="relative bg-cover bg-center bg-no-repeat py-16 sm:py-24 md:py-28"
        style={{
          backgroundImage: "url('/images/backgrounds/library-hero.jpg')",
        }}
      >
        <div className="absolute inset-0 bg-black/30" />
        <div className="relative z-10">
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

        {/* Sticky Gallery Section */}
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

          <div className="grid grid-cols-12 gap-2 px-4">
            {/* Left column */}
            <div className="grid gap-2 col-span-12 md:col-span-4">
              <figure><img src="https://images.unsplash.com/photo-1718838541476-d04e71caa347?w=1200&auto=format&fit=crop" alt="Family story moment" className="w-full h-96 object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1715432362539-6ab2ab480db2?w=1200&auto=format&fit=crop" alt="Memory preservation" className="w-full h-96 object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1718601980986-0ce75101d52d?w=1200&auto=format&fit=crop" alt="Storytelling session" className="w-full h-96 object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1685904042960-66242a0ac352?w=1200&auto=format&fit=crop" alt="Family gathering" className="w-full h-96 object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1719411182379-ffd97c1f7ebf?w=1200&auto=format&fit=crop" alt="Cherished memories" className="w-full h-96 object-cover rounded-md" /></figure>
            </div>

            {/* Sticky middle column */}
            <div className="sticky top-0 h-screen w-full col-span-12 md:col-span-4 grid grid-rows-3 gap-2">
              <figure><img src="https://images.unsplash.com/photo-1718969604981-de826f44ce15?w=1600&auto=format&fit=crop" alt="Recording stories" className="h-full w-full object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1476180814856-a36609db0493?w=1600&auto=format&fit=crop" alt="Family book creation" className="h-full w-full object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=1600&auto=format&fit=crop" alt="Legacy preservation" className="h-full w-full object-cover rounded-md" /></figure>
            </div>

            {/* Right column */}
            <div className="grid gap-2 col-span-12 md:col-span-4">
              <figure><img src="https://images.unsplash.com/photo-1719547907790-f661a88302c2?w=1200&auto=format&fit=crop" alt="Generations together" className="w-full h-96 object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1599054799131-4b09c73a63cf?w=1200&auto=format&fit=crop" alt="Shared stories" className="w-full h-96 object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1719963532023-01b573d1d584?w=1200&auto=format&fit=crop" alt="Recording moments" className="w-full h-96 object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1714328101501-3594de6cb80f?w=1200&auto=format&fit=crop" alt="Family heritage" className="w-full h-96 object-cover rounded-md" /></figure>
              <figure><img src="https://images.unsplash.com/photo-1719554873571-0fd6bf322bb1?w=1200&auto=format&fit=crop" alt="Lasting legacy" className="w-full h-96 object-cover rounded-md" /></figure>
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
    </ReactLenis>
  );
}