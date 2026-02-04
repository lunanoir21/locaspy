import { motion, type HTMLMotionProps } from 'framer-motion';
import { type ReactNode } from 'react';

// Loading Dots Animation
export const LoadingDots = () => (
  <div className="flex gap-1">
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-white/60 rounded-full"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.5, 1, 0.5]
        }}
        transition={{
          duration: 1,
          repeat: Infinity,
          delay: i * 0.2
        }}
      />
    ))}
  </div>
);

// Progress Bar
interface ProgressBarProps {
  progress: number;
  className?: string;
}

export const ProgressBar = ({ progress, className = '' }: ProgressBarProps) => (
  <div className={`w-full h-2 bg-white/10 rounded-full overflow-hidden ${className}`}>
    <motion.div
      className="h-full bg-gradient-to-r from-white/60 to-white rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
    />
  </div>
);

// Page Transition
interface PageTransitionProps {
  children: ReactNode;
}

export const PageTransition = ({ children }: PageTransitionProps) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    exit={{ opacity: 0 }}
    transition={{ duration: 0.3 }}
  >
    {children}
  </motion.div>
);

// Fade In Animation
interface FadeInProps {
  children: ReactNode;
  delay?: number;
  className?: string;
}

export const FadeIn = ({ children, delay = 0, className = '' }: FadeInProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ duration: 0.5, delay }}
    className={className}
  >
    {children}
  </motion.div>
);

// Glow Card
interface GlowCardProps extends HTMLMotionProps<'div'> {
  children: ReactNode;
  className?: string;
}

export const GlowCard = ({ children, className = '', ...props }: GlowCardProps) => (
  <motion.div
    whileHover={{ scale: 1.02 }}
    className={`bg-white/5 border border-white/10 rounded-xl backdrop-blur-sm
               hover:border-white/20 transition-all ${className}`}
    {...props}
  >
    {children}
  </motion.div>
);

// Slide In
interface SlideInProps {
  children: ReactNode;
  direction?: 'left' | 'right' | 'up' | 'down';
  delay?: number;
  className?: string;
}

export const SlideIn = ({ 
  children, 
  direction = 'up', 
  delay = 0,
  className = '' 
}: SlideInProps) => {
  const directions = {
    left: { x: -50, y: 0 },
    right: { x: 50, y: 0 },
    up: { x: 0, y: 50 },
    down: { x: 0, y: -50 }
  };

  return (
    <motion.div
      initial={{ opacity: 0, ...directions[direction] }}
      animate={{ opacity: 1, x: 0, y: 0 }}
      transition={{ duration: 0.5, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
};

// Pulse Animation
interface PulseProps {
  children: ReactNode;
  className?: string;
}

export const Pulse = ({ children, className = '' }: PulseProps) => (
  <motion.div
    animate={{
      scale: [1, 1.05, 1],
      opacity: [1, 0.8, 1]
    }}
    transition={{
      duration: 2,
      repeat: Infinity,
      ease: 'easeInOut'
    }}
    className={className}
  >
    {children}
  </motion.div>
);
