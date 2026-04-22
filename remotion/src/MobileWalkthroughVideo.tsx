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
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";
import { loadFont as loadDmSans } from "@remotion/google-fonts/DMSans";

const { fontFamily: loraFamily } = loadLora("normal", {
  weights: ["500", "600", "700"],
  subsets: ["latin"],
});

const { fontFamily: dmSansFamily } = loadDmSans("normal", {
  weights: ["400", "500", "700"],
  subsets: ["latin"],
});

const PALETTE = {
  background: "#f8f2ec",
  surface: "#fffaf6",
  ink: "#2c2218",
  muted: "#6f6155",
  gold: "#a8845c",
  blush: "#ead8ca",
  shadow: "rgba(44, 34, 24, 0.16)",
  shadowStrong: "rgba(44, 34, 24, 0.26)",
};

const SCENES = [
  {
    image: "images/screen-1-onboarding.jpg",
    caption: "Start your story",
    subcaption: "Pick a book and open a new session in seconds",
    finger: { type: "tap" as const, x: 526, y: 774, start: 22 },
  },
  {
    image: "images/screen-2-recording.jpg",
    caption: "AI-guided interview",
    subcaption: "Gentle prompts help memories come naturally",
    finger: { type: "tap" as const, x: 516, y: 644, start: 18 },
  },
  {
    image: "images/screen-3-followup.jpg",
    caption: "Choose a direction",
    subcaption: "Questions and categories keep the conversation flowing",
    finger: { type: "swipe" as const, x: 520, y: 720, endX: 520, endY: 520, start: 18 },
  },
  {
    image: "images/screen-4-chapter.jpg",
    caption: "Watch the story take shape",
    subcaption: "Recorded memories become polished, readable chapters",
    finger: { type: "tap" as const, x: 516, y: 876, start: 28 },
  },
  {
    image: "images/screen-5-story.jpg",
    caption: "Refine and revisit",
    subcaption: "Every chapter stays connected to the session behind it",
    finger: { type: "swipe" as const, x: 530, y: 670, endX: 530, endY: 460, start: 18 },
  },
  {
    image: "images/screen-6-book.jpg",
    caption: "Turn memories into a book",
    subcaption: "Finish with a keepsake story ready for PDF or print",
    finger: { type: "tap" as const, x: 520, y: 810, start: 24 },
  },
] as const;

const FPS = 30;
const SCENE_DURATION = 92;
const FINAL_DURATION = 120;
const TRANSITION_DURATION = 16;

const FloatingGlow: React.FC<{ index: number }> = ({ index }) => {
  const frame = useCurrentFrame();
  const driftX = Math.sin((frame + index * 35) / 55) * (18 + index * 4);
  const driftY = Math.cos((frame + index * 45) / 75) * (22 + index * 5);

  return (
    <div
      style={{
        position: "absolute",
        width: 260 + index * 120,
        height: 260 + index * 120,
        borderRadius: "50%",
        left: 70 + index * 190 + driftX,
        top: 180 + (index % 2) * 540 + driftY,
        background:
          index % 2 === 0
            ? "radial-gradient(circle, rgba(168,132,92,0.14), rgba(168,132,92,0) 70%)"
            : "radial-gradient(circle, rgba(234,216,202,0.24), rgba(234,216,202,0) 72%)",
        filter: "blur(10px)",
      }}
    />
  );
};

const CaptionCard: React.FC<{ title: string; body: string; align?: "left" | "center" }> = ({
  title,
  body,
  align = "center",
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame: frame - 8, fps, config: { damping: 20, stiffness: 170 } });
  const opacity = interpolate(entrance, [0, 1], [0, 1]);
  const translateY = interpolate(entrance, [0, 1], [30, 0]);

  return (
    <div
      style={{
        position: "absolute",
        left: 64,
        right: 64,
        bottom: 88,
        borderRadius: 30,
        background: "rgba(255, 250, 246, 0.92)",
        border: "1px solid rgba(168,132,92,0.18)",
        padding: "24px 28px",
        boxShadow: `0 22px 70px ${PALETTE.shadow}`,
        opacity,
        transform: `translateY(${translateY}px)`,
      }}
    >
      <div
        style={{
          fontFamily: dmSansFamily,
          fontSize: 17,
          letterSpacing: 3,
          textTransform: "uppercase",
          color: PALETTE.gold,
          marginBottom: 10,
          textAlign: align,
        }}
      >
        OSSTE Mobile Flow
      </div>
      <div
        style={{
          fontFamily: loraFamily,
          fontSize: 54,
          lineHeight: 1.08,
          color: PALETTE.ink,
          marginBottom: 10,
          textAlign: align,
        }}
      >
        {title}
      </div>
      <div
        style={{
          fontFamily: dmSansFamily,
          fontSize: 26,
          lineHeight: 1.45,
          color: PALETTE.muted,
          textAlign: align,
        }}
      >
        {body}
      </div>
    </div>
  );
};

