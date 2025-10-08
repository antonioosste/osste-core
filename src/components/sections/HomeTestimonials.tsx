import { TestimonialsSection } from "@/components/ui/testimonials-with-marquee"

const testimonials = [
  {
    author: {
      name: "Sarah Chen",
      handle: "Family Historian",
      avatar: "https://images.unsplash.com/photo-1502685104226-ee32379fefbe?w=150&h=150&fit=crop&crop=faces"
    },
    text: "OSSTE helped me capture my grandfather's war stories before it was too late. The guided prompts made it feel like a natural conversation."
  },
  {
    author: {
      name: "Luis Romero",
      handle: "Grandson & Editor",
      avatar: "https://images.unsplash.com/photo-1552053831-71594a27632d?w=150&h=150&fit=crop&crop=faces"
    },
    text: "We recorded over a weekend and had a beautiful PDF ready to share with the whole family—photos slotted perfectly next to the memories."
  },
  {
    author: {
      name: "Aisha Karim",
      handle: "Archivist",
      avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150&h=150&fit=crop&crop=faces"
    },
    text: "The transcript cleanup and chapter structure saved me hours. OSSTE feels built for preserving heritage, not just making another document."
  },
  {
    author: {
      name: "Mark O'Neill",
      handle: "Family Organizer",
      avatar: "https://images.unsplash.com/photo-1547425260-76bcadfb4f2c?w=150&h=150&fit=crop&crop=faces"
    },
    text: "Inviting my siblings to add photos was simple. Seeing our parents' stories brought to life is priceless."
  },
  {
    author: {
      name: "Priya Patel",
      handle: "Daughter",
      avatar: "https://images.unsplash.com/photo-1541534401786-2077eed87a4a?w=150&h=150&fit=crop&crop=faces"
    },
    text: "The interview felt warm and respectful. My mom loved hearing her own voice woven through the finished book."
  },
]

export function HomeTestimonials() {
  return (
    <TestimonialsSection
      title="Trusted by Families Worldwide"
      description="Real families use OSSTE to capture voices, photos, and memories—turning interviews into a polished keepsake for future generations."
      testimonials={testimonials}
    />
  )
}
