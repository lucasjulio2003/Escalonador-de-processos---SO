import { useState, useEffect, useCallback } from "react";
import { Process } from "../lib/types";
import { fifo, sjf, edf, roundRobin } from "../lib/utils";

function simulateQueue(processes: Process[], algorithm: string, quantum: number, overhead: number) {
  let scheduledProcesses: Process[] = []; // Lista de processos escalonados

  // Escolhe o algoritmo de escalonamento
  switch (algorithm) {
    case "FIFO":
      scheduledProcesses = fifo(processes);
      break;
    case "SJF":
      scheduledProcesses = sjf(processes);
      break;
    case "EDF":
      scheduledProcesses = edf(processes, quantum, overhead);
      break;
    case "RR":
      scheduledProcesses = roundRobin(processes, quantum, overhead);
      break;
  }

  let currentTime = 0; // Controla o tempo atual da simulação
  const history: { processes: Process[], overheadProcess: number | null }[] = []; // Histórico de execução dos processos
  const queue: Process[] = []; // Fila de processos prontos para execução
  let overheadProcess: number | null = null; // Identifica se um processo sofreu sobrecarga

  while (scheduledProcesses.some((p) => p.executationTime > 0) || queue.length > 0) {
    scheduledProcesses.forEach((p) => {
      if (p.arrivalTime <= currentTime && p.executationTime > 0 && !queue.includes(p)) {
        queue.push(p);
        p.executedTime = 0;
      }
    });

    if (queue.length > 0) {
      if ((algorithm === "RR" || algorithm === "EDF") && overheadProcess !== null) {
        for (let i = 0; i < overhead; i++) {
          history.push({ processes: [...queue], overheadProcess });
          currentTime++;
        }

        // 🔴 Exibe detalhes do processo que sofreu sobrecarga
        // let processOverhead = scheduledProcesses.find(p => p.id === overheadProcess);
        // if (processOverhead) {
        //   console.log(`⚠️ Tempo ${currentTime}: P${processOverhead.id} sofreu sobrecarga`, {
        //     id: processOverhead.id,
        //     arrivalTime: processOverhead.arrivalTime,
        //     executationTime: processOverhead.executationTime,
        //     remainingTime: processOverhead.remainingTime ?? processOverhead.executationTime,
        //     deadline: processOverhead.deadline,
        //     numPages: processOverhead.numPages,
        //     systemOverhead: processOverhead.systemOverhead
        //   });
        // }

        overheadProcess = null;
      } else {
        const process = queue[0];
        process.executationTime--;
        process.executedTime++;
        history.push({ processes: [...queue], overheadProcess: null });

        if (process.executationTime === 0) {
          queue.shift();
        }

        if (algorithm === "RR" || algorithm === "EDF") {
          if (process.executedTime === quantum) {
            if (queue.length > 1) {
              console.log("entrou");

              overheadProcess = process.id;
              queue.push(queue.shift()!);
              currentTime += overhead;
            }
          }
        }
      }
    } else {
      history.push({ processes: [], overheadProcess: null });
    }

    scheduledProcesses = scheduledProcesses.filter(p => p.executationTime > 0);

    if (queue.length === 0 && scheduledProcesses.every(p => p.executationTime <= 0)) {
      // console.log("🚨 Nenhum processo restante. Encerrando a simulação.");
      break;
    }

    currentTime++;
  }

  return history;
}

export default function GanttChart({ processes, algorithm, quantum, overhead }: { processes: Process[], algorithm: string, quantum: number, overhead: number }) {
  const [history, setHistory] = useState<{ processes: Process[], overheadProcess: number | null }[]>([]);
  const [displayIndex, setDisplayIndex] = useState(0);

  const runSimulation = useCallback(() => {
    const result = simulateQueue(processes, algorithm, quantum, overhead);
    setHistory(result);
    setDisplayIndex(0);
  }, [processes, algorithm, quantum, overhead]);

  useEffect(() => {
    runSimulation();
  }, [runSimulation]);

  useEffect(() => {
    if (displayIndex < history.length - 1) {
      const interval = setInterval(() => {
        setDisplayIndex((prev) => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [history, displayIndex]);

  return (
    <div className="p-4 border rounded bg-gray-700 text-white my-4">
      <h2 className="text-xl">Gráfico de Gantt</h2>

      {/* Legenda */}
      <div className="flex space-x-4 my-2">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500"></div>
          <span>Executando</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500"></div>
          <span>Esperando</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500"></div>
          <span>Sobrecarga</span>
        </div>
      </div>

      {/* Exibição do gráfico */}
      <div className="flex space-x-2">
        <div className="flex flex-col space-y-2">
          {processes.map((p) => (
            <div key={p.id} className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">
              P{p.id}
            </div>
          ))}
        </div>

        {history.slice(0, displayIndex + 1).map((step, i) => (
          <div key={i} className="flex flex-col space-y-2">
            {processes.map((p) => {
              let color = "bg-gray-500";

              if ((algorithm === "RR" || algorithm === "EDF") && step.overheadProcess === p.id) {
                color = "bg-red-500";
              } else if (step.processes.find((q) => q.id === p.id)) {
                color = "bg-yellow-500";
              }
              if (!step.overheadProcess && step.processes.length > 0 && step.processes[0].id === p.id) {
                color = "bg-green-500";
              }

              return <div key={p.id} className={`${color} text-white p-2 h-4`} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}
