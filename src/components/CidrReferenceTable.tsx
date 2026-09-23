import React, { useState, useMemo } from 'react';
import { CIDR_TABLE, type CidrRow } from '../data/cidrReference';
import { CopyButton } from './CopyButton';
import { Search, Table, ArrowRight, BookOpen } from 'lucide-react';

interface CidrReferenceTableProps {
  onSelectCidr?: (cidr: number) => void;
}

export const CidrReferenceTable: React.FC<CidrReferenceTableProps> = ({
  onSelectCidr,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');

  const filteredRows = useMemo(() => {
    if (!searchTerm.trim()) return CIDR_TABLE;
    const term = searchTerm.toLowerCase().trim();
    return CIDR_TABLE.filter(
      (r) =>
        r.cidr.toString() === term ||
        `/${r.cidr}` === term ||
        r.mask.includes(term) ||
        r.wildcard.includes(term) ||
        r.defaultClass.toLowerCase().includes(term) ||
        r.typicalUsage.toLowerCase().includes(term)
    );
  }, [searchTerm]);

  return (
    <div className="space-y-6">
      {/* Search Header */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 mb-1">
              <Table className="w-5 h-5" />
              <h2 className="text-base font-semibold text-slate-100">
                Tabela de Referência Rápida CIDR (/0 a /32)
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Guia completo de máscaras decimais, máscaras curinga (wildcard) e capacidades de endereçamento IPv4.
            </p>
          </div>

          <div className="relative w-full sm:w-72">
            <Search className="w-4 h-4 text-slate-500 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar por prefixo, máscara, classe..."
              className="w-full bg-slate-950 border border-slate-700/80 rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
              <tr>
                <th className="py-3 px-4">CIDR</th>
                <th className="py-3 px-4">Máscara Decimal</th>
                <th className="py-3 px-4">Máscara Curinga (Wildcard)</th>
                <th className="py-3 px-4 text-right">Total de IPs</th>
                <th className="py-3 px-4 text-right">Hosts Úteis</th>
                <th className="py-3 px-4">Classificação</th>
                <th className="py-3 px-4 min-w-[200px]">Uso Comum & Aplicação</th>
                <th className="py-3 px-4 text-center w-24">Ação</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 text-slate-300">
              {filteredRows.map((row) => (
                <tr
                  key={row.cidr}
                  className="hover:bg-slate-800/40 transition-colors group"
                >
                  <td className="py-2.5 px-4 font-bold text-cyan-400">
                    <div className="flex items-center gap-1.5">
                      <span>/{row.cidr}</span>
                      <CopyButton textToCopy={`/${row.cidr}`} showIconOnly />
                    </div>
                  </td>
                  <td className="py-2.5 px-4 font-medium text-slate-200">
                    <div className="flex items-center gap-1.5">
                      <span>{row.mask}</span>
                      <CopyButton textToCopy={row.mask} showIconOnly />
                    </div>
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 tabular-nums">
                    {row.wildcard}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-slate-200 font-medium">
                    {typeof row.totalAddresses === 'number'
                      ? row.totalAddresses.toLocaleString('pt-BR')
                      : row.totalAddresses}
                  </td>
                  <td className="py-2.5 px-4 text-right tabular-nums text-emerald-400 font-semibold">
                    {typeof row.usableHosts === 'number'
                      ? row.usableHosts.toLocaleString('pt-BR')
                      : row.usableHosts}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 font-sans">
                    {row.defaultClass}
                  </td>
                  <td className="py-2.5 px-4 text-slate-400 font-sans text-[11px] leading-relaxed">
                    {row.typicalUsage}
                  </td>
                  <td className="py-2.5 px-4 text-center">
                    {onSelectCidr && (
                      <button
                        type="button"
                        onClick={() => onSelectCidr(row.cidr)}
                        className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded border border-cyan-800/50 transition-colors font-sans whitespace-nowrap"
                        title="Calcular com este CIDR"
                      >
                        <span>Usar</span>
                        <ArrowRight className="w-3 h-3" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Reference card with standard RFC reminders */}
      <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-5">
        <div className="flex items-center gap-2 mb-3 text-cyan-400">
          <BookOpen className="w-4 h-4" />
          <h3 className="text-xs font-semibold uppercase tracking-wider text-slate-200">
            Padrões & RFCs Cruciais de Roteamento
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-sans">
          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <h4 className="font-semibold text-slate-200 font-mono">RFC 1918 — Redes Privadas</h4>
            <ul className="text-slate-400 space-y-1 text-[11px] font-mono">
              <li>• 10.0.0.0 – 10.255.255.255 (/8)</li>
              <li>• 172.16.0.0 – 172.31.255.255 (/12)</li>
              <li>• 192.168.0.0 – 192.168.255.255 (/16)</li>
            </ul>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <h4 className="font-semibold text-slate-200 font-mono">RFC 3021 — Prefixo /31 em P2P</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Permite o uso de máscaras 255.255.255.254 (/31) em links ponto-a-ponto roteados, economizando 50% de endereços IPv4 ao eliminar o desperdício de rede e broadcast.
            </p>
          </div>

          <div className="bg-slate-950 p-3.5 rounded-lg border border-slate-800 space-y-1">
            <h4 className="font-semibold text-slate-200 font-mono">RFC 6598 — CGNAT</h4>
            <p className="text-slate-400 text-[11px] leading-relaxed">
              Faixa 100.64.0.0/10 reservada para Carrier-Grade NAT entre roteadores de borda de provedores de internet (ISPs) e roteadores de clientes domésticos.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
