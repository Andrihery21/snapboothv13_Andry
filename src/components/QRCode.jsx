import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const QRCode = ({ value, size = 128, imageUrl, showQROnly, qrColor = '#000000', bgColor = '#ffffff' }) => {
  const qrValue = value || imageUrl || '';
  return (
    <div className="w-full h-full flex justify-end items-end">
      <QRCodeSVG value={qrValue} size={size} bgColor={bgColor} fgColor={qrColor} level={"L"} />
    </div>
  );
};

export default QRCode;
