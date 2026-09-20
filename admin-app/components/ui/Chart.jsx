import { useEffect, useRef } from "react";
import { Chart as ChartJS, LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend } from "chart.js";

ChartJS.register(LineController, LineElement, PointElement, LinearScale, CategoryScale, Filler, Tooltip, Legend);

const darkDefaults = {
  color: "#7a7568",
  borderColor: "#2a2a26",
  backgroundColor: "#161614",
};

export function Chart({ type = "line", data, options = {}, height = 280, className = "" }) {
  const canvasRef = useRef(null);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!canvasRef.current || !data) return;

    if (chartRef.current) chartRef.current.destroy();

    const merged = {
      responsive: true,
      maintainAspectRatio: false,
      interaction: { intersect: false, mode: "index" },
      plugins: {
        legend: { display: false },
        tooltip: {
          backgroundColor: "#1e1e1b",
          titleColor: "#f7efd9",
          bodyColor: "#b8b0a0",
          borderColor: "#2a2a26",
          borderWidth: 1,
          padding: 10,
          cornerRadius: 8,
        },
        ...options.plugins,
      },
      scales: {
        x: {
          grid: { color: "#2a2a26", drawBorder: false },
          ticks: { color: "#7a7568", font: { size: 11 } },
          ...options.scales?.x,
        },
        y: {
          grid: { color: "#2a2a26", drawBorder: false },
          ticks: { color: "#7a7568", font: { size: 11 } },
          beginAtZero: true,
          ...options.scales?.y,
        },
      },
      ...options,
    };

    chartRef.current = new ChartJS(canvasRef.current, {
      type,
      data,
      options: merged,
      ...darkDefaults,
    });

    return () => {
      if (chartRef.current) {
        chartRef.current.destroy();
        chartRef.current = null;
      }
    };
  }, [type, data, options]);

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <canvas ref={canvasRef} />
    </div>
  );
}
