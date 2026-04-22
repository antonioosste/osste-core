import { Composition } from "remotion";
import { MainVideo } from "./MainVideo";
import { GiftGuideVideo } from "./GiftGuideVideo";

// Landscape walkthrough
export const RemotionRoot = () => (
  <>
    <Composition
      id="main"
      component={MainVideo}
      durationInFrames={700}
      fps={30}
      width={1920}
      height={1080}
    />
    {/* Vertical TikTok/Reels gift guide: 9:16 */}
    <Composition
      id="gift-guide"
      component={GiftGuideVideo}
      durationInFrames={810}
      fps={30}
      width={1080}
      height={1920}
    />
  </>
);
