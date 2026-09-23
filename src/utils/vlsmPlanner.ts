/**
 * VLSM (Variable Length Subnet Mask) Planner Utility
 */

import {
  calculateSubnet,
  cidrToMaskLong,
  ipToLong,
  longToIp,
  type IPv4SubnetInfo,
} from './subnetIPv4';

export interface VlsmRequirement {
  id: string;
  name: string;
  hostsNeeded: number;
}

export interface VlsmAllocatedSubnet {
  id: string;
  name: string;
  hostsNeeded: number;
  allocatedHosts: number;
  usableHosts: number;
  cidr: number;
  subnetMask: string;
  networkAddress: string;
  broadcastAddress: string;
  firstUsableIp: string;
  lastUsableIp: string;
  wastedHosts: number;
  percentageOfMajorBlock: number;
  startLong: number;
  endLong: number;
}

export interface VlsmResult {
  isFeasible: boolean;
  errorMessage?: string;
  allocatedSubnets: VlsmAllocatedSubnet[];
  totalHostsRequested: number;
  totalHostsAllocated: number;
  totalUsableAllocated: number;
  majorBlockTotalHosts: number;
  majorBlockNetwork: string;
  majorBlockCidr: number;
  freeSpaceHosts: number;
  freeSpaceRanges: {
    startIp: string;
    endIp: string;
    totalHosts: number;
  }[];
  efficiencyPercent: number;
}

export function calculateVlsm(
  majorNetworkIp: string,
  majorCidr: number,
  requirements: VlsmRequirement[]
): VlsmResult {
  const majorMaskLong = cidrToMaskLong(majorCidr);
  const majorNetLong = (ipToLong(majorNetworkIp) & majorMaskLong) >>> 0;
  const majorTotalHosts = Math.pow(2, 32 - majorCidr);
  const majorBroadcastLong = (majorNetLong + majorTotalHosts - 1) >>> 0;

  // Filter out invalid or zero hosts requirements
  const validReqs = requirements
    .filter((r) => r.hostsNeeded > 0)
    // VLSM requirement: Must sort descending by hosts needed
    .sort((a, b) => b.hostsNeeded - a.hostsNeeded);

  const totalHostsRequested = validReqs.reduce((acc, r) => acc + r.hostsNeeded, 0);

  if (validReqs.length === 0) {
    return {
      isFeasible: true,
      allocatedSubnets: [],
      totalHostsRequested: 0,
      totalHostsAllocated: 0,
      totalUsableAllocated: 0,
      majorBlockTotalHosts: majorTotalHosts,
      majorBlockNetwork: longToIp(majorNetLong),
      majorBlockCidr: majorCidr,
      freeSpaceHosts: majorTotalHosts,
      freeSpaceRanges: [
        {
          startIp: longToIp(majorNetLong),
          endIp: longToIp(majorBroadcastLong),
          totalHosts: majorTotalHosts,
        },
      ],
      efficiencyPercent: 0,
    };
  }

  let currentPointerLong = majorNetLong;
  const allocatedSubnets: VlsmAllocatedSubnet[] = [];
  let totalHostsAllocated = 0;
  let totalUsableAllocated = 0;

  for (const req of validReqs) {
    // Total addresses needed = hostsNeeded + 2 (network + broadcast)
    // If hostsNeeded === 1 or 2, we might allocate a /30 (4 IPs) or /31 if 2
    // By standard networking convention, we use hostsNeeded + 2
    const needed = req.hostsNeeded + 2;
    // Power of 2 needed
    const power = Math.ceil(Math.log2(needed));
    const subnetSize = Math.pow(2, Math.max(2, power)); // minimum /30 (size 4)
    const cidr = 32 - Math.max(2, power);

    // Boundary alignment: current address must be a multiple of subnetSize
    if (currentPointerLong % subnetSize !== 0) {
      currentPointerLong =
        (Math.floor(currentPointerLong / subnetSize) + 1) * subnetSize;
    }

    const subnetNetLong = currentPointerLong >>> 0;
    const subnetEndLong = (subnetNetLong + subnetSize - 1) >>> 0;

    // Check if this exceeds the major block broadcast
    if (subnetEndLong > majorBroadcastLong) {
      return {
        isFeasible: false,
        errorMessage: `O bloco ${longToIp(majorNetLong)}/${majorCidr} (capacidade: ${majorTotalHosts.toLocaleString('pt-BR')} IPs) não possui espaço suficiente para alocar a sub-rede "${req.name}" (${req.hostsNeeded} hosts).`,
        allocatedSubnets,
        totalHostsRequested,
        totalHostsAllocated,
        totalUsableAllocated,
        majorBlockTotalHosts: majorTotalHosts,
        majorBlockNetwork: longToIp(majorNetLong),
        majorBlockCidr: majorCidr,
        freeSpaceHosts: 0,
        freeSpaceRanges: [],
        efficiencyPercent: 0,
      };
    }

    const subInfo = calculateSubnet(longToIp(subnetNetLong), cidr);
    const wastedHosts = subInfo.usableHosts - req.hostsNeeded;

    allocatedSubnets.push({
      id: req.id,
      name: req.name,
      hostsNeeded: req.hostsNeeded,
      allocatedHosts: subnetSize,
      usableHosts: subInfo.usableHosts,
      cidr,
      subnetMask: subInfo.subnetMask,
      networkAddress: subInfo.networkAddress,
      broadcastAddress: subInfo.broadcastAddress,
      firstUsableIp: subInfo.firstUsableIp,
      lastUsableIp: subInfo.lastUsableIp,
      wastedHosts: Math.max(0, wastedHosts),
      percentageOfMajorBlock: (subnetSize / majorTotalHosts) * 100,
      startLong: subnetNetLong,
      endLong: subnetEndLong,
    });

    totalHostsAllocated += subnetSize;
    totalUsableAllocated += subInfo.usableHosts;
    currentPointerLong = (subnetEndLong + 1) >>> 0;
  }

  // Calculate free space ranges
  const freeSpaceRanges: { startIp: string; endIp: string; totalHosts: number }[] = [];
  if (currentPointerLong <= majorBroadcastLong) {
    const freeCount = majorBroadcastLong - currentPointerLong + 1;
    freeSpaceRanges.push({
      startIp: longToIp(currentPointerLong),
      endIp: longToIp(majorBroadcastLong),
      totalHosts: freeCount,
    });
  }

  const freeSpaceHosts = majorTotalHosts - totalHostsAllocated;
  const efficiencyPercent =
    totalHostsAllocated > 0
      ? Math.round((totalHostsRequested / totalHostsAllocated) * 100)
      : 0;

  return {
    isFeasible: true,
    allocatedSubnets,
    totalHostsRequested,
    totalHostsAllocated,
    totalUsableAllocated,
    majorBlockTotalHosts: majorTotalHosts,
    majorBlockNetwork: longToIp(majorNetLong),
    majorBlockCidr: majorCidr,
    freeSpaceHosts,
    freeSpaceRanges,
    efficiencyPercent,
  };
}
