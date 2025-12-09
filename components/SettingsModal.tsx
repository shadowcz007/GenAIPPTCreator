
import React, { useState, useEffect } from 'react';
import { getApiKey, setApiKey } from '../services/geminiService';
import { Language } from '../types';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, language }) => {
  const [key, setKey] = useState('');

  useEffect(() => {
    if (isOpen) {
      setKey(getApiKey());
    }
  }, [isOpen]);

  const handleSave = () => {
    setApiKey(key.trim());
    onClose();
  };

  const handleClear = () => {
    setApiKey('');
    setKey('');
  };

  if (!isOpen) return null;

  const t = {
    zh: {
      title: "设置",
      apiKeyLabel: "API 密钥",
      placeholder: "输入您的 API 密钥",
      save: "保存",
      clear: "清除",
      cancel: "取消",
      desc: "请配置您的 API 密钥以使用胜算云 AI 服务。",
      help: "如何获取 API 密钥？"
    },
    en: {
      title: "Settings",
      apiKeyLabel: "API Key",
      placeholder: "Enter your API Key",
      save: "Save",
      clear: "Clear",
      cancel: "Cancel",
      desc: "Please configure your API Key to use the Shengsuan Cloud AI service.",
      help: "How to get an API Key?"
    }
  }[language];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-md overflow-hidden transform transition-all scale-100">
        <div className="p-6">
          <h2 className="text-xl font-bold text-slate-800 mb-2">{t.title}</h2>
          <p className="text-sm text-slate-500 mb-6">{t.desc}</p>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                {t.apiKeyLabel}
              </label>
              <input
                type="password"
                value={key}
                onChange={(e) => setKey(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none text-slate-900"
                placeholder={t.placeholder}
              />
              <div className="mt-2 text-right">
                <a 
                  href="https://www.shengsuanyun.com/?from=CH_X30T9465" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-xs text-indigo-600 hover:text-indigo-800 hover:underline flex items-center justify-end gap-1"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-3 w-3" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                  </svg>
                  {t.help}
                </a>
              </div>
            </div>
          </div>
        </div>
        
        <div className="bg-slate-50 px-6 py-4 flex justify-between items-center border-t border-slate-100">
          <button
              onClick={handleClear}
              className="text-sm text-red-500 hover:text-red-700 font-medium"
            >
              {t.clear}
          </button>
          <div className="flex gap-3">
            <button
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-600 hover:text-slate-800 transition-colors"
            >
              {t.cancel}
            </button>
            <button
              onClick={handleSave}
              className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 rounded-lg shadow-sm transition-colors"
            >
              {t.save}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
