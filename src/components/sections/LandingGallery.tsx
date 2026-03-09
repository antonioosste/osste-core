import { motion } from "framer-motion";

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop",
    alt: "Old letters and journal — evokes written memories",
    caption: "A letter never sent, now preserved forever.",
  },
  {
    src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop",
    alt: "Family together, warm light — connection across generations",
    caption: "Three generations, one story.",
  },
  {
    src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop",
    alt: "Grandmother with grandchild — legacy and love",
    caption: "Grandma's voice, written down at last.",
  },
  {
    src: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop",
    alt: "Open book — the memoir itself",
    caption: "The book she always wanted to write.",
  },
  {
    src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop",
    alt: "Warm portrait, natural light — personal and human",
    caption: "Her story deserved to be told.",
  },
];

function GalleryImage({ img }: { img: typeof galleryImages[0] }) {
  return (
    <div className="gallery-img-wrap group relative overflow-hidden">
      <img
        src={img.src}
        alt={img.alt}
        className="w-full h-full object-cover transition-transform duration-400 group-hover:scale-[1.03]"
        loading="lazy"
      />
      {/* Hover caption overlay */}
      <div
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-end pointer-events-none"
        style={{
          background:
            "linear-gradient(to top, rgba(44,34,24,0.75) 0%, transparent 60%)",
        }}
      >
        <p className="font-body italic text-white text-[13px] px-4 pb-4">
          {img.caption}
        </p>
      </div>
    </div>
  );
}

export function LandingGallery() {
  return (
    <section className="py-24 md:py-32 bg-blush">
      <div className="container mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center reveal"
        >
          <span className="eyebrow text-gold mb-4 block">Gallery</span>
          <h2 className="text-3xl md:text-5xl font-display text-ink mb-4">
            Stories That Come to Life
          </h2>
          <p className="text-lg text-ink-soft font-body font-light">
            See how families are preserving their precious memories.
          </p>
        </motion.div>
      </div>

      {/* Grid: Row 1 = 40/30/30, Row 2 = 50/50 */}
      <div className="max-w-6xl mx-auto px-4 reveal reveal-delay-1">
        <div className="grid grid-cols-10 gap-3 mb-3">
          <div className="col-span-4 aspect-[4/3]">
            <GalleryImage img={galleryImages[0]} />
          </div>
          <div className="col-span-3 aspect-[4/3]">
            <GalleryImage img={galleryImages[1]} />
          </div>
          <div className="col-span-3 aspect-[4/3]">
            <GalleryImage img={galleryImages[2]} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="aspect-[3/2]">
            <GalleryImage img={galleryImages[3]} />
          </div>
          <div className="aspect-[3/2]">
            <GalleryImage img={galleryImages[4]} />
          </div>
        </div>
      </div>
    </section>
  );
}
