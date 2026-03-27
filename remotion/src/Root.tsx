import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";

// Intro(90) + 6 scenes(105 each) + 5 scene transitions(20 each) + 2 boundary transitions(20 each) + Outro(90)
// = 90 + 630 - 100 - 40 + 90 = ~670 frames ≈ 22s
export const RemotionRoot = () => (
  <Composition
    id="main"
    component={MainVideo}
    durationInFrames={700}
    fps={30}
    width={1920}
    height={1080}
  />
);
