/**
 * IPv4 Subnet Calculator Utilities
 */

export interface IPv4SubnetInfo {
  ip: string;
  cidr: number;
  subnetMask: string;
  wildcardMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  usableHostRange: string;
  totalHosts: number;
  usableHosts: number;
  networkClass: 'A' | 'B' | 'C' | 'D' | 'E';
  ipType: {
    category: string;
    description: string;
    isPrivate: boolean;
  };
  binary: {
    ip: string[];
    mask: string[];
    network: string[];
    broadcast: string[];
    wildcard: string[];
  };
  integerValue: number;
  hexValue: string;
  ptrRecord: string;
}

export function ipToLong(ip: string): number {
  return (
    ip
      .split('.')
      .reduce((acc, octet) => ((acc << 8) + parseInt(octet, 10)) >>> 0, 0) >>>
    0
  );
}

export function longToIp(long: number): string {
  return [
    (long >>> 24) & 255,
    (long >>> 16) & 255,
    (long >>> 8) & 255,
    long & 255,
  ].join('.');
}

export function cidrToMaskLong(cidr: number): number {
  if (cidr === 0) return 0;
  return (0xffffffff << (32 - cidr)) >>> 0;
}

export function cidrToMask(cidr: number): string {
  return longToIp(cidrToMaskLong(cidr));
}

export function maskToCidr(mask: string): number | null {
  if (!isValidIp(mask)) return null;
  const long = ipToLong(mask);
  // Check if bits are contiguous
  let countingOnes = true;
  let count = 0;
  for (let i = 31; i >= 0; i--) {
    const bit = (long >>> i) & 1;
    if (bit === 1) {
      if (!countingOnes) return null; // Non-contiguous mask
      count++;
    } else {
      countingOnes = false;
    }
  }
  return count;
}

export function cidrToWildcard(cidr: number): string {
  const maskLong = cidrToMaskLong(cidr);
  const wildcardLong = (~maskLong) >>> 0;
  return longToIp(wildcardLong);
}

export function isValidIp(ip: string): boolean {
  const parts = ip.trim().split('.');
  if (parts.length !== 4) return false;
  return parts.every((part) => {
    if (!/^\d+$/.test(part)) return false;
    const num = parseInt(part, 10);
    return num >= 0 && num <= 255;
  });
}

export function toBinary8(num: number): string {
  return num.toString(2).padStart(8, '0');
}

export function ipToBinaryArray(ip: string): string[] {
  return ip.split('.').map((octet) => toBinary8(parseInt(octet, 10)));
}

export function getNetworkClass(firstOctet: number): 'A' | 'B' | 'C' | 'D' | 'E' {
  if (firstOctet >= 1 && firstOctet <= 126) return 'A';
  if (firstOctet >= 128 && firstOctet <= 191) return 'B';
  if (firstOctet >= 192 && firstOctet <= 223) return 'C';
  if (firstOctet >= 224 && firstOctet <= 239) return 'D'; // Multicast
  return 'E'; // Experimental / Reserved
}

export function getIpType(ip: string): {
  category: string;
  description: string;
  isPrivate: boolean;
} {
  const long = ipToLong(ip);
  const octets = ip.split('.').map((x) => parseInt(x, 10));

  // Loopback (127.0.0.0/8)
  if (octets[0] === 127) {
    return {
      category: 'Loopback',
      description: 'Reservado para testes em host local (127.0.0.0/8)',
      isPrivate: true,
    };
  }

  // RFC 1918 Private ranges
  // 10.0.0.0/8
  if (octets[0] === 10) {
    return {
      category: 'Privado (Classe A)',
      description: 'Endereço privado não roteável na internet (RFC 1918)',
      isPrivate: true,
    };
  }
  // 172.16.0.0/12
  if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
    return {
      category: 'Privado (Classe B)',
      description: 'Endereço privado não roteável na internet (RFC 1918)',
      isPrivate: true,
    };
  }
  // 192.168.0.0/16
  if (octets[0] === 192 && octets[1] === 168) {
    return {
      category: 'Privado (Classe C)',
      description: 'Endereço privado não roteável na internet (RFC 1918)',
      isPrivate: true,
    };
  }

  // Carrier-Grade NAT (CGNAT) 100.64.0.0/10 (RFC 6598)
  if (octets[0] === 100 && octets[1] >= 64 && octets[1] <= 127) {
    return {
      category: 'CGNAT (RFC 6598)',
      description: 'Espaço compartilhado entre Provedor e Assinante',
      isPrivate: true,
    };
  }

  // Link-Local APIPA 169.254.0.0/16 (RFC 3927)
  if (octets[0] === 169 && octets[1] === 254) {
    return {
      category: 'Link-Local (APIPA)',
      description: 'Autoconfiguração de rede quando DHCP falha',
      isPrivate: true,
    };
  }

  // Multicast 224.0.0.0/4
  if (octets[0] >= 224 && octets[0] <= 239) {
    return {
      category: 'Multicast (Classe D)',
      description: 'Reservado para transmissão em grupo multicast',
      isPrivate: false,
    };
  }

  // Reserved / Experimental 240.0.0.0/4
  if (octets[0] >= 240) {
    return {
      category: 'Reservado (Classe E)',
      description: 'Reservado para pesquisa futura ou broadcast limitado',
      isPrivate: false,
    };
  }

  // 0.0.0.0/8
  if (octets[0] === 0) {
    return {
      category: 'Esta Rede',
      description: 'Endereço de origem de inicialização (0.0.0.0/8)',
      isPrivate: true,
    };
  }

  return {
    category: 'Público',
    description: 'Endereço público globalmente roteável na Internet',
    isPrivate: false,
  };
}

