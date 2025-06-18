import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

export const QRCode = ({ value, size = 128 }) => {
  return (
    <div className="flex justify-center items-center">
      <QRCodeSVG value={value} size={size} bgColor={"#ffffff"} fgColor={"#000000"} level={"L"} />
    </div>
  );
};

export default QRCode;
