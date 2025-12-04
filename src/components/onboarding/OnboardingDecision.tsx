import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { BookOpen, Gift, ArrowRight, Heart, Sparkles } from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface OptionCardProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  highlight: string;
  isSelected: boolean;
  onClick: () => void;
}

function OptionCard({ icon, title, description, highlight, isSelected, onClick }: OptionCardProps) {
  return (
    <motion.button
      whileHover={{ scale: 1.02, y: -4 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={cn(
        "relative flex flex-col items-center p-8 md:p-10 rounded-2xl border-2 transition-all duration-300 text-left w-full group",
        "bg-card/80 backdrop-blur-sm",
        isSelected 
          ? "border-primary shadow-xl shadow-primary/20 ring-2 ring-primary/30" 
          : "border-border/50 hover:border-primary/50 hover:shadow-lg"
      )}
    >
      {/* Gradient overlay on hover */}
      <div className={cn(
        "absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300",
        "bg-gradient-to-br from-primary/5 to-amber-500/5",
        isSelected ? "opacity-100" : "group-hover:opacity-100"
      )} />
      
      {/* Icon */}
      <div className={cn(
        "relative w-16 h-16 md:w-20 md:h-20 rounded-2xl flex items-center justify-center mb-6 transition-all duration-300",
        isSelected 
          ? "bg-primary text-primary-foreground" 
          : "bg-muted text-muted-foreground group-hover:bg-primary/10 group-hover:text-primary"
      )}>
        {icon}
      </div>
      
      {/* Content */}
      <div className="relative text-center">
        <h3 className="text-xl md:text-2xl font-semibold text-foreground mb-2">
          {title}
        </h3>
        <p className="text-muted-foreground text-sm md:text-base mb-4">
          {description}
        </p>
        <span className={cn(
          "inline-flex items-center gap-1.5 text-sm font-medium transition-colors",
          isSelected ? "text-primary" : "text-muted-foreground group-hover:text-primary"
        )}>
          {highlight}
          <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1" />
        </span>
      </div>
      
      {/* Selected indicator */}
      {isSelected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute -top-2 -right-2 w-8 h-8 bg-primary rounded-full flex items-center justify-center"
        >
          <Sparkles className="w-4 h-4 text-primary-foreground" />
        </motion.div>
      )}
    </motion.button>
  );
}

export function OnboardingDecision() {
  const navigate = useNavigate();
  const [selected, setSelected] = useState<"self" | "gift" | null>(null);

  const handleContinue = () => {
    if (selected === "self") {
      navigate("/checkout?plan=basic&flow=self");
    } else if (selected === "gift") {
      navigate("/gift");
    }
  };

  return (
    <section className="py-20 md:py-28 px-4 bg-gradient-to-b from-background via-muted/30 to-background">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12 md:mb-16"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4">
            <Heart className="w-4 h-4" />
            Begin Your Journey
          </span>
          <h2 className="text-3xl md:text-5xl font-bold text-foreground mb-4">
            How would you like to start?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Whether you're preserving your own memories or giving the gift of storytelling to someone special, we're here to help.
          </p>
        </motion.div>

        {/* Options */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.1 }}
          className="grid md:grid-cols-2 gap-6 md:gap-8 mb-10"
        >
          <OptionCard
            icon={<BookOpen className="w-8 h-8 md:w-10 md:h-10" />}
            title="Write My Story"
            description="Begin capturing your own life story, memories, and experiences in a beautifully crafted book."
            highlight="Start your journey"
            isSelected={selected === "self"}
            onClick={() => setSelected("self")}
          />
          
          <OptionCard
            icon={<Gift className="w-8 h-8 md:w-10 md:h-10" />}
            title="Give OSSTE as a Gift"
            description="Give someone special the gift of preserving their story. Perfect for parents, grandparents, or mentors."
            highlight="Send a meaningful gift"
            isSelected={selected === "gift"}
            onClick={() => setSelected("gift")}
          />
        </motion.div>

        {/* Continue Button */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: selected ? 1 : 0.5 }}
          className="text-center"
        >
          <button
            onClick={handleContinue}
            disabled={!selected}
            className={cn(
              "inline-flex items-center gap-2 px-8 py-4 rounded-xl font-semibold text-lg transition-all duration-300",
              selected
                ? "bg-primary text-primary-foreground hover:bg-primary/90 shadow-lg shadow-primary/25 hover:shadow-xl hover:shadow-primary/30"
                : "bg-muted text-muted-foreground cursor-not-allowed"
            )}
          >
            Continue
            <ArrowRight className="w-5 h-5" />
          </button>
        </motion.div>
      </div>
    </section>
  );
}
