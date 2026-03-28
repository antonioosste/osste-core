import React from "react";
import {
  AbsoluteFill,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  Sequence,
  Img,
  staticFile,
} from "remotion";
import { TransitionSeries, springTiming } from "@remotion/transitions";
import { slide } from "@remotion/transitions/slide";
import { fade } from "@remotion/transitions/fade";
import { loadFont as loadLora } from "@remotion/google-fonts/Lora";
import { loadFont as loadDMSans } from "@remotion/google-fonts/DMSans";

const { fontFamily: loraFamily } = loadLora("normal", {
  weights: ["400", "600", "700"],
  subsets: ["latin"],
});
const { fontFamily: dmSansFamily } = loadDMSans("normal", {
  weights: ["400", "500", "600"],
  subsets: ["latin"],
});

const BRAND = {
  bg: "#FAF5EF",
  warm: "#C4A882",
  dark: "#5C4A3A",
  accent: "#8B7355",
  cream: "#F5F0EB",
  white: "#FFFFFF",
};

/* ── Floating orb background ── */
const Background: React.FC = () => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();
  const drift = (i: number) =>
    Math.sin((frame + i * 80) / 120) * 30;

  return (
    <AbsoluteFill style={{ background: BRAND.bg }}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          style={{
            position: "absolute",
            width: 400 + i * 100,
            height: 400 + i * 100,
            borderRadius: "50%",
            background: `radial-gradient(circle, ${BRAND.warm}18, transparent 70%)`,
            top: `${20 + i * 25}%`,
            left: `${10 + i * 30}%`,
            transform: `translate(${drift(i)}px, ${drift(i + 3)}px)`,
            filter: "blur(60px)",
          }}
        />
      ))}
    </AbsoluteFill>
  );
};

/* ── Animated text block ── */
const AnimatedText: React.FC<{
  text: string;
  fontSize: number;
  color?: string;
  font?: string;
  fontWeight?: string;
  delay?: number;
  maxWidth?: number;
  textAlign?: "center" | "left";
  lineHeight?: number;
}> = ({
  text,
  fontSize,
  color = BRAND.dark,
  font = loraFamily,
  fontWeight = "600",
  delay = 0,
  maxWidth,
  textAlign = "center",
  lineHeight = 1.3,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 20, stiffness: 180 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [40, 0]);

  return (
    <div
      style={{
        fontFamily: font,
        fontSize,
        fontWeight,
        color,
        textAlign,
        lineHeight,
        opacity,
        transform: `translateY(${y}px)`,
        maxWidth: maxWidth || "100%",
      }}
    >
      {text}
    </div>
  );
};

/* ── Phone frame component ── */
const PhoneFrame: React.FC<{
  src: string;
  delay?: number;
  scale?: number;
}> = ({ src, delay = 0, scale = 1 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 18, stiffness: 160 } });
  const opacity = interpolate(s, [0, 1], [0, 1]);
  const y = interpolate(s, [0, 1], [60, 0]);
  const sc = interpolate(s, [0, 1], [0.9, scale]);

  // Subtle zoom drift
  const zoomDrift = interpolate(frame, [delay + 20, 200], [1, 1.03], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  return (
    <div
      style={{
        opacity,
        transform: `translateY(${y}px) scale(${sc})`,
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        style={{
          width: 700,
          borderRadius: 32,
          overflow: "hidden",
          boxShadow: `0 30px 80px ${BRAND.dark}30, 0 8px 30px ${BRAND.warm}20`,
          border: `3px solid ${BRAND.warm}40`,
          background: BRAND.white,
        }}
      >
        <div style={{ transform: `scale(${zoomDrift})`, transformOrigin: "center top" }}>
          <Img src={staticFile(src)} style={{ width: "100%", display: "block" }} />
        </div>
      </div>
    </div>
  );
};

/* ── Step indicator ── */
const StepBadge: React.FC<{ step: number; delay?: number }> = ({ step, delay = 0 }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const s = spring({ frame: frame - delay, fps, config: { damping: 12 } });

  return (
    <div
      style={{
        width: 64,
        height: 64,
        borderRadius: "50%",
        background: BRAND.warm,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: dmSansFamily,
        fontSize: 28,
        fontWeight: "700",
        color: BRAND.white,
        opacity: interpolate(s, [0, 1], [0, 1]),
        transform: `scale(${interpolate(s, [0, 1], [0.3, 1])})`,
        boxShadow: `0 4px 20px ${BRAND.warm}40`,
      }}
    >
      {step}
    </div>
  );
};

/* ══════════════════════════════════════════════════
   SCENES
   ══════════════════════════════════════════════════ */

/* ── Scene 1: Hook / Intro ── */
const IntroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 20) * 0.03;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 50px",
        gap: 40,
      }}
    >
      {/* Gift emoji */}
      <div
        style={{
          fontSize: 100,
          transform: `scale(${pulse})`,
        }}
      >
        🎁
      </div>
      <AnimatedText
        text="How to Gift Someone Their Life Story"
        fontSize={52}
        fontWeight="700"
        maxWidth={800}
        delay={8}
      />
      <AnimatedText
        text="A step-by-step guide"
        fontSize={28}
        color={BRAND.accent}
        font={dmSansFamily}
        fontWeight="500"
        delay={18}
      />
      {/* Brand watermark */}
      <div
        style={{
          position: "absolute",
          bottom: 80,
          fontFamily: loraFamily,
          fontSize: 32,
          color: BRAND.warm,
          fontWeight: "700",
          opacity: interpolate(frame, [25, 40], [0, 0.6], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        OSSTE
      </div>
    </AbsoluteFill>
  );
};

/* ── Scene 2: Visit the Gift Page ── */
const Step1Scene: React.FC = () => (
  <AbsoluteFill
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "50px 40px",
      gap: 24,
    }}
  >
    <StepBadge step={1} delay={0} />
    <AnimatedText
      text="Visit the Gift Page"
      fontSize={40}
      fontWeight="700"
      delay={5}
    />
    <AnimatedText
      text='Go to osste.com/gift and choose "Give the Gift of Stories"'
      fontSize={22}
      color={BRAND.accent}
      font={dmSansFamily}
      fontWeight="400"
      delay={12}
      maxWidth={750}
    />
    <div style={{ marginTop: 10, flex: 1, display: "flex", alignItems: "center" }}>
      <PhoneFrame src="images/screen-gift.png" delay={15} scale={0.95} />
    </div>
  </AbsoluteFill>
);

