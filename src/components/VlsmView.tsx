import React, { useState, useMemo } from 'react';
import {
  calculateVlsm,
  type VlsmRequirement,
  type VlsmResult,
} from '../utils/vlsmPlanner';
import { cidrToMask, isValidIp } from '../utils/subnetIPv4';
import { CopyButton } from './CopyButton';
import {
  Network,
  Plus,
  Trash2,
  AlertTriangle,
  CheckCircle2,
  Download,
  Copy,
  Sparkles,
  PieChart,
  ArrowRight,
  RefreshCw,
} from 'lucide-react';

interface VlsmViewProps {
  initialIp?: string;
  initialCidr?: number;
  onSelectSubnet?: (ip: string, cidr: number) => void;
}

const DEFAULT_REQUIREMENTS: VlsmRequirement[] = [
  { id: '1', name: 'Wi-Fi Visitantes & Geral', hostsNeeded: 120 },
  { id: '2', name: 'Desenvolvimento & Engenharia', hostsNeeded: 55 },
  { id: '3', name: 'Vendas & Marketing', hostsNeeded: 28 },
  { id: '4', name: 'Servidores & Infraestrutura', hostsNeeded: 14 },
  { id: '5', name: 'Link Ponto-a-Ponto WAN', hostsNeeded: 2 },
];

const PRESETS = [
  {
    name: 'Empresa Média (Corporativo)',
    ip: '192.168.0.0',
    cidr: 23, // 512 IPs
    reqs: [
      { id: '1', name: 'Wi-Fi Corporativo & Visitantes', hostsNeeded: 150 },
      { id: '2', name: 'Departamento Comercial', hostsNeeded: 60 },
      { id: '3', name: 'TI e Engenharia de Software', hostsNeeded: 50 },
      { id: '4', name: 'RH e Finanças', hostsNeeded: 25 },
      { id: '5', name: 'Servidores Locais & DMZ', hostsNeeded: 12 },
      { id: '6', name: 'Link Ponto-a-Ponto Matriz-Filial', hostsNeeded: 2 },
    ],
  },
  {
    name: 'Campus / Escola (/22)',
    ip: '172.16.0.0',
    cidr: 22, // 1024 IPs
    reqs: [
      { id: '1', name: 'Rede de Alunos / Wi-Fi', hostsNeeded: 450 },
      { id: '2', name: 'Laboratórios de Informática', hostsNeeded: 180 },
      { id: '3', name: 'Corpo Docente / Professores', hostsNeeded: 90 },
      { id: '4', name: 'Administração & Secretaria', hostsNeeded: 40 },
      { id: '5', name: 'Câmeras CFTV & IoT', hostsNeeded: 30 },
      { id: '6', name: 'Servidores & Portal Acadêmico', hostsNeeded: 14 },
      { id: '7', name: 'Link de Fibra Roteador Principal', hostsNeeded: 2 },
    ],
  },
  {
    name: 'Pequeno Escritório (/24)',
    ip: '192.168.1.0',
    cidr: 24, // 256 IPs
    reqs: [
      { id: '1', name: 'Estações de Trabalho', hostsNeeded: 70 },
      { id: '2', name: 'Wi-Fi Clientes', hostsNeeded: 40 },
      { id: '3', name: 'Ventrículos VoIP & Telefonia', hostsNeeded: 20 },
      { id: '4', name: 'Gerência & Diretoria', hostsNeeded: 8 },
      { id: '5', name: 'Link VPN de Backup', hostsNeeded: 2 },
    ],
  },
];

const SLICE_COLORS = [
  'bg-cyan-500',
  'bg-emerald-500',
  'bg-blue-500',
  'bg-purple-500',
  'bg-amber-500',
  'bg-rose-500',
  'bg-teal-500',
  'bg-indigo-500',
  'bg-fuchsia-500',
  'bg-orange-500',
];

