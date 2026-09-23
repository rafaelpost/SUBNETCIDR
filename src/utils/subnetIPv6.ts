/**
 * IPv6 Subnet Calculator Utilities
 */

export interface IPv6SubnetInfo {
  ip: string;
  prefixLength: number;
  expandedIp: string;
  compressedIp: string;
  networkPrefix: string;
  networkAddress: string;
  firstAddress: string;
  lastAddress: string;
  interfaceId: string;
  addressType: {
    name: string;
    description: string;
    scope: string;
  };
  total64Subnets: string;
  totalAddresses: string;
}

export function isValidIPv6(ip: string): boolean {
  if (!ip || ip.trim() === '') return false;
  const clean = ip.trim();

  // Handle double colon
  const doubleColonCount = (clean.match(/::/g) || []).length;
  if (doubleColonCount > 1) return false;

  const parts = clean.split('::');
  if (parts.length > 2) return false;

  const validateHextets = (str: string): boolean => {
    if (!str) return true;
    const hextets = str.split(':');
    return hextets.every((h) => /^[0-9a-fA-F]{1,4}$/.test(h));
  };

  if (parts.length === 1) {
    const hextets = clean.split(':');
    if (hextets.length !== 8) return false;
    return validateHextets(clean);
  } else {
    const left = parts[0] ? parts[0].split(':') : [];
    const right = parts[1] ? parts[1].split(':') : [];
    if (!validateHextets(parts[0]) || !validateHextets(parts[1])) return false;
    return left.length + right.length < 8;
  }
}

export function expandIPv6(ip: string): string {
  const clean = ip.trim().toLowerCase();
  const doubleColonIdx = clean.indexOf('::');

  let leftParts: string[] = [];
  let rightParts: string[] = [];

  if (doubleColonIdx !== -1) {
    const leftStr = clean.slice(0, doubleColonIdx);
    const rightStr = clean.slice(doubleColonIdx + 2);

    if (leftStr) leftParts = leftStr.split(':');
    if (rightStr) rightParts = rightStr.split(':');

    const missingCount = 8 - (leftParts.length + rightParts.length);
    const middleParts = Array(missingCount).fill('0000');
    const allParts = [
      ...leftParts.map((p) => p.padStart(4, '0')),
      ...middleParts,
      ...rightParts.map((p) => p.padStart(4, '0')),
    ];
    return allParts.join(':');
  } else {
    return clean
      .split(':')
      .map((p) => p.padStart(4, '0'))
      .join(':');
  }
}

export function compressIPv6(ip: string): string {
  const expanded = expandIPv6(ip);
  // remove leading zeros from each hextet
  const parts = expanded.split(':').map((p) => {
    const trimmed = p.replace(/^0+/, '');
    return trimmed === '' ? '0' : trimmed;
  });

  // Find longest run of '0's
  let longestStart = -1;
  let longestLen = 0;
  let currentStart = -1;
  let currentLen = 0;

  for (let i = 0; i < parts.length; i++) {
    if (parts[i] === '0') {
      if (currentStart === -1) {
        currentStart = i;
        currentLen = 1;
      } else {
        currentLen++;
      }
      if (currentLen > longestLen) {
        longestLen = currentLen;
        longestStart = currentStart;
      }
    } else {
      currentStart = -1;
      currentLen = 0;
    }
  }

  // RFC 5952: only compress if length > 1
  if (longestLen > 1) {
    const head = parts.slice(0, longestStart).join(':');
    const tail = parts.slice(longestStart + longestLen).join(':');
    return `${head}::${tail}`.replace(/^:::/, '::').replace(/:::$/, '::');
  }

  return parts.join(':');
}

