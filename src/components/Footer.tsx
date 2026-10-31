import React from 'react';
import { FileText, Shield, Zap, Lock, Heart, ExternalLink } from 'lucide-react';

interface FooterProps {
  onSelectTool: (toolId: string) => void;
}

export const Footer: React.FC<FooterProps> = ({ onSelectTool }) => {
  return (
    <footer className="w-full bg-zinc-50 dark:bg-zinc-950 border-t border-zinc-200 dark:border-zinc-800/80 pt-16 pb-12 text-zinc-600 dark:text-zinc-400 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-10 pb-12 border-b border-zinc-200 dark:border-zinc-800/80">
          {/* Brand Info */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-indigo-600 to-violet-500 text-white flex items-center justify-center shadow-md shadow-indigo-500/20">
                <FileText className="w-5 h-5" />
              </div>
              <span className="font-heading font-extrabold text-xl text-zinc-900 dark:text-white tracking-tight">
                Convert<span className="text-indigo-600 dark:text-indigo-400">Pro</span>
              </span>
            </div>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 max-w-sm leading-relaxed">
              Fast, privacy-first PDF and image processing suite built with modern web standards. All conversions occur client-side inside your browser—no files uploaded to foreign servers.
            </p>
            <div className="flex items-center gap-4 pt-2">
              <div className="flex items-center gap-1.5 text-xs text-emerald-600 dark:text-emerald-400 font-semibold bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-1 rounded-full border border-emerald-200/60 dark:border-emerald-800/50">
                <Shield className="w-3.5 h-3.5" />
                <span>Zero File Uploads</span>
              </div>
              <div className="flex items-center gap-1.5 text-xs text-indigo-600 dark:text-indigo-400 font-semibold bg-indigo-50 dark:bg-indigo-950/40 px-2.5 py-1 rounded-full border border-indigo-200/60 dark:border-indigo-800/50">
                <Zap className="w-3.5 h-3.5" />
                <span>Browser Powered</span>
              </div>
            </div>
          </div>

          {/* PDF Tools */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">
              PDF Utilities
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onSelectTool('merge')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Merge PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('split')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Split PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('rotate')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Rotate PDF
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('extract-pages')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Extract Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('delete-pages')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Delete Pages
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-metadata')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  PDF Metadata Editor
                </button>
              </li>
            </ul>
          </div>

          {/* Image Tools */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">
              Image Utilities
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onSelectTool('compress-image')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Compress Image
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('resize-image')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Resize Image
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('convert-image')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Convert (JPG, PNG, WebP)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('crop-image')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Crop Image
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('images-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Images to PDF
                </button>
              </li>
            </ul>
          </div>

          {/* Documents & Architecture */}
          <div>
            <h4 className="font-heading text-xs font-bold uppercase tracking-wider text-zinc-900 dark:text-zinc-100 mb-4">
              Documents & Tech
            </h4>
            <ul className="space-y-2 text-sm">
              <li>
                <button
                  onClick={() => onSelectTool('word-to-pdf')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  Word to PDF (.docx)
                </button>
              </li>
              <li>
                <button
                  onClick={() => onSelectTool('pdf-to-word')}
                  className="hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors text-left"
                >
                  PDF to Word (.doc)
                </button>
              </li>
              <li className="pt-2 text-xs text-zinc-500 dark:text-zinc-500">
                <span>Deployable to Netlify, Vercel, or Firebase Hosting.</span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-zinc-500 dark:text-zinc-500">
          <div>
            © {new Date().getFullYear()} ConvertPro. Free & Open Source Architecture.
          </div>
          <div className="flex items-center gap-6">
            <span>Client-side WebAssembly & Canvas</span>
            <span>PDF-lib Powered</span>
            <span>Firebase Auth Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