/* ── Scene 3: Fill in Recipient Details ── */
const Step2Scene: React.FC = () => (
  <AbsoluteFill
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "50px 40px",
      gap: 24,
    }}
  >
    <StepBadge step={2} delay={0} />
    <AnimatedText
      text="Add Their Details"
      fontSize={40}
      fontWeight="700"
      delay={5}
    />
    <AnimatedText
      text="Enter their name, email, and write a heartfelt personal message"
      fontSize={22}
      color={BRAND.accent}
      font={dmSansFamily}
      fontWeight="400"
      delay={12}
      maxWidth={750}
    />
    <div style={{ marginTop: 10, flex: 1, display: "flex", alignItems: "center" }}>
      <PhoneFrame src="images/screen-gift.png" delay={15} scale={0.95} />
    </div>
  </AbsoluteFill>
);

/* ── Scene 4: Choose a Plan ── */
const Step3Scene: React.FC = () => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        padding: "50px 40px",
        gap: 28,
      }}
    >
      <StepBadge step={3} delay={0} />
      <AnimatedText
        text="Choose a Plan"
        fontSize={40}
        fontWeight="700"
        delay={5}
      />
      <AnimatedText
        text="Select Digital or Legacy — each unlocks beautiful features"
        fontSize={22}
        color={BRAND.accent}
        font={dmSansFamily}
        fontWeight="400"
        delay={12}
        maxWidth={750}
      />
      {/* Plan cards */}
      <div style={{ display: "flex", gap: 24, marginTop: 20 }}>
        {[
          { name: "Digital", desc: "60 min recording\nPDF export", price: "$49" },
          { name: "Legacy", desc: "120 min recording\nPDF + Printed Book", price: "$99" },
        ].map((plan, i) => {
          const s = spring({
            frame: frame - 20 - i * 8,
            fps,
            config: { damping: 18, stiffness: 160 },
          });
          return (
            <div
              key={plan.name}
              style={{
                width: 340,
                padding: "36px 28px",
                borderRadius: 20,
                background: i === 1 ? BRAND.warm : BRAND.white,
                color: i === 1 ? BRAND.white : BRAND.dark,
                border: `2px solid ${i === 1 ? BRAND.warm : BRAND.warm + "40"}`,
                boxShadow: `0 12px 40px ${BRAND.dark}15`,
                opacity: interpolate(s, [0, 1], [0, 1]),
                transform: `translateY(${interpolate(s, [0, 1], [40, 0])}px)`,
                textAlign: "center",
              }}
            >
              <div style={{ fontFamily: loraFamily, fontSize: 30, fontWeight: "700", marginBottom: 8 }}>
                {plan.name}
              </div>
              <div
                style={{
                  fontFamily: dmSansFamily,
                  fontSize: 17,
                  whiteSpace: "pre-line",
                  lineHeight: 1.5,
                  opacity: 0.85,
                  marginBottom: 16,
                }}
              >
                {plan.desc}
              </div>
              <div style={{ fontFamily: loraFamily, fontSize: 36, fontWeight: "700" }}>
                {plan.price}
              </div>
            </div>
          );
        })}
      </div>
    </AbsoluteFill>
  );
};