export function getIPv6Type(expanded: string): {
  name: string;
  description: string;
  scope: string;
} {
  const normalized = expanded.toLowerCase();

  if (normalized === '0000:0000:0000:0000:0000:0000:0000:0001') {
    return {
      name: 'Loopback (::1)',
      description: 'Endereço de loopback para teste local na máquina',
      scope: 'Host Local',
    };
  }

  if (normalized === '0000:0000:0000:0000:0000:0000:0000:0000') {
    return {
      name: 'Não Especificado (::)',
      description: 'Ausência de endereço (usado em inicialização de interfaces)',
      scope: 'Indefinido',
    };
  }

  if (normalized.startsWith('fe8') || normalized.startsWith('fe9') || normalized.startsWith('fea') || normalized.startsWith('feb')) {
    return {
      name: 'Link-Local (fe80::/10)',
      description: 'Válido apenas dentro do mesmo enlace/switch de rede local',
      scope: 'Link Local',
    };
  }

  if (normalized.startsWith('fc') || normalized.startsWith('fd')) {
    return {
      name: 'Unique Local (ULA fc00::/7)',
      description: 'Equivalente aos endereços privados IPv4 (não roteável na internet pública)',
      scope: 'Organização Privada',
    };
  }

  if (normalized.startsWith('ff')) {
    return {
      name: 'Multicast (ff00::/8)',
      description: 'Transmissão para grupos de interfaces de rede (substitui o broadcast)',
      scope: 'Multicast',
    };
  }

  if (normalized.startsWith('2001:0db8')) {
    return {
      name: 'Documentação (2001:db8::/32)',
      description: 'Reservado pela RFC 3849 para livros, tutoriais e documentação',
      scope: 'Documentação',
    };
  }

  if (normalized.startsWith('0064:ff9b')) {
    return {
      name: 'Tradução NAT64 (64:ff9b::/96)',
      description: 'Utilizado para transição e tradução de IPv4 para IPv6',
      scope: 'Global',
    };
  }

  if (normalized.startsWith('2') || normalized.startsWith('3')) {
    return {
      name: 'Global Unicast (2000::/3)',
      description: 'Endereço público padrão globalmente roteável na Internet',
      scope: 'Global Internet',
    };
  }

  return {
    name: 'Reservado IANA',
    description: 'Faixa especial ou experimental alocada pela IANA',
    scope: 'Reservado',
  };
}

export function calculateIPv6Subnet(ip: string, prefixLength: number): IPv6SubnetInfo {
  const expanded = expandIPv6(ip);
  const cleanHex = expanded.replace(/:/g, '');

  // Calculate bit boundary
  // 128 bits total
  let binary = '';
  for (let i = 0; i < cleanHex.length; i++) {
    binary += parseInt(cleanHex[i], 16).toString(2).padStart(4, '0');
  }

  const prefixBinary = binary.slice(0, prefixLength);
  const networkBinary = prefixBinary.padEnd(128, '0');
  const broadcastBinary = prefixBinary.padEnd(128, '1');

  const binaryToExpanded = (bin: string): string => {
    const hextets: string[] = [];
    for (let i = 0; i < 128; i += 16) {
      const chunk = bin.slice(i, i + 16);
      const hex = parseInt(chunk, 2).toString(16).padStart(4, '0');
      hextets.push(hex);
    }
    return hextets.join(':');
  };

  const networkAddressExpanded = binaryToExpanded(networkBinary);
  const lastAddressExpanded = binaryToExpanded(broadcastBinary);

  const networkAddress = compressIPv6(networkAddressExpanded);
  const firstAddress = networkAddress; // in IPv6 first is network, often usable with router ::1
  const lastAddress = compressIPv6(lastAddressExpanded);

  // Interface ID is the last 64 bits if prefix <= 64
  const interfaceIdHextets = expanded.split(':').slice(4).join(':');

  // Total /64 subnets
  let total64Subnets = '0';
  if (prefixLength <= 64) {
    const subnetsExp = 64 - prefixLength;
    if (subnetsExp <= 52) {
      total64Subnets = Math.pow(2, subnetsExp).toLocaleString('pt-BR');
    } else {
      total64Subnets = `2^${subnetsExp} (${BigInt(2) ** BigInt(subnetsExp)})`;
    }
  } else {
    total64Subnets = 'Menor que /64 (Host ou sub-rede reduzida)';
  }

  // Total addresses
  const hostBits = 128 - prefixLength;
  let totalAddresses = '';
  if (hostBits <= 32) {
    totalAddresses = Math.pow(2, hostBits).toLocaleString('pt-BR');
  } else {
    totalAddresses = `2^${hostBits} (aprox. ${(Math.pow(2, hostBits % 10) * Math.pow(1024, Math.floor(hostBits / 10) - 3)).toExponential(2)} endereços)`;
  }

  return {
    ip: ip.trim(),
    prefixLength,
    expandedIp: expanded,
    compressedIp: compressIPv6(ip),
    networkPrefix: `${networkAddress}/${prefixLength}`,
    networkAddress,
    firstAddress,
    lastAddress,
    interfaceId: interfaceIdHextets,
    addressType: getIPv6Type(expanded),
    total64Subnets,
    totalAddresses,
  };
}
