import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, BookOpen, Feather, PenTool } from "lucide-react";

interface GeneratingOverlayProps {
  isVisible: boolean;
  type: "story" | "chapter";
  title?: string;
}

const loadingMessages = {
  story: [
    "Weaving your memories together...",
    "Crafting your narrative...",
    "Polishing each chapter...",
    "Adding the finishing touches...",
  ],
  chapter: [
    "Transcribing your words...",
    "Understanding your story...",
    "Creating your chapter...",
    "Almost there...",
  ],
};

export function GeneratingOverlay({ isVisible, type, title }: GeneratingOverlayProps) {
  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", damping: 20, stiffness: 300 }}
            className="relative flex flex-col items-center max-w-md mx-4 p-8 rounded-2xl bg-card border border-border shadow-2xl"
          >
            {/* Animated icon */}
            <div className="relative mb-6">
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                className="absolute inset-0 rounded-full border-2 border-dashed border-primary/30"
                style={{ width: 80, height: 80 }}
              />
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="relative flex items-center justify-center w-20 h-20 rounded-full bg-primary/10"
              >
                {type === "story" ? (
                  <BookOpen className="w-8 h-8 text-primary" />
                ) : (
                  <Feather className="w-8 h-8 text-primary" />
                )}
              </motion.div>
              
              {/* Floating sparkles */}
              <motion.div
                animate={{ 
                  y: [-5, 5, -5],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="absolute -top-2 -right-2"
              >
                <Sparkles className="w-5 h-5 text-primary" />
              </motion.div>
              <motion.div
                animate={{ 
                  y: [5, -5, 5],
                  opacity: [0.5, 1, 0.5],
                }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute -bottom-1 -left-2"
              >
                <PenTool className="w-4 h-4 text-primary/70" />
              </motion.div>
            </div>

            {/* Title */}
            <h3 className="text-xl font-serif font-bold text-foreground mb-2 text-center">
              {type === "story" ? "Generating Your Story" : "Creating Your Chapter"}
            </h3>
            
            {title && (
              <p className="text-sm text-muted-foreground mb-4 text-center">
                "{title}"
              </p>
            )}

            {/* Animated loading messages */}
            <div className="h-6 overflow-hidden">
              <motion.div
                animate={{ y: [0, -24, -48, -72, 0] }}
                transition={{ 
                  duration: 8, 
                  repeat: Infinity, 
                  ease: "easeInOut",
                  times: [0, 0.25, 0.5, 0.75, 1]
                }}
                className="flex flex-col items-center"
              >
                {loadingMessages[type].map((message, index) => (
                  <span 
                    key={index} 
                    className="h-6 flex items-center text-sm text-muted-foreground"
                  >
                    {message}
                  </span>
                ))}
              </motion.div>
            </div>

            {/* Progress dots */}
            <div className="flex gap-1.5 mt-6">
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  animate={{ 
                    scale: [1, 1.3, 1],
                    opacity: [0.4, 1, 0.4],
                  }}
                  transition={{ 
                    duration: 1, 
                    repeat: Infinity, 
                    delay: i * 0.2,
                    ease: "easeInOut"
                  }}
                  className="w-2 h-2 rounded-full bg-primary"
                />
              ))}
            </div>

            {/* Subtle hint */}
            <p className="text-xs text-muted-foreground/60 mt-6 text-center">
              This may take a moment. Please don't close this page.
            </p>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}