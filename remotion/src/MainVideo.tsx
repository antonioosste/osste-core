import { AbsoluteFill, Sequence, useCurrentFrame, interpolate, Img, staticFile } from "remotion";
import { loadFont } from "@remotion/google-fonts/Lora";
import { loadFont as loadDM } from "@remotion/google-fonts/DMSans";

const { fontFamily: lora } = loadFont("normal", { weights: ["400", "600"], subsets: ["latin"] });
const { fontFamily: dmSans } = loadDM("normal", { weights: ["400", "500"], subsets: ["latin"] });

const SCREENS = [
  { file: "screen-1-onboarding.jpg", label: "Welcome", desc: "Begin your story" },
  { file: "screen-2-recording.jpg", label: "Record", desc: "Share your memories" },
  { file: "screen-3-followup.jpg", label: "Explore", desc: "AI guides the conversation" },
  { file: "screen-4-chapter.jpg", label: "Generate", desc: "Stories become chapters" },
  { file: "screen-5-story.jpg", label: "Read", desc: "Your life, beautifully written" },
  { file: "screen-6-book.jpg", label: "Publish", desc: "A book to treasure forever" },
];

const SCENE_DUR = 120; // 4s per screen
const TRANS_DUR = 30;  // 1s transition
const INTRO_DUR = 90;  // 3s intro
const OUTRO_DUR = 90;  // 3s outro

function Background({ frame }: { frame: number }) {
  const hue = interpolate(frame, [0, 900], [30, 25], { extrapolateRight: "clamp" });
  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(135deg, hsl(${hue}, 60%, 97%) 0%, hsl(${hue - 10}, 47%, 90%) 100%)`,
      }}
    />
  );
}

function DeviceFrame({ src, frame, enter }: { src: string; frame: number; enter: number }) {
  const localFrame = frame - enter;
  const scale = interpolate(localFrame, [0, 25], [0.85, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const opacity = interpolate(localFrame, [0, 20], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const y = interpolate(localFrame, [0, 25], [40, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  // Subtle zoom during display
  const drift = interpolate(localFrame, [25, SCENE_DUR], [1, 1.03], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px) scale(${scale * drift})`,
        display: "flex",
        flexDirection: "column",
        borderRadius: 16,
        overflow: "hidden",
        boxShadow: "0 30px 80px rgba(44,34,24,0.25), 0 10px 30px rgba(44,34,24,0.15)",
        width: 720,
        background: "#fdfbf7",
      }}
    >
      {/* Browser chrome */}
      <div style={{ height: 36, background: "#f0ebe4", display: "flex", alignItems: "center", padding: "0 14px", gap: 8 }}>
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#ff5f57" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#febc2e" }} />
        <div style={{ width: 12, height: 12, borderRadius: "50%", background: "#28c840" }} />
        <div style={{ flex: 1, display: "flex", justifyContent: "center" }}>
          <div style={{ background: "#e8e0d6", borderRadius: 6, padding: "3px 40px", fontSize: 11, fontFamily: dmSans, color: "#8b7d6b" }}>
            osste.app
          </div>
        </div>
      </div>
      <Img src={staticFile(`images/${src}`)} style={{ width: "100%", display: "block" }} />
    </div>
  );
}

function ScreenScene({ screen, index, frame }: { screen: typeof SCREENS[0]; index: number; frame: number }) {
  const labelOpacity = interpolate(frame, [15, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const labelY = interpolate(frame, [15, 35], [20, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const exitOpacity = interpolate(frame, [SCENE_DUR - TRANS_DUR, SCENE_DUR], [1, 0], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill style={{ opacity: exitOpacity, display: "flex", alignItems: "center", justifyContent: "center" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 80 }}>
        <DeviceFrame src={screen.file} frame={frame} enter={0} />
        <div style={{ opacity: labelOpacity, transform: `translateY(${labelY}px)`, maxWidth: 400 }}>
          <div style={{ fontFamily: dmSans, fontSize: 14, letterSpacing: 3, textTransform: "uppercase", color: "#A8845C", marginBottom: 12 }}>
            Step {index + 1}
          </div>
          <div style={{ fontFamily: lora, fontSize: 48, color: "#2C2218", lineHeight: 1.2, marginBottom: 16 }}>
            {screen.label}
          </div>
          <div style={{ fontFamily: lora, fontSize: 22, color: "#5C4A3A", lineHeight: 1.6 }}>
            {screen.desc}
          </div>
        </div>
      </div>
    </AbsoluteFill>
  );
}

export const MainVideo = () => {
  const frame = useCurrentFrame();

  // Intro
  const introOpacity = interpolate(frame, [0, 30, INTRO_DUR - 15, INTRO_DUR], [0, 1, 1, 0], { extrapolateRight: "clamp" });
  const introScale = interpolate(frame, [0, 30], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  // Outro
  const outroStart = INTRO_DUR + SCREENS.length * (SCENE_DUR - TRANS_DUR) + TRANS_DUR;
  const outroOpacity = interpolate(frame, [outroStart, outroStart + 30], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });
  const outroScale = interpolate(frame, [outroStart, outroStart + 30], [0.9, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" });

  return (
    <AbsoluteFill>
      <Background frame={frame} />

      {/* Intro */}
      <Sequence from={0} durationInFrames={INTRO_DUR}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: introOpacity, transform: `scale(${introScale})` }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: lora, fontSize: 80, color: "#2C2218", letterSpacing: -1 }}>
              OSSTE
            </div>
            <div style={{ fontFamily: lora, fontSize: 28, color: "#A8845C", marginTop: 16 }}>
              Your stories deserve to be remembered
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>

      {/* Screens */}
      {SCREENS.map((screen, i) => {
        const start = INTRO_DUR + i * (SCENE_DUR - TRANS_DUR);
        return (
          <Sequence key={i} from={start} durationInFrames={SCENE_DUR}>
            <ScreenScene screen={screen} index={i} frame={frame - start} />
          </Sequence>
        );
      })}

      {/* Outro */}
      <Sequence from={outroStart} durationInFrames={OUTRO_DUR}>
        <AbsoluteFill style={{ display: "flex", alignItems: "center", justifyContent: "center", opacity: outroOpacity, transform: `scale(${outroScale})` }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: lora, fontSize: 64, color: "#2C2218" }}>
              Start preserving your legacy
            </div>
            <div style={{ fontFamily: dmSans, fontSize: 24, color: "#A8845C", marginTop: 24, letterSpacing: 2, textTransform: "uppercase" }}>
              osste.app
            </div>
          </div>
        </AbsoluteFill>
      </Sequence>
    </AbsoluteFill>
  );
};
