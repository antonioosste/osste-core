import React from "react";
import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  staticFile,
  useCurrentFrame,
  useVideoConfig,
} from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/Lora";
import { loadFont as loadSans } from "@remotion/google-fonts/DMSans";

const { fontFamily: serifFont } = loadFont("normal", {
  weights: ["400", "600"],
  subsets: ["latin"],
});

const { fontFamily: sansFont } = loadSans("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

const BG = "#F7EFE8";
const BG_GLOW = "#EEDFD1";
const INK = "#2C2218";
const GOLD = "#A8845C";
const SOFT = "#E7D7C9";
const PANEL = "rgba(255,250,245,0.72)";

const SCENES = [
  {
    file: "images/screen-1-onboarding.jpg",
    eyebrow: "Home",
    title: "Start your story",
    subtitle: "A calm, guided beginning from the mobile home screen.",
    tap: { x: 540, y: 1460, start: 34 },
    imageScale: 1.04,
  },
  {
    file: "images/screen-2-recording.jpg",
    eyebrow: "New session",
    title: "Choose a path",
    subtitle: "Questions and categories appear as gentle prompts, not friction.",
    tap: { x: 300, y: 1180, start: 26 },
    imageScale: 1.02,
  },
  {
    file: "images/screen-3-followup.jpg",
    eyebrow: "Interview",
    title: "AI-guided interview",
    subtitle: "The conversation keeps flowing with smart follow-up guidance.",
    tap: { x: 550, y: 1550, start: 40 },
    imageScale: 1.01,
  },
  {
    file: "images/screen-4-chapter.jpg",
    eyebrow: "Generated",
    title: "Your story takes shape",
    subtitle: "Moments quickly become readable, polished chapters.",
    tap: { x: 540, y: 980, start: 36 },
    imageScale: 1.03,
  },
  {
    file: "images/screen-5-story.jpg",
    eyebrow: "Story view",
    title: "Turn memories into a book",
    subtitle: "From voice to narrative, the experience stays intimate and clear.",
    tap: { x: 560, y: 1380, start: 28 },
    imageScale: 1.02,
  },
  {
    file: "images/screen-6-book.jpg",
    eyebrow: "Final output",
    title: "A story you can hold onto",
    subtitle: "The finished book lands as an emotional, shareable keepsake.",
    tap: { x: 540, y: 1640, start: 52 },
    imageScale: 1.04,
  },
] as const;

const SCENE_DURATION = 100;
const TRANSITION_DURATION = 12;

const springConfig = { damping: 18, stiffness: 120, mass: 0.9 };

const Background: React.FC = () => {
  const frame = useCurrentFrame();

  const orbY = Math.sin(frame * 0.025) * 28;
  const orbX = Math.cos(frame * 0.018) * 18;

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${BG} 0%, #F4E9DF 45%, #F0E2D5 100%)`,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: -160,
          background:
            "radial-gradient(circle at 20% 15%, rgba(232,221,208,0.95) 0%, rgba(232,221,208,0) 35%), radial-gradient(circle at 80% 75%, rgba(168,132,92,0.14) 0%, rgba(168,132,92,0) 28%), radial-gradient(circle at 50% 40%, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0) 42%)",
          transform: `translate(${orbX}px, ${orbY}px) scale(1.02)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(180deg, rgba(255,255,255,0.22) 0%, rgba(255,255,255,0) 30%, rgba(44,34,24,0.02) 100%)",
        }}
      />
    </AbsoluteFill>
  );
};

const PhoneShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <div
      style={{
        position: "relative",
        width: 760,
        height: 1520,
        borderRadius: 84,
        background: "#201711",
        boxShadow: "0 50px 120px rgba(44,34,24,0.22), 0 18px 40px rgba(44,34,24,0.12)",
        padding: 22,
      }}
    >
      <div
        style={{
          position: "absolute",
          top: 24,
          left: "50%",
          transform: "translateX(-50%)",
          width: 220,
          height: 34,
          borderRadius: 20,
          background: "#100b08",
          zIndex: 4,
        }}
      />
      <div
        style={{
          position: "relative",
          width: "100%",
          height: "100%",
          overflow: "hidden",
          borderRadius: 64,
          background: "#f6eee8",
        }}
      >
        {children}
      </div>
    </div>
  );
};

const TapIndicator: React.FC<{ x: number; y: number; start: number }> = ({ x, y, start }) => {
  const frame = useCurrentFrame();
  const local = Math.max(0, frame - start);
  const ring = interpolate(local, [0, 18], [0.6, 1.8], {
    extrapolateRight: "clamp",
  });
  const opacity = interpolate(local, [0, 4, 18], [0, 0.9, 0], {
    extrapolateRight: "clamp",
  });
  const fingerDown = interpolate(local, [0, 8, 18], [0, 1, 0], {
    extrapolateRight: "clamp",
  });

  return (
    <>
      <div
        style={{
          position: "absolute",
          left: x - 42,
          top: y - 42,
          width: 84,
          height: 84,
          borderRadius: 999,
          border: `3px solid rgba(168,132,92,${opacity})`,
          transform: `scale(${ring})`,
          opacity,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 28,
          top: y - 28 + fingerDown * 8,
          width: 56,
          height: 56,
          borderRadius: 999,
          background: "rgba(255,255,255,0.88)",
          border: "2px solid rgba(44,34,24,0.08)",
          boxShadow: "0 12px 24px rgba(44,34,24,0.16)",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 10,
          top: y - 10 + fingerDown * 8,
          width: 20,
          height: 20,
          borderRadius: 999,
          background: GOLD,
          boxShadow: "0 0 0 8px rgba(168,132,92,0.16)",
        }}
      />
    </>
  );
};

const CaptionBlock: React.FC<{
  eyebrow: string;
  title: string;
  subtitle: string;
  accent?: boolean;
}> = ({ eyebrow, title, subtitle, accent = false }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame: frame - 6, fps, config: springConfig });
  const textY = interpolate(reveal, [0, 1], [30, 0]);
  const textOpacity = interpolate(reveal, [0, 1], [0, 1]);

  return (
    <div
      style={{
        position: "absolute",
        left: 72,
        right: 72,
        bottom: accent ? 92 : 86,
        padding: "28px 30px 30px",
        borderRadius: 36,
        background: PANEL,
        border: "1px solid rgba(168,132,92,0.16)",
        boxShadow: "0 18px 40px rgba(44,34,24,0.08)",
        backdropFilter: undefined,
        opacity: textOpacity,
        transform: `translateY(${textY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: sansFont,
          fontSize: 20,
          letterSpacing: 4,
          textTransform: "uppercase",
          color: GOLD,
          marginBottom: 12,
          fontWeight: 700,
        }}
      >
        {eyebrow}
      </div>
      <div
        style={{
          fontFamily: serifFont,
          fontSize: accent ? 60 : 54,
          lineHeight: 1.04,
          color: INK,
          fontWeight: 600,
          marginBottom: 14,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: sansFont,
          fontSize: 25,
          lineHeight: 1.4,
          color: "rgba(44,34,24,0.72)",
          fontWeight: 500,
        }}
      >
        {subtitle}
      </div>
    </div>
  );
};

