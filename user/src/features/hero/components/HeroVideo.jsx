import { useEffect, useRef } from 'react';
import gsap from 'gsap';
import heroVideoSrc from '../../../assets/hero.mp4';

export const HeroVideo = () => {
  const videoRef = useRef(null);

  useEffect(() => {
    if (videoRef.current) {
      gsap.fromTo(
        videoRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 1, ease: 'power2.out' }
      );
    }
  }, []);

  return (
    <div className="absolute inset-0 w-full h-full overflow-hidden pointer-events-none">
      {/* Video directly plays with full clarity - no dark shadows/overlays */}
      <video
        ref={videoRef}
        src={heroVideoSrc}
        autoPlay
        loop
        muted
        playsInline
        className="w-full h-full object-cover object-center"
      />
    </div>
  );
};
