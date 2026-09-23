import React, { useState, useMemo } from 'react';
import { splitSubnet, type SplitSubnetItem } from '../utils/subnetSplitter';
import { cidrToMask, isValidIp } from '../utils/subnetIPv4';
import { CopyButton } from './CopyButton';
import {
  Layers,
  ArrowRight,
  Download,
  Search,
  CheckCircle,
  ExternalLink,
  Info,
} from 'lucide-react';

interface SubnetSplitterViewProps {
  initialIp?: string;
  initialCidr?: number;
  onSelectSubnet?: (ip: string, cidr: number) => void;
}

export const SubnetSplitterView: React.FC<SubnetSplitterViewProps> = ({
  initialIp = '192.168.1.0',
  initialCidr = 24,
  onSelectSubnet,
}) => {
  const [baseIp, setBaseIp] = useState<string>(initialIp);
  const [baseCidr, setBaseCidr] = useState<number>(initialCidr);
  const [targetCidr, setTargetCidr] = useState<number>(
    Math.min(30, initialCidr + 2)
  );
  const [searchTerm, setSearchTerm] = useState<string>('');

  const isBaseIpValid = isValidIp(baseIp);

  // Keep targetCidr valid (> baseCidr)
  const effectiveTargetCidr = targetCidr > baseCidr ? targetCidr : Math.min(32, baseCidr + 1);

  const splitData = useMemo(() => {
    if (!isBaseIpValid || effectiveTargetCidr <= baseCidr) {
      return { subnets: [], totalSubnetsCount: 0, isTruncated: false };
    }
    return splitSubnet(baseIp, baseCidr, effectiveTargetCidr, 512);
  }, [baseIp, baseCidr, effectiveTargetCidr, isBaseIpValid]);

  const filteredSubnets = useMemo(() => {
    if (!searchTerm.trim()) return splitData.subnets;
    const term = searchTerm.toLowerCase();
    return splitData.subnets.filter(
      (s) =>
        s.networkAddress.includes(term) ||
        s.firstUsableIp.includes(term) ||
        s.lastUsableIp.includes(term) ||
        s.broadcastAddress.includes(term) ||
        s.index.toString() === term
    );
  }, [splitData.subnets, searchTerm]);

  // Export functions
  const handleExportCsv = () => {
    const headers = [
      '#',
      'Rede CIDR',
      'Mascara',
      'Primeiro IP Util',
      'Ultimo IP Util',
      'Broadcast',
      'Hosts Uteis',
    ];
    const rows = splitData.subnets.map((s) => [
      s.index,
      `${s.networkAddress}/${s.cidr}`,
      s.subnetMask,
      s.firstUsableIp,
      s.lastUsableIp,
      s.broadcastAddress,
      s.usableHosts,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `subredes_${baseIp.replace(/\./g, '_')}_cidr${effectiveTargetCidr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMarkdown = () => {
    let md = `### Divisão de Sub-redes: ${baseIp}/${baseCidr} dividida em /${effectiveTargetCidr}\n\n`;
    md += `Total de sub-redes geradas: ${splitData.totalSubnetsCount}\n\n`;
    md += `| # | Rede CIDR | Máscara | Primeiro Host | Último Host | Broadcast | Hosts Úteis |\n`;
    md += `|---|---|---|---|---|---|---|\n`;
    splitData.subnets.forEach((s) => {
      md += `| ${s.index} | \`${s.networkAddress}/${s.cidr}\` | ${s.subnetMask} | ${s.firstUsableIp} | ${s.lastUsableIp} | ${s.broadcastAddress} | ${s.usableHosts} |\n`;
    });

    navigator.clipboard.writeText(md);
    alert('Tabela em Markdown copiada para a área de transferência!');
  };

  const bitsBorrowed = effectiveTargetCidr - baseCidr;
  const hostsPerSubnet =
    effectiveTargetCidr === 32
      ? 1
      : effectiveTargetCidr === 31
      ? 2
      : Math.max(0, Math.pow(2, 32 - effectiveTargetCidr) - 2);

  return (
    <div className="space-y-6">
      {/* Control panel */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-cyan-400">
          <Layers className="w-5 h-5" />
          <h2 className="text-base font-semibold text-slate-100">
            Divisor de Sub-redes (Subnet Splitter)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 items-end">
          {/* Base Network IP */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Rede Pai / Origem
            </label>
            <input
              type="text"
              value={baseIp}
              onChange={(e) => setBaseIp(e.target.value.trim())}
              placeholder="ex: 192.168.0.0"
              className="w-full bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 rounded-lg font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Base CIDR */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Prefixo Base da Rede
            </label>
            <select
              value={baseCidr}
              onChange={(e) => {
                const newBase = parseInt(e.target.value, 10);
                setBaseCidr(newBase);
                if (targetCidr <= newBase) {
                  setTargetCidr(Math.min(32, newBase + 1));
                }
              }}
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 text-sm font-mono px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {Array.from({ length: 31 }, (_, i) => i + 1).map((p) => (
                <option key={p} value={p}>
                  /{p} — {cidrToMask(p)}
                </option>
              ))}
            </select>
          </div>

          {/* Target CIDR to split into */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Dividir em Sub-redes Menores
            </label>
            <select
              value={effectiveTargetCidr}
              onChange={(e) => setTargetCidr(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 text-sm font-mono px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {Array.from({ length: 32 - baseCidr }, (_, i) => baseCidr + 1 + i).map(
                (p) => {
                  const count = Math.pow(2, p - baseCidr);
                  const subHosts =
                    p === 32 ? 1 : p === 31 ? 2 : Math.max(0, Math.pow(2, 32 - p) - 2);
                  return (
                    <option key={p} value={p}>
                      /{p} — {count.toLocaleString('pt-BR')} sub-redes ({subHosts.toLocaleString('pt-BR')} hosts cada)
                    </option>
                  );
                }
              )}
            </select>
          </div>
        </div>

        {/* Informative summary */}
        <div className="mt-4 p-3 bg-slate-950 border border-slate-800 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 text-slate-300">
            <Info className="w-4 h-4 text-cyan-400 shrink-0" />
            <span>
              Pegando emprestados <strong className="text-cyan-300">{bitsBorrowed} bits</strong> de host: a rede base de <strong className="text-slate-100">/{baseCidr}</strong> é fragmentada em <strong className="text-cyan-300">{splitData.totalSubnetsCount.toLocaleString('pt-BR')} sub-redes /{effectiveTargetCidr}</strong>, cada uma comportando <strong className="text-emerald-400">{hostsPerSubnet.toLocaleString('pt-BR')} hosts úteis</strong>.
            </span>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              type="button"
              onClick={handleExportCsv}
              disabled={splitData.subnets.length === 0}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              <Download className="w-3.5 h-3.5" />
              CSV
            </button>
            <button
              type="button"
              onClick={handleExportMarkdown}
              disabled={splitData.subnets.length === 0}
              className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1.5 disabled:opacity-50"
            >
              Copiar MD
            </button>
          </div>
        </div>
      </div>

      {/* Subnets List Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">
              Sub-redes Resultantes ({splitData.subnets.length} exibidas)
            </h3>
            {splitData.isTruncated && (
              <span className="text-xs text-amber-400">
                (Exibindo as primeiras 512 de {splitData.totalSubnetsCount.toLocaleString('pt-BR')})
              </span>
            )}
          </div>

          <div className="relative w-full sm:w-64">
            <Search className="w-3.5 h-3.5 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Filtrar por IP ou índice..."
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4 w-12 text-center">#</th>
                <th className="py-3 px-4">Endereço de Rede</th>
                <th className="py-3 px-4">Máscara</th>
                <th className="py-3 px-4">Faixa de Hosts Úteis</th>
                <th className="py-3 px-4">Broadcast</th>
                <th className="py-3 px-4 text-right">Hosts Úteis</th>
                <th className="py-3 px-4 text-center w-28">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredSubnets.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-slate-500 font-sans">
                    Nenhuma sub-rede encontrada com o filtro informado.
                  </td>
                </tr>
              ) : (
                filteredSubnets.map((sub) => (
                  <tr
                    key={sub.index}
                    className="hover:bg-slate-800/40 transition-colors group"
                  >
                    <td className="py-2.5 px-4 text-center text-slate-500 tabular-nums">
                      {sub.index}
                    </td>
                    <td className="py-2.5 px-4 font-semibold text-cyan-300">
                      <div className="flex items-center gap-1.5">
                        <span>
                          {sub.networkAddress}/{sub.cidr}
                        </span>
                        <CopyButton
                          textToCopy={`${sub.networkAddress}/${sub.cidr}`}
                          showIconOnly
                        />
                      </div>
                    </td>
                    <td className="py-2.5 px-4 text-slate-400">
                      {sub.subnetMask}
                    </td>
                    <td className="py-2.5 px-4 text-emerald-400/90 tabular-nums">
                      {sub.firstUsableIp} – {sub.lastUsableIp}
                    </td>
                    <td className="py-2.5 px-4 text-slate-400 tabular-nums">
                      {sub.broadcastAddress}
                    </td>
                    <td className="py-2.5 px-4 text-right tabular-nums text-slate-200">
                      {sub.usableHosts.toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 px-4 text-center">
                      {onSelectSubnet && (
                        <button
                          type="button"
                          onClick={() => onSelectSubnet(sub.networkAddress, sub.cidr)}
                          className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded border border-cyan-800/50 transition-colors font-sans"
                          title="Carregar esta sub-rede na calculadora principal"
                        >
                          <span>Calcular</span>
                          <ArrowRight className="w-3 h-3" />
                        </button>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