const FingerIndicator: React.FC<{
  finger: (typeof SCENES)[number]["finger"];
}> = ({ finger }) => {
  const frame = useCurrentFrame();
  const localFrame = Math.max(0, frame - finger.start);
  const progress = interpolate(localFrame, [0, 18], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const pulse = interpolate(localFrame, [0, 6, 12, 18], [0, 1, 0.82, 0.72], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  const x = finger.type === "swipe" ? interpolate(progress, [0, 1], [finger.x, finger.endX]) : finger.x;
  const y = finger.type === "swipe" ? interpolate(progress, [0, 1], [finger.y, finger.endY]) : finger.y;
  const pathOpacity = finger.type === "swipe" ? interpolate(localFrame, [2, 8, 18], [0, 0.65, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  }) : 0;

  return (
    <>
      {finger.type === "swipe" ? (
        <svg
          width={708}
          height={1530}
          viewBox="0 0 708 1530"
          style={{ position: "absolute", inset: 0, opacity: pathOpacity }}
        >
          <line
            x1={finger.x}
            y1={finger.y}
            x2={finger.endX}
            y2={finger.endY}
            stroke="rgba(255,255,255,0.65)"
            strokeWidth={10}
            strokeLinecap="round"
            strokeDasharray="16 18"
          />
        </svg>
      ) : null}
      <div
        style={{
          position: "absolute",
          left: x - 26,
          top: y - 26,
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(255,255,255,0.95)",
          boxShadow: `0 12px 24px ${PALETTE.shadowStrong}`,
          border: "2px solid rgba(168,132,92,0.18)",
          transform: `scale(${1 - pulse * 0.12})`,
        }}
      />
      <div
        style={{
          position: "absolute",
          left: x - 44,
          top: y - 44,
          width: 88,
          height: 88,
          borderRadius: "50%",
          border: "3px solid rgba(255,255,255,0.7)",
          opacity: 0.8 - pulse * 0.4,
          transform: `scale(${0.66 + pulse * 0.65})`,
        }}
      />
    </>
  );
};

const PhoneScene: React.FC<{ scene: (typeof SCENES)[number]; index: number }> = ({ scene, index }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, config: { damping: 22, stiffness: 160 } });
  const scale = interpolate(entrance, [0, 1], [0.9, 1]);
  const translateY = interpolate(entrance, [0, 1], [100, 0]);
  const rotation = interpolate(entrance, [0, 1], [index % 2 === 0 ? -4 : 4, index % 2 === 0 ? -1.6 : 1.6]);
  const driftScale = interpolate(frame, [16, SCENE_DURATION], [1, 1.038], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });
  const driftY = interpolate(frame, [10, SCENE_DURATION], [0, -22], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(180deg, ${PALETTE.background} 0%, #f3e6da 100%)`,
      }}
    >
      <FloatingGlow index={0} />
      <FloatingGlow index={1} />
      <FloatingGlow index={2} />

      <div
        style={{
          position: "absolute",
          inset: 0,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          paddingTop: 70,
          paddingBottom: 250,
        }}
      >
        <div
          style={{
            width: 760,
            height: 1490,
            borderRadius: 84,
            background: "linear-gradient(180deg, #3b2c20 0%, #1f1712 100%)",
            padding: 22,
            boxShadow: `0 38px 120px ${PALETTE.shadowStrong}`,
            transform: `translateY(${translateY}px) scale(${scale}) rotate(${rotation}deg)`,
          }}
        >
          <div
            style={{
              position: "relative",
              width: "100%",
              height: "100%",
              borderRadius: 66,
              overflow: "hidden",
              background: PALETTE.surface,
            }}
          >
            <div
              style={{
                position: "absolute",
                top: 18,
                left: "50%",
                width: 190,
                height: 34,
                transform: "translateX(-50%)",
                borderRadius: 999,
                background: "rgba(31, 23, 18, 0.94)",
                zIndex: 5,
              }}
            />
            <Img
              src={staticFile(scene.image)}
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                transform: `translateY(${driftY}px) scale(${driftScale})`,
                transformOrigin: "center top",
              }}
            />
            <div
              style={{
                position: "absolute",
                inset: 0,
                background:
                  "linear-gradient(180deg, rgba(32,24,18,0.04) 0%, rgba(32,24,18,0) 22%, rgba(32,24,18,0.02) 100%)",
              }}
            />
            <FingerIndicator finger={scene.finger} />
          </div>
        </div>
      </div>

      <CaptionCard title={scene.caption} body={scene.subcaption} />
    </AbsoluteFill>
  );
};

