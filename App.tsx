
import React, { useState, useEffect, useRef } from 'react';
import { SlideData, GenerationStatus, Language, HistoryItem } from './types';
import { generatePresentationStructure, generateSlideImage, checkAndRequestApiKey } from './services/geminiService';
import { getHistory, saveHistoryItem, deleteHistoryItem } from './services/historyService';
import { SlideThumbnail } from './components/SlideThumbnail';
import { SlideEditor } from './components/SlideEditor';
import { SettingsModal } from './components/SettingsModal';

const TRANSLATIONS = {
  zh: {
    heroTitle: "AI PPT 生成器",
    heroSubtitle: "输入您的主题或文档内容，瞬间生成精美演示文稿。",
    heroPlaceholder: "例如：2025年人工智能在医疗领域的发展趋势...",
    startBtn: "开始生成",
    viewExample: "查看布局示例",
    generatingStructure: "生成大纲中...",
    imagesReady: "张图片已就绪",
    genAllImages: "批量生成图片",
    generatingAll: "正在生成...",
    exportPdf: "导出 PDF",
    slidesTitle: "幻灯片",
    newPresentation: "新建文稿",
    processingImages: "正在处理图像 (Gemini 3 Pro)...",
    errorApiKey: "请先在设置中配置 API Key",
    successImages: "所有幻灯片已有图片",
    settings: "设置",
    historyTitle: "历史记录",
    noHistory: "暂无历史记录",
    slideCount: "页",
    delete: "删除",
    lastEdited: "最后编辑",
    confirmDelete: "确定要删除这条记录吗？",
    slideEditor: {
      header: "当前幻灯片编辑器",
      genImage: "生成/重新生成图像",
      generating: "正在生成图像...",
      noImage: "暂无图像",
      titlePlaceholder: "输入标题...",
      promptLabel: "AI 绘图提示词",
      promptPlaceholder: "描述您想生成的图像...",
      genButton: "生成图片",
      tip: "提示：纯图模式采用扁平信息图风格。建议在提示词中描述图表结构、流程或对比关系。",
      zoomIn: "放大",
      zoomOut: "缩小",
      zoomReset: "自适应"
    }
  },
  en: {
    heroTitle: "GenAI PPT Creator",
    heroSubtitle: "Transform ideas into professional presentations instantly.",
    heroPlaceholder: "E.g., The Future of AI in Healthcare 2025...",
    startBtn: "Generate Presentation",
    viewExample: "View Layout Examples",
    generatingStructure: "Generating Outline...",
    imagesReady: "Images Ready",
    genAllImages: "Generate All Images",
    generatingAll: "Generating...",
    exportPdf: "Export PDF",
    slidesTitle: "Slides",
    newPresentation: "New Presentation",
    processingImages: "Processing images with Gemini 3 Pro...",
    errorApiKey: "Please configure API Key in Settings first",
    successImages: "All slides already have images",
    settings: "Settings",
    historyTitle: "History",
    noHistory: "No history found",
    slideCount: "slides",
    delete: "Delete",
    lastEdited: "Last edited",
    confirmDelete: "Are you sure you want to delete this item?",
    slideEditor: {
      header: "Slide Editor",
      genImage: "Generate Image",
      generating: "Generating...",
      noImage: "No Image Generated",
      titlePlaceholder: "Enter Title...",
      promptLabel: "AI Image Prompt",
      promptPlaceholder: "Describe the image you want to generate...",
      genButton: "Generate Image",
      tip: "Tip: Image Only mode uses a Flat Infographic style. Describe chart structures or flows in the prompt.",
      zoomIn: "Zoom In",
      zoomOut: "Zoom Out",
      zoomReset: "Fit Screen"
    }
  }
};

const LANG_STORAGE_KEY = 'GENAI_LANG';

