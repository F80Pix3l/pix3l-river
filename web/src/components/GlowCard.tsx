import { useRef } from 'react';
import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';

const GLOW_GRADIENT =
  'conic-gradient(' +
  'from calc(var(--glow-start, 0deg) - 10deg) at var(--glow-x, 50%) var(--glow-y, 50%),' +
  'transparent 0deg,' +
  '#A100FF 30deg,' +
  '#8599FF 70deg,' +
  '#FF1673 110deg,' +
  '#FF1635 145deg,' +
  'transparent 180deg,' +
  'transparent 360deg)';

interface GlowCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  children: ReactNode;
  style?: CSSProperties;
  /** CSS classes applied to the inner content div */
  innerClassName?: string;
  /** Styles applied to the inner content div */
  innerStyle?: CSSProperties;
  /** Background of the inner card surface. Defaults to rgba(0,9,71,0.3) */
  bg?: string;
}

/**
 * GlowCard wraps card content with the Pix3l conic-gradient glow border effect.
 * The outer div has a 1px padding that reveals the gradient on hover.
 * The inner div carries the actual card background and content.
 *
 * Usage:
 *   <GlowCard innerClassName="p-6" bg="rgba(0,9,71,0.3)">...</GlowCard>
 */
export function GlowCard({
  children,
  className = '',
  style,
  innerClassName = '',
  innerStyle,
  bg = 'rgba(0,9,71,0.3)',
  onMouseMove: callerMouseMove,
  onMouseEnter: callerMouseEnter,
  onMouseLeave: callerMouseLeave,
  ...rest
}: GlowCardProps) {
  const outerRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);

  const reducedMotion =
    typeof window !== 'undefined'
      ? window.matchMedia('(prefers-reduced-motion: reduce)').matches
      : false;

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    callerMouseMove?.(e);
    if (reducedMotion || !outerRef.current) return;
    const rect = outerRef.current.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    outerRef.current.style.setProperty('--glow-x', `${x}%`);
    outerRef.current.style.setProperty('--glow-y', `${y}%`);
  };

  const handleMouseEnter = (e: React.MouseEvent<HTMLDivElement>) => {
    callerMouseEnter?.(e);
    if (reducedMotion || !glowRef.current) return;
    glowRef.current.style.opacity = '1';
  };

  const handleMouseLeave = (e: React.MouseEvent<HTMLDivElement>) => {
    callerMouseLeave?.(e);
    if (!glowRef.current) return;
    glowRef.current.style.opacity = '0';
  };

  return (
    <div
      ref={outerRef}
      className={className}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      style={{
        position: 'relative',
        borderRadius: 12,
        padding: 1,
        // Default resting border color -- glow replaces this on hover
        background: 'rgba(255,255,255,0.06)',
        ...style,
      }}
      {...rest}
    >
      {/* Conic gradient glow layer -- sits behind inner content */}
      <div
        ref={glowRef}
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          borderRadius: 'inherit',
          background: GLOW_GRADIENT,
          opacity: 0,
          transition: 'opacity 0.35s ease',
          pointerEvents: 'none',
          zIndex: 0,
        }}
      />

      {/* Card interior -- 1px inside outer, clips content to rounded corners */}
      <div
        className={innerClassName}
        style={{
          position: 'relative',
          zIndex: 1,
          borderRadius: 11,
          background: bg,
          overflow: 'hidden',
          height: '100%',
          ...innerStyle,
        }}
      >
        {children}
      </div>
    </div>
  );
}