export const VlsmView: React.FC<VlsmViewProps> = ({
  initialIp = '192.168.0.0',
  initialCidr = 23,
  onSelectSubnet,
}) => {
  const [majorIp, setMajorIp] = useState<string>(initialIp);
  const [majorCidr, setMajorCidr] = useState<number>(initialCidr);
  const [requirements, setRequirements] = useState<VlsmRequirement[]>(
    DEFAULT_REQUIREMENTS
  );
  const [hoveredSubnetId, setHoveredSubnetId] = useState<string | null>(null);

  const isMajorIpValid = isValidIp(majorIp);

  // Compute VLSM
  const vlsmResult: VlsmResult = useMemo(() => {
    if (!isMajorIpValid) {
      return {
        isFeasible: false,
        errorMessage: 'Endereço IP do bloco principal inválido.',
        allocatedSubnets: [],
        totalHostsRequested: 0,
        totalHostsAllocated: 0,
        totalUsableAllocated: 0,
        majorBlockTotalHosts: 0,
        majorBlockNetwork: '',
        majorBlockCidr: majorCidr,
        freeSpaceHosts: 0,
        freeSpaceRanges: [],
        efficiencyPercent: 0,
      };
    }
    return calculateVlsm(majorIp, majorCidr, requirements);
  }, [majorIp, majorCidr, requirements, isMajorIpValid]);

  // Handler to add new requirement
  const handleAddRequirement = () => {
    const nextNum = requirements.length + 1;
    setRequirements([
      ...requirements,
      {
        id: Date.now().toString(),
        name: `Sub-rede ${nextNum}`,
        hostsNeeded: 20,
      },
    ]);
  };

  // Handler to remove requirement
  const handleRemoveRequirement = (id: string) => {
    setRequirements(requirements.filter((r) => r.id !== id));
  };

  // Handler to edit requirement
  const handleUpdateRequirement = (
    id: string,
    field: 'name' | 'hostsNeeded',
    val: string | number
  ) => {
    setRequirements(
      requirements.map((r) => (r.id === id ? { ...r, [field]: val } : r))
    );
  };

  // Export functions
  const handleExportCsv = () => {
    if (!vlsmResult.isFeasible || vlsmResult.allocatedSubnets.length === 0) return;

    const headers = [
      'Nome da Subrede',
      'Hosts Solicitados',
      'Hosts Uteis Alocados',
      'Tamanho Bloco',
      'CIDR',
      'Mascara',
      'Endereco de Rede',
      'Primeiro Host',
      'Ultimo Host',
      'Broadcast',
      'Desperdicio',
    ];

    const rows = vlsmResult.allocatedSubnets.map((s) => [
      `"${s.name}"`,
      s.hostsNeeded,
      s.usableHosts,
      s.allocatedHosts,
      `/${s.cidr}`,
      s.subnetMask,
      s.networkAddress,
      s.firstUsableIp,
      s.lastUsableIp,
      s.broadcastAddress,
      s.wastedHosts,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `vlsm_planejamento_${majorIp.replace(/\./g, '_')}_cidr${majorCidr}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleExportMarkdown = () => {
    if (!vlsmResult.isFeasible || vlsmResult.allocatedSubnets.length === 0) return;

    let md = `### Planejamento de Sub-redes VLSM (${vlsmResult.majorBlockNetwork}/${vlsmResult.majorBlockCidr})\n\n`;
    md += `* **Total Solicitado:** ${vlsmResult.totalHostsRequested} hosts\n`;
    md += `* **Total Alocado:** ${vlsmResult.totalHostsAllocated} endereços\n`;
    md += `* **Eficiência do Bloco:** ${vlsmResult.efficiencyPercent}%\n`;
    md += `* **Espaço Livre Restante:** ${vlsmResult.freeSpaceHosts} endereços\n\n`;
    md += `| Sub-rede | Solicitado | Alocado | CIDR | Máscara | Endereço de Rede | Faixa Útil | Broadcast |\n`;
    md += `|---|---|---|---|---|---|---|---|\n`;

    vlsmResult.allocatedSubnets.forEach((s) => {
      md += `| ${s.name} | ${s.hostsNeeded} | ${s.usableHosts} | \`/${s.cidr}\` | ${s.subnetMask} | \`${s.networkAddress}\` | ${s.firstUsableIp} - ${s.lastUsableIp} | \`${s.broadcastAddress}\` |\n`;
    });

    navigator.clipboard.writeText(md);
    alert('Relatório VLSM copiado para a área de transferência em formato Markdown!');
  };

  return (
    <div className="space-y-6">
      {/* Top Configuration Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex items-center gap-2 mb-4 text-cyan-400">
          <Network className="w-5 h-5" />
          <h2 className="text-base font-semibold text-slate-100">
            Planejador VLSM (Variable Length Subnet Mask)
          </h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Major Block IP */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Bloco Pai Maior (Endereço IP Inicial)
            </label>
            <input
              type="text"
              value={majorIp}
              onChange={(e) => setMajorIp(e.target.value.trim())}
              placeholder="ex: 192.168.0.0 ou 10.0.0.0"
              className="w-full bg-slate-950 border border-slate-700/80 px-3.5 py-2.5 rounded-lg font-mono text-sm text-slate-100 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
            />
          </div>

          {/* Major Block CIDR */}
          <div>
            <label className="block text-xs font-semibold text-slate-400 mb-1.5 uppercase tracking-wider">
              Máscara do Bloco Pai (Capacidade Total)
            </label>
            <select
              value={majorCidr}
              onChange={(e) => setMajorCidr(parseInt(e.target.value, 10))}
              className="w-full bg-slate-950 border border-slate-700/80 text-slate-200 text-sm font-mono px-3.5 py-2.5 rounded-lg focus:outline-none focus:ring-1 focus:ring-cyan-500 cursor-pointer"
            >
              {Array.from({ length: 24 }, (_, i) => i + 8).map((p) => {
                const total = Math.pow(2, 32 - p);
                return (
                  <option key={p} value={p}>
                    /{p} — {cidrToMask(p)} ({total.toLocaleString('pt-BR')} IPs no total)
                  </option>
                );
              })}
            </select>
          </div>
        </div>

        {/* Quick Presets */}
        <div className="mt-4 pt-4 border-t border-slate-800/80 flex flex-wrap items-center gap-2">
          <span className="text-xs text-slate-400 font-medium mr-1 flex items-center gap-1">
            <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
            Cenários Prontos:
          </span>
          {PRESETS.map((p) => (
            <button
              key={p.name}
              type="button"
              onClick={() => {
                setMajorIp(p.ip);
                setMajorCidr(p.cidr);
                setRequirements(p.reqs);
              }}
              className="text-xs bg-slate-800/70 hover:bg-slate-700 text-slate-300 hover:text-white px-2.5 py-1 rounded border border-slate-700/60 font-sans transition-colors"
            >
              {p.name}
            </button>
          ))}
        </div>
      </div>

      {/* Requirements Editor Card */}
      <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
          <div>
            <h3 className="text-sm font-semibold text-slate-200">
              Demandas de Sub-redes e Departamentos
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              O algoritmo ordena automaticamente por demanda decrescente para máxima eficiência sem sobreposição de blocos.
            </p>
          </div>
          <button
            type="button"
            onClick={handleAddRequirement}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors shrink-0 shadow-sm"
          >
            <Plus className="w-3.5 h-3.5" />
            Adicionar Sub-rede
          </button>
        </div>

        <div className="space-y-2.5 max-h-80 overflow-y-auto pr-1">
          {requirements.map((req, index) => (
            <div
              key={req.id}
              className="flex items-center gap-3 bg-slate-950/80 p-2.5 rounded-lg border border-slate-800/90"
            >
              <span className="w-6 text-center text-xs font-mono text-slate-500 shrink-0">
                #{index + 1}
              </span>
              <input
                type="text"
                value={req.name}
                onChange={(e) =>
                  handleUpdateRequirement(req.id, 'name', e.target.value)
                }
                placeholder="Nome do Departamento / VLAN"
                className="flex-1 bg-slate-900 border border-slate-800 px-3 py-1.5 text-xs rounded text-slate-200 placeholder:text-slate-600 focus:outline-none focus:ring-1 focus:ring-cyan-500"
              />
              <div className="flex items-center gap-2 shrink-0">
                <input
                  type="number"
                  min="1"
                  max="1000000"
                  value={req.hostsNeeded}
                  onChange={(e) =>
                    handleUpdateRequirement(
                      req.id,
                      'hostsNeeded',
                      Math.max(1, parseInt(e.target.value, 10) || 1)
                    )
                  }
                  className="w-24 bg-slate-900 border border-slate-800 px-2.5 py-1.5 text-xs font-mono rounded text-slate-200 text-right focus:outline-none focus:ring-1 focus:ring-cyan-500"
                />
                <span className="text-xs text-slate-400 w-16">hosts úteis</span>
              </div>
              <button
                type="button"
                onClick={() => handleRemoveRequirement(req.id)}
                disabled={requirements.length <= 1}
                className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-950/30 rounded transition-colors disabled:opacity-30 disabled:hover:text-slate-500"
                title="Remover sub-rede"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* VLSM Results or Feasibility Alert */}
      {!vlsmResult.isFeasible ? (
        <div className="p-4 bg-rose-950/50 border border-rose-800/80 rounded-xl flex items-start gap-3 text-rose-200">
          <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
          <div className="text-xs space-y-1">
            <h4 className="font-semibold text-rose-100 text-sm">
              Espaço de Endereçamento Insuficiente!
            </h4>
            <p>{vlsmResult.errorMessage}</p>
            <p className="text-rose-300 font-mono">
              Sugestão: Aumente o tamanho do bloco pai (ex: mude de /{majorCidr} para /{majorCidr - 1}).
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Metric Cards */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1 uppercase tracking-wider font-semibold">
                Hosts Solicitados
              </span>
              <span className="text-2xl font-bold font-mono text-cyan-300 tabular-nums">
                {vlsmResult.totalHostsRequested.toLocaleString('pt-BR')}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                em {requirements.length} sub-redes
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1 uppercase tracking-wider font-semibold">
                Espaço Alocado
              </span>
              <span className="text-2xl font-bold font-mono text-slate-100 tabular-nums">
                {vlsmResult.totalHostsAllocated.toLocaleString('pt-BR')}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                {vlsmResult.totalUsableAllocated.toLocaleString('pt-BR')} IPs utilizáveis
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1 uppercase tracking-wider font-semibold">
                Eficiência Alocada
              </span>
              <span className="text-2xl font-bold font-mono text-emerald-400 tabular-nums">
                {vlsmResult.efficiencyPercent}%
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                demanda real vs blocos alocados
              </p>
            </div>

            <div className="bg-slate-900/80 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-slate-400 block mb-1 uppercase tracking-wider font-semibold">
                Espaço Livre Restante
              </span>
              <span className="text-2xl font-bold font-mono text-amber-300 tabular-nums">
                {vlsmResult.freeSpaceHosts.toLocaleString('pt-BR')}
              </span>
              <p className="text-[11px] text-slate-500 mt-1">
                IPs disponíveis para expansão futura
              </p>
            </div>
          </div>

          {/* Visual Address Space Allocation Bar */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-5 shadow-sm">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <PieChart className="w-4 h-4 text-cyan-400" />
                <h3 className="text-sm font-semibold text-slate-200">
                  Mapa Visual de Alocação de Bloco ({vlsmResult.majorBlockNetwork}/{vlsmResult.majorBlockCidr})
                </h3>
              </div>
              <span className="text-xs font-mono text-slate-400">
                Capacidade: {vlsmResult.majorBlockTotalHosts.toLocaleString('pt-BR')} IPs
              </span>
            </div>

            {/* Proportional Bar */}
            <div className="w-full h-8 bg-slate-950 rounded-lg overflow-hidden flex border border-slate-800 p-0.5">
              {vlsmResult.allocatedSubnets.map((sub, i) => {
                const color = SLICE_COLORS[i % SLICE_COLORS.length];
                const widthPercent = sub.percentageOfMajorBlock;
                const isHovered = hoveredSubnetId === sub.id;

                return (
                  <div
                    key={sub.id}
                    onMouseEnter={() => setHoveredSubnetId(sub.id)}
                    onMouseLeave={() => setHoveredSubnetId(null)}
                    style={{ width: `${Math.max(0.5, widthPercent)}%` }}
                    className={`h-full ${color} transition-all cursor-pointer relative group flex items-center justify-center ${
                      isHovered ? 'brightness-125 ring-2 ring-white z-10' : 'opacity-90 hover:opacity-100'
                    }`}
                    title={`${sub.name}: ${sub.networkAddress}/${sub.cidr} (${widthPercent.toFixed(1)}% do bloco)`}
                  >
                    {widthPercent > 6 && (
                      <span className="text-[10px] font-mono font-bold text-slate-950 px-1 truncate select-none">
                        /{sub.cidr}
                      </span>
                    )}
                  </div>
                );
              })}

              {/* Free Space slice */}
              {vlsmResult.freeSpaceHosts > 0 && (
                <div
                  style={{
                    width: `${(vlsmResult.freeSpaceHosts / vlsmResult.majorBlockTotalHosts) * 100}%`,
                  }}
                  className="h-full bg-slate-800/80 hover:bg-slate-700/80 transition-all flex items-center justify-center text-[10px] text-slate-400 font-mono border-l border-slate-700/50 select-none"
                  title={`Espaço Livre: ${vlsmResult.freeSpaceHosts} IPs`}
                >
                  {(vlsmResult.freeSpaceHosts / vlsmResult.majorBlockTotalHosts) * 100 > 8 && (
                    <span>Livre ({( (vlsmResult.freeSpaceHosts / vlsmResult.majorBlockTotalHosts) * 100 ).toFixed(0)}%)</span>
                  )}
                </div>
              )}
            </div>

            {/* Legend */}
            <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3 text-xs">
              {vlsmResult.allocatedSubnets.map((sub, i) => (
                <div
                  key={sub.id}
                  onMouseEnter={() => setHoveredSubnetId(sub.id)}
                  onMouseLeave={() => setHoveredSubnetId(null)}
                  className={`flex items-center gap-1.5 cursor-pointer transition-opacity ${
                    hoveredSubnetId && hoveredSubnetId !== sub.id ? 'opacity-40' : 'opacity-100'
                  }`}
                >
                  <span
                    className={`w-2.5 h-2.5 rounded-sm ${SLICE_COLORS[i % SLICE_COLORS.length]}`}
                  />
                  <span className="text-slate-300 font-medium">{sub.name}</span>
                  <span className="font-mono text-cyan-400">/{sub.cidr}</span>
                </div>
              ))}
              {vlsmResult.freeSpaceHosts > 0 && (
                <div className="flex items-center gap-1.5 text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-sm bg-slate-700" />
                  <span>Não Alocado ({vlsmResult.freeSpaceHosts} IPs)</span>
                </div>
              )}
            </div>
          </div>

          {/* Allocation Table */}
          <div className="bg-slate-900/90 border border-slate-800 rounded-xl overflow-hidden shadow-sm">
            <div className="p-4 border-b border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-slate-200">
                Tabela de Alocação Detalhada VLSM
              </h3>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleExportCsv}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Download className="w-3.5 h-3.5" />
                  Exportar CSV
                </button>
                <button
                  type="button"
                  onClick={handleExportMarkdown}
                  className="px-2.5 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded border border-slate-700 transition-colors flex items-center gap-1.5 text-xs font-medium"
                >
                  <Copy className="w-3.5 h-3.5" />
                  Copiar Markdown
                </button>
              </div>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead className="bg-slate-950 text-slate-400 uppercase tracking-wider text-[11px] border-b border-slate-800">
                  <tr>
                    <th className="py-3 px-4">Sub-rede / Departamento</th>
                    <th className="py-3 px-4 text-center">Demanda</th>
                    <th className="py-3 px-4 text-center">Alocado</th>
                    <th className="py-3 px-4">CIDR / Máscara</th>
                    <th className="py-3 px-4">Endereço de Rede</th>
                    <th className="py-3 px-4">Faixa de Hosts Úteis</th>
                    <th className="py-3 px-4">Broadcast</th>
                    <th className="py-3 px-4 text-center">Sobra</th>
                    <th className="py-3 px-4 text-center w-24">Ações</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {vlsmResult.allocatedSubnets.map((sub, i) => {
                    const isHovered = hoveredSubnetId === sub.id;
                    const dotColor = SLICE_COLORS[i % SLICE_COLORS.length];

                    return (
                      <tr
                        key={sub.id}
                        onMouseEnter={() => setHoveredSubnetId(sub.id)}
                        onMouseLeave={() => setHoveredSubnetId(null)}
                        className={`transition-colors ${
                          isHovered ? 'bg-cyan-950/30' : 'hover:bg-slate-800/40'
                        }`}
                      >
                        <td className="py-2.5 px-4 font-sans font-medium text-slate-100">
                          <div className="flex items-center gap-2">
                            <span className={`w-2 h-2 rounded-full ${dotColor}`} />
                            <span>{sub.name}</span>
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-center tabular-nums text-slate-300">
                          {sub.hostsNeeded}
                        </td>
                        <td className="py-2.5 px-4 text-center tabular-nums text-emerald-400 font-semibold">
                          {sub.usableHosts}
                        </td>
                        <td className="py-2.5 px-4">
                          <span className="text-cyan-400 font-bold">/{sub.cidr}</span>
                          <span className="text-slate-500 ml-1.5">({sub.subnetMask})</span>
                        </td>
                        <td className="py-2.5 px-4 font-semibold text-slate-200">
                          <div className="flex items-center gap-1.5">
                            <span>{sub.networkAddress}</span>
                            <CopyButton textToCopy={sub.networkAddress} showIconOnly />
                          </div>
                        </td>
                        <td className="py-2.5 px-4 text-emerald-400/90 tabular-nums">
                          {sub.firstUsableIp} – {sub.lastUsableIp}
                        </td>
                        <td className="py-2.5 px-4 text-slate-400 tabular-nums">
                          {sub.broadcastAddress}
                        </td>
                        <td className="py-2.5 px-4 text-center tabular-nums text-slate-400">
                          +{sub.wastedHosts}
                        </td>
                        <td className="py-2.5 px-4 text-center">
                          {onSelectSubnet && (
                            <button
                              type="button"
                              onClick={() =>
                                onSelectSubnet(sub.networkAddress, sub.cidr)
                              }
                              className="inline-flex items-center gap-1 px-2 py-1 text-[11px] text-cyan-400 hover:text-cyan-300 hover:bg-cyan-950/60 rounded border border-cyan-800/50 transition-colors font-sans"
                              title="Calcular esta sub-rede"
                            >
                              <span>Ver</span>
                              <ArrowRight className="w-3 h-3" />
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
