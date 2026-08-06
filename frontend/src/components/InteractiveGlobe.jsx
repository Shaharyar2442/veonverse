import { useEffect, useRef, useState } from "react";

const OPCOS = [
  { id: "veon-hq", name: "VEON HQ", country: "Dubai, UAE", lat: 25.2048, lon: 55.2708, x: 58, y: 44, logo: "V" },
  { id: "mobilink-bank", name: "Mobilink Bank", country: "Pakistan", lat: 30.3753, lon: 69.3451, x: 67, y: 48, logo: "M" },
  { id: "jazz", name: "Jazz", country: "Pakistan", lat: 30.3753, lon: 69.3451, x: 68, y: 46, logo: "J" },
  { id: "kyivstar", name: "Kyivstar", country: "Ukraine", lat: 48.3794, lon: 31.1656, x: 54, y: 28, logo: "K" },
  { id: "banglalink", name: "Banglalink", country: "Bangladesh", lat: 23.685, lon: 90.3563, x: 74, y: 52, logo: "B" },
  { id: "beeline-kz", name: "Beeline", country: "Kazakhstan", lat: 48.0196, lon: 66.9237, x: 66, y: 32, logo: "B" },
  { id: "beeline-uz", name: "Beeline", country: "Uzbekistan", lat: 41.3775, lon: 64.5853, x: 64, y: 38, logo: "B" },
];

export default function InteractiveGlobe({ selectedOpCo, onSelectOpCo }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    let animationFrameId;
    let angle = 0;

    function resize() {
      if (canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth;
        canvas.height = canvas.parentElement.clientHeight;
      }
    }
    resize();
    window.addEventListener("resize", resize);

    function draw() {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const width = canvas.width;
      const height = canvas.height;
      angle += 0.005;

      // Draw faint latitude/longitude grid rings
      ctx.strokeStyle = "rgba(0, 210, 255, 0.08)";
      ctx.lineWidth = 1;
      for (let i = 1; i <= 4; i++) {
        ctx.beginPath();
        ctx.ellipse(width / 2, height / 2 + 10, width * 0.42, height * (0.15 * i), 0, 0, Math.PI * 2);
        ctx.stroke();
      }

      // Draw connecting arcs between OpCo nodes
      OPCOS.forEach((opco1, idx1) => {
        OPCOS.forEach((opco2, idx2) => {
          if (idx1 < idx2) {
            const x1 = (opco1.x / 100) * width;
            const y1 = (opco1.y / 100) * height;
            const x2 = (opco2.x / 100) * width;
            const y2 = (opco2.y / 100) * height;

            ctx.beginPath();
            ctx.moveTo(x1, y1);
            const cx = (x1 + x2) / 2;
            const cy = (y1 + y2) / 2 - 30;
            ctx.quadraticCurveTo(cx, cy, x2, y2);

            const isSelected = selectedOpCo?.id === opco1.id || selectedOpCo?.id === opco2.id;
            ctx.strokeStyle = isSelected ? "rgba(255, 199, 0, 0.6)" : "rgba(255, 199, 0, 0.15)";
            ctx.lineWidth = isSelected ? 1.8 : 0.8;
            ctx.setLineDash([4, 4]);
            ctx.stroke();
            ctx.setLineDash([]);
          }
        });
      });

      animationFrameId = requestAnimationFrame(draw);
    }

    draw();

    return () => {
      window.removeEventListener("resize", resize);
      cancelAnimationFrame(animationFrameId);
    };
  }, [selectedOpCo]);

  return (
    <div className="interactive-globe-container">
      <canvas ref={canvasRef} className="globe-canvas" />
      
      {/* OpCo Pin Overlays */}
      {OPCOS.map((opco) => {
        const isSelected = selectedOpCo?.id === opco.id;
        return (
          <div
            key={opco.id}
            className={`opco-map-pin ${isSelected ? "selected" : ""}`}
            style={{ left: `${opco.x}%`, top: `${opco.y}%` }}
            onClick={() => onSelectOpCo(opco)}
          >
            <div className="pin-pulse"></div>
            <div className="pin-head">📍</div>
            <div className="pin-tooltip">
              <strong>{opco.name}</strong>
              <small>{opco.country}</small>
            </div>
          </div>
        );
      })}
    </div>
  );
}
