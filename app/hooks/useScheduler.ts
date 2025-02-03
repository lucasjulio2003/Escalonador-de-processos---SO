// hooks/useScheduler.ts
import { useState } from "react";
import { Process } from "../lib/types";
import { simulateQueue } from "../lib/utils";

export function useScheduler() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<"FIFO" | "SJF" | "RR" | "EDF">("FIFO");
  const [quantum, setQuantum] = useState<number>(1);
  const [overhead, setOverhead] = useState<number>(1);
  const [turnaroundAvg, setTurnaroundAvg] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const setQuantumValue = (value: number) => {
    setQuantum(value);
  };
  
  const setOverheadValue = (value: number) => {
    setOverhead(value);
  };

  // Save the processes (without immediately running the simulation).
  const saveProcesses = (newProcesses: Process[]) => {
    setProcesses(newProcesses);
    setIsRunning(false);
  };

  // Execute the simulation when the "Executar" button is pressed.
  const runScheduler = () => {
    if (isExecuting || processes.length === 0) return;

    setIsExecuting(true);
    setIsRunning(true);

    setProcesses((prevProcesses) => {
      // Run the simulation.
      const { finalProcesses } = simulateQueue(prevProcesses, algorithm, quantum, overhead);

      // Calculate average turnaround time from the final processes.
      const turnaroundSum = finalProcesses.reduce((sum, p) => sum + ((p.completionTime ?? 0) - p.arrivalTime), 0);
      const turnaround = finalProcesses.length > 0 ? turnaroundSum / finalProcesses.length : 0;
      setTurnaroundAvg(turnaround);

      // Return final processes as the new state.
      return finalProcesses;
    });

    setTimeout(() => setIsExecuting(false), 1000);
  };

  return {
    processes,
    saveProcesses, 
    algorithm,
    setAlgorithm,
    quantum,
    setQuantum: setQuantumValue,
    overhead,
    setOverhead: setOverheadValue,
    runScheduler,
    turnaroundAvg,
    isExecuting,
    isRunning, 
  };
}
