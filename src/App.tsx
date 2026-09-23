/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Header, type NavTab } from './components/Header';
import { IPv4Calculator } from './components/IPv4Calculator';
import { SubnetSplitterView } from './components/SubnetSplitterView';
import { VlsmView } from './components/VlsmView';
import { IPv6Calculator } from './components/IPv6Calculator';
import { CidrReferenceTable } from './components/CidrReferenceTable';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('ipv4');

  // Shared state between views
  const [currentIp, setCurrentIp] = useState<string>('192.168.1.1');
  const [currentCidr, setCurrentCidr] = useState<number>(24);

  // Splitter state
  const [splitterIp, setSplitterIp] = useState<string>('192.168.1.0');
  const [splitterCidr, setSplitterCidr] = useState<number>(24);

  // VLSM state
  const [vlsmIp, setVlsmIp] = useState<string>('192.168.0.0');
  const [vlsmCidr, setVlsmCidr] = useState<number>(23);

  // Navigation callbacks
  const handleNavigateToSplitter = (ip: string, cidr: number) => {
    setSplitterIp(ip);
    setSplitterCidr(cidr);
    setActiveTab('splitter');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleNavigateToVlsm = (ip: string, cidr: number) => {
    setVlsmIp(ip);
    setVlsmCidr(cidr);
    setActiveTab('vlsm');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectSubnetForCalc = (ip: string, cidr: number) => {
    setCurrentIp(ip);
    setCurrentCidr(cidr);
    setActiveTab('ipv4');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSelectCidrFromTable = (cidr: number) => {
    setCurrentCidr(cidr);
    setActiveTab('ipv4');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleReset = () => {
    setCurrentIp('192.168.1.1');
    setCurrentCidr(24);
    setSplitterIp('192.168.1.0');
    setSplitterCidr(24);
    setVlsmIp('192.168.0.0');
    setVlsmCidr(23);
    setActiveTab('ipv4');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      <Header
        activeTab={activeTab}
        onTabChange={setActiveTab}
        onReset={handleReset}
      />

      <main className="flex-1 max-w-7xl w-full mx-auto px-4 lg:px-8 py-8">
        {/* Intro kicker */}
        <div className="mb-6 flex flex-col sm:flex-row sm:items-baseline justify-between gap-2 border-b border-slate-800/60 pb-4">
          <div>
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-white">
              {activeTab === 'ipv4' && 'Calculadora de Sub-redes IPv4'}
              {activeTab === 'splitter' && 'Divisor de Sub-redes (Subnet Splitter)'}
              {activeTab === 'vlsm' && 'Planejador de Máscara Variável (VLSM)'}
              {activeTab === 'ipv6' && 'Calculadora de Prefixo IPv6'}
              {activeTab === 'reference' && 'Guia & Tabela de Referência CIDR'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-400 mt-0.5">
              {activeTab === 'ipv4' &&
                'Cálculo em tempo real de máscaras, faixas utilizáveis, broadcast, visualização bitwise e análise de classes.'}
              {activeTab === 'splitter' &&
                'Subdivisão hierárquica contígua de blocos CIDR em sub-redes menores com exportação de dados.'}
              {activeTab === 'vlsm' &&
                'Alocação otimizada sem sobreposição de endereços baseada em demandas reais por departamento.'}
              {activeTab === 'ipv6' &&
                'Análise de prefixos de 128 bits, identificador de interface (EUI-64/SLAAC) e contagem de /64.'}
              {activeTab === 'reference' &&
                'Tabela comparativa rápida de todos os prefixos /0 a /32 com especificações e aplicações práticas.'}
            </p>
          </div>

          <div className="text-xs text-slate-500 font-mono self-start sm:self-auto">
            IPv4 / IPv6 RFCs Compliant
          </div>
        </div>

        {/* Tab Views */}
        {activeTab === 'ipv4' && (
          <IPv4Calculator
            initialIp={currentIp}
            initialCidr={currentCidr}
            onNavigateToSplitter={handleNavigateToSplitter}
            onNavigateToVlsm={handleNavigateToVlsm}
          />
        )}

        {activeTab === 'splitter' && (
          <SubnetSplitterView
            initialIp={splitterIp}
            initialCidr={splitterCidr}
            onSelectSubnet={handleSelectSubnetForCalc}
          />
        )}

        {activeTab === 'vlsm' && (
          <VlsmView
            initialIp={vlsmIp}
            initialCidr={vlsmCidr}
            onSelectSubnet={handleSelectSubnetForCalc}
          />
        )}

        {activeTab === 'ipv6' && <IPv6Calculator />}

        {activeTab === 'reference' && (
          <CidrReferenceTable onSelectCidr={handleSelectCidrFromTable} />
        )}
      </main>

      {/* Clean Footer (Anti-Slop compliant, zero fake telemetry) */}
      <footer className="mt-auto border-t border-slate-800/80 py-6 px-4 lg:px-8 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-400">SubnetCIDR</span>
            <span>·</span>
            <span>Ferramenta para Engenharia de Redes & Infraestrutura</span>
          </div>
          <div className="flex items-center gap-3 text-slate-500">
            <span>RFC 791 (IPv4)</span>
            <span>·</span>
            <span>RFC 1918 (Privado)</span>
            <span>·</span>
            <span>RFC 3021 (/31 P2P)</span>
            <span>·</span>
            <span>RFC 8200 (IPv6)</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
