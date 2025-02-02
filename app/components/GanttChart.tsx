import { useState, useEffect } from "react";
import { Process } from "../lib/types";
import { simulateQueue } from "../lib/utils";

export default function GanttChart({
  processes, algorithm, quantum, overhead, isRunning
}: {
  processes: Process[],
  algorithm: string,
  quantum: number,
  overhead: number,
  isRunning: boolean
}) {
  const [history, setHistory] = useState<{ processes: Process[], overheadProcess: number | null }[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    // Run new simulation
    const newHistory = simulateQueue(processes, algorithm, quantum, overhead);
    setHistory(newHistory);
    setDisplayIndex(0);
  }, [processes, algorithm, quantum, overhead, isRunning]);

  useEffect(() => {
    // Animate the Gantt in 500ms intervals
    if (displayIndex < history.length - 1) {
      const intervalId = setInterval(() => {
        setDisplayIndex((prev) => prev + 1);
      }, 500);
      return () => clearInterval(intervalId);
    }
  }, [displayIndex, history]);

  return (
    <div className="p-4 border rounded bg-gray-700 text-white my-4">
      <h2 className="text-xl">Gráfico de Gantt</h2>

      {/* Legenda */}
      <div className="flex space-x-4 my-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500" />
          <span>Executando</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500" />
          <span>Esperando</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500" />
          <span>Ocioso</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500" />
          <span>Sobrecarga</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-stone-800"></div>
          <span>Após Deadline</span>
        </div>
      </div>

      {isRunning && (
        <div className="flex space-x-2">
          {/* Column of labels: top cell = time index, others = process labels */}
          <div className="flex flex-col space-y-2">
            <div className="bg-gray-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">t</div>
            {processes.map((p) => (
              <div key={p.id}
                className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center"
              >
                P{p.id}
              </div>
            ))}
          </div>

          {history.slice(0, displayIndex + 1).map((step, i) => (
            <div key={i} className="flex flex-col space-y-2">
              {/* Top cell shows the current time index */}
              <div
                className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center"
              >
                {i}
              </div>
              {/* For each process, decide the color */}
              {processes.map((p) => {
                // Overhead coloring for RR/EDF if this step is overhead
                if (step.overheadProcess === p.id) {
                  return <div key={p.id} className="bg-red-500 text-white p-2 h-4" />;
                }

                // If ANY process is in step.processes, we have at least one occupant
                // The first in step.processes is running = green
                // The rest in step.processes are waiting = yellow
                // If p is not in step.processes -> idle or not relevant
                const idx = step.processes.findIndex((proc) => proc.id === p.id);
                if (idx === -1) {
                  // Not in queue and not overhead -> CPU idle or process not arrived yet or finished
                  return <div key={p.id} className="bg-gray-500 text-white p-2 h-4" />;
                }

                // Found the process in `step.processes`
                return idx === 0
                  ? <div key={p.id} className="bg-green-500 text-white p-2 h-4" /> // running
                  : <div key={p.id} className="bg-yellow-500 text-white p-2 h-4" />; // waiting
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
