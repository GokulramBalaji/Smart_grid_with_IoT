import React, { useState } from 'react';
import { VIVA_QUESTIONS } from '../../data/hardwareData';
import { OriginBadge } from '../common/Badge';
import { 
  GraduationCap, 
  HelpCircle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  Layers, 
  CheckCircle2, 
  Code, 
  UserCheck, 
  Award,
  Zap,
  Cpu
} from 'lucide-react';

export const VivaDefenseSection: React.FC = () => {
  const [openQId, setOpenQId] = useState<number>(1);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');

  const categories = ['ALL', 'Measurement', 'Calculations', 'Hardware', 'Power Quality', 'ML & IoT'];

  const filteredQuestions = VIVA_QUESTIONS.filter(q => {
    return selectedCategory === 'ALL' || q.category === selectedCategory;
  });

  const projectStoryline = [
    { step: '1. Problem Statement', question: 'What is the electrical problem?', answer: 'Unmonitored three-phase power leads to undetected phase voltage sags, current unbalance, and poor power factor that burn out induction motors and incur steep utility penalty tariffs.' },
    { step: '2. Solution Architecture', question: 'What is the engineered solution?', answer: 'An IoT Edge monitoring system combining 3× PZEM-004T dedicated energy ASICs with an ESP32 microcontroller and a high-performance web analytics platform.' },
    { step: '3. Measured Parameters', question: 'What is directly measured?', answer: 'Single-phase AC Voltage, Current, Active Power, Power Factor, Frequency, and Accumulated Energy across each phase (R, Y, B).' },
    { step: '4. Calculated Parameters', question: 'What is calculated in software?', answer: 'Three-phase Average Voltage, Average Current, Total Active Power (W/kW), Apparent Power (kVA), Reactive Power (kVAR), True System Power Factor (Ptotal/Stotal), and Voltage/Current Imbalance Percentages.' },
    { step: '5. Regulatory Comparison', question: 'What standards are compared?', answer: 'Central Electricity Authority (CEA 2019) Grid Connectivity Regulations and IEC 61000-4-30 / EN 50160 power quality benchmarks.' },
    { step: '6. Intelligent Scoring', question: 'What is scored?', answer: 'A 0–100 Power Quality Health Score synthesizing voltage deviations, frequency stability, power factor, and unbalance severity.' },
    { step: '7. Predictive Maintenance', question: 'What is forecasted?', answer: 'Time-series linear and polynomial regression forecasting of parameter trajectories with 95% confidence intervals to identify developing faults before failure.' },
    { step: '8. End Benefit', question: 'What is the industrial benefit?', answer: 'Immediate operational visibility, proactive maintenance scheduling, equipment lifetime extension, and energy cost optimization.' }
  ];

  return (
    <section className="space-y-6">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-2 border-b border-slate-800">
        <div>
          <div className="flex items-center gap-2">
            <h2 className="text-xl font-bold text-white tracking-tight flex items-center gap-2">
              <GraduationCap className="w-6 h-6 text-amber-400" />
              Final-Year EEE Viva Technical Defense & Review Center
            </h2>
            <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30 text-xs font-mono font-bold">
              Oral Exam Guide
            </span>
          </div>
          <p className="text-xs text-slate-400 font-mono mt-1">
            Authoritative technical responses, mathematical proofs, and presentation storyline for project evaluators
          </p>
        </div>

        <div className="px-3 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400">
          Curated for External Reviewers & Viva Committees
        </div>
      </div>

      {/* Eight-Point Project Narrative Storyline */}
      <div className="industrial-card p-5 space-y-4">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Layers className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white uppercase font-mono tracking-wider">
            The 8-Step Project Technical Storyline (Presentation Script)
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {projectStoryline.map((item, idx) => (
            <div key={idx} className="p-3 rounded-lg bg-[#080C14] border border-slate-800 space-y-1.5 flex flex-col justify-between">
              <div>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400 font-semibold">
                  {item.step}
                </span>
                <h4 className="text-xs font-bold text-white mt-1.5 font-sans">
                  {item.question}
                </h4>
                <p className="text-[11px] text-slate-300 font-sans mt-1 leading-relaxed">
                  {item.answer}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Category Tabs for Viva Questions */}
      <div className="industrial-card p-3 flex flex-wrap items-center gap-2">
        <span className="text-xs font-mono text-slate-400 mr-2">Viva Topics:</span>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setSelectedCategory(cat)}
            className={`px-3 py-1 rounded text-xs font-mono transition-all ${
              selectedCategory === cat
                ? 'bg-amber-500 text-black font-bold shadow-glow-amber'
                : 'bg-slate-900 text-slate-400 hover:text-white border border-slate-800'
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Top Viva Questions Accordion */}
      <div className="space-y-3">
        {filteredQuestions.map(q => {
          const isOpen = openQId === q.id;

          return (
            <div
              key={q.id}
              className={`industrial-card transition-all duration-200 border ${
                isOpen ? 'border-amber-500/50 shadow-panel' : 'border-slate-800/80 hover:border-slate-700'
              }`}
            >
              {/* Question Header */}
              <div
                onClick={() => setOpenQId(isOpen ? 0 : q.id)}
                className="p-4 flex items-center justify-between gap-3 cursor-pointer select-none"
              >
                <div className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 flex items-center justify-center font-mono font-bold text-xs shrink-0">
                    Q{q.id}
                  </span>
                  <div>
                    <h4 className="text-sm font-bold text-white font-sans">
                      {q.question}
                    </h4>
                    <span className="text-[10px] font-mono text-cyan-400">
                      Topic: {q.category}
                    </span>
                  </div>
                </div>

                <button className="text-slate-400 hover:text-white">
                  {isOpen ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Expandable Technical Answer */}
              {isOpen && (
                <div className="px-4 pb-5 pt-1 border-t border-slate-800/80 space-y-3 text-xs">
                  {/* Short Summary Answer */}
                  <div className="p-3 rounded-lg bg-cyan-950/20 border border-cyan-500/30 font-sans text-cyan-200">
                    <strong className="font-mono text-cyan-400 block mb-1">Direct Technical Summary:</strong>
                    {q.shortAnswer}
                  </div>

                  {/* Detailed Explanation */}
                  <div className="space-y-1 font-sans text-slate-300 leading-relaxed">
                    <strong className="font-mono text-slate-200 block">In-Depth Engineering Rationale:</strong>
                    <p>{q.detailedExplanation}</p>
                  </div>

                  {/* Formula or Code block */}
                  {q.formulaOrCode && (
                    <div className="p-2.5 rounded bg-[#080C14] border border-slate-800 font-mono text-[11px] text-amber-300">
                      <code>{q.formulaOrCode}</code>
                    </div>
                  )}

                  {/* Examiner Tip */}
                  <div className="p-2.5 rounded bg-emerald-950/20 border border-emerald-500/30 text-emerald-300 font-sans text-[11px] flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span><strong>Pro-Tip for Committee Defense:</strong> {q.examinerTip}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Project & Team Attribution Card */}
      <div className="industrial-card p-5 space-y-3 border-cyan-500/30">
        <div className="flex items-center gap-2 pb-2 border-b border-slate-800">
          <Award className="w-5 h-5 text-cyan-400" />
          <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
            Final Year Project Metadata & Verification
          </h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block">Project Title:</span>
            <strong className="text-white">Three-Phase Smart Power Monitoring System</strong>
          </div>
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block">Department:</span>
            <strong className="text-cyan-400">Electrical & Electronics Engineering (EEE)</strong>
          </div>
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block">Review Stage:</span>
            <strong className="text-amber-400">Review 2 / Final Demonstration</strong>
          </div>
          <div className="p-2.5 rounded bg-slate-900/60 border border-slate-800">
            <span className="text-slate-500 block">Hardware Target:</span>
            <strong className="text-emerald-400">ESP32 + 3× PZEM-004T v3.0</strong>
          </div>
        </div>
      </div>
    </section>
  );
};
