import { useState, useEffect } from "react";
import { Process } from "../lib/types";
import { fifo, sjf, edf, roundRobin } from "../lib/utils";

function simulateQueue(processes: Process[], algorithm: string, quantum: number, overhead: number) {
  let scheduledProcesses: Process[] = []; // Lista de processos escalonados

  console.log(`🟢 Iniciando simulação com algoritmo: ${algorithm}`);
  console.log(`🔢 Processos iniciais:`, JSON.parse(JSON.stringify(processes)));

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

  console.log(`🚀 Processos escalonados:`, JSON.parse(JSON.stringify(scheduledProcesses)));

  while (scheduledProcesses.some((p) => p.executationTime > 0)) {
    console.log(`⏳ Tempo ${currentTime}: Verificando processos...`);

    scheduledProcesses.forEach((p) => {
      if (p.arrivalTime <= currentTime && p.executationTime > 0 && !queue.includes(p)) {
        queue.push(p);
        console.log(`✅ Tempo ${currentTime}: Processo P${p.id} chegou e entrou na fila.`);
      }
    });

    if (queue.length > 0) { // Se há processos na fila, executar
      console.log(`▶️ Tempo ${currentTime}: Processos na fila:`, queue.map(p => `P${p.id}`));

      if ((algorithm === "RR" || algorithm === "EDF") && overheadProcess !== null) {
        console.log(`⚠️ Tempo ${currentTime}: Aplicando sobrecarga ao processo P${overheadProcess}`);
         // Registra sobrecarga

        for (let i = 0; i < overhead; i++) {
          history.push({ processes: [...queue], overheadProcess }); 
          currentTime++;
        }
        overheadProcess = null; // Reseta indicador de sobrecarga
      } else {
        let process = queue[0];
        console.log(`🔹 Tempo ${currentTime}: Executando P${process.id}`);

        process.executationTime--;
        history.push({ processes: [...queue], overheadProcess: null }); // Salva estado no histórico

        if (process.executationTime === 0) {
          console.log(`✅ Tempo ${currentTime}: P${process.id} finalizado.`);
          queue.shift(); // Remove processo concluído
        }

        if (algorithm === "RR" || algorithm === "EDF") {
          if (process.executationTime === quantum) {
            if (queue.length == 1) {
              break
            }
            overheadProcess = process.id;
            console.log(`🔴 Tempo ${currentTime}: P${process.id} sofreu preempção e será pausado.`);
            queue.push(queue.shift()!); // Move o processo para o final da fila
            currentTime += overhead; // Aplica sobrecarga
          }
        }

        
      }
    } else {
      console.log(`⏳ Tempo ${currentTime}: Nenhum processo pronto para execução.`);
      history.push({ processes: [], overheadProcess: null }); // Registra tempo ocioso
    }

    currentTime++; // Incrementa tempo da simulação
  }

  console.log("🏁 Simulação finalizada!");
  console.log("📊 Histórico final:", JSON.parse(JSON.stringify(history)));

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