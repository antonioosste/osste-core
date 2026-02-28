import { motion } from "framer-motion";

export function LandingGallery() {
  return (
    <section className="py-24 md:py-32 bg-paper-alt">
      <div className="container mx-auto px-4 mb-12">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-3xl mx-auto text-center"
        >
          <h2 className="text-3xl md:text-5xl font-display text-foreground mb-4">
            Stories That Come to Life
          </h2>
          <p className="text-lg text-muted-foreground font-light">
            See how families are preserving their precious memories.
          </p>
        </motion.div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 px-4 max-w-7xl mx-auto">
        <figure className="col-span-1 row-span-2">
          <img src="https://images.unsplash.com/photo-1718838541476-d04e71caa347?w=800&auto=format&fit=crop" alt="Family story moment" className="w-full h-full object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure>
          <img src="https://images.unsplash.com/photo-1715432362539-6ab2ab480db2?w=800&auto=format&fit=crop" alt="Memory preservation" className="w-full h-48 md:h-56 object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure>
          <img src="https://images.unsplash.com/photo-1718601980986-0ce75101d52d?w=800&auto=format&fit=crop" alt="Storytelling session" className="w-full h-48 md:h-56 object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure className="row-span-2">
          <img src="https://images.unsplash.com/photo-1476180814856-a36609db0493?w=800&auto=format&fit=crop" alt="Family book creation" className="w-full h-full object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure>
          <img src="https://images.unsplash.com/photo-1685904042960-66242a0ac352?w=800&auto=format&fit=crop" alt="Family gathering" className="w-full h-48 md:h-56 object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure>
          <img src="https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=800&auto=format&fit=crop" alt="Legacy preservation" className="w-full h-48 md:h-56 object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure>
          <img src="https://images.unsplash.com/photo-1719547907790-f661a88302c2?w=800&auto=format&fit=crop" alt="Generations together" className="w-full h-48 md:h-56 object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure>
          <img src="https://images.unsplash.com/photo-1599054799131-4b09c73a63cf?w=800&auto=format&fit=crop" alt="Shared stories" className="w-full h-48 md:h-56 object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure>
          <img src="https://images.unsplash.com/photo-1719963532023-01b573d1d584?w=800&auto=format&fit=crop" alt="Recording moments" className="w-full h-48 md:h-56 object-cover rounded-lg" loading="lazy" />
        </figure>
        <figure>
          <img src="/images/gallery/family-photos.jpg" alt="Vintage family photographs" className="w-full h-48 md:h-56 object-cover rounded-lg" loading="lazy" />
        </figure>
      </div>
    </section>
  );
}
