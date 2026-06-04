import type { ReactNode } from 'react';

/**
 * Root template — re-rendered on every navigation (unlike layout, which
 * persists). Gives each route a subtle fade-and-rise entrance, our "signature"
 * page transition. The animation is neutralized under `prefers-reduced-motion`
 * (see globals.css), so it never fights accessibility settings.
 */
export default function Template({ children }: { children: ReactNode }) {
  return <div className="page-enter">{children}</div>;
}
