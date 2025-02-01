/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { Process } from "../lib/types";

import { fifo, sjf, edf, roundRobin, calculateTurnaround } from "../lib/utils";


export function useScheduler() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<"FIFO" | "SJF" | "RR" | "EDF">("FIFO");
  const [quantum, setQuantum] = useState<number>(2);
  const [overhead, setOverhead] = useState<number>(1); // ADICIONADO
  const [turnaroundAvg, setTurnaroundAvg] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);


  const runScheduler = () => {
    if (isExecuting) return;
    setIsExecuting(true);

    setProcesses((prevProcesses) => {
      let scheduledProcesses: Process[] = [];

      switch (algorithm) {
        case "FIFO":
          scheduledProcesses = fifo(prevProcesses);
          break;
        case "SJF":
          scheduledProcesses = sjf(prevProcesses);
          break;
        case "EDF":
          scheduledProcesses = edf(prevProcesses, quantum, overhead);
          break;
        case "RR":
          scheduledProcesses = roundRobin(prevProcesses, quantum, overhead);
          break;
      }

      // Calcular o turnaround médio corretamente
      const turnaround = calculateTurnaround(scheduledProcesses);
      setTurnaroundAvg(turnaround);

      return scheduledProcesses;
    });

    setTimeout(() => setIsExecuting(false), 1000);
  };

  return { processes, setProcesses, algorithm, setAlgorithm, quantum, setQuantum, runScheduler, turnaroundAvg, isExecuting };

}

