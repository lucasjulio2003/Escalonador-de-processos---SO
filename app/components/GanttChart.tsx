import { useState, useEffect } from "react";
import { Process } from "../lib/types";
import { fifo, sjf, edf, roundRobin } from "../lib/utils";

function simulateQueue(processes: Process[], algorithm: string, quantum: number, overhead: number) {
  let scheduledProcesses: Process[] = [];

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

  let currentTime = 0; // Tempo atual da simulação
  const history: { processes: Process[], overheadProcess: number | null }[] = []; // Histórico da execução
  const queue: Process[] = []; // Fila de processos prontos
  let overheadProcess: number | null = null; // Guarda qual processo sofreu sobrecarga

  console.log("🟢 Iniciando simulação com algoritmo:", algorithm);
  console.log("🔢 Processos iniciais:", scheduledProcesses);

  while (scheduledProcesses.some((p) => p.executationTime > 0)) {
    scheduledProcesses.forEach((p) => {
      if (p.arrivalTime <= currentTime && p.executationTime > 0 && !queue.includes(p)) {
        queue.push(p); // Adiciona processo à fila quando ele chega
        console.log(`⏳ Tempo ${currentTime}: Processo P${p.id} chegou e entrou na fila.`);
      }
    });

    if (queue.length > 0) { // Se houver processos na fila, executa
      let process = queue[0];

      // 🚨 Se RR ou EDF estiver aplicando sobrecarga
      if (algorithm === "RR" || algorithm === "EDF") {
        let executionTime = Math.min(quantum, process.executationTime);
        console.log(`▶️ Tempo ${currentTime}: P${process.id} começou a executar (até ${executionTime} unidades).`);
        
        history.push({ processes: [...queue], overheadProcess }); // Marca sobrecarga

        process.executationTime -= executionTime;
        currentTime += executionTime;

        if (process.executationTime === 0) {
          console.log(`✅ Tempo ${currentTime}: P${process.id} finalizado.`);
          
          // Se RR ou EDF, aplica sobrecarga no próximo ciclo
          if (algorithm === "RR" || algorithm === "EDF") {
            overheadProcess = process.id;
            console.log(`🔴 Tempo ${currentTime}: P${process.id} sofrerá sobrecarga antes de sair.`);
          }

          queue.shift(); // Remove processo da fila
        }
      } else {
        // Executa o processo
        process.executationTime--;
        console.log(`▶️ Tempo ${currentTime}: Executando P${process.id}, restante: ${process.executationTime} unidades.`);
        history.push({ processes: [...queue], overheadProcess: null });

        // Se o processo terminou
        
      }
    } else {
      // Nenhum processo pronto para execução
      history.push({ processes: [], overheadProcess: null });
      console.log(`⏳ Tempo ${currentTime}: Nenhum processo pronto.`);
    }

    currentTime++;
  }

  console.log("🏁 Simulação finalizada!");
  console.log("📊 Histórico final:", history);
  
  return history;
}


export default function GanttChart({ processes, algorithm, quantum, overhead }: { processes: Process[], algorithm: string, quantum: number, overhead: number }) {
  const history = simulateQueue(processes, algorithm, quantum, overhead);
  const [displayIndex, setDisplayIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayIndex((prev) => (prev < history.length - 1 ? prev + 1 : prev));
    }, 1000);
    return () => clearInterval(interval);
  }, [history]);

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
              let color = "bg-gray-500"; // Padrão: Processo não está na fila

              // Apenas EDF e RR sofrem sobrecarga
              if ((algorithm === "RR" || algorithm === "EDF") && step.overheadProcess === p.id) {
                color = "bg-red-500"; // Apenas o processo específico sofre sobrecarga
              } else if (step.processes.find((q) => q.id === p.id)) {
                color = "bg-yellow-500"; // Processo esperando na fila
              }
              if (!step.overheadProcess && step.processes.length > 0 && step.processes[0].id === p.id) {
                color = "bg-green-500"; // Processo executando
              }

              return <div key={p.id} className={`${color} text-white p-2 h-4`} />;
            })}
          </div>
        ))}
      </div>
    </div>
  );
}