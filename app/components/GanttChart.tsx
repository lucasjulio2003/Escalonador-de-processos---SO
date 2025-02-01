import { useState, useEffect } from "react";
import { Process } from "../lib/types";
import { fifo, sjf, edf, roundRobin } from "../lib/utils";

function simulateQueue(processes: Process[], algorithm: string, quantum: number, overhead: number) {
  let scheduledProcesses: Process[] = [];


  // Escolhe o algoritmo correto para a simulação
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

  let currentTime = 0;
  const history: Process[][] = [];
  const queue: Process[] = [];

  while (scheduledProcesses.some((p) => p.executationTime > 0)) {
    // Adiciona processos que chegaram ao sistema e ainda não foram executados
    scheduledProcesses.forEach((p) => {
      if (p.arrivalTime <= currentTime && p.executationTime > 0 && !queue.includes(p)) {
        queue.push(p);
      }
    });

    if (queue.length > 0) {
      queue[0].executationTime--; // Executa o primeiro processo
    }

    history.push(queue.map((p) => ({ ...p }))); // Salva o estado atual da fila

    if (queue.length > 0 && queue[0].executationTime === 0) {
      queue.shift(); // Remove o processo finalizado da fila
    }
    currentTime++;
  }

  return history;
}

export default function GanttChart({ processes, algorithm, quantum, overhead }: { processes: Process[], algorithm: string, quantum: number, overhead: number }) {
  // Fazemos a simulação apenas 1 vez, por exemplo, no "mount"
  const processesCopy = processes.map((p) => ({ ...p }));
  const history = simulateQueue(processesCopy, algorithm, quantum, overhead);

  // Estado que vai dizer até qual coluna do histórico vamos exibir
  const [displayIndex, setDisplayIndex] = useState(0);

  // A cada X ms, incrementa o displayIndex para exibir a próxima coluna
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayIndex((prev) => {
        if (prev < history.length - 1) {
          return prev + 1;
        } else {
          clearInterval(interval);
          return prev;
        }
      });
    }, 1000); // 1000 ms = 1 segundo

    return () => clearInterval(interval);
  }, [history]);

  return (
    <div className="p-4 border rounded bg-gray-700 text-white my-4">
      <h2 className="text-xl">Gráfico de Gantt</h2>

      {/* Você pode mostrar os processos na primeira coluna (legenda) */}
      <div className="flex space-x-2">
        <div className="flex flex-col space-y-2">
          {processes.map((p) => (
            <div key={p.id} className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">
              P{p.id}
            </div>
          ))}
        </div>

        {/* Aqui exibimos só até displayIndex */}
        {history.slice(0, displayIndex + 1).map((queue, i) => (
          <div key={i} className="flex flex-col space-y-2">
            {processes.map((p) => {
              let color = "bg-gray-500"; // Cinza por padrão (não está na fila)

              if (queue.find((q) => q.id === p.id)) {
                color = "bg-yellow-500"; // Processo está na fila esperando
              }
              if (queue.length > 0 && queue[0].id === p.id) {
                color = "bg-green-500"; // Processo está rodando
              }

              return (
                <div key={p.id} className={`${color} text-white p-2 h-4`} />
              );
            })}
          </div>
        ))}
      </div>
    </div>
  );
}


