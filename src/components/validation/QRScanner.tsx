"use client";

import { Html5Qrcode } from "html5-qrcode";
import { useEffect, useRef } from "react";

interface QRScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onClose: () => void;
}

export default function QRScanner({
  onScanSuccess,
  onClose,
}: QRScannerProps) {
  const scannerRef = useRef<Html5Qrcode | null>(null);
  const startedRef = useRef(false);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (initializedRef.current) return;

    initializedRef.current = true;

    const scanner = new Html5Qrcode("reader");
    scannerRef.current = scanner;

    const iniciarScanner = async () => {
      try {
        await scanner.start(
          { facingMode: "environment" },
          {
            fps: 10,
            qrbox: {
              width: 250,
              height: 250,
            },
          },
          async (decodedText) => {
            alert(decodedText);
          
            if (startedRef.current) {
              startedRef.current = false;
          
              try {
                await scanner.stop();
              } catch {}
          
              try {
                await scanner.clear();
              } catch {}
          
              onScanSuccess(decodedText);
            }
          },
          () => {}
        );

        startedRef.current = true;
      } catch (err) {
        console.error("Error iniciando cámara:", err);
      }
    };

    iniciarScanner();

    return () => {
      const limpiar = async () => {
        if (startedRef.current) {
          startedRef.current = false;

          try {
            await scanner.stop();
          } catch {}

          try {
            await scanner.clear();
          } catch {}
        }

        initializedRef.current = false;
      };

      limpiar();
    };
  }, [onScanSuccess]);

  return (
    <div className="space-y-4">
      <div
        id="reader"
        className="w-full overflow-hidden rounded-xl border"
      />

      <button
        type="button"
        onClick={onClose}
        className="w-full rounded-lg bg-red-600 py-2 text-white hover:bg-red-700"
      >
        Cancelar
      </button>
    </div>
  );
}