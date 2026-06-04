'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';

import { cn } from '@/lib/utils/cn';

interface RevealProps {
  children: ReactNode;
  className?: string;
  /** Stagger the reveal by this many milliseconds. */
  delay?: number;
}

/**
 * Scroll-reveal wrapper: fades + lifts its children into view the first time
 * they enter the viewport, then disconnects. Pure CSS transition driven by a
 * class toggle — no animation library. Honors `prefers-reduced-motion` (the CSS
 * neutralizes the transform/opacity) and degrades to "always shown" when
 * IntersectionObserver is unavailable, so content is never hidden.
 */
export function Reveal({ children, className, delay = 0 }: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setShown(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        const entry = entries[0];
        if (entry?.isIntersecting) {
          setShown(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15, rootMargin: '0px 0px -10% 0px' },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      className={cn('reveal', shown && 'reveal-in', className)}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
