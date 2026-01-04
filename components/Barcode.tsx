
import React, { useMemo } from 'react';

interface BarcodeProps {
  value: string;
  width: number;
  height: number;
  hideText?: boolean;
  style?: 'standard' | 'dense' | 'wide' | 'minimal';
}

/**
 * A more realistic 1D Barcode visualization with multiple style support.
 */
export const Barcode: React.FC<BarcodeProps> = ({ value, width, height, hideText, style = 'standard' }) => {
  const bars = useMemo(() => {
    const seed = value || '7290000000000';
    
    // Different patterns based on style
    const patterns = style === 'dense' 
      ? [[1, 1], [2, 1], [1, 2], [1, 1, 1]] 
      : [[1, 2, 1, 1], [2, 1, 1, 1], [1, 1, 2, 1], [1, 1, 1, 2]];
    
    let result: { width: number; isBlack: boolean }[] = [];
    
    // Guard bars
    result.push({ width: style === 'wide' ? 4 : 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });
    
    for (let i = 0; i < seed.length; i++) {
      const charCode = seed.charCodeAt(i) % patterns.length;
      const pattern = patterns[charCode];
      pattern.forEach((w, idx) => {
        let barW = w;
        if (style === 'wide') barW *= 1.5;
        if (style === 'minimal') barW *= 0.8;
        result.push({ width: barW, isBlack: idx % 2 === 0 });
      });
    }
    
    // End guard
    result.push({ width: 2, isBlack: true }, { width: 1, isBlack: false }, { width: 2, isBlack: true });
    
    return result;
  }, [value, style]);

  const totalWidth = bars.reduce((acc, bar) => acc + bar.width, 0);
  let currentX = 0;

  return (
    <div className={`flex flex-col items-center justify-center p-2 select-none pointer-events-none transition-all duration-300 ${style === 'minimal' ? 'opacity-80' : ''}`} style={{ width, height }}>
      <svg 
        viewBox={`0 0 ${totalWidth} 100`} 
        preserveAspectRatio="none" 
        className="w-full h-full"
      >
        {bars.map((bar, i) => {
          const x = currentX;
          currentX += bar.width;
          if (!bar.isBlack) return null;
          return (
            <rect 
              key={i} 
              x={x} 
              y="0" 
              width={bar.width} 
              height="100" 
              fill="currentColor" 
            />
          );
        })}
      </svg>
      {!hideText && style !== 'minimal' && (
        <span className="text-[10px] mt-1 font-mono tracking-widest leading-none truncate w-full text-center">
          {value || '7290000000000'}
        </span>
      )}
    </div>
  );
};
