import { ArrowRight, Mic, BookOpen, Users, Sparkles, Play, Check } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";

const features = [
  {
    icon: Mic,
    title: "Voice Interviews",
    description: "AI-guided conversations that help you capture meaningful stories naturally.",
  },
  {
    icon: BookOpen,
    title: "Story Library",
    description: "Organize and browse your growing collection of captured memories.",
  },
  {
    icon: Sparkles,
    title: "AI Enhancement",
    description: "Polish and refine your stories with intelligent editing assistance.",
  },
  {
    icon: Users,
    title: "Family Sharing",
    description: "Share completed stories with family members and future generations.",
  },
];

const testimonials = [
  {
    name: "Sarah Johnson",
    role: "Grandmother",
    content: "OSSTE helped me capture my father's war stories before it was too late. The AI made it so easy to have natural conversations.",
  },
  {
    name: "Michael Chen",
    role: "Family Historian",
    content: "As someone preserving our family history, OSSTE is invaluable. The quality of stories it helps capture is incredible.",
  },
  {
    name: "Elena Rodriguez",
    role: "Author",
    content: "I use OSSTE for gathering material for my books. The interview process is so natural and reveals unexpected details.",
  },
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-6">
              Capture Stories That{" "}
              <span className="text-primary">Matter</span>
            </h1>
            <p className="text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              Use AI-guided voice interviews to preserve precious memories, 
              family histories, and personal stories for future generations.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" asChild>
                <Link to="/signup">
                  Start Recording <ArrowRight className="w-4 h-4 ml-2" />
                </Link>
              </Button>
              <Button variant="outline" size="lg" asChild>
                <Link to="/stories">
                  <Play className="w-4 h-4 mr-2" />
                  See Examples
                </Link>
              </Button>
            </div>
          </div>
        </div>
        
        {/* Background decoration */}
        <div className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-primary/5 blur-3xl" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Everything You Need to Preserve Stories
            </h2>
            <p className="text-lg text-muted-foreground">
              Our AI-powered platform makes it simple to conduct meaningful 
              interviews and create lasting memories.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, index) => (
              <Card key={index} className="text-center border-2 hover:border-primary/20 transition-colors">
                <CardHeader>
                  <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary/10 mx-auto mb-4">
                    <feature.icon className="w-6 h-6 text-primary" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Simple Process, Powerful Results
            </h2>
            <p className="text-lg text-muted-foreground">
              Start capturing stories in just three easy steps.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              {
                step: "1",
                title: "Start Interview",
                description: "Begin a voice conversation guided by our AI interviewer.",
              },
              {
                step: "2", 
                title: "Natural Conversation",
                description: "Answer questions naturally while our AI captures every detail.",
              },
              {
                step: "3",
                title: "Story Created",
                description: "Receive a polished story ready to share with family.",
              },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="flex items-center justify-center w-12 h-12 rounded-full bg-primary text-primary-foreground font-bold text-lg mx-auto mb-4">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  {item.title}
                </h3>
                <p className="text-muted-foreground">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
              Trusted by Families Worldwide
            </h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-6xl mx-auto">
            {testimonials.map((testimonial, index) => (
              <Card key={index}>
                <CardContent className="p-6">
                  <p className="text-muted-foreground mb-4 italic">
                    "{testimonial.content}"
                  </p>
                  <div>
                    <p className="font-semibold text-foreground">{testimonial.name}</p>
                    <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
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
              <Link to="/signup">
                Get Started Free <ArrowRight className="w-4 h-4 ml-2" />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}