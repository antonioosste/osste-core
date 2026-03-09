import { motion } from "framer-motion";

const memoryImages = [
  {
    src: "https://images.unsplash.com/photo-1474552226712-ac0f0961a954?w=150",
    style: { top: "8%", left: "3%", width: 100, rotate: -5 },
    duration: 25,
  },
  {
    src: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=150",
    style: { top: "12%", right: "5%", width: 90, rotate: 3 },
    duration: 30,
  },
  {
    src: "https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=150",
    style: { bottom: "15%", left: "8%", width: 80, rotate: -2 },
    duration: 22,
  },
  {
    src: "https://images.unsplash.com/photo-1529156069898-49953e39b3ac?w=150",
    style: { top: "50%", right: "3%", width: 110, rotate: 7 },
    duration: 28,
  },
  {
    src: "https://images.unsplash.com/photo-1519682337058-a94d519337bc?w=150",
    style: { bottom: "8%", right: "12%", width: 85, rotate: -4 },
    duration: 35,
  },
];

export function FloatingMemoryImages() {
  return (
    <>
      {memoryImages.map((img, i) => {
        const { rotate, ...pos } = img.style;
        return (
          <motion.img
            key={i}
            src={img.src}
            alt=""
            className="absolute rounded-lg pointer-events-none z-[1] hidden md:block"
            style={{
              ...pos,
              opacity: 0.18,
              filter: "sepia(0.3) saturate(0.8)",
              transform: `rotate(${rotate}deg)`,
            }}
            animate={{ y: [0, -20, 0] }}
            transition={{
              duration: img.duration,
              repeat: Infinity,
              ease: "easeInOut",
            }}
          />
        );
      })}
    </>
  );
}