export function calculateSubnet(ipInput: string, cidr: number): IPv4SubnetInfo {
  const cleanIp = ipInput.trim();
  const ipLong = ipToLong(cleanIp);
  const maskLong = cidrToMaskLong(cidr);
  const wildcardLong = (~maskLong) >>> 0;

  const networkLong = (ipLong & maskLong) >>> 0;
  const broadcastLong = (networkLong | wildcardLong) >>> 0;

  const networkAddress = longToIp(networkLong);
  const broadcastAddress = longToIp(broadcastLong);
  const subnetMask = cidrToMask(cidr);
  const wildcardMask = cidrToWildcard(cidr);

  let firstUsableLong: number;
  let lastUsableLong: number;
  let usableHosts: number;

  const totalHosts = cidr === 0 ? 4294967296 : Math.pow(2, 32 - cidr);

  if (cidr === 31) {
    // RFC 3021 Point-to-Point
    firstUsableLong = networkLong;
    lastUsableLong = broadcastLong;
    usableHosts = 2;
  } else if (cidr === 32) {
    // Host Route
    firstUsableLong = networkLong;
    lastUsableLong = networkLong;
    usableHosts = 1;
  } else {
    firstUsableLong = (networkLong + 1) >>> 0;
    lastUsableLong = (broadcastLong - 1) >>> 0;
    usableHosts = Math.max(0, totalHosts - 2);
  }

  const firstUsableIp = longToIp(firstUsableLong);
  const lastUsableIp = longToIp(lastUsableLong);
  const usableHostRange =
    usableHosts > 0 ? `${firstUsableIp} - ${lastUsableIp}` : 'Nenhum host útil';

  const firstOctet = parseInt(cleanIp.split('.')[0], 10);
  const networkClass = getNetworkClass(firstOctet);
  const ipType = getIpType(cleanIp);

  const octets = cleanIp.split('.').reverse().join('.');
  const ptrRecord = `${octets}.in-addr.arpa`;

  return {
    ip: cleanIp,
    cidr,
    subnetMask,
    wildcardMask,
    networkAddress,
    broadcastAddress,
    firstUsableIp,
    lastUsableIp,
    usableHostRange,
    totalHosts,
    usableHosts,
    networkClass,
    ipType,
    binary: {
      ip: ipToBinaryArray(cleanIp),
      mask: ipToBinaryArray(subnetMask),
      network: ipToBinaryArray(networkAddress),
      broadcast: ipToBinaryArray(broadcastAddress),
      wildcard: ipToBinaryArray(wildcardMask),
    },
    integerValue: ipLong,
    hexValue: '0x' + ipLong.toString(16).toUpperCase().padStart(8, '0'),
    ptrRecord,
  };
}

export function isIpInSubnet(testIp: string, networkIp: string, cidr: number): boolean {
  if (!isValidIp(testIp) || !isValidIp(networkIp)) return false;
  const testLong = ipToLong(testIp);
  const netLong = ipToLong(networkIp);
  const maskLong = cidrToMaskLong(cidr);
  return (testLong & maskLong) === (netLong & maskLong);
}
