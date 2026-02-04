import { motion, AnimatePresence } from 'framer-motion';
import type { ReactNode } from 'react';

interface AnimatedContainerProps {
  children: ReactNode;
  className?: string;
  delay?: number;
}

export const FadeIn = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
  <motion.div
    initial={{ opacity: 0, y: 20 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -20 }}
    transition={{ duration: 0.4, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const SlideIn = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
  <motion.div
    initial={{ opacity: 0, x: 50 }}
    animate={{ opacity: 1, x: 0 }}
    exit={{ opacity: 0, x: -50 }}
    transition={{ duration: 0.5, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const ScaleIn = ({ children, className = '', delay = 0 }: AnimatedContainerProps) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.9 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.9 }}
    transition={{ duration: 0.3, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
    className={className}
  >
    {children}
  </motion.div>
);

export const GlowCard = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ 
      boxShadow: '0 0 40px rgba(255, 255, 255, 0.15)',
      borderColor: 'rgba(255, 255, 255, 0.3)'
    }}
    transition={{ duration: 0.3 }}
    className={`bg-zinc-950 border border-white/10 rounded-2xl overflow-hidden ${className}`}
  >
    {children}
  </motion.div>
);

export const AnimatedButton = ({ 
  children, 
  onClick, 
  className = '',
  variant = 'primary'
}: { 
  children: ReactNode; 
  onClick?: () => void; 
  className?: string;
  variant?: 'primary' | 'secondary' | 'ghost';
}) => {
  const baseStyles = 'px-6 py-3 rounded-xl font-medium transition-all duration-200 flex items-center gap-2';
  const variants = {
    primary: 'bg-white text-black hover:bg-gray-100',
    secondary: 'bg-white/10 text-white border border-white/20 hover:bg-white/15',
    ghost: 'text-white/70 hover:text-white hover:bg-white/5'
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className={`${baseStyles} ${variants[variant]} ${className}`}
    >
      {children}
    </motion.button>
  );
};

export const StaggerContainer = ({ 
  children, 
  className = '',
  staggerDelay = 0.1
}: { 
  children: ReactNode; 
  className?: string;
  staggerDelay?: number;
}) => (
  <motion.div
    initial="hidden"
    animate="visible"
    variants={{
      hidden: { opacity: 0 },
      visible: {
        opacity: 1,
        transition: {
          staggerChildren: staggerDelay
        }
      }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const StaggerItem = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div
    variants={{
      hidden: { opacity: 0, y: 20 },
      visible: { opacity: 1, y: 0 }
    }}
    className={className}
  >
    {children}
  </motion.div>
);

export const PulseRing = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <div className={`relative ${className}`}>
    <motion.div
      className="absolute inset-0 rounded-full border-2 border-white/30"
      animate={{
        scale: [1, 1.2, 1],
        opacity: [0.5, 0, 0.5]
      }}
      transition={{
        duration: 2,
        repeat: Infinity,
        ease: "easeInOut"
      }}
    />
    {children}
  </div>
);

export const LoadingDots = ({ className = '' }: { className?: string }) => (
  <div className={`flex gap-1 ${className}`}>
    {[0, 1, 2].map((i) => (
      <motion.div
        key={i}
        className="w-2 h-2 bg-white rounded-full"
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

export const ProgressBar = ({ progress, className = '' }: { progress: number; className?: string }) => (
  <div className={`h-2 bg-white/10 rounded-full overflow-hidden ${className}`}>
    <motion.div
      className="h-full bg-gradient-to-r from-white/60 to-white rounded-full"
      initial={{ width: 0 }}
      animate={{ width: `${progress}%` }}
      transition={{ duration: 0.5, ease: "easeOut" }}
    />
  </div>
);

export const AnimatedCounter = ({ 
  value, 
  suffix = '',
  className = '' 
}: { 
  value: number; 
  suffix?: string;
  className?: string;
}) => (
  <motion.span
    key={value}
    initial={{ opacity: 0, y: 10 }}
    animate={{ opacity: 1, y: 0 }}
    className={className}
  >
    {value}{suffix}
  </motion.span>
);

export const HoverLift = ({ children, className = '' }: { children: ReactNode; className?: string }) => (
  <motion.div
    whileHover={{ y: -4 }}
    transition={{ duration: 0.2 }}
    className={className}
  >
    {children}
  </motion.div>
);

export const PageTransition = ({ children }: { children: ReactNode }) => (
  <AnimatePresence mode="wait">
    <motion.div
      initial={{ opacity: 0, scale: 0.98 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.98 }}
      transition={{ duration: 0.3 }}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);
