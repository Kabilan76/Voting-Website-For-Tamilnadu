
import React from 'react';

interface MotionProps {
  initial?: any;
  animate?: any;
  transition?: any;
  className?: string;
  children: React.ReactNode;
}

export const motion = {
  div: ({ initial, animate, transition, className, children }: MotionProps) => {
    const [isVisible, setIsVisible] = React.useState(false);
    
    React.useEffect(() => {
      setIsVisible(true);
    }, []);
    
    // Create styles based on animation states
    const getStyles = () => {
      const initialStyles = initial || {};
      const animateStyles = animate || {};
      
      // Convert the animation properties to CSS
      if (isVisible) {
        return {
          ...initialStyles,
          ...animateStyles,
          transition: transition ? `all ${transition.duration || 0.3}s ${transition.ease || 'ease'}` : 'all 0.3s ease',
        };
      }
      
      return initialStyles;
    };
    
    return (
      <div className={className} style={getStyles()}>
        {children}
      </div>
    );
  }
};
