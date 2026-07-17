import React, { useState } from 'react';
import { Frown, Annoyed, Meh, Smile, Laugh } from "lucide-react";

export function MoodStressSlider({ title, value, onValueChange, icons, labels }) {
  const defaultIcons = [
    <Frown key="1" className="w-[22px] h-[22px] text-rose-500" />,
    <Annoyed key="2" className="w-[22px] h-[22px] text-orange-500" />,
    <Meh key="3" className="w-[22px] h-[22px] text-yellow-500" />,
    <Smile key="4" className="w-[22px] h-[22px] text-lime-500" />,
    <Laugh key="5" className="w-[22px] h-[22px] text-emerald-500" />
  ];
  const displayIcons = icons || defaultIcons;
  const displayLabels = labels || ["Bad", "Not Bad", "Neutral", "Good", "Very Good"];

  const handleChange = (newValue) => {
    if (onValueChange) onValueChange(newValue);
  };

  return (
    <div className="bg-white rounded-[24px] p-6 lg:p-8 shadow-sm border border-gray-100 flex flex-col h-full">
      <h3 className="text-[18px] font-sans font-semibold text-black mb-8">{title}</h3>

      <div className="mb-12 relative w-full">
        <div className="relative w-full h-3 bg-[#E5EBE7] rounded-full">
          <div className="absolute inset-y-0 left-[10%] right-[10%]">
            {/* Invisible native slider */}
            <input 
              type="range"
              min="1"
              max="5"
              step="1"
              value={value}
              onChange={(e) => handleChange(parseInt(e.target.value))}
              className="absolute inset-0 top-1/2 -translate-y-1/2 w-full h-3 opacity-0 cursor-pointer z-20 m-0"
            />

            {/* Floating Icon Thumb */}
            <div 
              className="absolute top-1/2 -translate-y-1/2 -ml-[18px] w-9 h-9 bg-white border border-gray-100 rounded-full shadow-sm flex items-center justify-center transition-all duration-300 ease-out z-10 pointer-events-none"
              style={{ left: `${((value - 1) / 4) * 100}%` }}
            >
              {displayIcons[value - 1]}
            </div>
            
            {/* Labels below */}
            <div className="absolute top-full mt-4 w-full h-6">
               {displayLabels.map((label, idx) => (
                  <button 
                    key={label} 
                    onClick={() => handleChange(idx + 1)}
                    className={`absolute -translate-x-1/2 whitespace-nowrap text-[12px] font-sans font-medium transition-colors z-30 ${value === idx + 1 ? "text-[#5D8B66]" : "text-[#5D8B66]/70 hover:text-[#5D8B66]"}`}
                    style={{ left: `${(idx / 4) * 100}%` }}
                  >
                    {label}
                  </button>
               ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
