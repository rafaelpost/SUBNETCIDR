import React, { useState, useMemo } from 'react';
import {
  calculateIPv6Subnet,
  isValidIPv6,
  type IPv6SubnetInfo,
} from '../utils/subnetIPv6';
import { CopyButton } from './CopyButton';
import {
  Globe,
  Layers,
  Sparkles,
  AlertCircle,
  FileCode,
  Share2,
} from 'lucide-react';

const IPV6_PRESETS = [
  { label: 'Exemplo Documentação (RFC 3849)', ip: '2001:0db8:85a3::8a2e:0370:7334', prefix: 64 },
  { label: 'Bloco de ISP / Provedor (/32)', ip: '2804:014d::', prefix: 32 },
  { label: 'Alocação Corporativa Típica (/48)', ip: '2001:db8:acad::', prefix: 48 },
  { label: 'Alocação Residencial / Varejo (/56)', ip: '2001:db8:beef::', prefix: 56 },
  { label: 'Link-Local Localhost', ip: 'fe80::1', prefix: 64 },
  { label: 'Endereço Privado ULA (RFC 4193)', ip: 'fd00:1234:5678:9abc::1', prefix: 64 },
];

export const IPv6Calculator: React.FC = () => {
  const [ipInput, setIpInput] = useState<string>('2001:0db8:85a3::8a2e:0370:7334');
  const [prefix, setPrefix] = useState<number>(64);

  const handleIpChange = (value: string) => {
    const trimmed = value.trim();
    if (trimmed.includes('/')) {
      const [ipPart, prefixPart] = trimmed.split('/');
      setIpInput(ipPart);
      const parsedPrefix = parseInt(prefixPart, 10);
      if (!isNaN(parsedPrefix) && parsedPrefix >= 1 && parsedPrefix <= 128) {
        setPrefix(parsedPrefix);
      }
    } else {
      setIpInput(trimmed);
    }
  };

  const isIpValid = isValidIPv6(ipInput);

  const ipv6Info: IPv6SubnetInfo | null = useMemo(() => {
    if (!isIpValid) return null;
    try {
      return calculateIPv6Subnet(ipInput, prefix);
    } catch {
      return null;
    }
  }, [ipInput, prefix, isIpValid]);

  return (
    <div className="space-y-6">
      {/* Input panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-cyan-400">
          <Globe className="w-5 h-5" />
          <h2 className="text-base font-semibold text-slate-100">
            Calculadora de Sub-rede IPv6 (128 Bits)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* IPv6 Address Input */}
          <div className="md:col-span-2">
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Endereço IPv6 (Comprimido ou Expandido)
            </label>
            <div className="relative">
              <input
                type="text"
                value={ipInput}
                onChange={(e) => handleIpChange(e.target.value)}
                placeholder="ex: 2001:db8::1 ou 2001:db8::1/64"
                className={`w-full bg-slate-950 border px-3.5 py-2.5 rounded-lg font-mono text-xs sm:text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 transition-colors ${
                  isIpValid
                    ? 'border-slate-700/80 focus:ring-cyan-500'
                    : 'border-rose-500/80 focus:ring-rose-500'
                }`}
              />
              {!isIpValid && (
                <div className="absolute right-3 top-2.5 text-rose-400 flex items-center gap-1 text-xs">
                  <AlertCircle className="w-4 h-4" />
                  <span>IPv6 Inválido</span>
                </div>
              )}
            </div>
          </div>

          {/* Prefix selector */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider">
                Comprimento de Prefixo
              </label>
              <span className="text-xs font-mono text-cyan-400 font-semibold">
                /{prefix}
              </span>
            </div>
            <select
              value={prefix}
              onChange={(e) => setPrefix(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 text-sm font-mono px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {[128, 127, 126, 120, 112, 96, 64, 60, 56, 52, 48, 44, 40, 36, 32, 28, 24, 20, 16, 12, 8].map(
                (p) => (
                  <option key={p} value={p}>
                    /{p}{' '}
                    {p === 64
                      ? '(Padrão LAN SLAAC)'
                      : p === 48
                      ? '(Empresas / Campus)'
                      : p === 56
                      ? '(Residencial / Small Business)'
                      : p === 32
                      ? '(Alocação ISP RIR)'
                      : ''}
                  </option>
                )
              )}
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Presets IPv6:
          </span>
          {IPV6_PRESETS.map((preset) => (
            <button
              key={preset.label}
              type="button"
              onClick={() => {
                setIpInput(preset.ip);
                setPrefix(preset.prefix);
              }}
              className="text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700/60 font-mono transition-colors"
            >
              /{preset.prefix}
              <span className="text-slate-400 font-sans ml-1 text-[11px] hidden sm:inline">
                ({preset.label})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {ipv6Info && (
        <div className="space-y-6">
          {/* Header Summary */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-xs font-semibold uppercase tracking-wider text-cyan-400">
                  {ipv6Info.addressType.name}
                </span>
                <span className="text-slate-600">·</span>
                <span className="text-xs text-slate-400">
                  Escopo: {ipv6Info.addressType.scope}
                </span>
              </div>
              <div className="flex items-center gap-3">
                <h2 className="text-xl sm:text-2xl font-bold font-mono text-white tracking-tight break-all">
                  {ipv6Info.compressedIp}
                  <span className="text-cyan-400">/{ipv6Info.prefixLength}</span>
                </h2>
                <CopyButton
                  textToCopy={`${ipv6Info.compressedIp}/${ipv6Info.prefixLength}`}
                  label="Copiar"
                  showIconOnly
                />
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-2xl">
                {ipv6Info.addressType.description}
              </p>
            </div>
          </div>

          {/* Expanded vs Compressed Box */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Formato Expandido Completo (32 Hex)
                </span>
                <span className="text-xs font-mono text-cyan-300 break-all select-all block leading-relaxed">
                  {ipv6Info.expandedIp}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  8 grupos de 4 dígitos hexadecimais sem omissão de zeros
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <CopyButton textToCopy={ipv6Info.expandedIp} label="Copiar Expandido" />
              </div>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Formato Comprimido Canônico (RFC 5952)
                </span>
                <span className="text-xs font-mono text-emerald-300 break-all select-all block leading-relaxed">
                  {ipv6Info.compressedIp}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Zeros à esquerda suprimidos e maior sequência nula substituída por ::
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <CopyButton textToCopy={ipv6Info.compressedIp} label="Copiar Comprimido" />
              </div>
            </div>
          </div>

          {/* Subnetting breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Network Prefix */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Prefixo de Rede
                </span>
                <span className="text-sm font-bold font-mono text-slate-100 break-all block">
                  {ipv6Info.networkPrefix}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  {ipv6Info.prefixLength} bits de roteamento / rede
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <CopyButton textToCopy={ipv6Info.networkPrefix} />
              </div>
            </div>

            {/* Interface ID */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Identificador de Interface (Host)
                </span>
                <span className="text-sm font-bold font-mono text-slate-100 break-all block">
                  {ipv6Info.interfaceId || '0000:0000:0000:0000'}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  Últimos 64 bits (atribuível via SLAAC / EUI-64 ou estático)
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end">
                <CopyButton textToCopy={ipv6Info.interfaceId} />
              </div>
            </div>

            {/* Subnets capacity */}
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
              <div>
                <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider block mb-1">
                  Sub-redes /64 Possíveis
                </span>
                <span className="text-lg font-bold font-mono text-emerald-400 block tabular-nums">
                  {ipv6Info.total64Subnets}
                </span>
                <p className="text-[11px] text-slate-500 mt-1">
                  {prefix <= 64 ? `2^(64 - ${prefix}) sub-redes /64 padrão` : 'Prefixo maior que /64'}
                </p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-800 flex justify-end text-xs text-slate-500 font-mono">
                Bits Livres p/ Sub-redes: {Math.max(0, 64 - prefix)}
              </div>
            </div>
          </div>

          {/* Address Range */}
          <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
            <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
              Limites de Endereçamento do Prefixo
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-1">Primeiro Endereço (Endereço do Prefixo / Roteador)</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 break-all">{ipv6Info.firstAddress}</span>
                  <CopyButton textToCopy={ipv6Info.firstAddress} showIconOnly />
                </div>
              </div>

              <div className="bg-slate-950 p-3 rounded-lg border border-slate-800">
                <span className="text-slate-500 block mb-1">Último Endereço do Bloco</span>
                <div className="flex items-center justify-between">
                  <span className="text-slate-200 break-all">{ipv6Info.lastAddress}</span>
                  <CopyButton textToCopy={ipv6Info.lastAddress} showIconOnly />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
