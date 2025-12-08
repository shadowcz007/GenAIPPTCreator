
import React from 'react';
import { SlideData } from '../types';

interface SlideThumbnailProps {
  slide: SlideData;
  index: number;
  isActive: boolean;
  onClick: () => void;
}

export const SlideThumbnail: React.FC<SlideThumbnailProps> = ({ slide, index, isActive, onClick }) => {
  const { layout = 'CONTENT_RIGHT', imageUrl, title, content } = slide;
  const hasImage = !!imageUrl;

  // Mini components for thumbnail parts
  
  const ImageSlot = ({ className, dark }: { className?: string, dark?: boolean }) => (
    <div className={`${className} ${hasImage ? '' : (dark ? 'bg-slate-800' : 'bg-indigo-50')} overflow-hidden relative flex items-center justify-center`}>
      {hasImage ? (
        <img src={imageUrl} alt="thumb" className="w-full h-full object-cover" />
      ) : (
        <svg className={`w-3 h-3 ${dark ? 'text-slate-600' : 'text-indigo-200'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      )}
    </div>
  );

  const TextSlot = ({ className, align = 'left', dark = false, isTitleOnly = false }: { className?: string, align?: 'left' | 'center' | 'right', dark?: boolean, isTitleOnly?: boolean }) => (
    <div className={`${className} flex flex-col justify-center p-1.5 ${dark ? 'text-white' : 'text-slate-800'}`}>
      {/* Tiny Title */}
      <div 
        className={`font-bold leading-tight mb-1 text-[5px] truncate w-full ${align === 'center' ? 'text-center' : align === 'right' ? 'text-right' : 'text-left'}`}
      >
        {title || 'Untitled'}
      </div>
      
      {/* Tiny Content Lines (Skeleton) */}
      {!isTitleOnly && (
        <div className={`space-y-0.5 ${align === 'center' ? 'flex flex-col items-center' : align === 'right' ? 'flex flex-col items-end' : ''}`}>
          {content.slice(0, 3).map((_, i) => (
            <div 
              key={i} 
              className={`h-[1.5px] rounded-full bg-current opacity-20 ${i === 0 ? 'w-full' : i === 1 ? 'w-5/6' : 'w-4/6'}`} 
            />
          ))}
        </div>
      )}
    </div>
  );

  const renderLayout = () => {
    switch (layout) {
      case 'TITLE':
        return (
          <div className="w-full h-full relative flex flex-col items-center justify-center">
            {/* Background */}
            <div className="absolute inset-0 z-0">
               {hasImage ? (
                  <img src={imageUrl} className="w-full h-full object-cover" />
               ) : (
                  <div className="w-full h-full bg-gradient-to-br from-indigo-50 to-blue-50"></div>
               )}
            </div>
            {/* Overlay Content */}
            <div className="relative z-10 p-2 w-full text-center bg-white/40 backdrop-blur-[1px] mx-2 rounded-sm">
               <div className="font-bold text-[6px] text-slate-900 mb-0.5 truncate">{title || 'Title'}</div>
               <div className="w-3 h-[1px] bg-indigo-600 mx-auto mb-0.5"></div>
               <div className="flex flex-col items-center gap-[1px]">
                  <div className="h-[1px] bg-slate-800 w-1/2 opacity-30"></div>
                  <div className="h-[1px] bg-slate-800 w-1/3 opacity-30"></div>
               </div>
            </div>
          </div>
        );
      
      case 'CONTENT_LEFT':
        return (
          <div className="w-full h-full flex bg-white">
            <ImageSlot className="w-1/2 h-full" />
            <TextSlot className="w-1/2 h-full" align="right" />
          </div>
        );

      case 'FULL_IMAGE':
        return (
          <div className="w-full h-full relative bg-slate-900">
            <ImageSlot className="absolute inset-0" dark />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent"></div>
            <div className="absolute bottom-0 left-0 right-0 p-1.5 z-10">
               <div className="font-bold text-[5px] text-white truncate mb-0.5">{title || 'Title'}</div>
               <div className="h-[1px] bg-white w-2/3 opacity-50"></div>
            </div>
          </div>
        );

      case 'IMAGE_ONLY':
        return (
          <div className="w-full h-full relative bg-slate-900">
             <ImageSlot className="absolute inset-0" dark />
          </div>
        );

      case 'CONTENT_RIGHT':
      default:
        return (
          <div className="w-full h-full flex bg-white">
            <TextSlot className="w-1/2 h-full" align="left" />
            <ImageSlot className="w-1/2 h-full" />
          </div>
        );
    }
  };

  return (
    <div 
      onClick={onClick}
      className={`
        cursor-pointer group relative flex flex-col gap-1.5 p-2 rounded-lg transition-all border
        ${isActive 
          ? 'bg-indigo-50 border-indigo-500 ring-1 ring-indigo-500' 
          : 'bg-white border-transparent hover:bg-slate-50 hover:border-slate-300'}
      `}
    >
      <div className="flex justify-between items-center text-[10px] text-slate-500 font-mono">
        <span className="font-bold">#{index + 1}</span>
        <span className="text-[9px] uppercase opacity-50">{layout.replace('_', ' ')}</span>
      </div>
      
      {/* Mini Slide Preview */}
      <div className="relative w-full aspect-video bg-white rounded border border-slate-200 overflow-hidden shadow-sm pointer-events-none select-none">
        {renderLayout()}
      </div>

      <div className={`text-xs font-medium truncate pr-1 mt-0.5 ${isActive ? 'text-indigo-900' : 'text-slate-700'}`}>
        {title || 'Untitled'}
      </div>
    </div>
  );
};
