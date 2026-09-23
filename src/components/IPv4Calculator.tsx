import React, { useState, useMemo } from 'react';
import {
  calculateSubnet,
  cidrToMask,
  isValidIp,
  ipToLong,
  isIpInSubnet,
  type IPv4SubnetInfo,
} from '../utils/subnetIPv4';
import { CopyButton } from './CopyButton';
import { BinaryVisualizer } from './BinaryVisualizer';
import {
  Network,
  Globe,
  ShieldCheck,
  Binary,
  Layers,
  Search,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Sparkles,
  ArrowRight,
} from 'lucide-react';

interface IPv4CalculatorProps {
  initialIp?: string;
  initialCidr?: number;
  onNavigateToSplitter?: (ip: string, cidr: number) => void;
  onNavigateToVlsm?: (ip: string, cidr: number) => void;
}

const PRESETS = [
  { label: 'LAN Doméstica / Escritório', ip: '192.168.1.1', cidr: 24 },
  { label: 'Rede Privada Corporativa', ip: '10.0.0.0', cidr: 16 },
  { label: 'Data Center Médio', ip: '172.16.0.0', cidr: 20 },
  { label: 'Wi-Fi Alta Densidade', ip: '192.168.0.0', cidr: 23 },
  { label: 'Link WAN Ponto a Ponto', ip: '10.255.0.1', cidr: 30 },
  { label: 'Provedor CGNAT (RFC 6598)', ip: '100.64.0.0', cidr: 10 },
];

