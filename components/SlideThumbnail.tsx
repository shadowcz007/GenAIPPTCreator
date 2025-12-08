import React from 'react';
import { SlideData } from '../types';

interface SlideThumbnailProps {
  slide: SlideData;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export const SlideThumbnail: React.FC<SlideThumbnailProps> = ({ slide, index, isActive, onClick }) => {
  return (
    <div 
      onClick={onClick}
      className={`
        cursor-pointer group relative flex flex-col gap-2 p-2 rounded-lg transition-all border
        ${isActive 
          ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-300'}
      `}
    >
      <div className="flex justify-between items-center text-xs text-slate-500 mb-1">
        <span className="font-bold">#{index + 1}</span>
      </div>
      
      {/* Mini Slide Preview */}
      <div className="relative w-full aspect-video bg-white rounded border border-slate-200 overflow-hidden shadow-sm pointer-events-none">
        {slide.imageUrl ? (
          <img src={slide.imageUrl} alt="thumbnail" className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-slate-100 flex items-center justify-center p-2">
            <div className="text-[6px] text-slate-400 text-center leading-tight overflow-hidden h-full">
              <strong className="block text-slate-800 mb-1">{slide.title}</strong>
              {slide.content.map((c, i) => (
                <div key={i} className="truncate">• {c}</div>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className={`text-sm font-medium truncate pr-2 ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
        {slide.title}
      </div>
    </div>
  );
};