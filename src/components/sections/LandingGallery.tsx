import { motion } from "framer-motion";

const galleryImages = [
  {
    src: "https://images.unsplash.com/photo-1455390582262-044cdead277a?w=800&auto=format&fit=crop",
    alt: "Old letters and journal — evokes written memories",
  },
  {
    src: "https://images.unsplash.com/photo-1511895426328-dc8714191300?w=800&auto=format&fit=crop",
    alt: "Family together, warm light — connection across generations",
  },
  {
    src: "https://images.unsplash.com/photo-1516627145497-ae6968895b74?w=800&auto=format&fit=crop",
    alt: "Grandmother with grandchild — legacy and love",
  },
  {
    src: "https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=800&auto=format&fit=crop",
    alt: "Open book — the memoir itself",
  },
  {
    src: "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=800&auto=format&fit=crop",
    alt: "Warm portrait, natural light — personal and human",
  },
  {
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=800&auto=format&fit=crop",
    alt: "Warm portrait — intimate storytelling feel",
  },
];

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
          <div className="col-span-4 gallery-img-wrap aspect-[4/3]">
            <img
              src={galleryImages[0].src}
              alt={galleryImages[0].alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="col-span-3 gallery-img-wrap aspect-[4/3]">
            <img
              src={galleryImages[1].src}
              alt={galleryImages[1].alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="col-span-3 gallery-img-wrap aspect-[4/3]">
            <img
              src={galleryImages[2].src}
              alt={galleryImages[2].alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="gallery-img-wrap aspect-[3/2]">
            <img
              src={galleryImages[3].src}
              alt={galleryImages[3].alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
          <div className="gallery-img-wrap aspect-[3/2]">
            <img
              src={galleryImages[4].src}
              alt={galleryImages[4].alt}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
}