const AppScene: React.FC<{
  scene: (typeof SCENES)[number];
  index: number;
}> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const intro = spring({ frame, fps, config: springConfig });
  const shellScale = interpolate(intro, [0, 1], [0.93, 1]);
  const shellY = interpolate(intro, [0, 1], [70, 0]);
  const shellOpacity = interpolate(intro, [0, 1], [0, 1]);

  const drift = interpolate(frame, [0, SCENE_DURATION], [0, -index % 2 === 0 ? -36 : 36], {
    extrapolateRight: "clamp",
  });
  const driftY = interpolate(frame, [0, SCENE_DURATION], [0, -54], {
    extrapolateRight: "clamp",
  });
  const imageScale = interpolate(
    frame,
    [0, SCENE_DURATION],
    [scene.imageScale, scene.imageScale + 0.035],
    { extrapolateRight: "clamp" },
  );

  const glowOpacity = interpolate(frame, [0, 20, 70, SCENE_DURATION], [0, 0.5, 0.8, 0.45], {
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill style={{ alignItems: "center", justifyContent: "center" }}>
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: glowOpacity,
          background: `radial-gradient(circle at ${index % 2 === 0 ? "28% 30%" : "72% 24%"}, ${BG_GLOW} 0%, rgba(238,223,209,0) 28%)`,
        }}
      />
      <div
        style={{
          position: "absolute",
          top: 124,
          left: 72,
          right: 72,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          zIndex: 3,
          opacity: interpolate(frame, [0, 20], [0, 1], { extrapolateRight: "clamp" }),
        }}
      >
        <div
          style={{
            fontFamily: sansFont,
            fontSize: 18,
            letterSpacing: 3.5,
            textTransform: "uppercase",
            color: "rgba(44,34,24,0.54)",
            fontWeight: 700,
          }}
        >
          OSSTE mobile
        </div>
        <div
          style={{
            fontFamily: sansFont,
            fontSize: 18,
            color: "rgba(44,34,24,0.45)",
            fontWeight: 500,
          }}
        >
          {String(index + 1).padStart(2, "0")} / {String(SCENES.length).padStart(2, "0")}
        </div>
      </div>

      <div
        style={{
          position: "absolute",
          top: 220,
          transform: `translateY(${shellY}px) scale(${shellScale})`,
          opacity: shellOpacity,
        }}
      >
        <PhoneShell>
          <Img
            src={staticFile(scene.file)}
            style={{
              width: "100%",
              height: "100%",
              objectFit: "cover",
              transform: `translate(${drift}px, ${driftY}px) scale(${imageScale})`,
              transformOrigin: "center top",
            }}
          />
          <div
            style={{
              position: "absolute",
              inset: 0,
              background:
                "linear-gradient(180deg, rgba(255,255,255,0.06) 0%, rgba(255,255,255,0) 18%, rgba(44,34,24,0.02) 100%)",
            }}
          />
          <TapIndicator {...scene.tap} />
        </PhoneShell>
      </div>

      <CaptionBlock
        eyebrow={scene.eyebrow}
        title={scene.title}
        subtitle={scene.subtitle}
        accent={index === SCENES.length - 1}
      />
    </AbsoluteFill>
  );
};

