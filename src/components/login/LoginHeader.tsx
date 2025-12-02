
import React from 'react';
import Logo from '@/components/Logo';
import { useIsMobile } from '@/hooks/use-mobile';
import { motion } from '@/components/ui/motion';

const LoginHeader: React.FC = () => {
  const isMobile = useIsMobile();
  
  return (
    <motion.div 
      className="text-center"
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <img src="/two.jpg" alt="IJK Logo" className="object-cover h-full w-full" />
      <h2 className={`mt-6 ${isMobile ? 'text-2xl' : 'text-3xl'} font-extrabold text-ijkred-dark`}>
      MARVEL உட்கட்சி தேர்தல்
      </h2>
      
      <p className="mt-2 text-sm text-ijkred-light/90">
      புதிய கட்சி, புதிய கொள்கை, புதிய பாதை, புதிய தலைமுறைக்காக
      </p>
      
      <div className="mt-4 h-1 w-32 bg-gradient-to-r from-ijkred to-ijkred-light mx-auto rounded-full"></div>
    </motion.div>
  );
};

export default LoginHeader;
