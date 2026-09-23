import React from 'react';
import { CopyButton } from './CopyButton';

interface BinaryVisualizerProps {
  label: string;
  binaryOctets: string[]; // 4 octets of 8 bits each
  cidr: number;
  highlightCidrBoundary?: boolean;
}

export const BinaryVisualizer: React.FC<BinaryVisualizerProps> = ({
  label,
  binaryOctets,
  cidr,
  highlightCidrBoundary = true,
}) => {
  const fullBinaryString = binaryOctets.join('.');
  let bitIndexCounter = 0;

  return (
    <div className="bg-slate-900/80 border border-slate-800 rounded-lg p-3">
      <div className="flex items-center justify-between gap-2 mb-2">
        <span className="text-xs font-medium text-slate-400">{label}</span>
        <CopyButton textToCopy={fullBinaryString} label="Copiar bits" showIconOnly />
      </div>

      <div className="flex flex-wrap items-center gap-2 font-mono text-xs tabular-nums select-all">
        {binaryOctets.map((octet, octetIdx) => {
          const bits = octet.split('');
          return (
            <React.Fragment key={octetIdx}>
              <div className="flex items-center gap-0.5 bg-slate-950 px-2 py-1.5 rounded border border-slate-800/80">
                {bits.map((bit, bitInOctetIdx) => {
                  const currentGlobalBitIndex = bitIndexCounter++;
                  const isNetworkBit = currentGlobalBitIndex < cidr;
                  const isBoundary = highlightCidrBoundary && currentGlobalBitIndex === cidr - 1;

                  return (
                    <span
                      key={bitInOctetIdx}
                      className={`relative inline-flex items-center justify-center w-3.5 h-5 text-center font-bold transition-colors ${
                        isNetworkBit
                          ? 'text-cyan-400'
                          : 'text-amber-400/90'
                      } ${isBoundary ? 'border-r-2 border-dashed border-red-500 pr-0.5 mr-0.5' : ''}`}
                      title={`Bit ${currentGlobalBitIndex + 1} (${isNetworkBit ? 'Rede' : 'Host'})`}
                    >
                      {bit}
                    </span>
                  );
                })}
              </div>
              {octetIdx < 3 && (
                <span className="text-slate-600 font-bold select-none">.</span>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