const EndingOverlay: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const reveal = spring({ frame, fps, config: { damping: 16, stiffness: 110 } });
  const opacity = interpolate(reveal, [0, 1], [0, 1]);
  const y = interpolate(reveal, [0, 1], [40, 0]);

  return (
    <AbsoluteFill style={{ justifyContent: "flex-end", padding: "0 72px 120px" }}>
      <div
        style={{
          opacity,
          transform: `translateY(${y}px)`,
          textAlign: "center",
        }}
      >
        <div
          style={{
            fontFamily: serifFont,
            fontSize: 74,
            lineHeight: 1,
            color: INK,
            fontWeight: 600,
            marginBottom: 16,
          }}
        >
          Preserve what
          <br />
          matters most
        </div>
        <div
          style={{
            fontFamily: sansFont,
            fontSize: 26,
            lineHeight: 1.45,
            color: "rgba(44,34,24,0.72)",
            maxWidth: 760,
            margin: "0 auto",
          }}
        >
          From a simple recording to a finished story, the journey feels personal from start to book.
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const MobileWalkthroughVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        {SCENES.map((scene, index) => (
          <React.Fragment key={scene.file}>
            <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
              <AppScene scene={scene} index={index} />
              {index === SCENES.length - 1 ? (
                <Sequence from={34} durationInFrames={58}>
                  <EndingOverlay />
                </Sequence>
              ) : null}
            </TransitionSeries.Sequence>
            {index < SCENES.length - 1 ? (
              <TransitionSeries.Transition
                presentation={index % 2 === 0 ? slide({ direction: "from-right" }) : fade()}
                timing={springTiming({ durationInFrames: TRANSITION_DURATION, config: { damping: 200 } })}
              />
            ) : null}
          </React.Fragment>
        ))}
      </TransitionSeries>
    </AbsoluteFill>
  );
};