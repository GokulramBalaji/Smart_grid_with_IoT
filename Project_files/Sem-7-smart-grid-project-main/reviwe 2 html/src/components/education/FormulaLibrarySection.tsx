import React, { useState } from 'react';
import { usePowerData } from '../../context/PowerDataContext';
import { FORMULA_LIBRARY } from '../../data/formulaData';
import { OriginBadge } from '../common/Badge';
import { 
  BookOpen, 
  Search, 
  ChevronDown, 
  ChevronUp, 
  Zap, 
  Layers,
  Sparkles,
  ArrowRight
} from 'lucide-react';

export const FormulaLibrarySection: React.FC = () => {
  const context = usePowerData();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [expandedId, setExpandedId] = useState<string>('v_avg');
  const [viewModeMap, setViewModeMap] = useState<Record<string, 'FORMULA' | 'EXAMPLE' | 'LIVE'>>({
    v_avg: 'LIVE',
    pf_total: 'LIVE',
    v_imb: 'LIVE'
  });

  const categories = ['ALL', 'Voltage', 'Current', 'Power', 'Power Factor', 'Frequency', 'Energy', 'Power Quality'];

  const filteredFormulas = FORMULA_LIBRARY.filter(f => {
    const matchesCategory = selectedCategory === 'ALL' || f.category === selectedCategory;
    const matchesSearch = f.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.engineeringExplanation.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          f.category.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedId(prev => prev === id ? '' : id);
  };

  const setViewMode = (id: string, mode: 'FORMULA' | 'EXAMPLE' | 'LIVE') => {
    setViewModeMap(prev => ({ ...prev, [id]: mode }));
  };

  return (
    <section className="space-y-6">
      {/* Section Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-xl bg-blue-50 text-[#0071E3] flex items-center justify-center">
              <BookOpen className="w-4 h-4" />
            </div>
            <h2 className="text-xl font-bold text-[#1D1D1F] tracking-tight">
              Electrical Engineering Formula & Derivation Library
            </h2>
            <OriginBadge origin="CALCULATED" />
          </div>
          <p className="text-xs text-slate-500 font-mono mt-1">
            Complete mathematical formulations, variable definitions, and interactive live calculation bridges
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-blue-50 border border-blue-200/80 text-[#0071E3] text-xs font-mono flex items-center gap-2">
          <Sparkles className="w-3.5 h-3.5 text-[#0071E3]" />
          <span>Interactive "Show Live Value" Bridge Enabled</span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="apple-card p-3 flex flex-wrap items-center justify-between gap-3 bg-white">
        <div className="flex items-center gap-1.5 overflow-x-auto scrollbar-none py-1">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-medium font-mono whitespace-nowrap transition-all ${
                selectedCategory === cat
                  ? 'bg-[#0071E3] text-white font-bold shadow-sm'
                  : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-64">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search formulas or symbols..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-xs font-mono text-slate-900 placeholder-slate-400 focus:outline-none focus:border-[#0071E3] focus:bg-white"
          />
        </div>
      </div>

      {/* Formula Cards Catalog */}
      <div className="space-y-4">
        {filteredFormulas.map(item => {
          const isExpanded = expandedId === item.id;
          const currentMode = viewModeMap[item.id] || 'FORMULA';
          const liveVal = item.getLiveValue(context);

          return (
            <div
              key={item.id}
              className={`apple-card transition-all duration-200 border bg-white ${
                isExpanded ? 'border-[#0071E3]/50 shadow-apple-hover ring-1 ring-[#0071E3]/10' : 'border-black/[0.06] hover:border-slate-300'
              }`}
            >
              {/* Card Header Accordion */}
              <div 
                onClick={() => toggleExpand(item.id)}
                className="p-4 flex flex-wrap items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="text-xs font-mono px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0071E3] border border-blue-200 font-medium">
                    {item.category}
                  </span>
                  <div>
                    <h3 className="text-base font-bold text-[#1D1D1F]">
                      {item.title}
                    </h3>
                    <span className="text-xs font-mono text-slate-500">
                      Unit: {item.unit}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3">
                  <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-xs font-mono">
                    <span className="text-slate-500">Live:</span>
                    <span className="text-emerald-700 font-bold">{liveVal.result}</span>
                  </div>

                  <button className="p-1 text-slate-400 hover:text-slate-700 transition-colors">
                    {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                  </button>
                </div>
              </div>

              {/* Expanded Card Details */}
              {isExpanded && (
                <div className="px-4 pb-5 pt-1 border-t border-slate-100 space-y-4">
                  
                  {/* Interactive Step Switcher: Formula -> Example -> Live Value */}
                  <div className="flex items-center gap-2 pt-2">
                    <button
                      onClick={() => setViewMode(item.id, 'FORMULA')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                        currentMode === 'FORMULA'
                          ? 'bg-[#0071E3] text-white font-bold shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      1. Show Formula
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      onClick={() => setViewMode(item.id, 'EXAMPLE')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-medium transition-all ${
                        currentMode === 'EXAMPLE'
                          ? 'bg-amber-500 text-white font-bold shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      2. Worked Example
                    </button>
                    <ArrowRight className="w-3.5 h-3.5 text-slate-400" />
                    <button
                      onClick={() => setViewMode(item.id, 'LIVE')}
                      className={`px-3.5 py-1.5 rounded-full text-xs font-mono font-bold transition-all ${
                        currentMode === 'LIVE'
                          ? 'bg-emerald-600 text-white shadow-sm'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      3. Show Live Value ⚡
                    </button>
                  </div>

                  {/* Mode View Box */}
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 font-mono">
                    {currentMode === 'FORMULA' && (
                      <div className="space-y-2">
                        <div className="text-[11px] text-slate-500 uppercase tracking-wider font-semibold">Mathematical Representation:</div>
                        <div className="text-xl font-bold text-[#0071E3] tracking-wide">
                          {item.formulaLatex}
                        </div>
                      </div>
                    )}

                    {currentMode === 'EXAMPLE' && (
                      <div className="space-y-2">
                        <div className="text-[11px] text-amber-700 uppercase tracking-wider font-semibold">Worked Numerical Example:</div>
                        <pre className="text-xs text-slate-800 whitespace-pre-wrap font-mono leading-relaxed">
                          {item.exampleCalculation}
                        </pre>
                      </div>
                    )}

                    {currentMode === 'LIVE' && (
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-[11px] text-emerald-700 uppercase tracking-wider font-semibold">
                          <span>Live Context Calculation (From PZEM Hardware Telemetry):</span>
                          <span className="text-[10px] text-slate-500">Updated in real-time</span>
                        </div>
                        <div className="text-sm text-slate-700">
                          {item.id}: <span className="text-slate-900 font-bold">{liveVal.formulaFilled}</span>
                        </div>
                        <div className="text-2xl font-black text-emerald-700 flex items-center gap-2">
                          = {liveVal.result}
                          <span className="text-xs text-emerald-600 font-normal">✓ Live Telemetry Verified</span>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Symbol Meanings Table */}
                  <div>
                    <h4 className="text-xs font-mono uppercase tracking-wider text-slate-500 mb-2 font-semibold">Symbol Definitions & Units:</h4>
                    <div className="overflow-x-auto">
                      <table className="w-full text-xs font-mono text-left border border-slate-200 rounded-xl overflow-hidden">
                        <thead className="bg-slate-100 text-slate-700 border-b border-slate-200">
                          <tr>
                            <th className="p-2.5">Symbol</th>
                            <th className="p-2.5">Physical Quantity / Meaning</th>
                            <th className="p-2.5">SI Unit</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100 bg-white">
                          {item.symbols.map((sym, idx) => (
                            <tr key={idx} className="hover:bg-slate-50">
                              <td className="p-2.5 font-bold text-[#0071E3]">{sym.symbol}</td>
                              <td className="p-2.5 text-slate-800">{sym.meaning}</td>
                              <td className="p-2.5 text-slate-500">{sym.unit}</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>

                  {/* Engineering Explanation and Project Application */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs leading-relaxed">
                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <h5 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5 font-mono text-[11px] text-[#0071E3]">
                        <Zap className="w-3.5 h-3.5" />
                        Engineering Principle & Viva Relevance:
                      </h5>
                      <p className="text-slate-600 font-sans">{item.engineeringExplanation}</p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
                      <h5 className="font-semibold text-slate-900 mb-1 flex items-center gap-1.5 font-mono text-[11px] text-purple-700">
                        <Layers className="w-3.5 h-3.5" />
                        Application in this Capstone Project:
                      </h5>
                      <p className="text-slate-600 font-sans">{item.projectApplication}</p>
                    </div>
                  </div>

                </div>
              )}
            </div>
          );
        })}
      </div>
    </section>
  );
};
