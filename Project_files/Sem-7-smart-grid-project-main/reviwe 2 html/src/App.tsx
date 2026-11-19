import React, { useState } from 'react';
import { PowerDataProvider, usePowerData } from './context/PowerDataContext';
import { Header } from './components/common/Header';
import { HeroSection } from './components/dashboard/HeroSection';
import { PhaseCardsSection } from './components/dashboard/PhaseCardsSection';
import { WaveformCanvas } from './components/common/WaveformCanvas';
import { ThreePhaseAnalysisSection } from './components/dashboard/ThreePhaseAnalysisSection';
import { FormulaLibrarySection } from './components/education/FormulaLibrarySection';
import { StandardsSection } from './components/standards/StandardsSection';
import { HealthScoreSection } from './components/intelligence/HealthScoreSection';
import { PredictiveMaintenance } from './components/intelligence/PredictiveMaintenance';
import { HardwareArchitectureSection } from './components/hardware/HardwareArchitectureSection';
import { HistoricalTrendsSection } from './components/analytics/HistoricalTrendsSection';
import { EnergyCostSection } from './components/analytics/EnergyCostSection';
import { AlertsCenterSection } from './components/analytics/AlertsCenterSection';
import { VivaDefenseSection } from './components/education/VivaDefenseSection';
import { FaultInjectionModal } from './components/modals/FaultInjectionModal';
import { RealHardwareModal } from './components/modals/RealHardwareModal';
import { AuditReportModal } from './components/modals/AuditReportModal';
import { 
  Zap, 
  Activity, 
  ShieldCheck, 
  Cpu, 
  FileText, 
  GraduationCap, 
  Sliders, 
  Wifi, 
  Layers, 
  Coins 
} from 'lucide-react';

const MainAppContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('dashboard');
  const [isFaultModalOpen, setIsFaultModalOpen] = useState(false);
  const [isEspModalOpen, setIsEspModalOpen] = useState(false);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);

  const { isPresentationMode, activeFault } = usePowerData();

  return (
    <div className="min-h-screen flex flex-col bg-[#F5F5F7] text-slate-900 selection:bg-blue-500 selection:text-white font-sans antialiased">
      {/* Top Header */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        onOpenFaultModal={() => setIsFaultModalOpen(true)}
        onOpenEspModal={() => setIsEspModalOpen(true)}
        onOpenReportModal={() => setIsReportModalOpen(true)}
      />

      {/* Presentation / Viva Mode Floating Banner */}
      {isPresentationMode && (
        <div className="bg-indigo-50/90 backdrop-blur-md border-b border-indigo-200/80 px-4 py-2 text-center text-xs font-medium text-indigo-900 flex items-center justify-center gap-3">
          <span className="w-2 h-2 rounded-full bg-indigo-600 animate-ping" />
          <span>
            🎓 <strong>VIVA EXAMINATION REVIEW MODE ACTIVE</strong>: Showing expanded mathematical proofs, standard compliance references, and interactive fault controls.
          </span>
          <button
            onClick={() => setActiveTab('viva')}
            className="px-2.5 py-0.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[11px] font-semibold transition-colors"
          >
            Open Examiner Q&A Guide
          </button>
        </div>
      )}

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-8">
        
        {/* VIEW 1: Main Dashboard (Default overview) */}
        {activeTab === 'dashboard' && (
          <div className="space-y-8">
            {/* Hero Section */}
            <HeroSection
              onExplore={() => {
                const el = document.getElementById('monitoring-cards');
                el?.scrollIntoView({ behavior: 'smooth' });
              }}
              onTechOverview={() => setActiveTab('hardware')}
            />

            {/* 60 FPS Real-Time Waveform Visualizer */}
            <WaveformCanvas />

            {/* Three-Phase Physical Measurement Cards (R, Y, B) */}
            <div id="monitoring-cards">
              <PhaseCardsSection />
            </div>

            {/* Three-Phase Calculated Parameters & Visual Tools */}
            <ThreePhaseAnalysisSection />

            {/* Quick Teaser Grid: Intelligent Scoring & Cost */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-blue-500" />
                    Power Quality Health Score
                  </h3>
                  <button
                    onClick={() => setActiveTab('scoring')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View Breakdown →
                  </button>
                </div>
                <HealthScoreSection />
              </div>

              <div className="space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-slate-200">
                  <h3 className="text-sm font-bold text-slate-800 tracking-tight flex items-center gap-2">
                    <Coins className="w-4 h-4 text-blue-500" />
                    Energy Cost & Carbon Estimator
                  </h3>
                  <button
                    onClick={() => setActiveTab('trends')}
                    className="text-xs font-semibold text-blue-600 hover:text-blue-700 transition-colors"
                  >
                    View Analytics →
                  </button>
                </div>
                <EnergyCostSection />
              </div>
            </div>

            {/* Real-Time Event Alerts Strip */}
            <AlertsCenterSection />
          </div>
        )}

        {/* VIEW 2: 3-Phase Electrical Analysis */}
        {activeTab === 'analysis' && (
          <div className="space-y-6">
            <PhaseCardsSection />
            <ThreePhaseAnalysisSection />
            <WaveformCanvas />
          </div>
        )}

        {/* VIEW 3: Electrical Formula Library */}
        {activeTab === 'formulas' && (
          <FormulaLibrarySection />
        )}

        {/* VIEW 4: Power Quality Standards Reference */}
        {activeTab === 'standards' && (
          <StandardsSection />
        )}

        {/* VIEW 5: Intelligent Scoring Engine */}
        {activeTab === 'scoring' && (
          <div className="space-y-6">
            <HealthScoreSection />
            <ThreePhaseAnalysisSection />
          </div>
        )}

        {/* VIEW 6: Predictive Maintenance & Machine Learning */}
        {activeTab === 'predictive' && (
          <PredictiveMaintenance />
        )}

        {/* VIEW 7: ESP32 + PZEM Hardware Architecture */}
        {activeTab === 'hardware' && (
          <HardwareArchitectureSection />
        )}

        {/* VIEW 8: Historical Trends & Analytics */}
        {activeTab === 'trends' && (
          <div className="space-y-6">
            <HistoricalTrendsSection />
            <EnergyCostSection />
          </div>
        )}

        {/* VIEW 9: Final Year Viva Defense Center */}
        {activeTab === 'viva' && (
          <VivaDefenseSection />
        )}

      </main>

      {/* Apple SCADA Footer */}
      <footer className="border-t border-black/5 bg-white/70 backdrop-blur-md py-8 text-xs font-sans text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-wrap items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="text-slate-800 font-semibold flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-blue-500" />
              <span>Three-Phase Smart Power Monitoring & Power Quality Analysis System</span>
            </div>
            <p className="text-slate-400 text-[11px]">
              Final Year Capstone Project • Electrical & Electronics Engineering (EEE)
            </p>
          </div>

          <div className="flex items-center gap-4 text-[11px] font-medium">
            <span className="text-slate-600">Microcontroller: ESP32 DevKit V1</span>
            <span>•</span>
            <span className="text-slate-600">Sensors: 3× PZEM-004T v3.0</span>
            <span>•</span>
            <span className="text-blue-600 font-semibold">CEA 2019 / IEC 61000 Compliant</span>
          </div>
        </div>
      </footer>

      {/* Interactive Modals */}
      <FaultInjectionModal
        isOpen={isFaultModalOpen}
        onClose={() => setIsFaultModalOpen(false)}
      />

      <RealHardwareModal
        isOpen={isEspModalOpen}
        onClose={() => setIsEspModalOpen(false)}
      />

      <AuditReportModal
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <PowerDataProvider>
      <MainAppContent />
    </PowerDataProvider>
  );
}
