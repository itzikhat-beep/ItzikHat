
import React from 'react';

interface QRCodeProps {
  value: string;
  width: number;
  height: number;
}

export const QRCode: React.FC<QRCodeProps> = ({ value, width, height }) => {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(value || 'https://comax.co.il')}`;

  return (
    <div className="flex items-center justify-center p-1 select-none pointer-events-none" style={{ width, height }}>
      <img 
        src={qrUrl} 
        alt="QR Code" 
        className="w-full h-full object-contain"
        style={{ imageRendering: 'pixelated' }}
      />
    </div>
  );
};
