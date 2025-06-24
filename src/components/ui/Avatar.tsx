'use client';

import React from 'react';

interface AvatarProps {
  svgCode: string;
  size?: number;
  className?: string;
}

const Avatar: React.FC<AvatarProps> = ({ svgCode, size = 40, className = '' }) => {
  return (
    <div 
      className={`inline-block rounded-full overflow-hidden ${className}`}
      style={{ width: size, height: size }}
      dangerouslySetInnerHTML={{ __html: svgCode }}
    />
  );
};

export default Avatar;