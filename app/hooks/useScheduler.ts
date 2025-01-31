import { useState } from "react";
import { Process } from "../lib/types";
import { fifo, sjf, roundRobin } from "../lib/utils";

export function useScheduler() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<"FIFO" | "SJF" | "RR">("FIFO");

  const runScheduler = () => {
    console.log("Executando escalonador...");
    setProcesses((prevProcesses) => {
      if (algorithm === "FIFO") return fifo(prevProcesses);
      if (algorithm === "SJF") return sjf(prevProcesses);
      return prevProcesses; // Caso não tenha algoritmo definido, mantém os mesmos processos
    });
  };

  return { processes, setProcesses, algorithm, setAlgorithm, runScheduler };
}
