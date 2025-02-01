import { useState } from "react";
import { Process } from "../lib/types";
import { fifo, sjf, edf, roundRobin } from "../lib/utils";

export function useScheduler() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<"FIFO" | "SJF" | "RR" | "EDF">("FIFO");
  const [quantum, setQuantum] = useState<number>(2); // Quantum dinâmico para RR
  const [turnaroundAvg, setTurnaroundAvg] = useState<number>(0);

  const runScheduler = () => {
    setProcesses((prevProcesses) => {
      let scheduledProcesses: Process[] = []; // Adicionando tipagem explícita

      if (algorithm === "FIFO") scheduledProcesses = fifo(prevProcesses);
      if (algorithm === "SJF") scheduledProcesses = sjf(prevProcesses);
      if (algorithm === "EDF") scheduledProcesses = edf(prevProcesses);
      if (algorithm === "RR") scheduledProcesses = roundRobin(prevProcesses, quantum);

      if (!scheduledProcesses) return prevProcesses;

      let currentTime = 0;
      let turnaroundSum = 0;

      scheduledProcesses.forEach((process) => {
        const turnaround = currentTime - process.arrivalTime + process.executationTime;
        turnaroundSum += turnaround;
        currentTime += process.executationTime;
      });

      setTurnaroundAvg(turnaroundSum / scheduledProcesses.length);
      return scheduledProcesses;
    });
  };

  return { processes, setProcesses, algorithm, setAlgorithm, quantum, setQuantum, runScheduler, turnaroundAvg };
}
