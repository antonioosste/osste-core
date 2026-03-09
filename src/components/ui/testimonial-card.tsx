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
        "flex flex-col rounded-[4px]",
        "bg-cream border border-blush-deep/20",
        "p-6 sm:p-8 text-start",
        "shadow-sm hover:shadow-md",
        "max-w-[340px]",
        "transition-shadow duration-300",
        className
      )}
    >
      {/* Large quotation mark — Cormorant Garamond, gold */}
      <span className="font-display text-[52px] text-gold-light leading-none mb-2 select-none">"</span>
      <p className="text-sm sm:text-base text-ink-soft leading-relaxed mb-6 font-body font-light italic">{text}</p>
      <div className="flex items-center gap-3 mt-auto">
        <Avatar className="h-10 w-10">
          <AvatarImage src={author.avatar} alt={author.name} />
        </Avatar>
        <div className="flex flex-col items-start">
          <h3 className="text-[13px] font-sans font-medium leading-none text-ink">{author.name}</h3>
          <p className="text-[11px] font-sans text-gold mt-1">{author.handle}</p>
        </div>
      </div>
    </Card>
  )
}
