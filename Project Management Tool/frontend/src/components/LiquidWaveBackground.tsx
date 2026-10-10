import React from 'react';

export const LiquidWaveBackground: React.FC = () => {
  return (
    <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10 select-none">
      {/* Exact soft lavender/purple gradient matching reference image */}
      <div className="absolute inset-0 bg-gradient-to-br from-[#dce5fd] via-[#e5e0fb] to-[#f4e1f7] dark:from-[#0d1222] dark:via-[#141028] dark:to-[#1c102a] transition-colors duration-500" />

      {/* Very subtle smooth ambient light */}
      <div className="absolute top-0 right-0 w-[50vw] h-[50vw] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[140px]" />
      <div className="absolute bottom-0 left-0 w-[50vw] h-[50vw] bg-pink-200/25 dark:bg-pink-900/10 rounded-full blur-[140px]" />
    </div>
  );
};
