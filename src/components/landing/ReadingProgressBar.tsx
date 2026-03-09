import { useEffect, useState } from "react";

export function ReadingProgressBar() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const docHeight = document.documentElement.scrollHeight;
      const winHeight = window.innerHeight;
      const scrollY = window.scrollY;
      const pct = (scrollY / (docHeight - winHeight)) * 100;
      setProgress(Math.min(100, Math.max(0, pct)));
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <div
      className="fixed top-0 left-0 h-[3px] z-[9999]"
      style={{
        width: `${progress}%`,
        background: "linear-gradient(90deg, hsl(var(--rose)), hsl(var(--gold)), hsl(var(--gold-light)))",
        transition: "width 50ms linear",
      }}
    />
  );
}
