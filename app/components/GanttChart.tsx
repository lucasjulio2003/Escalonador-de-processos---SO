import { useState, useEffect, useCallback } from "react";
import { Process } from "../lib/types";
import { simulateQueue } from "../lib/utils";

export default function GanttChart({ processes, algorithm, quantum, overhead, isRunning }: { processes: Process[], algorithm: string, quantum: number, overhead: number, isRunning: boolean }) {
  const [history, setHistory] = useState<{ processes: Process[], overheadProcess: number | null }[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);

  const runSimulation = useCallback(() => {
    const result = simulateQueue(processes, algorithm, quantum, overhead);
    setHistory(result);
    setDisplayIndex(0);
  }, [processes, algorithm, quantum, overhead]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  useEffect(() => {
    if (displayIndex < history.length - 1) {
      const interval = setInterval(() => {
        setDisplayIndex((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [history, displayIndex]);

  return (
    <div className="p-4 border rounded bg-gray-700 text-white my-4">
      <h2 className="text-xl">Gráfico de Gantt</h2>

      {/* Legenda */}
      <div className="flex space-x-4 my-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500"></div>
          <span>Executando</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500"></div>
          <span>Esperando</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500"></div>
          <span>Sobrecarga</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-stone-800"></div>
          <span>Após Deadline</span>
        </div>
      </div>

      {/* Exibição do gráfico */}
      {isRunning && (
      <div className="flex space-x-2">
        <div className="flex flex-col space-y-2">
          <div className="bg-gray-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">x</div>
          {processes.map((p) => (
            <div key={p.id} className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">
              P{p.id}
            </div>
          ))}
        </div>

        {history.slice(0, displayIndex + 1).map((step, i) => (
          <div key={i} className="flex flex-col space-y-2">
            <div className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">{i}</div>
            {processes.map((p) => {
              let color = "bg-gray-500";

              if ((algorithm === "RR" || algorithm === "EDF") && step.overheadProcess === p.id) {
                color = "bg-red-500";
              } else if (step.processes.find((q) => q.id === p.id)) {
                color = "bg-yellow-500";
              }
              if (!step.overheadProcess && step.processes.length > 0 && step.processes[0].id === p.id) {
                color = "bg-green-500";
              }

              return <div key={p.id} className={`${color} text-white p-2 h-4`} />;
            })}
          </div>
        ))}
      </div>)}
    </div>
  );
}
