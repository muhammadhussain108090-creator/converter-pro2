import React from 'react';
import {
  Upload,
  Sliders,
  Download,
  Shield,
  Zap,
  Lock,
  Layers,
  Image,
  FileCheck,
  ChevronDown,
  HelpCircle,
  Sparkles
} from 'lucide-react';

export const InfoSections: React.FC = () => {
  return (
    <div className="space-y-24 py-16">
      {/* How It Works Section */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 text-xs font-bold uppercase tracking-wider mb-2 border border-indigo-200/60 dark:border-indigo-800/40">
            <Zap className="w-3.5 h-3.5" />
            <span>Effortless Workflow</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-zinc-900 dark:text-white tracking-tight">
            How ConvertPro Works
          </h2>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-2">
            Professional file conversion in three straightforward steps. No software installation, no waiting in upload queues.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative group hover:border-indigo-500/50 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Upload className="w-7 h-7" />
            </div>
            <span className="text-4xl font-heading font-extrabold text-zinc-200 dark:text-zinc-800 absolute top-6 right-6">
              01
            </span>
            <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-white mb-2">
              Select or Drop Files
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Upload PDF documents, images (JPG, PNG, WebP), or Word files up to 50 MB each. Drag & drop support with multi-file batch reordering.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative group hover:border-indigo-500/50 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Sliders className="w-7 h-7" />
            </div>
            <span className="text-4xl font-heading font-extrabold text-zinc-200 dark:text-zinc-800 absolute top-6 right-6">
              02
            </span>
            <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-white mb-2">
              Customize Settings
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Adjust page ranges, rotate angles, image compression quality, aspect ratios, target pixel dimensions, or document metadata.
            </p>
          </div>

          <div className="bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200/80 dark:border-zinc-800 shadow-sm relative group hover:border-indigo-500/50 transition-all">
            <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-6 shadow-sm group-hover:scale-110 transition-transform">
              <Download className="w-7 h-7" />
            </div>
            <span className="text-4xl font-heading font-extrabold text-zinc-200 dark:text-zinc-800 absolute top-6 right-6">
              03
            </span>
            <h3 className="font-heading font-bold text-lg text-zinc-900 dark:text-white mb-2">
              Instant Download
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Processing executes directly in browser memory using WebAssembly & Canvas. Download begins immediately with zero storage latency.
            </p>
          </div>
        </div>
      </section>

      {/* Features Showcase Section */}
      <section id="features" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 scroll-mt-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 text-xs font-bold uppercase tracking-wider mb-2 border border-emerald-200/60 dark:border-emerald-800/40">
            <Shield className="w-3.5 h-3.5" />
            <span>Built Differently</span>
          </div>
          <h2 className="text-3xl sm:text-4xl font-heading font-extrabold text-zinc-900 dark:text-white tracking-tight">
            Why Professionals Prefer ConvertPro
          </h2>
          <p className="text-sm sm:text-base text-zinc-500 dark:text-zinc-400 mt-2">
            Most online file converters upload your confidential invoices, tax forms, and private photos to unknown remote servers. ConvertPro doesn't.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-4">
              <Shield className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-white mb-1.5">
              100% Client-Side Sandboxing
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              All processing happens in your browser's RAM memory using WebAssembly and standard HTML5 Canvas APIs. No file ever touches our cloud.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-violet-50 dark:bg-violet-950/60 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-4">
              <Zap className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-white mb-1.5">
              Zero Network Latency
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Skip waiting for large files to upload over slow internet connections. Processing begins instantly the millisecond you click run.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4">
              <Lock className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-white mb-1.5">
              Firebase Authentication
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Sync your personal conversion activity history across devices securely using Firebase Auth and Firestore security rules.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-4">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-white mb-1.5">
              Deep PDF Tooling
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Merge, extract, delete, rotate, and edit metadata on standard PDF documents with precision vector page copying via PDF-lib.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 flex items-center justify-center mb-4">
              <Image className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-white mb-1.5">
              High-Fidelity Image Suite
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Lossless and lossy compression, format conversion (JPG, PNG, WebP), aspect-ratio locked resizing, and visual cropping.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800">
            <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center mb-4">
              <FileCheck className="w-5 h-5" />
            </div>
            <h3 className="font-heading font-bold text-base text-zinc-900 dark:text-white mb-1.5">
              Netlify Compatible
            </h3>
            <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
              Includes pre-configured <code>netlify.toml</code> with SPA fallback redirects and serverless functions compatibility.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 text-xs font-bold uppercase tracking-wider mb-2">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>Frequently Asked Questions</span>
          </div>
          <h2 className="text-2xl sm:text-3xl font-heading font-extrabold text-zinc-900 dark:text-white">
            Answers to common questions
          </h2>
        </div>

        <div className="space-y-4">
          {[
            {
              q: 'Are my confidential documents uploaded to any server?',
              a: 'No. All operations (merging, splitting, compressing, resizing, rotating) execute 100% inside your browser using client-side WebAssembly, JavaScript, and Canvas APIs. Your files never leave your device.'
            },
            {
              q: 'What is the maximum file size limit?',
              a: 'ConvertPro supports files up to 50 MB per file, which covers virtually all personal, business, and educational PDF and image files. Because files are processed in your browser memory, limits prevent high memory consumption on mobile devices.'
            },
            {
              q: 'Do I need an account to convert files?',
              a: 'No account is required to use any of the conversion tools! If you choose to create a free account with email/password or Google, ConvertPro will save your conversion history and profile preferences securely in Firestore.'
            },
            {
              q: 'How does Word (.docx) to PDF conversion work in the browser?',
              a: 'ConvertPro uses Mammoth.js to parse the structure, headings, paragraphs, and formatting of .docx files and compiles them into a printable PDF via PDF-lib. Complex proprietary Microsoft Word macros or shapes require an offline or dedicated LibreOffice server.'
            },
            {
              q: 'How do I deploy this project to Netlify?',
              a: 'Simply connect your GitHub repository in the Netlify dashboard. Netlify will detect the included netlify.toml file, run "npm run build", and publish the "dist" folder with full SPA route support.'
            }
          ].map((item, idx) => (
            <div
              key={idx}
              className="p-5 rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 text-left"
            >
              <h3 className="font-heading font-bold text-sm sm:text-base text-zinc-900 dark:text-white mb-2">
                {item.q}
              </h3>
              <p className="text-xs sm:text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                {item.a}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
