import { useState, useEffect } from "react";
import { Process } from "../lib/types";
import { simulateQueue } from "../lib/utils";

/**
 * Determines the cell color for a given process at a given simulation time step,
 * based on the simulation state in `step` and the scheduling algorithm.
 *
 * New rules:
 * - If the simulation has reached a process's deadline (for EDF), return black.
 * - If overhead is active:
 *    - If this process is the one causing overhead, return red.
 *    - Otherwise, if the process is in the ready queue, return yellow.
 * - If no overhead is active:
 *    - If the process is present:
 *         - If it is the first (i.e. running), return green.
 *         - Otherwise, return yellow.
 * - Otherwise, return gray (idle).
 *
 * (Red, yellow, green, and black cells all count toward turnaround.)
 */
function getCellColor(
  p: Process,
  timeStep: number,
  step: { processes: Process[]; overheadProcess: number | null },
  algorithm: string
): string {
  // For EDF, mark all cells black after the deadline if the process is present and not during overhead
  if (
    algorithm === "EDF" &&
    p.deadline !== undefined &&
    timeStep >= p.arrivalTime + p.deadline &&
    step.overheadProcess === null &&
    step.processes.some((proc) => proc.id === p.id)
  ) {
    return "bg-stone-800";
  }

  // If overhead is active in this time step...
  if (step.overheadProcess !== null) {
    if (step.overheadProcess === p.id) {
      return "bg-red-500"; // overhead block for this process
    } else if (step.processes.findIndex((proc) => proc.id === p.id) !== -1) {
      return "bg-yellow-500"; // waiting during overhead
    }
  } else {
    // No overhead active.
    const idx = step.processes.findIndex((proc) => proc.id === p.id);
    if (idx !== -1) {
      return idx === 0 ? "bg-green-500" : "bg-yellow-500";
    }
  }
  return "bg-gray-500"; // idle (process not present)
}

/**
 * Computes the custom turnaround average from the simulation history.
 * For each time step (column) in the history and for each process, if the cell's color
 * is not idle (bg-gray-500), we count it. (Deadline cells in EDF are black and count only if reached.)
 * The average turnaround is the total count divided by the number of processes.
 */
function computeCustomTurnaround(
  history: { processes: Process[]; overheadProcess: number | null }[],
  processes: Process[],
  algorithm: string
): number {
  let totalCount = 0;
  // Loop over each time step.
  for (let timeStep = 0; timeStep < history.length; timeStep++) {
    const step = history[timeStep];
    // For consistency, sort processes by id.
    const sortedProcs = processes.slice().sort((a, b) => a.id - b.id);
    for (const p of sortedProcs) {
      const cellColor = getCellColor(p, timeStep, step, algorithm);
      // Count the cell if it is not idle (gray).
      if (cellColor !== "bg-gray-500") {
        totalCount++;
      }
    }
  }
  return processes.length > 0 ? totalCount / processes.length : 0;
}

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
  const [history, setHistory] = useState<
    { processes: Process[]; overheadProcess: number | null }[]
  >([]);
  const [displayIndex, setDisplayIndex] = useState(0);
  const [turnaround, setTurnaround] = useState<number>(0);

  useEffect(() => {
    if (!isRunning) return;
    // Run the simulation to obtain the complete history.
    const newHistory = simulateQueue(processes, algorithm, quantum, overhead);
    setHistory(newHistory);
    setDisplayIndex(0);

    // Compute the custom turnaround based on the simulation history.
    const customTurnaround = computeCustomTurnaround(newHistory, processes, algorithm);
    setTurnaround(customTurnaround);
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
          <span>Deadline</span>
        </div>
      </div>

      {isRunning && (
        <div className="flex space-x-2">
          {/* Column labels */}
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
          {history.slice(0, displayIndex + 1).map((step, i) => (
            <div key={i} className="flex flex-col space-y-2">
              <div className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">
                {i}
              </div>
              {processes
                .slice()
                .sort((a, b) => a.id - b.id)
                .map((p) => {
                  let color = "bg-gray-500";
                  if (
                    algorithm === "EDF" &&
                    p.deadline !== undefined &&
                    i >= p.arrivalTime + p.deadline &&
                    step.overheadProcess === null &&
                    step.processes.some((proc) => proc.id === p.id)
                  ) {
                    color = "bg-stone-800";
                  } else if (step.overheadProcess !== null) {
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

      <div className="mt-4 text-white text-lg">
        <h3>
          Turnaround Médio: {turnaround.toFixed(2)} unidades de tempo
        </h3>
      </div>
    </div>
  );
}
