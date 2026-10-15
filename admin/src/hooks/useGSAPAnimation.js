import { useEffect } from 'react';
import gsap from 'gsap';

/**
 * Custom GSAP hooks for dashboard animations
 */

// Stagger entrance animation for elements matching a selector
export const useStaggerEntrance = (containerRef, selector = '.gsap-card', delay = 0.1) => {
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        selector,
        {
          opacity: 0,
          y: 20,
        },
        {
          opacity: 1,
          y: 0,
          duration: 0.6,
          ease: 'power2.out',
          stagger: 0.08,
          delay,
        }
      );
    }, containerRef);

    return () => ctx.revert();
  }, [containerRef, selector, delay]);
};

// Gentle continuous floating animation for 3D orb
export const useFloatingOrb = (orbRef) => {
  useEffect(() => {
    if (!orbRef.current) return;

    const ctx = gsap.context(() => {
      gsap.to(orbRef.current, {
        y: -8,
        scale: 1.03,
        duration: 2.4,
        ease: 'sine.inOut',
        yoyo: true,
        repeat: -1,
      });
    }, orbRef);

    return () => ctx.revert();
  }, [orbRef]);
};

// Bar chart grow animation
export const useBarChartGrow = (chartRef) => {
  useEffect(() => {
    if (!chartRef.current) return;

    const ctx = gsap.context(() => {
      gsap.fromTo(
        '.gsap-bar',
        {
          scaleY: 0,
          transformOrigin: 'bottom',
        },
        {
          scaleY: 1,
          duration: 0.8,
          ease: 'power3.out',
          stagger: 0.06,
          delay: 0.2,
        }
      );
    }, chartRef);

    return () => ctx.revert();
  }, [chartRef]);
};

// Smooth count up animation
export const animateCounter = (element, targetValue, duration = 1.2) => {
  if (!element) return;
  const obj = { val: 0 };
  gsap.to(obj, {
    val: targetValue,
    duration,
    ease: 'power2.out',
    onUpdate: () => {
      element.innerText = Math.round(obj.val).toLocaleString();
    },
  });
};
