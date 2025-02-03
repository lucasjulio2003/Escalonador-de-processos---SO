import { useState, useEffect } from "react";
import { Process } from "../lib/types";
import { simulateQueue } from "../lib/utils";

export default function GanttChart({
  processes,
  algorithm,
  quantum,
  overhead,
  isRunning
}: {
  processes: Process[];
  algorithm: string;
  quantum: number;
  overhead: number;
  isRunning: boolean;
}) {
  // Now the state holds an array of history steps
  const [history, setHistory] = useState<
    { processes: Process[]; overheadProcess: number | null }[]
  >([]);
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    if (!isRunning) return;
    // Destructure to get only the history array
    const simulationResult = simulateQueue(processes, algorithm, quantum, overhead);
    setHistory(simulationResult.history);
    setDisplayIndex(0);
  }, [processes, algorithm, quantum, overhead, isRunning]);

  useEffect(() => {
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
          <div className="w-4 h-4 bg-stone-800" />
          <span>Após Deadline</span>
        </div>
      </div>

      {isRunning && (
        <div className="flex space-x-2">
          {/* Column of labels: top cell = time index, then process labels */}
          <div className="flex flex-col space-y-2">
            <div className="bg-gray-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">
              t
            </div>
            {processes
              .slice()
              .sort((a, b) => a.id - b.id)
              .map((p) => (
                <div
                  key={p.id}
                  className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center"
                >
                  P{p.id}
                </div>
              ))}
          </div>

          {/* Render one column for each simulation step */}
          {history.slice(0, displayIndex + 1).map((step, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">
                {i}
              </div>
              {processes
                .slice()
                .sort((a, b) => a.id - b.id)
                .map((p) => {
                  let color = "bg-gray-500"; // default: idle

                  if (step.overheadProcess !== null) {
                    if (step.overheadProcess === p.id) {
                      color = "bg-red-500";
                    } else {
                      const idx = step.processes.findIndex(
                        (proc) => proc.id === p.id
                      );
                      if (idx !== -1) {
                        color = "bg-yellow-500";
                      }
                    }
                  } else {
                    const idx = step.processes.findIndex(
                      (proc) => proc.id === p.id
                    );
                    if (idx !== -1) {
                      color = idx === 0 ? "bg-green-500" : "bg-yellow-500";
                    }
                  }

                  return (
                    <div key={p.id} className={`${color} text-white p-2 h-4`} />
                  );
                })}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
