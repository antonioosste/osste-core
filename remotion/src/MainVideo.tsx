import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate, spring, Img, staticFile, Sequence } from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { fade } from "@remotion/transitions/fade";
import { slide } from "@remotion/transitions/slide";
import { loadFont } from "@remotion/google-fonts/Lora";
import { loadFont as loadDM } from "@remotion/google-fonts/DMSans";

const { fontFamily: lora } = loadFont("normal", { weights: ["400", "600"], subsets: ["latin"] });
const { fontFamily: dmSans } = loadDM("normal", { weights: ["400", "500", "700"], subsets: ["latin"] });

// Brand colors
const CREAM = "#FAF5EF";
const INK = "#2C2218";
const GOLD = "#A8845C";
const WARM = "#E8DDD0";

const SCREENS = [
  { file: "screen-landing.png", label: "Welcome to OSSTE", desc: "Your stories deserve to be remembered" },
  { file: "screen-dashboard.png", label: "Your Dashboard", desc: "Everything in one place" },
  { file: "screen-session.png", label: "Record Your Story", desc: "Just talk — AI guides the conversation" },
  { file: "screen-chapters.png", label: "Chapters Emerge", desc: "Your words become beautifully structured stories" },
  { file: "screen-story.png", label: "Your Story, Written", desc: "Polished prose from your voice" },
  { file: "screen-book.png", label: "A Book to Treasure", desc: "Print and gift to your loved ones" },
];

// Scene timings
const INTRO_DUR = 90;      // 3s
const SCENE_DUR = 105;     // 3.5s per screen
const TRANS_DUR = 20;      // transition overlap
const OUTRO_DUR = 90;      // 3s

function WarmBackground({ frame }: { frame: number }) {
  const hueShift = interpolate(frame, [0, 900], [0, 8], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill style={{
      background: `linear-gradient(145deg, 
        hsl(${30 + hueShift}, 55%, 96%) 0%, 
        hsl(${25 + hueShift}, 40%, 90%) 50%,
        hsl(${20 + hueShift}, 50%, 93%) 100%)`,
    }} />
  );
}

function FloatingOrb({ x, y, size, delay, frame }: { x: number; y: number; size: number; delay: number; frame: number }) {
  const drift = Math.sin((frame + delay) * 0.008) * 15;
  const driftX = Math.cos((frame + delay) * 0.006) * 10;
  const opacity = interpolate(frame, [0, 40], [0, 0.12], { extrapolateRight: "clamp" });
  return (
    <div style={{
      position: "absolute",
      left: x + driftX,
      top: y + drift,
      width: size,
      height: size,
      borderRadius: "50%",
      background: `radial-gradient(circle, hsla(30, 60%, 75%, ${opacity}) 0%, transparent 70%)`,
    }} />
  );
}

function IntroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame, fps, config: { damping: 30, stiffness: 120 } });
  const titleY = interpolate(titleSpring, [0, 1], [60, 0]);
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);

  const subSpring = spring({ frame: frame - 15, fps, config: { damping: 25 } });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);
  const subY = interpolate(subSpring, [0, 1], [30, 0]);

  const lineWidth = interpolate(frame, [20, 50], [0, 120], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Exit
  const exitOp = interpolate(frame, [INTRO_DUR - 20, INTRO_DUR], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: exitOp }}>
      <div style={{ textAlign: "center" }}>
        <div style={{
          fontFamily: lora,
          fontSize: 96,
          fontWeight: 600,
          color: INK,
          letterSpacing: -2,
          opacity: titleOpacity,
          transform: `translateY(${titleY}px)`,
        }}>
          OSSTE
        </div>
        <div style={{
          width: lineWidth,
          height: 2,
          background: GOLD,
          margin: "20px auto",
          borderRadius: 1,
        }} />
        <div style={{
          fontFamily: lora,
          fontSize: 28,
          color: GOLD,
          opacity: subOpacity,
          transform: `translateY(${subY}px)`,
          letterSpacing: 1,
        }}>
          Your stories, beautifully preserved
        </div>
      </div>
    </AbsoluteFill>
  );
}

