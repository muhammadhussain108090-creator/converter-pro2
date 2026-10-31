import React, { useState, useMemo } from 'react';
import {
  Search,
  Layers,
  Scissors,
  RotateCw,
  FileImage,
  Minimize2,
  Maximize2,
  RefreshCw,
  Crop,
  FileText,
  FileCode,
  FilePlus2,
  Trash2,
  Info,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  CheckCircle2,
  Sliders
} from 'lucide-react';
import { TOOLS } from '../config/tools';
import { Tool, ToolCategory } from '../types';

interface ToolsDirectoryProps {
  onSelectTool: (toolId: string) => void;
  selectedCategory?: ToolCategory;
}

const ICON_MAP: Record<string, React.FC<any>> = {
  Layers,
  Scissors,
  RotateCw,
  FileImage,
  Minimize2,
  Maximize2,
  RefreshCw,
  Crop,
  FileText,
  FileCode,
  FilePlus2,
  Trash2,
  Info
};

export const ToolsDirectory: React.FC<ToolsDirectoryProps> = ({
  onSelectTool,
  selectedCategory: initialCategory = 'All'
}) => {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<ToolCategory>(initialCategory);

  const categories: ToolCategory[] = ['All', 'PDF', 'Image', 'Document'];

  const filteredTools = useMemo(() => {
    return TOOLS.filter((tool) => {
      const matchCat = category === 'All' || tool.category === category;
      const matchQuery =
        !query.trim() ||
        tool.name.toLowerCase().includes(query.toLowerCase()) ||
        tool.shortDesc.toLowerCase().includes(query.toLowerCase()) ||
        tool.desc.toLowerCase().includes(query.toLowerCase()) ||
        tool.category.toLowerCase().includes(query.toLowerCase());
      return matchCat && matchQuery;
    });
  }, [category, query]);

  return (
    <section id="tools" className="w-full py-16 scroll-mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 mb-10">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-200/60 dark:border-indigo-800/40">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Full Toolkit Directory</span>
            </div>
            <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-zinc-900 dark:text-white tracking-tight">
              Powerful tools, zero upload risk.
            </h2>
            <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl">
              Choose from our high-performance suite of client-side conversion utilities. Every operation runs securely inside your device.
            </p>
          </div>

          <div className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 hidden md:block">
            Showing {filteredTools.length} of {TOOLS.length} available tools
          </div>
        </div>

        {/* Filters & Search Row */}
        <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-1.5 p-1 rounded-2xl bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-x-auto no-scrollbar">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setCategory(cat)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all whitespace-nowrap cursor-pointer ${
                  category === cat
                    ? 'bg-white dark:bg-zinc-800 text-indigo-600 dark:text-indigo-400 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {cat === 'All' ? 'All Tools' : `${cat} Tools`}
              </button>
            ))}
          </div>

          {/* Search Bar */}
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter tools (e.g. merge, compress, rotate, docx)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white text-xs sm:text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-all placeholder:text-zinc-400"
            />
            {query && (
              <button
                onClick={() => setQuery('')}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-xs font-bold text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 cursor-pointer"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {/* Tools Grid */}
        {filteredTools.length === 0 ? (
          <div className="py-16 text-center border-2 border-dashed border-zinc-200 dark:border-zinc-800 rounded-3xl bg-zinc-50/50 dark:bg-zinc-900/30">
            <div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-400 flex items-center justify-center mx-auto mb-3">
              <Search className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-zinc-800 dark:text-zinc-200 text-base">
              No matching tools found
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1 max-w-sm mx-auto">
              We couldn't find anything matching "{query}". Try checking your spelling or clearing filters.
            </p>
            <button
              onClick={() => {
                setQuery('');
                setCategory('All');
              }}
              className="mt-4 px-4 py-2 rounded-xl bg-indigo-600 text-white font-semibold text-xs cursor-pointer shadow-md shadow-indigo-600/20 hover:bg-indigo-500"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-5">
            {filteredTools.map((tool) => {
              const IconComp = ICON_MAP[tool.icon] || FileText;

              return (
                <div
                  key={tool.id}
                  onClick={() => onSelectTool(tool.id)}
                  className="group relative bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800/80 hover:border-indigo-500/50 dark:hover:border-indigo-500/50 rounded-3xl p-5 shadow-sm hover:shadow-xl hover:shadow-indigo-500/5 transition-all duration-300 flex flex-col justify-between cursor-pointer"
                >
                  <div>
                    {/* Top row with Icon and Badges */}
                    <div className="flex items-start justify-between gap-3 mb-4">
                      <div className="w-12 h-12 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center group-hover:scale-110 group-hover:bg-indigo-600 group-hover:text-white transition-all duration-300 shadow-sm">
                        <IconComp className="w-6 h-6" />
                      </div>

                      <div className="flex items-center gap-1.5">
                        {tool.tag && (
                          <span
                            className={`px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider ${
                              tool.tag === 'Popular'
                                ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-700 dark:text-amber-400 border border-amber-200/70 dark:border-amber-800/50'
                                : tool.tag === 'New'
                                ? 'bg-emerald-100 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400 border border-emerald-200/70 dark:border-emerald-800/50'
                                : 'bg-indigo-100 dark:bg-indigo-950/50 text-indigo-700 dark:text-indigo-400 border border-indigo-200/70 dark:border-indigo-800/50'
                            }`}
                          >
                            {tool.tag}
                          </span>
                        )}
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-zinc-500 dark:text-zinc-400 bg-zinc-100 dark:bg-zinc-800">
                          {tool.category}
                        </span>
                      </div>
                    </div>

                    {/* Title and Short Description */}
                    <h3 className="font-heading font-extrabold text-base text-zinc-900 dark:text-white group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                      {tool.name}
                    </h3>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1.5 leading-relaxed">
                      {tool.shortDesc}
                    </p>
                  </div>

                  {/* Bottom launch action link */}
                  <div className="mt-5 pt-3 border-t border-zinc-100 dark:border-zinc-800/60 flex items-center justify-between text-xs font-bold text-indigo-600 dark:text-indigo-400">
                    <span>Use tool</span>
                    <ArrowRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
};