const FinalScene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const bookSpring = spring({ frame, fps, config: { damping: 18, stiffness: 130 } });
  const bookScale = interpolate(bookSpring, [0, 1], [0.88, 1]);
  const bookY = interpolate(bookSpring, [0, 1], [90, 0]);
  const textSpring = spring({ frame: frame - 12, fps, config: { damping: 20, stiffness: 150 } });
  const textOpacity = interpolate(textSpring, [0, 1], [0, 1]);
  const textY = interpolate(textSpring, [0, 1], [36, 0]);

  return (
    <AbsoluteFill
      style={{
        background: "linear-gradient(180deg, #f6eee6 0%, #ead8ca 100%)",
        overflow: "hidden",
      }}
    >
      <FloatingGlow index={0} />
      <FloatingGlow index={1} />
      <FloatingGlow index={2} />

      <Sequence from={0}>
        <div
          style={{
            position: "absolute",
            top: 104,
            left: 70,
            right: 70,
            textAlign: "center",
            opacity: textOpacity,
            transform: `translateY(${textY}px)`,
          }}
        >
          <div
            style={{
              fontFamily: dmSansFamily,
              fontSize: 18,
              textTransform: "uppercase",
              letterSpacing: 4,
              color: PALETTE.gold,
              marginBottom: 14,
            }}
          >
            OSSTE
          </div>
          <div
            style={{
              fontFamily: loraFamily,
              fontSize: 76,
              lineHeight: 1.02,
              color: PALETTE.ink,
              marginBottom: 18,
            }}
          >
            Turn memories into
            <br />
            something lasting
          </div>
          <div
            style={{
              fontFamily: dmSansFamily,
              fontSize: 28,
              lineHeight: 1.45,
              color: PALETTE.muted,
            }}
          >
            From a guided session to a finished story, book, or PDF — all in one smooth mobile flow.
          </div>
        </div>
      </Sequence>

      <div
        style={{
          position: "absolute",
          left: 110,
          right: 110,
          bottom: 140,
          height: 1080,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          transform: `translateY(${bookY}px) scale(${bookScale})`,
        }}
      >
        <div
          style={{
            width: 620,
            height: 920,
            borderRadius: 34,
            overflow: "hidden",
            boxShadow: `0 42px 120px ${PALETTE.shadowStrong}`,
            background: PALETTE.surface,
          }}
        >
          <Img
            src={staticFile("images/screen-6-book.jpg")}
            style={{ width: "100%", height: "100%", objectFit: "cover" }}
          />
        </div>
      </div>
    </AbsoluteFill>
  );
};

export const MobileWalkthroughVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <TransitionSeries>
        {SCENES.map((scene, index) => (
          <React.Fragment key={scene.image}>
            <TransitionSeries.Sequence durationInFrames={SCENE_DURATION}>
              <PhoneScene scene={scene} index={index} />
            </TransitionSeries.Sequence>
            {index < SCENES.length - 1 ? (
              <TransitionSeries.Transition
                presentation={index % 2 === 0 ? fade() : slide({ direction: "from-right" })}
                timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_DURATION })}
              />
            ) : null}
          </React.Fragment>
        ))}
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANSITION_DURATION })}
        />
        <TransitionSeries.Sequence durationInFrames={FINAL_DURATION}>
          <FinalScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};

export const mobileWalkthroughDuration =
  SCENES.length * SCENE_DURATION + FINAL_DURATION - SCENES.length * TRANSITION_DURATION;

export const mobileWalkthroughFps = FPS;