function ScreenScene({ screen, index }: { screen: typeof SCREENS[0]; index: number }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  // Screenshot entrance with spring
  const imgSpring = spring({ frame, fps, config: { damping: 25, stiffness: 140 } });
  const imgScale = interpolate(imgSpring, [0, 1], [0.88, 1]);
  const imgOpacity = interpolate(imgSpring, [0, 1], [0, 1]);
  const imgY = interpolate(imgSpring, [0, 1], [50, 0]);

  // Slow zoom during display (Ken Burns-lite)
  const zoomDrift = interpolate(frame, [20, SCENE_DUR], [1, 1.04], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Subtle pan
  const panX = interpolate(frame, [20, SCENE_DUR], [0, index % 2 === 0 ? -8 : 8], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const panY = interpolate(frame, [20, SCENE_DUR], [0, -5], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Text entrance (staggered)
  const labelSpring = spring({ frame: frame - 10, fps, config: { damping: 20 } });
  const labelOpacity = interpolate(labelSpring, [0, 1], [0, 1]);
  const labelY = interpolate(labelSpring, [0, 1], [25, 0]);

  const descSpring = spring({ frame: frame - 22, fps, config: { damping: 20 } });
  const descOpacity = interpolate(descSpring, [0, 1], [0, 1]);
  const descY = interpolate(descSpring, [0, 1], [20, 0]);

  // Step badge
  const badgeSpring = spring({ frame: frame - 5, fps, config: { damping: 15, stiffness: 200 } });
  const badgeScale = interpolate(badgeSpring, [0, 1], [0.5, 1]);
  const badgeOpacity = interpolate(badgeSpring, [0, 1], [0, 1]);

  // Alternate layout: even=image left, odd=image right
  const isLeft = index % 2 === 0;

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{
        display: "flex",
        alignItems: "center",
        gap: 70,
        flexDirection: isLeft ? "row" : "row-reverse",
        padding: "0 100px",
      }}>
        {/* Screenshot in browser frame */}
        <div style={{
          opacity: imgOpacity,
          transform: `translateY(${imgY}px) scale(${imgScale})`,
          flexShrink: 0,
        }}>
          <div style={{
            borderRadius: 14,
            overflow: "hidden",
            boxShadow: `0 30px 80px rgba(44,34,24,0.2), 0 8px 24px rgba(44,34,24,0.1)`,
            background: CREAM,
            width: 820,
          }}>
            {/* Browser chrome */}
            <div style={{
              height: 34,
              background: WARM,
              display: "flex",
              alignItems: "center",
              padding: "0 14px",
              gap: 7,
            }}>
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#ff5f57" }} />
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#febc2e" }} />
              <div style={{ width: 11, height: 11, borderRadius: "50%", background: "#28c840" }} />
              <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
                <div style={{
                  background: "rgba(44,34,24,0.06)",
                  borderRadius: 5,
                  padding: "2px 36px",
                  fontSize: 10,
                  fontFamily: dmSans,
                  color: "#8b7d6b",
                }}>
                  osste.app
                </div>
              </div>
            </div>
            {/* Screenshot with zoom */}
            <div style={{ overflow: "hidden" }}>
              <Img
                src={staticFile(`images/${screen.file}`)}
                style={{
                  width: "100%",
                  display: "block",
                  transform: `scale(${zoomDrift}) translate(${panX}px, ${panY}px)`,
                }}
              />
            </div>
          </div>
        </div>

        {/* Text side */}
        <div style={{ maxWidth: 420 }}>
          {/* Step badge */}
          <div style={{
            opacity: badgeOpacity,
            transform: `scale(${badgeScale})`,
            marginBottom: 16,
            display: "inline-block",
          }}>
            <div style={{
              fontFamily: dmSans,
              fontSize: 12,
              fontWeight: 700,
              letterSpacing: 3,
              textTransform: "uppercase",
              color: GOLD,
              background: `${GOLD}15`,
              padding: "6px 16px",
              borderRadius: 20,
              border: `1px solid ${GOLD}30`,
            }}>
              Step {index + 1}
            </div>
          </div>

          {/* Title */}
          <div style={{
            fontFamily: lora,
            fontSize: 44,
            fontWeight: 600,
            color: INK,
            lineHeight: 1.15,
            marginBottom: 16,
            opacity: labelOpacity,
            transform: `translateY(${labelY}px)`,
          }}>
            {screen.label}
          </div>

          {/* Description */}
          <div style={{
            fontFamily: lora,
            fontSize: 22,
            color: "#6B5B4E",
            lineHeight: 1.6,
            opacity: descOpacity,
            transform: `translateY(${descY}px)`,
          }}>
            {screen.desc}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

function OutroScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const titleSpring = spring({ frame: frame - 5, fps, config: { damping: 25 } });
  const titleOpacity = interpolate(titleSpring, [0, 1], [0, 1]);
  const titleScale = interpolate(titleSpring, [0, 1], [0.92, 1]);

  const subSpring = spring({ frame: frame - 20, fps, config: { damping: 20 } });
  const subOpacity = interpolate(subSpring, [0, 1], [0, 1]);

  const lineWidth = interpolate(frame, [15, 45], [0, 80], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ textAlign: "center", opacity: titleOpacity, transform: `scale(${titleScale})` }}>
        <div style={{
          fontFamily: lora,
          fontSize: 56,
          fontWeight: 600,
          color: INK,
          lineHeight: 1.2,
          marginBottom: 24,
        }}>
          Start preserving
          <br />
          your legacy
        </div>
        <div style={{
          width: lineWidth,
          height: 2,
          background: GOLD,
          margin: "0 auto 24px",
          borderRadius: 1,
        }} />
        <div style={{
          fontFamily: dmSans,
          fontSize: 20,
          fontWeight: 500,
          color: GOLD,
          letterSpacing: 3,
          textTransform: "uppercase",
          opacity: subOpacity,
        }}>
          osste.app
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const MainVideo = () => {
  const frame = useCurrentFrame();

  return (
    <AbsoluteFill>
      <WarmBackground frame={frame} />

      {/* Floating orbs for ambience */}
      <FloatingOrb x={150} y={200} size={300} delay={0} frame={frame} />
      <FloatingOrb x={1400} y={100} size={250} delay={100} frame={frame} />
      <FloatingOrb x={800} y={600} size={350} delay={200} frame={frame} />
      <FloatingOrb x={100} y={700} size={200} delay={300} frame={frame} />

      <TransitionSeries>
        {/* Intro */}
        <TransitionSeries.Sequence durationInFrames={INTRO_DUR}>
          <IntroScene />
        </TransitionSeries.Sequence>

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
        />

        {/* Screen scenes with alternating transitions */}
        {SCREENS.map((screen, i) => (
          <>
            <TransitionSeries.Sequence key={`scene-${i}`} durationInFrames={SCENE_DUR}>
              <ScreenScene screen={screen} index={i} />
            </TransitionSeries.Sequence>
            {i < SCREENS.length - 1 && (
              <TransitionSeries.Transition
                key={`trans-${i}`}
                presentation={i % 2 === 0 ? slide({ direction: "from-right" }) : fade()}
                timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
              />
            )}
          </>
        ))}

        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
        />

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={OUTRO_DUR}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
