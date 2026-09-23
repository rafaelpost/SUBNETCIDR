import React from 'react';
import { Network, RotateCcw, Share2 } from 'lucide-react';

export type NavTab = 'ipv4' | 'splitter' | 'vlsm' | 'ipv6' | 'reference';

interface HeaderProps {
  activeTab: NavTab;
  onTabChange: (tab: NavTab) => void;
  onReset: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  onTabChange,
  onReset,
}) => {
  return (
    <header className="sticky top-0 z-50 bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-8 py-3.5">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        {/* Zone 1: Brand Wordmark (Single text element) */}
        <div className="flex items-center gap-2.5 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Network className="w-4 h-4" />
          </div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-white font-sans">
            Subnet<span className="text-cyan-400 font-mono">CIDR</span>
          </span>
        </div>

        {/* Zone 2: Navigation Links / Tabs */}
        <nav className="flex items-center gap-1 sm:gap-1.5 overflow-x-auto py-1 text-xs font-medium">
          <button
            type="button"
            onClick={() => onTabChange('ipv4')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'ipv4'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Calculadora IPv4
          </button>

          <button
            type="button"
            onClick={() => onTabChange('splitter')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'splitter'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Divisor CIDR
          </button>

          <button
            type="button"
            onClick={() => onTabChange('vlsm')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'vlsm'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Planejador VLSM
          </button>

          <button
            type="button"
            onClick={() => onTabChange('ipv6')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'ipv6'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            IPv6
          </button>

          <button
            type="button"
            onClick={() => onTabChange('reference')}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition-colors ${
              activeTab === 'reference'
                ? 'bg-slate-800 text-cyan-300 border border-slate-700 font-semibold'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-900/60'
            }`}
          >
            Tabela CIDR
          </button>
        </nav>

        {/* Zone 3: 1-2 Primary Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={onReset}
            title="Redefinir cálculos para o padrão"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-900 hover:bg-slate-800 border border-slate-800 rounded-lg transition-colors whitespace-nowrap"
          >
            <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
            <span className="hidden sm:inline">Redefinir</span>
          </button>
        </div>
      </div>
    </header>
  );
};
