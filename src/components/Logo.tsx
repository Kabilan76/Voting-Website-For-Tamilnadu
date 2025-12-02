import React from 'react';

const Logo: React.FC = () => {
  return (
    <div className="flex items-center space-x-2">
      <div className="h-10 w-10 rounded-full overflow-hidden shadow-md">
        <img src="/thumbnail.jpg" alt="IJK Logo" className="object-cover h-full w-full" />
      </div>
      <div className="flex flex-col">
        <span className="font-bold text-ijkred text-xl leading-tight">MARVEL கட்சி</span>
        <span className="text-sm text-gray-600 leading-tight">புதிய கட்சி, புதிய கொள்கை, புதிய பாதை, புதிய தலைமுறைக்காக</span>
      </div>
    </div>
  );
};

export default Logo;
