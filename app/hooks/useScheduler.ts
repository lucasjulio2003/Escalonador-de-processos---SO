import { useState } from "react";
import { Process } from "../lib/types";
import { fifo, sjf, edf, roundRobin, calculateTurnaround } from "../lib/utils";

export function useScheduler() {
  const [originalProcesses, setOriginalProcesses] = useState<Process[]>([]);
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

  // Save the processes input and also store the original order.
  const saveProcesses = (newProcesses: Process[]) => {
    setOriginalProcesses(newProcesses);
    setProcesses(newProcesses);
    setIsRunning(false); // Do not start simulation yet!
  };

  // Use the original processes each time so the simulation order stays consistent.
  const runScheduler = () => {
    if (isExecuting || originalProcesses.length === 0) return;

    setIsExecuting(true);
    setIsRunning(true);

    // Always start with a fresh clone of the original processes.
    const inputProcesses = originalProcesses.map(p => ({ ...p }));

    let scheduledProcesses: Process[] = [];
    switch (algorithm) {
      case "FIFO":
        scheduledProcesses = fifo(inputProcesses);
        break;
      case "SJF":
        scheduledProcesses = sjf(inputProcesses);
        break;
      case "EDF":
        scheduledProcesses = edf(inputProcesses, quantum, overhead);
        break;
      case "RR":
        scheduledProcesses = roundRobin(inputProcesses, quantum, overhead);
        break;
    }

    // Update state with the scheduled (and now consistently ordered) processes.
    setProcesses(scheduledProcesses);
    const turnaround = calculateTurnaround(scheduledProcesses);
    setTurnaroundAvg(turnaround);

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
