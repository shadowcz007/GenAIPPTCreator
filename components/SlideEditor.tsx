
import React, { useState, useEffect, useRef } from 'react';
import { SlideData, SlideLayout } from '../types';

interface SlideEditorProps {
  slide: SlideData;
  onUpdate: (updatedSlide: SlideData) => void;
  onGenerateImage: () => void;
  isGeneratingImage: boolean;
  texts: {
    header: string;
    genImage: string;
    generating: string;
    noImage: string;
    titlePlaceholder: string;
    promptLabel?: string;
    promptPlaceholder?: string;
    tip?: string;
    genButton?: string;
    zoomIn?: string;
    zoomOut?: string;
    zoomReset?: string;
  };
}

export const SlideEditor: React.FC<SlideEditorProps> = ({ 
  slide, 
  onUpdate, 
  onGenerateImage, 
  isGeneratingImage,
  texts
}) => {
  const [zoom, setZoom] = useState(1);
  const [autoFit, setAutoFit] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Fixed Slide Dimensions (16:9 Aspect Ratio)
  const BASE_WIDTH = 1024;
  const BASE_HEIGHT = 576;
  const PADDING = 64; // Padding around the slide when fitting

  // Auto-fit logic using ResizeObserver
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const calculateFit = () => {
      if (!autoFit) return;
      
      const { clientWidth, clientHeight } = container;
      if (clientWidth === 0 || clientHeight === 0) return;

      const availableWidth = Math.max(0, clientWidth - PADDING);
      const availableHeight = Math.max(0, clientHeight - PADDING);

      const scaleX = availableWidth / BASE_WIDTH;
      const scaleY = availableHeight / BASE_HEIGHT;
      
      // Use the smaller scale to fit entirely, clamp to sensible min/max for auto
      const newZoom = Math.min(scaleX, scaleY);
      setZoom(Math.max(newZoom, 0.2)); 
    };

    const observer = new ResizeObserver(() => {
        // Wrap in requestAnimationFrame to avoid "ResizeObserver loop limit exceeded"
        requestAnimationFrame(calculateFit);
    });
    
    observer.observe(container);
    // Initial calc
    calculateFit();

    return () => observer.disconnect();
  }, [autoFit]);
  
  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ ...slide, title: e.target.value });
  };

  const handleContentChange = (index: number, value: string) => {
    const newContent = [...slide.content];
    newContent[index] = value;
    onUpdate({ ...slide, content: newContent });
  };

  const handlePromptChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    onUpdate({ ...slide, imagePrompt: e.target.value });
  };

  const setLayout = (layout: SlideLayout) => {
    onUpdate({ ...slide, layout });
  };

  // --- Zoom Controls ---
  const handleZoomIn = () => {
    setAutoFit(false);
    setZoom(prev => Math.min(prev + 0.1, 2.0));
  };
  
  const handleZoomOut = () => {
    setAutoFit(false);
    setZoom(prev => Math.max(prev - 0.1, 0.2));
  };

  const handleFitScreen = () => {
    setAutoFit(true);
  };

  // --- Layout Components ---

  const LayoutControls = () => (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200">
      <button 
        onClick={() => setLayout('TITLE')} 
        className={`p-1.5 rounded hover:bg-white hover:shadow-sm transition-all ${slide.layout === 'TITLE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        title="Cover / Title"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M7 12h10"/></svg>
      </button>
      <button 
        onClick={() => setLayout('CONTENT_RIGHT')} 
        className={`p-1.5 rounded hover:bg-white hover:shadow-sm transition-all ${slide.layout === 'CONTENT_RIGHT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        title="Content Left, Image Right"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M14 4v16M8 8h4M8 12h4M8 16h4"/></svg>
      </button>
      <button 
        onClick={() => setLayout('CONTENT_LEFT')} 
        className={`p-1.5 rounded hover:bg-white hover:shadow-sm transition-all ${slide.layout === 'CONTENT_LEFT' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        title="Image Left, Content Right"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M10 4v16M14 8h4M14 12h4M14 16h4"/></svg>
      </button>
      <button 
        onClick={() => setLayout('FULL_IMAGE')} 
        className={`p-1.5 rounded hover:bg-white hover:shadow-sm transition-all ${slide.layout === 'FULL_IMAGE' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        title="Full Background Image (with Text)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><path strokeWidth="2" d="M3 14l4-4 5 5 7-7 2 2"/></svg>
      </button>
      <button 
        onClick={() => setLayout('IMAGE_ONLY')} 
        className={`p-1.5 rounded hover:bg-white hover:shadow-sm transition-all ${slide.layout === 'IMAGE_ONLY' ? 'bg-white shadow-sm text-indigo-600' : 'text-slate-400'}`}
        title="Image Only (Text in Image)"
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><rect x="3" y="3" width="18" height="18" rx="2" strokeWidth="2"/><circle cx="8.5" cy="8.5" r="1.5" fill="currentColor"/><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 15l-5-5L5 21"/></svg>
      </button>
    </div>
  );

  const ZoomControls = () => (
    <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg border border-slate-200 ml-2">
      <button 
        onClick={handleZoomOut}
        className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-indigo-600"
        title={texts.zoomOut || "Zoom Out"}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" /></svg>
      </button>
      <button 
        onClick={handleFitScreen}
        className={`px-2 py-0.5 min-w-[3rem] text-xs font-medium rounded hover:bg-white hover:shadow-sm transition-all text-center ${autoFit ? 'bg-indigo-100 text-indigo-700' : 'text-slate-600'}`}
        title={texts.zoomReset || "Fit to Screen"}
      >
        {autoFit ? 'Fit' : `${Math.round(zoom * 100)}%`}
      </button>
      <button 
        onClick={handleZoomIn}
        className="p-1.5 rounded hover:bg-white hover:shadow-sm transition-all text-slate-500 hover:text-indigo-600"
        title={texts.zoomIn || "Zoom In"}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /></svg>
      </button>
    </div>
  );

  const ImagePlaceholder = ({ dark = false }: { dark?: boolean }) => (
    <div className={`absolute inset-0 flex flex-col items-center justify-center p-8 text-center ${dark ? 'bg-slate-800 text-slate-400' : 'bg-slate-50 text-slate-500'}`}>
      <div className={`w-16 h-16 mb-4 rounded-full flex items-center justify-center ${dark ? 'bg-slate-700 border-slate-600' : 'bg-white border-slate-200'}`}>
        <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
        </svg>
      </div>
      <p className="font-medium">{texts.noImage}</p>
      <p className={`text-xs mt-2 max-w-xs opacity-70`}>{slide.imagePrompt}</p>
    </div>
  );

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-slate-50">
      {/* Toolbar / Actions */}
      <div className="h-14 border-b border-slate-200 flex items-center justify-between px-6 bg-white/50 backdrop-blur-sm z-20 shrink-0">
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar">
          <h2 className="text-slate-500 text-sm font-medium hidden lg:block mr-2">{texts.header}</h2>
          <div className="h-4 w-px bg-slate-300 hidden lg:block mr-2"></div>
          <LayoutControls />
          <ZoomControls />
        </div>
        
        <button
          onClick={onGenerateImage}
          disabled={isGeneratingImage}
          className={`
            px-4 py-1.5 rounded-full text-xs font-semibold flex items-center gap-2 transition-all shadow-sm ml-4 shrink-0
            ${isGeneratingImage 
              ? 'bg-slate-200 text-slate-500 cursor-not-allowed' 
              : 'bg-indigo-600 hover:bg-indigo-500 text-white shadow-indigo-500/20'}
          `}
        >
          {isGeneratingImage ? (
            <>
              <svg className="animate-spin h-3 w-3 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              {texts.generating}
            </>
          ) : (
            <>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
              </svg>
              {texts.genImage}
            </>
          )}
        </button>
      </div>

      {/* Slide Canvas Wrapper */}
      {/* 
         Structure:
         1. Scroll Container (ref=containerRef): Handles overflow scrolling and flex centering for smaller items.
         2. Sizing Wrapper: Explicitly sized to (BASE * zoom) to force the scroll container to recognize the size.
         3. Slide Content: Absolute positioned, scaled, top-left origin. Matches sizing wrapper visually.
      */}
      <div 
        ref={containerRef} 
        className="flex-1 bg-slate-100/80 relative overflow-auto flex p-8"
      >
        <div 
          style={{ 
             width: `${BASE_WIDTH * zoom}px`, 
             height: `${BASE_HEIGHT * zoom}px`,
             flexShrink: 0,
             margin: 'auto', // Centers the wrapper if it's smaller than container
             position: 'relative'
          }}
          className="transition-all duration-200 ease-out"
        >
          {/* The Slide Container */}
          <div 
            className="absolute top-0 left-0 bg-white text-slate-900 shadow-2xl rounded-sm overflow-hidden ring-1 ring-slate-900/5 origin-top-left"
            style={{ 
              width: BASE_WIDTH,
              height: BASE_HEIGHT,
              transform: `scale(${zoom})`,
              // No transition on transform here if we want instant responsiveness, 
              // but keeping it matches the wrapper's transition for smoothness.
            }}
          >
          
            {/* --- LAYOUT: TITLE --- */}
            {slide.layout === 'TITLE' && (
              <div className="w-full h-full relative flex flex-col items-center justify-center p-16 text-center z-10">
                  {/* Background Image (Optional for Title) */}
                  <div className="absolute inset-0 z-0">
                    {slide.imageUrl ? (
                      <>
                        <img src={slide.imageUrl} alt="Background" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
                      </>
                    ) : (
                      <div className="w-full h-full bg-gradient-to-br from-indigo-50 via-white to-blue-50">
                        <div className="absolute inset-0 flex items-center justify-center opacity-5">
                            <svg className="w-64 h-64" viewBox="0 0 200 200" fill="currentColor"><path d="M100 0L200 100L100 200L0 100Z" /></svg>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="z-10 w-full max-w-3xl">
                    <input
                      className="text-7xl font-black text-slate-900 bg-transparent border-none text-center focus:ring-0 placeholder-slate-300 w-full outline-none mb-6 leading-tight"
                      value={slide.title}
                      onChange={handleTitleChange}
                      placeholder="Presentation Title"
                    />
                    <div className="w-24 h-2 bg-indigo-600 mx-auto mb-8 rounded-full"></div>
                    
                    <div className="space-y-2">
                      {slide.content.map((point, idx) => (
                        <input
                          key={idx}
                          className="text-2xl text-slate-600 text-center bg-transparent border-none focus:ring-0 w-full outline-none"
                          value={point}
                          onChange={(e) => handleContentChange(idx, e.target.value)}
                          placeholder="Subtitle or Author"
                        />
                      ))}
                    </div>
                  </div>
              </div>
            )}

            {/* --- LAYOUT: CONTENT RIGHT (Standard) --- */}
            {slide.layout === 'CONTENT_RIGHT' && (
              <div className="flex flex-row h-full">
                <div className="w-1/2 p-12 flex flex-col justify-center bg-white z-10">
                  <input
                    className="text-5xl font-bold text-slate-900 bg-transparent border-none focus:ring-0 placeholder-slate-300 mb-8 w-full outline-none"
                    value={slide.title}
                    onChange={handleTitleChange}
                    placeholder={texts.titlePlaceholder}
                  />
                  <ul className="space-y-4">
                    {slide.content.map((point, idx) => (
                      <li key={idx} className="flex items-start">
                        <span className="mr-3 text-indigo-600 text-2xl leading-none">•</span>
                        <input
                          className="flex-1 text-xl text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-200 focus:ring-0 w-full outline-none pb-1"
                          value={point}
                          onChange={(e) => handleContentChange(idx, e.target.value)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
                <div className="w-1/2 h-full bg-indigo-50 relative overflow-hidden">
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt="Visual" className="w-full h-full object-cover animate-fade-in" />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>
              </div>
            )}

            {/* --- LAYOUT: CONTENT LEFT --- */}
            {slide.layout === 'CONTENT_LEFT' && (
              <div className="flex flex-row h-full">
                <div className="w-1/2 h-full bg-indigo-50 relative overflow-hidden border-r border-white/50">
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt="Visual" className="w-full h-full object-cover animate-fade-in" />
                  ) : (
                    <ImagePlaceholder />
                  )}
                </div>
                <div className="w-1/2 p-12 flex flex-col justify-center bg-white z-10">
                  <input
                    className="text-5xl font-bold text-slate-900 bg-transparent border-none focus:ring-0 placeholder-slate-300 mb-8 w-full outline-none text-right"
                    value={slide.title}
                    onChange={handleTitleChange}
                    placeholder={texts.titlePlaceholder}
                  />
                  <ul className="space-y-4">
                    {slide.content.map((point, idx) => (
                      <li key={idx} className="flex items-start flex-row-reverse text-right">
                        <span className="ml-3 text-indigo-600 text-2xl leading-none">•</span>
                        <input
                          className="flex-1 text-xl text-slate-700 bg-transparent border-b border-transparent focus:border-indigo-200 focus:ring-0 w-full outline-none pb-1 text-right"
                          value={point}
                          onChange={(e) => handleContentChange(idx, e.target.value)}
                        />
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            )}

            {/* --- LAYOUT: FULL IMAGE --- */}
            {slide.layout === 'FULL_IMAGE' && (
              <div className="w-full h-full relative flex flex-col justify-end p-12">
                {/* Background Layer */}
                  <div className="absolute inset-0 z-0 bg-slate-900">
                    {slide.imageUrl ? (
                      <>
                        <img src={slide.imageUrl} alt="Background" className="w-full h-full object-cover opacity-80" />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/40 to-transparent"></div>
                      </>
                    ) : (
                      <ImagePlaceholder dark />
                    )}
                  </div>

                  {/* Content Layer */}
                  <div className="relative z-10 w-full max-w-4xl">
                    <input
                      className="text-6xl font-bold text-white bg-transparent border-none focus:ring-0 placeholder-white/50 mb-6 w-full outline-none drop-shadow-md"
                      value={slide.title}
                      onChange={handleTitleChange}
                      placeholder={texts.titlePlaceholder}
                    />
                    <div className="pl-6 border-l-4 border-indigo-500">
                      {slide.content.map((point, idx) => (
                        <input
                          key={idx}
                          className="block w-full text-2xl text-slate-200 bg-transparent border-none focus:ring-0 outline-none mb-2 drop-shadow-sm font-light"
                          value={point}
                          onChange={(e) => handleContentChange(idx, e.target.value)}
                        />
                      ))}
                    </div>
                  </div>
              </div>
            )}
            
            {/* --- LAYOUT: IMAGE ONLY --- */}
            {slide.layout === 'IMAGE_ONLY' && (
              <div className="w-full h-full relative bg-slate-900">
                  {slide.imageUrl ? (
                    <img src={slide.imageUrl} alt="Background" className="w-full h-full object-cover" />
                  ) : (
                    <ImagePlaceholder dark />
                  )}
                  {/* Note: Text is deliberately hidden in this layout for pure visual impact/text-in-image. */}
              </div>
            )}

          </div>
        </div>
      </div>
      
      {/* Prompt Editor Section - Fixed at Bottom */}
      <div className="w-full bg-white border-t border-slate-200 p-4 z-30 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)] shrink-0">
        <div className="max-w-5xl mx-auto">
          <div className="flex justify-between items-center mb-2">
             <label className="text-xs font-bold text-slate-500 uppercase tracking-wider flex items-center gap-2">
               {texts.promptLabel || 'AI Image Prompt'}
               {slide.layout === 'IMAGE_ONLY' && (
                 <span className="bg-indigo-100 text-indigo-700 text-[10px] px-1.5 py-0.5 rounded border border-indigo-200">
                   Text Rendering Enabled
                 </span>
               )}
             </label>
             <span className="text-xs text-slate-400">Gemini 3 Pro</span>
          </div>
          <div className="relative">
            <textarea 
              value={slide.imagePrompt} 
              onChange={handlePromptChange}
              className="w-full h-24 min-h-[5rem] max-h-[50vh] p-3 pr-28 text-sm text-slate-700 border border-slate-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-y bg-slate-50 font-mono leading-relaxed transition-all"
              placeholder={texts.promptPlaceholder || "Describe the image you want to generate..."}
            />
            <button 
              onClick={onGenerateImage}
              disabled={isGeneratingImage}
              className="absolute bottom-3 right-3 px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold rounded shadow-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {isGeneratingImage ? texts.generating : (texts.genButton || 'Generate')}
            </button>
          </div>
           {slide.layout === 'IMAGE_ONLY' && (
            <p className="text-xs text-slate-500 mt-2 italic flex items-center gap-1">
              <svg className="w-3 h-3 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              {texts.tip || "Tip: Use quotes like \"text 'HELLO'\" to render text in the image."}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};
