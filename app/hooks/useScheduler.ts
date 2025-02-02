import { useState } from "react";
import { Process } from "../lib/types";

import { fifo, sjf, edf, roundRobin, calculateTurnaround } from "../lib/utils";


export function useScheduler() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [algorithm, setAlgorithm] = useState<"FIFO" | "SJF" | "RR" | "EDF">("FIFO");
  const [quantum, setQuantum] = useState<number>(1);
  const [overhead, setOverhead] = useState<number>(1); // ADICIONADO
  const [turnaroundAvg, setTurnaroundAvg] = useState<number>(0);
  const [isExecuting, setIsExecuting] = useState<boolean>(false);
  const [isRunning, setIsRunning] = useState<boolean>(false);

  const setQuantumValue = (value: number) => {
    setQuantum(value);
  };
  
  const setOverheadValue = (value: number) => {
    setOverhead(value);
  };
  

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

      // console.log("Processos após escalonamento:", scheduledProcesses);

      // Calcular o turnaround médio corretamente
      const turnaround = calculateTurnaround(scheduledProcesses);
      setTurnaroundAvg(turnaround);

      return scheduledProcesses;
    });

    setTimeout(() => setIsExecuting(false), 1000);
  };

  return {
    processes,
    saveProcesses, 
    algorithm,
    setAlgorithm,
    quantum,
    setQuantum: setQuantumValue, // Usa a função que exibe no console
    overhead,
    setOverhead: setOverheadValue, // Usa a função que exibe no console
    runScheduler,
    turnaroundAvg,
    isExecuting,
    isRunning, 
  };
  
}

