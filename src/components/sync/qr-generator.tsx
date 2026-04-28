'use client';

import { QRCodeSVG } from 'qrcode.react';

interface QRGeneratorProps {
  value: string;
  size?: number;
}

export function QRGenerator({ value, size = 200 }: QRGeneratorProps) {
  if (!value) return <div className="w-[200px] h-[200px] bg-muted animate-pulse rounded-xl" />;

  return (
    <div className="flex items-center justify-center p-6 bg-white rounded-3xl shadow-xl border-8 border-muted">
      <QRCodeSVG 
        value={value} 
        size={size}
        level="H"
        bgColor="#FFFFFF"
        fgColor="#000000"
        includeMargin={false}
      />
    </div>
  );
}
