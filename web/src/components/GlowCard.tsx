import type { CSSProperties, HTMLAttributes, ReactNode } from 'react';
import { GlowingEffect } from './ui/glowing-effect';

interface GlowCardProps extends Omit<HTMLAttributes<HTMLDivElement>, 'style'> {
  children: ReactNode;
  style?: CSSProperties;
  /** CSS classes applied to the inner content div */
  innerClassName?: string;
  /** Styles applied to the inner content div */
  innerStyle?: CSSProperties;
  /** Background of the inner card surface. Defaults to #000947 */
  bg?: string;
}

export function GlowCard({
  children,
  className = '',
  style,
  innerClassName = '',
  innerStyle,
  bg = '#000947',
  ...rest
}: GlowCardProps) {
  return (
    <div
      className={`relative ${className}`}
      style={{
        borderRadius: 12,
        border: '1px solid rgba(255,255,255,0.06)',
        ...style,
      }}
      {...rest}
    >
      <GlowingEffect
        spread={40}
        glow
        disabled={false}
        proximity={64}
        inactiveZone={0.01}
        borderWidth={2}
      />
      <div
        className={innerClassName}
        style={{
          position: 'relative',
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
