"use client";

import React, { useRef, useState } from 'react';
import ReactSignatureCanvas from 'react-signature-canvas';

export function SignaturePad({ onSave }: { onSave: (data: string) => void }) {
  const sigCanvas = useRef<ReactSignatureCanvas>(null);

  const handleSave = () => {
    if (sigCanvas.current) {
      onSave(sigCanvas.current.toDataURL('image/png'));
    }
  };

  const clear = () => {
    sigCanvas.current?.clear();
  };

  return (
    <div className="flex flex-col gap-4 border p-4 rounded">
      <ReactSignatureCanvas
        ref={sigCanvas}
        penColor="black"
        canvasProps={{ width: 500, height: 200, className: 'border bg-white' }}
      />
      <div className="flex gap-2">
        <button onClick={clear} className="bg-gray-200 px-4 py-2 rounded">清除</button>
        <button onClick={handleSave} className="bg-blue-600 text-white px-4 py-2 rounded">儲存簽名</button>
      </div>
    </div>
  );
}
