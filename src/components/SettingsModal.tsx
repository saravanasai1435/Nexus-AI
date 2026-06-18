import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Moon, Sun, Monitor, Bell, Shield, Sliders, Palette, Check } from 'lucide-react';
import { cn } from '../lib/utils';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: any;
  onSettingChange: (key: string, value: any) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({ isOpen, onClose, settings, onSettingChange }) => {
  const [activeTab, setActiveTab] = React.useState('General');

  const TABS = ['General', 'Interface', 'Security'];

  const ACCENT_COLORS = ['#0284C7', '#7C3AED', '#10B981', '#F59E0B', '#EF4444'];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-xl z-[100]"
          />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-3xl glass-panel rounded-[2rem] border-white/10 z-[101] overflow-hidden flex flex-col md:flex-row h-[550px] shadow-2xl"
          >
            {/* Sidebar */}
            <div className="w-full md:w-60 bg-white/5 border-r border-white/5 p-6 flex flex-col justify-between">
              <div className="space-y-6">
                <div>
                  <div className="text-[10px] text-blue-400 uppercase font-bold tracking-[0.2em] mb-1">System Core</div>
                  <h2 className="text-2xl font-bold text-white">Settings</h2>
                </div>
                <nav className="space-y-1">
                  {TABS.map(tab => (
                    <button 
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl text-xs font-semibold uppercase tracking-widest transition-all",
                        activeTab === tab ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"
                      )}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
              <div className="text-[9px] text-white/20 uppercase tracking-widest font-bold">SparkFlow V2.0</div>
            </div>

            {/* Content */}
            <div className="flex-1 p-10 overflow-y-auto relative bg-[#0D0D0D]">
              <button 
                onClick={onClose}
                className="absolute top-8 right-8 p-2 rounded-xl hover:bg-white/5 text-white/40 hover:text-white transition-all"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="space-y-10">
                {activeTab === 'General' && (
                  <>
                    <SectionLabel icon={<Sliders className="w-4 h-4" />} title="Inference Preferences" />
                    <SettingRow 
                      title="Optimized Intelligence" 
                      desc="Automatically select the best model for the task."
                      control={<Toggle active={settings.optimizedInference} onToggle={() => onSettingChange('optimizedInference', !settings.optimizedInference)} />}
                    />
                    <SettingRow 
                      title="Persistence Engine" 
                      desc="Keep active threads in memory for faster switching."
                      control={<Toggle active={settings.contextPersistence} onToggle={() => onSettingChange('contextPersistence', !settings.contextPersistence)} />}
                    />
                    <SectionLabel icon={<Bell className="w-4 h-4" />} title="Notifications" />
                     <SettingRow 
                      title="Completion Alerts" 
                      desc="Notify when background generation ends."
                      control={<Toggle active={settings.notifications} onToggle={() => onSettingChange('notifications', !settings.notifications)} />}
                    />
                  </>
                )}

                {activeTab === 'Interface' && (
                  <>
                    <SectionLabel icon={<Palette className="w-4 h-4" />} title="Visual Engine" />
                    <SettingRow 
                      title="Glassmorphism" 
                      desc="Rich background blur and transparency effects."
                      control={<Toggle active={settings.glassMode} onToggle={() => onSettingChange('glassMode', !settings.glassMode)} />}
                    />
                    <SettingRow 
                      title="Fluid Animations" 
                      desc="Enable high-frame-rate interface transitions."
                      control={<Toggle active={settings.motionDynamics} onToggle={() => onSettingChange('motionDynamics', !settings.motionDynamics)} />}
                    />
                    <div className="space-y-4">
                      <p className="text-[10px] text-white/30 uppercase font-bold tracking-widest">Interface Hue</p>
                      <div className="flex gap-4">
                        {ACCENT_COLORS.map(c => (
                          <button 
                            key={c} 
                            onClick={() => onSettingChange('accentColor', c)}
                            className={cn(
                                "w-10 h-10 rounded-full border-4 flex items-center justify-center transition-all",
                                settings.accentColor === c ? "border-white" : "border-transparent scale-90 opacity-60 hover:opacity-100 hover:scale-100"
                            )}
                            style={{ backgroundColor: c }}
                          >
                             {settings.accentColor === c && <Check className="w-5 h-5 text-white" />}
                          </button>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {activeTab === 'Security' && (
                  <>
                    <SectionLabel icon={<Shield className="w-4 h-4" />} title="API Protocol Keys" />
                    <div className="space-y-6">
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">OpenRouter API Key</label>
                        <input 
                          type="password"
                          value={settings.openrouterKey || ''}
                          onChange={(e) => onSettingChange('openrouterKey', e.target.value)}
                          placeholder="sk-or-v1-..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/30 transition-all"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-[10px] text-white/30 uppercase font-bold tracking-widest">NVIDIA API Key</label>
                        <input 
                          type="password"
                          value={settings.nvidiaKey || ''}
                          onChange={(e) => onSettingChange('nvidiaKey', e.target.value)}
                          placeholder="nvapi-..."
                          className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-xs text-white outline-none focus:border-blue-500/30 transition-all"
                        />
                      </div>
                    </div>
                    
                    <div className="mt-8 p-4 rounded-xl bg-amber-500/5 border border-amber-500/20">
                      <p className="text-[10px] text-amber-500 font-medium leading-relaxed">
                        Note: Keys provided here are used for the current session. For permanent storage, configure environment variables in the project settings.
                      </p>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

const SectionLabel = ({ icon, title }: { icon: any, title: string }) => (
  <div className="flex items-center gap-3 mb-6">
    <div className="text-blue-400">{icon}</div>
    <span className="text-[10px] text-white/30 uppercase font-bold tracking-[0.3em]">{title}</span>
  </div>
);

const SettingRow = ({ title, desc, control }: { title: string, desc: string, control: any }) => (
  <div className="flex items-center justify-between py-5 border-b border-white/5">
    <div>
      <h4 className="text-sm font-semibold text-white">{title}</h4>
      <p className="text-xs text-white/40 mt-1">{desc}</p>
    </div>
    {control}
  </div>
);

const Toggle = ({ active, onToggle }: { active?: boolean, onToggle?: () => void }) => (
  <button 
    onClick={onToggle}
    className={cn(
      "w-12 h-6 rounded-full relative transition-all",
      active ? "bg-blue-500 shadow-lg shadow-blue-500/20" : "bg-white/10"
    )}
  >
    <div className={cn(
      "absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md",
      active ? "left-7" : "left-1"
    )} />
  </button>
);
