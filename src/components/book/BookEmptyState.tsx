import { BookX, ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";

interface BookEmptyStateProps {
  message?: string;
  backLink?: string;
  backLabel?: string;
}

export function BookEmptyState({ 
  message = "This story is not available for preview yet.",
  backLink = "/stories",
  backLabel = "Back to Stories"
}: BookEmptyStateProps) {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center text-center px-4">
      <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
        <BookX className="w-10 h-10 text-muted-foreground" />
      </div>
      <h2 className="text-xl font-semibold text-foreground mb-2">
        Story Not Available
      </h2>
      <p className="text-muted-foreground max-w-md mb-6">
        {message}
      </p>
      <Button variant="outline" asChild>
        <Link to={backLink}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          {backLabel}
        </Link>
      </Button>
    </div>
  );
}