export const IPv4Calculator: React.FC<IPv4CalculatorProps> = ({
  initialIp = '192.168.1.1',
  initialCidr = 24,
  onNavigateToSplitter,
  onNavigateToVlsm,
}) => {
  const [ipInput, setIpInput] = useState<string>(initialIp);
  const [cidr, setCidr] = useState<number>(initialCidr);
  const [showBinaryView, setShowBinaryView] = useState<boolean>(true);

  // Test IP verification
  const [testIpInput, setTestIpInput] = useState<string>('192.168.1.45');

  // Handle typing IP or pasting CIDR (e.g. 10.0.0.1/24)
  const handleIpChange = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.includes('/')) {
      const [ipPart, cidrPart] = trimmed.split('/');
      setIpInput(ipPart);
      const parsedCidr = parseInt(cidrPart, 10);
      if (!isNaN(parsedCidr) && parsedCidr >= 0 && parsedCidr <= 32) {
        setCidr(parsedCidr);
      }
    } else {
      setIpInput(trimmed);
    }
  };

  const isCurrentIpValid = isValidIp(ipInput);

  const subnetInfo: IPv4SubnetInfo | null = useMemo(() => {
    if (!isCurrentIpValid) return null;
    try {
      return calculateSubnet(ipInput, cidr);
    } catch {
      return null;
    }
  }, [ipInput, cidr, isCurrentIpValid]);

  // Test IP analysis
  const testIpResult = useMemo(() => {
    if (!subnetInfo || !isValidIp(testIpInput)) return null;

    const inSubnet = isIpInSubnet(testIpInput, subnetInfo.networkAddress, cidr);
    if (!inSubnet) {
      return {
        belongs: false,
        message: `O IP ${testIpInput} está FORA desta sub-rede (${subnetInfo.networkAddress}/${cidr}).`,
      };
    }

    if (testIpInput === subnetInfo.networkAddress) {
      return {
        belongs: true,
        isNetwork: true,
        message: `Este é exatamente o Endereço de Rede (não utilizável por hosts).`,
      };
    }
    if (cidr <= 30 && testIpInput === subnetInfo.broadcastAddress) {
      return {
        belongs: true,
        isBroadcast: true,
        message: `Este é exatamente o Endereço de Broadcast da sub-rede.`,
      };
    }

    const testLong = ipToLong(testIpInput);
    const firstLong = ipToLong(subnetInfo.firstUsableIp);
    const hostIndex = testLong - firstLong + 1;

    return {
      belongs: true,
      isUsable: true,
      message: `Pertence à sub-rede como Host Útil #${hostIndex.toLocaleString('pt-BR')} de ${subnetInfo.usableHosts.toLocaleString('pt-BR')}.`,
    };
  }, [testIpInput, subnetInfo, cidr]);

  return (
    <div className="space-y-6">
      {/* Input Controls Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col lg:flex-row lg:items-end gap-4">
          {/* IP Input */}
          <div className="flex-1">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Endereço IP (Host ou Rede)
            </label>
            <div className="relative">
              <input
                type="text"
                value={ipInput}
                onChange={(e) => handleIpChange(e.target.value)}
                placeholder="ex: 192.168.1.1 ou 10.0.0.1/24"
                className={`w-full bg-slate-950 border px-3.5 py-2.5 rounded-lg font-mono text-sm sm:text-base text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-2 transition-all ${
                  isCurrentIpValid
                    ? 'border-slate-700/80 focus:ring-cyan-500/40 focus:border-cyan-500'
                    : 'border-rose-500/80 focus:ring-rose-500/40 focus:border-rose-500'
                }`}
              />
              {!isCurrentIpValid && (
                <div className="absolute right-3 top-3 text-rose-400 flex items-center gap-1 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>IP Inválido</span>
                </div>
              )}
            </div>
          </div>

          {/* Mask / CIDR Dropdown */}
          <div className="w-full lg:w-80">
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Máscara de Sub-rede / CIDR
              </label>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                /{cidr}
              </span>
            </div>
            <select
              value={cidr}
              onChange={(e) => setCidr(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 text-sm font-mono px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500/40 focus:border-cyan-500 transition-all cursor-pointer"
            >
              {Array.from({ length: 33 }, (_, i) => 32 - i).map((prefix) => {
                const mask = cidrToMask(prefix);
                const hosts =
                  prefix === 32
                    ? 1
                    : prefix === 31
                    ? 2
                    : Math.max(0, Math.pow(2, 32 - prefix) - 2);
                return (
                  <option key={prefix} value={prefix}>
                    /{prefix} — {mask} ({hosts.toLocaleString('pt-BR')} hosts)
                  </option>
                );
              })}
            </select>
          </div>

          {/* CIDR Slider for rapid visual adjusting */}
          <div className="w-full lg:w-48 flex flex-col justify-end">
            <span className="text-xs text-slate-400 mb-1.5 flex justify-between">
              <span>Ajuste Rápido:</span>
              <span className="font-mono text-cyan-400">/{cidr}</span>
            </span>
            <input
              type="range"
              min="0"
              max="32"
              value={cidr}
              onChange={(e) => setCidr(parseInt(e.target.value, 10))}
              className="w-full h-2 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-400"
            />
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Presets rápidos:
          </span>
          {PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setIpInput(preset.ip);
                setCidr(preset.cidr);
              }}
              className="text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700/60 font-mono transition-colors"
            >
              {preset.ip}/{preset.cidr}
              <span className="text-slate-400 font-sans ml-1.5 text-[11px] hidden sm:inline">
                ({preset.label})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Main Subnet Results */}
      {subnetInfo && (
        <div className="space-y-6">
          {/* Header Summary Banner */}
          <div className="bg-gradient-to-r from-slate-900 via-slate-900 to-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  Sub-rede Identificada
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">
                  Classe {subnetInfo.networkClass}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">
                  {subnetInfo.ipType.category}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-2xl sm:text-3xl font-bold font-mono text-white tracking-tight">
                  {subnetInfo.networkAddress}
                  <span className="text-cyan-400">/{subnetInfo.cidr}</span>
                </h2>
                <CopyButton
                  textToCopy={`${subnetInfo.networkAddress}/${subnetInfo.cidr}`}
                  label="Copiar CIDR"
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {subnetInfo.ipType.description}
              </p>
            </div>

            {/* Quick Actions (Splitter, VLSM) */}
            <div className="flex flex-wrap items-center gap-2 shrink-0">
              {onNavigateToSplitter && (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToSplitter(
                      subnetInfo.networkAddress,
                      subnetInfo.cidr
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5" />
                  Dividir Sub-rede
                </button>
              )}
              {onNavigateToVlsm && (
                <button
                  type="button"
                  onClick={() =>
                    onNavigateToVlsm(
                      subnetInfo.networkAddress,
                      subnetInfo.cidr
                    )
                  }
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-medium text-slate-200 bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors"
                >
                  <Network className="w-3.5 h-3.5 text-cyan-400" />
                  Planejar no VLSM
                </button>
              )}
            </div>
          </div>

          {/* Grid of Subnet Properties */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {/* Network Address */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Endereço de Rede
                </span>
                <span className="text-lg font-bold font-mono text-cyan-300 tabular-nums">
                  {subnetInfo.networkAddress}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Identificador do bloco (não atribuível a hosts)
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <CopyButton textToCopy={subnetInfo.networkAddress} />
              </div>
            </div>

            {/* Subnet Mask & Wildcard */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Máscara de Sub-rede
                </span>
                <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                  {subnetInfo.subnetMask}
                </span>
                <div className="text-xs text-slate-400 mt-1 flex items-center gap-1">
                  <span>Máscara Curinga (Wildcard):</span>
                  <span className="font-mono text-slate-300">
                    {subnetInfo.wildcardMask}
                  </span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between">
                <span className="text-[11px] font-mono text-slate-500">
                  Bits de Rede: {cidr} · Host: {32 - cidr}
                </span>
                <CopyButton textToCopy={subnetInfo.subnetMask} />
              </div>
            </div>

            {/* Broadcast Address */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Endereço de Broadcast
                </span>
                <span className="text-lg font-bold font-mono text-slate-100 tabular-nums">
                  {subnetInfo.broadcastAddress}
                </span>
                <p className="text-xs text-slate-500 mt-1">
                  Mensagens enviadas para todos os hosts da sub-rede
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <CopyButton textToCopy={subnetInfo.broadcastAddress} />
              </div>
            </div>

            {/* Usable Host Range */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between md:col-span-2">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Faixa de IPs Úteis (Hosts Válidos)
                </span>
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4 my-1">
                  <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 font-mono text-emerald-400 font-semibold text-sm sm:text-base tabular-nums">
                    {subnetInfo.firstUsableIp}
                  </div>
                  <span className="text-slate-500 text-xs hidden sm:inline">
                    até
                  </span>
                  <div className="bg-slate-950 px-3 py-1.5 rounded border border-slate-800 font-mono text-emerald-400 font-semibold text-sm sm:text-base tabular-nums">
                    {subnetInfo.lastUsableIp}
                  </div>
                </div>
                <p className="text-xs text-slate-500 mt-1">
                  {cidr === 31
                    ? 'Ponto a ponto RFC 3021 (ambos os IPs são atribuíveis)'
                    : cidr === 32
                    ? 'Rota de Host único'
                    : 'Endereços IP que podem ser configurados em computadores, servidores e roteadores.'}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <CopyButton textToCopy={subnetInfo.usableHostRange} label="Copiar Faixa" />
              </div>
            </div>

            {/* Total Hosts & Usable Hosts */}
            <div className="bg-slate-900/80 border border-slate-800/80 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-medium text-slate-400 uppercase tracking-wider block mb-1">
                  Capacidade de Endereços
                </span>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                    {subnetInfo.usableHosts.toLocaleString('pt-BR')}
                  </span>
                  <span className="text-xs text-slate-400">hosts úteis</span>
                </div>
                <div className="text-xs text-slate-400 mt-1">
                  Total de endereços: <span className="font-mono text-slate-200">{subnetInfo.totalHosts.toLocaleString('pt-BR')}</span>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex items-center justify-between text-xs text-slate-500 font-mono">
                <span>2^{32 - cidr} {cidr <= 30 ? '- 2' : ''}</span>
                <span className="text-slate-400">{(subnetInfo.usableHosts / (subnetInfo.totalHosts || 1) * 100).toFixed(1)}% útil</span>
              </div>
            </div>
          </div>

          {/* Interactive Subnet Membership Checker */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center gap-2 mb-3">
              <Search className="w-4 h-4 text-cyan-400" />
              <h3 className="text-sm font-semibold text-slate-200">
                Testador de Associação de IP
              </h3>
              <span className="text-xs text-slate-400">
                — Verifique se outro endereço IP pertence a esta sub-rede
              </span>
            </div>

            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                type="text"
                value={testIpInput}
                onChange={(e) => setTestIpInput(e.target.value.trim())}
                placeholder="Digite um IP para testar (ex: 192.168.1.100)"
                className="flex-1 bg-slate-950 border border-slate-700/80 px-3.5 py-2 rounded-lg font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <button
                type="button"
                onClick={() => setTestIpInput(subnetInfo.firstUsableIp)}
                className="px-3 py-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors whitespace-nowrap"
              >
                1º IP Útil
              </button>
              <button
                type="button"
                onClick={() => setTestIpInput(subnetInfo.lastUsableIp)}
                className="px-3 py-2 text-xs font-mono bg-slate-800 hover:bg-slate-700 text-slate-300 rounded border border-slate-700 transition-colors whitespace-nowrap"
              >
                Último IP Útil
              </button>
            </div>

            {testIpResult && (
              <div
                className={`mt-3 p-3 rounded-lg flex items-center gap-2.5 text-xs font-medium border ${
                  testIpResult.belongs
                    ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-300'
                    : 'bg-rose-950/40 border-rose-800/60 text-rose-300'
                }`}
              >
                {testIpResult.belongs ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
                ) : (
                  <XCircle className="w-4 h-4 text-rose-400 shrink-0" />
                )}
                <span>{testIpResult.message}</span>
              </div>
            )}
          </div>

          {/* Binary Representation Section */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Binary className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Visão Binária em 32 Bits (Bitwise)
                </h3>
              </div>
              <div className="flex items-center gap-3 text-xs">
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                  <span className="text-slate-400">Bits de Rede ({cidr})</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                  <span className="text-slate-400">Bits de Host ({32 - cidr})</span>
                </div>
              </div>
            </div>

            <div className="space-y-3">
              <BinaryVisualizer
                label={`Endereço IP Fornecido (${subnetInfo.ip})`}
                binaryOctets={subnetInfo.binary.ip}
                cidr={cidr}
              />
              <BinaryVisualizer
                label={`Máscara de Sub-rede (${subnetInfo.subnetMask})`}
                binaryOctets={subnetInfo.binary.mask}
                cidr={cidr}
              />
              <BinaryVisualizer
                label={`Endereço de Rede Calculado (${subnetInfo.networkAddress})`}
                binaryOctets={subnetInfo.binary.network}
                cidr={cidr}
              />
              <BinaryVisualizer
                label={`Endereço de Broadcast (${subnetInfo.broadcastAddress})`}
                binaryOctets={subnetInfo.binary.broadcast}
                cidr={cidr}
              />
            </div>
          </div>

          {/* Technical Specifications & Alternative Formats */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Formatos Alternativos e Parâmetros Técnicos
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-1">Valor Hexadecimal</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200">{subnetInfo.hexValue}</span>
                  <CopyButton textToCopy={subnetInfo.hexValue} showIconOnly />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-1">Inteiro 32-bit (Decimal)</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 tabular-nums">
                    {subnetInfo.integerValue.toLocaleString('pt-BR')}
                  </span>
                  <CopyButton
                    textToCopy={subnetInfo.integerValue.toString()}
                    showIconOnly
                  />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800 sm:col-span-2">
                <span className="text-slate-500 block mb-1">Registro DNS Reverso (in-addr.arpa)</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 truncate">{subnetInfo.ptrRecord}</span>
                  <CopyButton textToCopy={subnetInfo.ptrRecord} showIconOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
