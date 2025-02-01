import { useState, useEffect } from "react";
import { Process } from "../lib/types";

function simulateQueue(processes: Process[], limitTime: number) {
  // (exatamente como você já tem)
  let currentTime = 0;
  const history: Process[][] = [];
  const queue: Process[] = [];


  while (processes.some((p) => p.remainingTime > 0)) {  
    // Adiciona e executa processos…
    processes.forEach((p) => {
      if (p.arrivalTime <= currentTime && p.remainingTime > 0 && !queue.includes(p)) {
        queue.push(p);
      }
    });

    if (queue.length > 0) {
      queue[0].remainingTime--;
    }

    history.push(queue.map((p) => ({ ...p })));

    if (queue.length > 0 && queue[0].remainingTime === 0) {
      queue.shift();
    }
    currentTime++;
  }

  return history;
}

export default function GanttChart({ processes }: { processes: Process[] }) {
  const limitTime = 10;

  // Fazemos a simulação apenas 1 vez, por exemplo, no "mount"
  const processesCopy = processes.map((p) => ({ ...p }));
  const history = simulateQueue(processesCopy, limitTime);

  // Estado que vai dizer até qual coluna do histórico vamos exibir
  const [displayIndex, setDisplayIndex] = useState(0);

  // A cada X ms, incrementa o displayIndex para exibir a próxima coluna
  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayIndex((prev) => {
        if (prev < history.length - 1) {
          return prev + 1;
        } else {
          // Se já estamos na última coluna, paramos o intervalo
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
              let color = queue.find((q) => q.id === p.id) 
                           ? "bg-yellow-500" 
                           : "bg-gray-500";
              if (queue.length > 0 && queue[0].id === p.id) {
                color = "bg-green-500";
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
