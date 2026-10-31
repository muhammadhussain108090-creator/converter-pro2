import React, { useState } from 'react';
import {
  Sparkles,
  Search,
  ArrowRight,
  ShieldCheck,
  Zap,
  CheckCircle2,
  FileText,
  Image as ImageIcon,
  RefreshCw,
  Lock,
  Layers,
  Scissors
} from 'lucide-react';
import { TOOLS } from '../config/tools';

interface HeroProps {
  onSearch: (query: string) => void;
  onSelectTool: (toolId: string) => void;
}

export const Hero: React.FC<HeroProps> = ({ onSearch, onSelectTool }) => {
  const [heroInput, setHeroInput] = useState('');

  const handleHeroSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSearch(heroInput);
    document.getElementById('tools')?.scrollIntoView({ behavior: 'smooth' });
  };

  const quickPicks = [
    { id: 'merge', label: 'Merge PDF' },
    { id: 'compress-image', label: 'Compress Image' },
    { id: 'split', label: 'Split PDF' },
    { id: 'images-pdf', label: 'Images to PDF' },
    { id: 'crop-image', label: 'Crop Photo' }
  ];

  return (
    <div className="relative overflow-hidden pt-8 pb-16 lg:pt-16 lg:pb-24 border-b border-zinc-200/80 dark:border-zinc-800/80 bg-gradient-to-b from-indigo-50/40 via-transparent to-transparent dark:from-indigo-950/20">
      {/* Background Glows */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-7xl h-96 bg-gradient-to-tr from-indigo-400/10 to-violet-400/10 blur-3xl pointer-events-none" />

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Left Column: Headlines & Search */}
          <div className="lg:col-span-7 space-y-6 text-center lg:text-left">
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-indigo-50 dark:bg-indigo-950/60 border border-indigo-200/60 dark:border-indigo-800/60 text-indigo-700 dark:text-indigo-300 text-xs font-bold tracking-wide">
              <Sparkles className="w-3.5 h-3.5" />
              <span>100% IN-BROWSER CONVERSIONS</span>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-heading font-extrabold text-zinc-900 dark:text-white tracking-tight leading-[1.1]">
              Every file.<br />
              <span className="bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-500 bg-clip-text text-transparent">
                Zero privacy risk.
              </span>
            </h1>

            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 max-w-xl mx-auto lg:mx-0 leading-relaxed font-normal">
              Merge, split, rotate, compress, resize, and convert your PDFs and images directly inside your browser. No files uploaded to foreign servers, ever.
            </p>

            {/* Hero Search Box */}
            <form
              onSubmit={handleHeroSubmit}
              className="max-w-lg mx-auto lg:mx-0 relative flex items-center shadow-lg shadow-indigo-500/5 rounded-2xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-1.5 focus-within:ring-2 focus-within:ring-indigo-500 transition-all"
            >
              <Search className="w-5 h-5 text-zinc-400 ml-3 shrink-0" />
              <input
                type="text"
                value={heroInput}
                onChange={(e) => setHeroInput(e.target.value)}
                placeholder="Find a tool (e.g. merge, compress, rotate, docx)..."
                className="w-full px-3 py-2 text-xs sm:text-sm text-zinc-900 dark:text-white bg-transparent outline-none placeholder:text-zinc-400"
              />
              <button
                type="submit"
                className="px-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold text-xs shrink-0 flex items-center gap-1.5 shadow-md shadow-indigo-600/20 cursor-pointer transition-colors"
              >
                <span>Search</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Quick Pick Links */}
            <div className="flex items-center justify-center lg:justify-start gap-2 flex-wrap text-xs">
              <span className="text-zinc-400 font-medium">Popular:</span>
              {quickPicks.map((pick) => (
                <button
                  key={pick.id}
                  onClick={() => onSelectTool(pick.id)}
                  className="px-2.5 py-1 rounded-lg bg-white dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700 hover:border-indigo-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors cursor-pointer font-medium"
                >
                  {pick.label}
                </button>
              ))}
            </div>

            {/* Trust Badges */}
            <div className="pt-2 flex items-center justify-center lg:justify-start gap-6 text-xs font-semibold text-zinc-600 dark:text-zinc-400 flex-wrap">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-500" />
                <span>Files stay on device</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Zap className="w-4 h-4 text-indigo-500" />
                <span>Instant RAM execution</span>
              </div>
              <div className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-violet-500" />
                <span>100% Free & Open</span>
              </div>
            </div>
          </div>

          {/* Right Column: Visual Interactive Graphic */}
          <div className="lg:col-span-5 flex items-center justify-center">
            <div className="relative w-full max-w-sm sm:max-w-md aspect-square rounded-3xl bg-gradient-to-tr from-indigo-500/10 via-violet-500/10 to-indigo-500/5 p-6 border border-zinc-200/80 dark:border-zinc-800 flex items-center justify-center shadow-xl">
              {/* Animated Floating Card: PDF */}
              <div
                onClick={() => onSelectTool('merge')}
                className="absolute top-8 left-4 sm:left-6 p-4 rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200/80 dark:border-zinc-700 flex items-center gap-3.5 transform -rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center">
                  <FileText className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">annual_report.pdf</p>
                  <p className="text-[10px] text-zinc-400">12 pages • 2.4 MB</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2" />
              </div>

              {/* Animated Floating Card: Image */}
              <div
                onClick={() => onSelectTool('compress-image')}
                className="absolute bottom-8 right-4 sm:right-6 p-4 rounded-2xl bg-white dark:bg-zinc-800 shadow-xl border border-zinc-200/80 dark:border-zinc-700 flex items-center gap-3.5 transform rotate-3 hover:rotate-0 hover:scale-105 transition-all duration-300 cursor-pointer"
              >
                <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center">
                  <ImageIcon className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs font-bold text-zinc-900 dark:text-white">portrait.webp</p>
                  <p className="text-[10px] text-emerald-600 font-bold">Compressed (-72%)</p>
                </div>
                <CheckCircle2 className="w-4 h-4 text-emerald-500 ml-2" />
              </div>

              {/* Center Converter Circle */}
              <div className="w-28 h-28 rounded-3xl bg-gradient-to-tr from-indigo-600 to-violet-600 text-white flex flex-col items-center justify-center shadow-2xl shadow-indigo-600/40 border-4 border-white dark:border-zinc-800 animate-pulse">
                <RefreshCw className="w-8 h-8 mb-1" />
                <span className="text-[11px] font-heading font-extrabold tracking-wider">CONVERT</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