const App: React.FC = () => {
  // Initialize language from local storage or default to 'zh'
  const [language, setLanguage] = useState<Language>(() => {
    return (localStorage.getItem(LANG_STORAGE_KEY) as Language) || 'zh';
  });
  
  const [topic, setTopic] = useState('');
  const [slides, setSlides] = useState<SlideData[]>([]);
  const [presentationId, setPresentationId] = useState<string | null>(null);
  const [currentSlideId, setCurrentSlideId] = useState<string | null>(null);
  const [status, setStatus] = useState<GenerationStatus>(GenerationStatus.IDLE);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [loadingMsg, setLoadingMsg] = useState<string>('');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [hasApiKey, setHasApiKey] = useState(false);
  const [historyList, setHistoryList] = useState<HistoryItem[]>([]);

  const t = TRANSLATIONS[language];
  const currentSlideIndex = slides.findIndex(s => s.id === currentSlideId);
  const currentSlide = slides[currentSlideIndex];
  
  // Ref for debouncing auto-save
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Persist language on change
  useEffect(() => {
    localStorage.setItem(LANG_STORAGE_KEY, language);
    document.title = language === 'zh' ? 'AI PPT 生成器' : 'GenAI PPT Creator';
  }, [language]);

  // Check for API key on mount and when settings close
  useEffect(() => {
    checkAndRequestApiKey().then(setHasApiKey);
  }, [isSettingsOpen]);

  // Load history on mount
  useEffect(() => {
    setHistoryList(getHistory());
  }, []);

  // Auto-save logic
  useEffect(() => {
    if (presentationId && slides.length > 0) {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
      
      saveTimeoutRef.current = setTimeout(() => {
        const item: HistoryItem = {
          id: presentationId,
          topic: topic || 'Untitled',
          slides,
          updatedAt: Date.now()
        };
        saveHistoryItem(item);
        setHistoryList(getHistory()); // Refresh list
      }, 1000); // Debounce 1s
    }
    
    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [slides, topic, presentationId]);

  const handleCreateOutline = async () => {
    if (!topic.trim()) return;
    
    // Check API Key
    const hasKey = await checkAndRequestApiKey();
    if (!hasKey) {
      setIsSettingsOpen(true);
      setErrorMsg(t.errorApiKey);
      return;
    }

    setStatus(GenerationStatus.GENERATING_STRUCTURE);
    setErrorMsg(null);
    setLoadingMsg(t.generatingStructure);

    try {
      const generatedSlides = await generatePresentationStructure(topic, language);
      setSlides(generatedSlides);
      
      // Initialize new presentation ID
      const newId = Date.now().toString() + Math.random().toString(36).substr(2, 9);
      setPresentationId(newId);

      if (generatedSlides.length > 0) {
        setCurrentSlideId(generatedSlides[0].id);
      }
      setStatus(GenerationStatus.COMPLETE);
    } catch (err: any) {
      if (err.message === 'API_KEY_MISSING') {
        setIsSettingsOpen(true);
        setErrorMsg(t.errorApiKey);
      } else {
        setErrorMsg(err.message || "Failed to generate structure");
      }
      setStatus(GenerationStatus.ERROR);
    }
  };

  const handleCreateExample = () => {
    const exampleSlides: SlideData[] = [
      {
        id: 'ex-1',
        title: language === 'zh' ? "未来科技趋势" : "Future Tech Trends",
        content: [
           language === 'zh' ? "探索2025年的可能性" : "Exploring the possibilities of 2025",
           language === 'zh' ? "演讲者：AI 助手" : "Presented by: AI Assistant"
        ],
        imagePrompt: "A futuristic city skyline at sunset with flying cars, cyberpunk style, neon lights, highly detailed, 8k",
        layout: 'TITLE'
      },
      {
        id: 'ex-2',
        title: language === 'zh' ? "人工智能革命" : "The AI Revolution",
        content: [
          language === 'zh' ? "自动化效率提升 300%" : "Automation increases efficiency by 300%",
          language === 'zh' ? "深度学习突破瓶颈" : "Deep learning breakthroughs",
          language === 'zh' ? "人机协作新模式" : "New modes of human-machine collaboration"
        ],
        imagePrompt: "A robot hand shaking a human hand, digital particles, glowing blue connections, macro shot",
        layout: 'CONTENT_RIGHT'
      },
      {
        id: 'ex-3',
        title: language === 'zh' ? "可持续能源" : "Sustainable Energy",
        content: [
          language === 'zh' ? "太阳能板效率翻倍" : "Solar panel efficiency doubled",
          language === 'zh' ? "全球碳中和目标" : "Global carbon neutrality goals",
          language === 'zh' ? "绿色城市的崛起" : "The rise of green cities"
        ],
        imagePrompt: "Wind turbines in a green field with flowers, sunny blue sky, photorealistic, cinematic lighting",
        layout: 'CONTENT_LEFT'
      },
      {
        id: 'ex-4',
        title: language === 'zh' ? "展望未来" : "Vision for Tomorrow",
        content: [
          language === 'zh' ? "科技为了更美好的生活" : "Technology for a better life",
          language === 'zh' ? "连接每一个人" : "Connecting everyone everywhere"
        ],
        imagePrompt: "An astronaut looking at earth from space, stars, galaxy background, awe-inspiring, wide angle",
        layout: 'FULL_IMAGE'
      },
      {
        id: 'ex-5',
        title: language === 'zh' ? "数据可视化" : "Data Visualization",
        content: [],
        // Updated to use the new Infographic style
        imagePrompt: "Flat vector illustration infographic in corporate Memphis style. Cream background. Header text 'DATA'. A large teal magnifying glass analyzing mustard yellow data blocks. Coral red connection lines forming a network. Clean lines, minimal shading, explanatory chart aesthetic.",
        layout: 'IMAGE_ONLY'
      }
    ];

    setTopic(language === 'zh' ? "演示文稿布局示例" : "Presentation Layout Examples");
    setSlides(exampleSlides);
    setPresentationId(`example-${Date.now()}`);
    setCurrentSlideId('ex-1');
    setStatus(GenerationStatus.COMPLETE);
  };

  const handleUpdateSlide = (updatedSlide: SlideData) => {
    setSlides(prev => prev.map(s => s.id === updatedSlide.id ? updatedSlide : s));
  };

  const handleGenerateImage = async (slideId: string) => {
    const slideToUpdate = slides.find(s => s.id === slideId);
    if (!slideToUpdate) return;

    // Set local loading state
    setSlides(prev => prev.map(s => s.id === slideId ? { ...s, isGeneratingImage: true } : s));
    
    try {
      const hasKey = await checkAndRequestApiKey();
      if (!hasKey) {
        setIsSettingsOpen(true);
        throw new Error(t.errorApiKey);
      }

      const imageUrl = await generateSlideImage(slideToUpdate.imagePrompt);
      
      setSlides(prev => prev.map(s => 
        s.id === slideId ? { ...s, imageUrl, isGeneratingImage: false } : s
      ));
    } catch (err: any) {
      console.error(err);
      if (err.message !== t.errorApiKey && err.message !== 'API_KEY_MISSING') {
        alert(`Image Generation Failed: ${err.message}`);
      }
      setSlides(prev => prev.map(s => s.id === slideId ? { ...s, isGeneratingImage: false } : s));
    }
  };

  const handleGenerateAllImages = async () => {
    const slidesToGen = slides.filter(s => !s.imageUrl);
    if (slidesToGen.length === 0) {
      alert(t.successImages);
      return;
    }

    const hasKey = await checkAndRequestApiKey();
    if (!hasKey) {
      setIsSettingsOpen(true);
      alert(t.errorApiKey);
      return;
    }

    setStatus(GenerationStatus.GENERATING_IMAGES);
    setLoadingMsg(t.processingImages);

    // Mark all as loading
    setSlides(prev => prev.map(s => !s.imageUrl ? { ...s, isGeneratingImage: true } : s));

    // Process one by one
    for (const slide of slidesToGen) {
      try {
        const imageUrl = await generateSlideImage(slide.imagePrompt);
        setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, imageUrl, isGeneratingImage: false } : s));
      } catch (e) {
        console.error(`Failed for slide ${slide.id}`, e);
        setSlides(prev => prev.map(s => s.id === slide.id ? { ...s, isGeneratingImage: false } : s));
      }
    }
    
    setStatus(GenerationStatus.COMPLETE);
  };

  const loadHistoryItem = (item: HistoryItem) => {
    setPresentationId(item.id);
    setTopic(item.topic);
    // Backward compatibility: add default layout if missing
    const hydratedSlides = item.slides.map(s => ({
      ...s,
      layout: s.layout || 'CONTENT_RIGHT'
    }));
    setSlides(hydratedSlides);
    setCurrentSlideId(hydratedSlides.length > 0 ? hydratedSlides[0].id : null);
    setStatus(GenerationStatus.COMPLETE);
  };

  const handleDeleteHistory = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (window.confirm(t.confirmDelete)) {
      const newList = deleteHistoryItem(id);
      setHistoryList(newList);
    }
  };

  const formatDate = (ts: number) => {
    return new Date(ts).toLocaleString(language === 'zh' ? 'zh-CN' : 'en-US', {
      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
    });
  };

  const TopControls = () => (
    <div className="flex items-center gap-3">
      <div className="flex bg-slate-100 rounded-lg p-1 border border-slate-200">
        <button
          onClick={() => setLanguage('zh')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            language === 'zh' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          中
        </button>
        <button
          onClick={() => setLanguage('en')}
          className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
            language === 'en' ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'
          }`}
        >
          EN
        </button>
      </div>
      <button 
        onClick={() => setIsSettingsOpen(true)}
        className="relative p-2 text-slate-500 hover:text-indigo-600 hover:bg-slate-100 rounded-full transition-colors"
        title={t.settings}
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
          <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
        </svg>
        {!hasApiKey && (
          <span className="absolute top-1 right-1 h-2.5 w-2.5 bg-red-500 rounded-full border-2 border-white"></span>
        )}
      </button>
    </div>
  );

  return (
    <>
      <SettingsModal 
        isOpen={isSettingsOpen} 
        onClose={() => setIsSettingsOpen(false)} 
        language={language}
      />

      {/* Render Initial Input Screen */}
      {slides.length === 0 ? (
        <div className="min-h-screen flex flex-col items-center bg-gradient-to-br from-indigo-50 via-white to-slate-100 p-6 relative overflow-y-auto">
          <div className="absolute top-6 right-6">
            <TopControls />
          </div>
          
          <div className="max-w-xl w-full bg-white/80 backdrop-blur-md p-10 rounded-2xl shadow-xl border border-slate-200 mt-20 mb-10">
            <div className="text-center mb-10">
              <h1 className="text-4xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-cyan-600 mb-4">
                {t.heroTitle}
              </h1>
              <p className="text-slate-600 text-lg">
                {t.heroSubtitle}
              </p>
              <p className="text-xs text-slate-400 mt-2">
                Powered by Gemini 2.5 Flash (Text) & Gemini 3 Pro (Image)
              </p>
            </div>

            <div className="space-y-4">
              <textarea
                className="w-full bg-white border border-slate-300 rounded-lg p-4 text-slate-900 placeholder-slate-400 focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none transition-all resize-none h-32 text-lg shadow-sm"
                placeholder={t.heroPlaceholder}
                value={topic}
                onChange={(e) => setTopic(e.target.value)}
                onKeyDown={(e) => {
                   if (e.key === 'Enter' && !e.shiftKey) {
                     e.preventDefault();
                     handleCreateOutline();
                   }
                }}
              />
              <div className="flex gap-3">
                 <button
                  onClick={handleCreateOutline}
                  disabled={!topic.trim() || status === GenerationStatus.GENERATING_STRUCTURE}
                  className={`
                    flex-1 py-3 rounded-lg font-bold text-lg tracking-wide shadow-lg
                    transform transition-all duration-200 active:scale-95
                    ${!topic.trim() 
                      ? 'bg-slate-200 text-slate-400 cursor-not-allowed' 
                      : 'bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white shadow-indigo-500/30'}
                  `}
                >
                  {status === GenerationStatus.GENERATING_STRUCTURE ? (
                    <span className="flex items-center justify-center gap-3">
                      <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      {t.generatingStructure}
                    </span>
                  ) : t.startBtn}
                </button>
              </div>
              <button
                onClick={handleCreateExample}
                className="w-full py-2 text-indigo-600 text-sm font-medium hover:bg-indigo-50 rounded transition-colors"
              >
                {t.viewExample}
              </button>
            </div>
            
            {errorMsg && (
              <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded text-sm text-center">
                {errorMsg}
              </div>
            )}
          </div>

          {/* History Section */}
          <div className="max-w-3xl w-full pb-10">
            <div className="flex items-center gap-3 mb-4 px-2">
              <h2 className="text-slate-400 font-bold uppercase text-xs tracking-wider">{t.historyTitle}</h2>
              <div className="h-px bg-slate-200 flex-1"></div>
            </div>
            
            {historyList.length === 0 ? (
              <div className="text-center py-8 text-slate-400 text-sm italic">
                {t.noHistory}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {historyList.map(item => (
                  <div 
                    key={item.id} 
                    onClick={() => loadHistoryItem(item)}
                    className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 cursor-pointer transition-all group relative"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-semibold text-slate-800 line-clamp-1 pr-6" title={item.topic}>{item.topic}</h3>
                      <button 
                        onClick={(e) => handleDeleteHistory(e, item.id)}
                        className="text-slate-300 hover:text-red-500 p-1 opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3"
                        title={t.delete}
                      >
                        <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                    <div className="flex justify-between items-end text-xs text-slate-400">
                      <span>{item.slides.length} {t.slideCount}</span>
                      <span>{formatDate(item.updatedAt)}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : (
        /* Render Main Editor */
        <div className="h-screen flex flex-col bg-slate-50 text-slate-900 overflow-hidden">
          
          {/* Header */}
          <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-6 z-20 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded bg-indigo-600 flex items-center justify-center font-bold text-white">Ai</div>
              <h1 className="font-semibold text-lg truncate max-w-md text-slate-800" title={topic}>{topic}</h1>
            </div>
            
            <div className="flex items-center gap-4">
              <TopControls />
              <div className="h-4 w-px bg-slate-300 mx-1"></div>
              <div className="text-xs text-slate-500 hidden sm:block">
                 {slides.filter(s => s.imageUrl).length} / {slides.length} {t.imagesReady}
              </div>
              <button 
                onClick={handleGenerateAllImages}
                disabled={status === GenerationStatus.GENERATING_IMAGES}
                className="px-4 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-md text-sm font-medium transition-colors"
              >
                {status === GenerationStatus.GENERATING_IMAGES ? t.generatingAll : t.genAllImages}
              </button>
              <button 
                className="px-4 py-2 bg-slate-900 text-white rounded-md text-sm font-bold hover:bg-slate-800 transition-colors shadow-sm"
                onClick={() => window.print()}
              >
                {t.exportPdf}
              </button>
            </div>
          </header>

          {/* Main Content */}
          <div className="flex-1 flex overflow-hidden">
            
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10">
              <div className="p-4 border-b border-slate-200">
                <h3 className="text-xs font-bold text-slate-500 uppercase tracking-wider">{t.slidesTitle}</h3>
              </div>
              <div className="flex-1 overflow-y-auto p-3 space-y-3">
                {slides.map((slide, index) => (
                  <SlideThumbnail 
                    key={slide.id}
                    slide={slide}
                    index={index}
                    isActive={slide.id === currentSlideId}
                    onClick={() => setCurrentSlideId(slide.id)}
                  />
                ))}
              </div>
              <div className="p-4 border-t border-slate-200 bg-slate-50">
                <button 
                  onClick={() => {
                    setSlides([]);
                    setTopic('');
                    setPresentationId(null); // Clear current ID
                    setStatus(GenerationStatus.IDLE);
                  }}
                  className="w-full py-2 text-xs text-slate-600 hover:text-slate-900 border border-slate-300 rounded hover:bg-white transition-colors"
                >
                  {t.newPresentation}
                </button>
              </div>
            </aside>

            {/* Editor Area */}
            <main className="flex-1 relative bg-slate-50">
               {status === GenerationStatus.GENERATING_STRUCTURE ? (
                 <div className="absolute inset-0 flex flex-col items-center justify-center bg-white/90 z-50">
                   <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mb-4"></div>
                   <p className="text-indigo-600 font-medium animate-pulse">{loadingMsg}</p>
                 </div>
               ) : currentSlide ? (
                 <SlideEditor 
                    slide={currentSlide}
                    onUpdate={handleUpdateSlide}
                    onGenerateImage={() => handleGenerateImage(currentSlide.id)}
                    isGeneratingImage={!!currentSlide.isGeneratingImage}
                    texts={t.slideEditor}
                 />
               ) : (
                 <div className="flex items-center justify-center h-full text-slate-400">
                   Select a slide to edit
                 </div>
               )}
            </main>
          </div>

          {/* Global Status Overlay (if needed for batch operations) */}
          {status === GenerationStatus.GENERATING_IMAGES && (
             <div className="fixed bottom-6 right-6 bg-white border border-slate-200 p-4 rounded-lg shadow-xl flex items-center gap-4 z-50 animate-bounce-in">
               <div className="w-5 h-5 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
               <span className="text-sm font-medium text-slate-800">{t.processingImages}</span>
             </div>
          )}
        </div>
      )}
    </>
  );
};

export default App;
