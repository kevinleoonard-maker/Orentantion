import React, { useState, useEffect } from 'react';
import { TopBar } from './components/TopBar';
import { HeroSection } from './components/HeroSection';
import { FlappyAILab } from './components/exhibits/FlappyAILab';
import { CPULab } from './components/exhibits/CPULab';
import { PathfindingLab } from './components/exhibits/PathfindingLab';
import { NetworkLab } from './components/exhibits/NetworkLab';
import { VisionLab } from './components/exhibits/VisionLab';
import { SessionRecap } from './components/SessionRecap';
import { sound } from './utils/sound';
import { Brain, Cpu, Compass, Network, Eye, Award } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('ai');
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true);
  const [progressPercent, setProgressPercent] = useState<number>(0);

  // Cumulative session stats
  const [activityStats, setActivityStats] = useState({
    aiGenerations: 1,
    cpuSteps: 0,
    pathfindRuns: 0,
    networkPackets: 0,
    visionFilters: 0,
  });

  const handleToggleSound = () => {
    sound.enabled = !sound.enabled;
    setSoundEnabled(sound.enabled);
  };

  const handleSelectTab = (tabId: string) => {
    setActiveTab(tabId);
    sound.playBlip(550, 'sine', 0.05);
    const el = document.getElementById('exhibits-deck');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Scroll listener for progress calculation
  useEffect(() => {
    const handleScroll = () => {
      const scrollY = window.scrollY;
      const docHeight = document.documentElement.scrollHeight - window.innerHeight;
      const progress = docHeight > 0 ? (scrollY / docHeight) * 100 : 0;
      setProgressPercent(progress);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const tabs = [
    { id: 'ai', label: '1. AI Neuroevoluzione', icon: Brain, color: 'text-sky-400' },
    { id: 'cpu', label: '2. Micro-CPU Von Neumann', icon: Cpu, color: 'text-amber-400' },
    { id: 'path', label: '3. Navigatore A*', icon: Compass, color: 'text-emerald-400' },
    { id: 'network', label: '4. Pacchetti TCP/IP', icon: Network, color: 'text-purple-400' },
    { id: 'vision', label: '5. Computer Vision', icon: Eye, color: 'text-rose-400' },
  ];

  return (
    <div className="min-h-screen bg-[#070b14] text-slate-100 flex flex-col font-sans selection:bg-sky-500/30 selection:text-sky-200">
      {/* Top Header */}
      <TopBar
        activeTab={activeTab}
        onSelectTab={handleSelectTab}
        soundEnabled={soundEnabled}
        onToggleSound={handleToggleSound}
        progressPercent={progressPercent}
      />

      <main className="flex-1">
        {/* Workshop Hero */}
        <HeroSection onSelectExhibit={handleSelectTab} />

        {/* Central Exhibits Deck */}
        <section id="exhibits-deck" className="py-16 px-4 sm:px-6 max-w-6xl mx-auto w-full">
          {/* Machine Selector Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-4 mb-8 border-b border-slate-800">
            {tabs.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  onClick={() => handleSelectTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-mono font-semibold whitespace-nowrap border transition-all ${
                    isActive
                      ? 'bg-slate-900 border-slate-600 text-white shadow-lg ring-1 ring-slate-600'
                      : 'bg-[#0a0f1d] border-slate-800 text-slate-400 hover:text-slate-200 hover:border-slate-700'
                  }`}
                >
                  <Icon className={`w-4 h-4 ${tab.color}`} />
                  <span>{tab.label}</span>
                </button>
              );
            })}
          </div>

          {/* Active Interactive Exhibit Machine */}
          <div>
            {activeTab === 'ai' && (
              <FlappyAILab
                onActivity={() =>
                  setActivityStats((s) => ({ ...s, aiGenerations: s.aiGenerations + 1 }))
                }
              />
            )}

            {activeTab === 'cpu' && (
              <CPULab
                onActivity={() =>
                  setActivityStats((s) => ({ ...s, cpuSteps: s.cpuSteps + 1 }))
                }
              />
            )}

            {activeTab === 'path' && (
              <PathfindingLab
                onActivity={() =>
                  setActivityStats((s) => ({ ...s, pathfindRuns: s.pathfindRuns + 1 }))
                }
              />
            )}

            {activeTab === 'network' && (
              <NetworkLab
                onActivity={() =>
                  setActivityStats((s) => ({ ...s, networkPackets: s.networkPackets + 8 }))
                }
              />
            )}

            {activeTab === 'vision' && (
              <VisionLab
                onActivity={() =>
                  setActivityStats((s) => ({ ...s, visionFilters: s.visionFilters + 1 }))
                }
              />
            )}
          </div>
        </section>

        {/* Personalized Session Certificate & Recap */}
        <SessionRecap
          activityStats={activityStats}
          onRestartAll={() => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
            sound.playSuccess();
          }}
        />
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800 bg-[#060911] py-8 text-center text-xs text-slate-500 font-mono">
        <div className="max-w-6xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <span>Istituto Giancarlo Vallauri · Fossano (CN)</span>
          </div>
          <div>
            <span>Dipartimento di Informatica &amp; Telecomunicazioni</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
