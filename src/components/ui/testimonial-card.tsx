import { cn } from "@/lib/utils"
import { Avatar, AvatarImage } from "@/components/ui/avatar"

export interface TestimonialAuthor {
  name: string
  handle: string
  avatar: string
}

export interface TestimonialCardProps {
  author: TestimonialAuthor
  text: string
  href?: string
  className?: string
}

export function TestimonialCard({ author, text, href, className }: TestimonialCardProps) {
  const Card: any = href ? "a" : "div"
  return (
    <Card
      {...(href ? { href, target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "flex flex-col rounded-lg",
        "bg-card border border-border/40",
        "p-6 sm:p-8 text-start",
        "shadow-sm hover:shadow-md",
        "max-w-[340px]",
        "transition-shadow duration-300",
        className
      )}
    >
      {/* Large quotation mark */}
      <span className="font-display text-5xl text-primary/20 leading-none mb-2 select-none">"</span>
      <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6 font-light">{text}</p>
      <div className="flex items-center gap-3 mt-auto">
        <Avatar className="h-10 w-10">
          <AvatarImage src={author.avatar} alt={author.name} />
        </Avatar>
        <div className="flex flex-col items-start">
          <h3 className="text-sm font-medium leading-none text-foreground">{author.name}</h3>
          <p className="text-xs text-muted-foreground mt-1">{author.handle}</p>
        </div>
      </div>
    </Card>
  )
}
