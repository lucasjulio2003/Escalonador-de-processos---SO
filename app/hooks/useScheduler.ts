/* eslint-disable @typescript-eslint/no-unused-vars */
import { useState } from "react";
import { Process } from "../lib/types";

import { fifo, sjf, edf, roundRobin, calculateTurnaround } from "../lib/utils";


export function useScheduler() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<"FIFO" | "SJF" | "RR" | "EDF">("FIFO");
  const [quantum, setQuantum] = useState<number>(0);
  const [overhead, setOverhead] = useState<number>(0); // ADICIONADO
  const [turnaroundAvg, setTurnaroundAvg] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  // Apenas salva os processos sem rodar imediatamente
  const saveProcesses = (newProcesses: Process[]) => {
    setProcesses(newProcesses);
    setIsRunning(false); // Não iniciar o gráfico ainda!
  };
  


  // Só executa a simulação quando o botão "Executar" for pressionado
  const runScheduler = () => {
    if (isExecuting || processes.length === 0) return;
    setIsExecuting(true);
    setIsRunning(true); // Agora pode rodar o gráfico

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

  return {
    processes,
    saveProcesses, // Modificado para salvar sem executar
    algorithm,
    setAlgorithm,
    quantum,
    setQuantum,
    overhead,
    setOverhead,
    runScheduler,
    turnaroundAvg,
    isExecuting,
    isRunning, // Estado que controla quando os processos estão prontos
  };
}

