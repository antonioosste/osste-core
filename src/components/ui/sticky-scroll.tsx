import React, { forwardRef } from 'react';

const StickyScroll = forwardRef<HTMLElement>((props, ref) => {
  return (
    <section ref={ref} className="py-16 md:py-20 bg-background">
      <div className="container mx-auto px-4 mb-12">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            Stories That Come to Life
          </h2>
          <p className="text-lg text-muted-foreground">
            See how families are preserving their precious memories through our platform.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-12 gap-2 px-4">
        {/* Left column */}
        <div className="grid gap-2 col-span-12 md:col-span-4">
          <figure><img src="https://images.unsplash.com/photo-1718838541476-d04e71caa347?w=1200&auto=format&fit=crop" alt="Family story moment" className="w-full h-96 object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1715432362539-6ab2ab480db2?w=1200&auto=format&fit=crop" alt="Memory preservation" className="w-full h-96 object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1718601980986-0ce75101d52d?w=1200&auto=format&fit=crop" alt="Storytelling session" className="w-full h-96 object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1685904042960-66242a0ac352?w=1200&auto=format&fit=crop" alt="Family gathering" className="w-full h-96 object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1719411182379-ffd97c1f7ebf?w=1200&auto=format&fit=crop" alt="Cherished memories" className="w-full h-96 object-cover rounded-md" /></figure>
        </div>

        {/* Sticky middle column */}
        <div className="sticky top-0 h-screen w-full col-span-12 md:col-span-4 grid grid-rows-3 gap-2">
          <figure><img src="https://images.unsplash.com/photo-1718969604981-de826f44ce15?w=1600&auto=format&fit=crop" alt="Recording stories" className="h-full w-full object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1476180814856-a36609db0493?w=1600&auto=format&fit=crop" alt="Family book creation" className="h-full w-full object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1595407660626-db35dcd16609?w=1600&auto=format&fit=crop" alt="Legacy preservation" className="h-full w-full object-cover rounded-md" /></figure>
        </div>

        {/* Right column */}
        <div className="grid gap-2 col-span-12 md:col-span-4">
          <figure><img src="https://images.unsplash.com/photo-1719547907790-f661a88302c2?w=1200&auto=format&fit=crop" alt="Generations together" className="w-full h-96 object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1599054799131-4b09c73a63cf?w=1200&auto=format&fit=crop" alt="Shared stories" className="w-full h-96 object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1719963532023-01b573d1d584?w=1200&auto=format&fit=crop" alt="Recording moments" className="w-full h-96 object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1714328101501-3594de6cb80f?w=1200&auto=format&fit=crop" alt="Family heritage" className="w-full h-96 object-cover rounded-md" /></figure>
          <figure><img src="https://images.unsplash.com/photo-1719554873571-0fd6bf322bb1?w=1200&auto=format&fit=crop" alt="Lasting legacy" className="w-full h-96 object-cover rounded-md" /></figure>
        </div>
      </div>
    </section>
  );
});

StickyScroll.displayName = 'StickyScroll';

export default StickyScroll;
