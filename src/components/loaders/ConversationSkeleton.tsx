import { Skeleton } from "@/components/ui/skeleton";

export function ConversationSkeleton() {
  return (
    <div className="space-y-6">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="animate-fade-in">
          {/* AI Message */}
          <div className="flex gap-3 mb-4">
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-20 w-full rounded-lg" />
            </div>
          </div>
          
          {/* User Message */}
          <div className="flex gap-3 justify-end mb-4">
            <div className="flex-1 space-y-2 flex flex-col items-end">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-16 w-3/4 rounded-lg" />
            </div>
            <Skeleton className="w-8 h-8 rounded-full flex-shrink-0" />
          </div>

          {/* Suggestions skeleton (show for every other message) */}
          {i % 2 === 0 && (
            <div className="ml-11 space-y-2 mb-4">
              <Skeleton className="h-3 w-32" />
              <div className="grid grid-cols-1 gap-2">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-10 w-full rounded-lg" />
                ))}
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
