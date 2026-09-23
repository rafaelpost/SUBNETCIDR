/**
 * Subnet Splitter Utility
 */

import {
  calculateSubnet,
  cidrToMask,
  cidrToMaskLong,
  ipToLong,
  longToIp,
  type IPv4SubnetInfo,
} from './subnetIPv4';

export interface SplitSubnetItem {
  index: number;
  networkAddress: string;
  cidr: number;
  subnetMask: string;
  firstUsableIp: string;
  lastUsableIp: string;
  broadcastAddress: string;
  usableHosts: number;
  totalHosts: number;
}

export function splitSubnet(
  parentNetworkIp: string,
  parentCidr: number,
  newCidr: number,
  maxResults: number = 256
): {
  subnets: SplitSubnetItem[];
  totalSubnetsCount: number;
  isTruncated: boolean;
} {
  if (newCidr <= parentCidr || newCidr > 32) {
    return { subnets: [], totalSubnetsCount: 0, isTruncated: false };
  }

  const parentNetLong = (ipToLong(parentNetworkIp) & cidrToMaskLong(parentCidr)) >>> 0;
  const bitDifference = newCidr - parentCidr;
  const totalSubnetsCount = Math.pow(2, bitDifference);
  const subnetSize = Math.pow(2, 32 - newCidr);

  const subnets: SplitSubnetItem[] = [];
  const countToGenerate = Math.min(totalSubnetsCount, maxResults);

  for (let i = 0; i < countToGenerate; i++) {
    const netLong = (parentNetLong + i * subnetSize) >>> 0;
    const netIp = longToIp(netLong);
    const subInfo = calculateSubnet(netIp, newCidr);

    subnets.push({
      index: i + 1,
      networkAddress: subInfo.networkAddress,
      cidr: newCidr,
      subnetMask: subInfo.subnetMask,
      firstUsableIp: subInfo.firstUsableIp,
      lastUsableIp: subInfo.lastUsableIp,
      broadcastAddress: subInfo.broadcastAddress,
      usableHosts: subInfo.usableHosts,
      totalHosts: subInfo.totalHosts,
    });
  }

  return {
    subnets,
    totalSubnetsCount,
    isTruncated: totalSubnetsCount > maxResults,
  };
}