/* ── Scene 5: They Receive It ── */
const Step4Scene: React.FC = () => (
  <AbsoluteFill
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "50px 40px",
      gap: 24,
    }}
  >
    <StepBadge step={4} delay={0} />
    <AnimatedText
      text="They Get a Beautiful Invitation"
      fontSize={38}
      fontWeight="700"
      delay={5}
    />
    <AnimatedText
      text="Your loved one receives a personal email inviting them to start recording their stories"
      fontSize={22}
      color={BRAND.accent}
      font={dmSansFamily}
      fontWeight="400"
      delay={12}
      maxWidth={750}
    />
    <div style={{ marginTop: 10, flex: 1, display: "flex", alignItems: "center" }}>
      <PhoneFrame src="images/screen-dashboard.png" delay={15} scale={0.95} />
    </div>
  </AbsoluteFill>
);

/* ── Scene 6: They Record & Get Their Book ── */
const Step5Scene: React.FC = () => (
  <AbsoluteFill
    style={{
      display: "flex",
      flexDirection: "column",
      alignItems: "center",
      padding: "50px 40px",
      gap: 24,
    }}
  >
    <StepBadge step={5} delay={0} />
    <AnimatedText
      text="They Record & Get Their Book"
      fontSize={38}
      fontWeight="700"
      delay={5}
    />
    <AnimatedText
      text="AI transforms their voice recordings into a beautifully written memoir"
      fontSize={22}
      color={BRAND.accent}
      font={dmSansFamily}
      fontWeight="400"
      delay={12}
      maxWidth={750}
    />
    <div style={{ marginTop: 10, flex: 1, display: "flex", alignItems: "center" }}>
      <PhoneFrame src="images/screen-book.png" delay={15} scale={0.95} />
    </div>
  </AbsoluteFill>
);

/* ── Scene 7: CTA / Outro ── */
const OutroScene: React.FC = () => {
  const frame = useCurrentFrame();
  const pulse = 1 + Math.sin(frame / 15) * 0.02;

  return (
    <AbsoluteFill
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 50px",
        gap: 36,
      }}
    >
      <div style={{ fontSize: 80, transform: `scale(${pulse})` }}>❤️</div>
      <AnimatedText
        text="Give the gift that lasts forever"
        fontSize={46}
        fontWeight="700"
        delay={5}
        maxWidth={800}
      />
      <AnimatedText
        text="osste.com/gift"
        fontSize={32}
        color={BRAND.warm}
        font={dmSansFamily}
        fontWeight="600"
        delay={15}
      />
      <div
        style={{
          position: "absolute",
          bottom: 100,
          fontFamily: loraFamily,
          fontSize: 38,
          color: BRAND.dark,
          fontWeight: "700",
          letterSpacing: 4,
          opacity: interpolate(frame, [20, 35], [0, 1], { extrapolateLeft: "clamp", extrapolateRight: "clamp" }),
        }}
      >
        OSSTE
      </div>
    </AbsoluteFill>
  );
};

/* ══════════════════════════════════════════════════
   MAIN COMPOSITION
   ══════════════════════════════════════════════════ */

const SCENE_DUR = 120; // 4 seconds per scene
const TRANS_DUR = 18;

export const GiftGuideVideo: React.FC = () => {
  return (
    <AbsoluteFill>
      <Background />
      <TransitionSeries>
        {/* Intro */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <IntroScene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
        />

        {/* Step 1 */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR}>
          <Step1Scene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
        />

        {/* Step 2 */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR}>
          <Step2Scene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-right" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
        />

        {/* Step 3 */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR + 20}>
          <Step3Scene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
        />

        {/* Step 4 */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR}>
          <Step4Scene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={slide({ direction: "from-bottom" })}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
        />

        {/* Step 5 */}
        <TransitionSeries.Sequence durationInFrames={SCENE_DUR}>
          <Step5Scene />
        </TransitionSeries.Sequence>
        <TransitionSeries.Transition
          presentation={fade()}
          timing={springTiming({ config: { damping: 200 }, durationInFrames: TRANS_DUR })}
        />

        {/* Outro */}
        <TransitionSeries.Sequence durationInFrames={100}>
          <OutroScene />
        </TransitionSeries.Sequence>
      </TransitionSeries>
    </AbsoluteFill>
  );
};
