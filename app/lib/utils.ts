/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// lib/utils.ts
import { Process } from "./types";

export function simulateQueue(processes: Process[], algorithm: string, quantum: number, overhead: number) {
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

  console.log("Processos escalonados:", scheduledProcesses);

  while (scheduledProcesses.some((p) => p.executationTime > 0) || queue.length > 0) {
    scheduledProcesses.forEach((p: Process) => {
      if (p.arrivalTime <= currentTime && p.executationTime > 0 && !queue.includes(p)) {
        queue.push(p);
        console.log(`⏰ Tempo ${currentTime}: P${p.id} chegou à fila de prontos`);
        p.executedTime = 0;
        console.log("Fila de processos:", queue);
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
        let process = queue[0];
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

  console.log("Histórico de execução:", history);

  return history;
}

/**
 * FIFO - Escalonamento First In, First Out
 * Ordena os processos pelo tempo de chegada
 */
export function fifo(processes: Process[]): Process[] {
  let time = 0;
  return [...processes]
    .sort((a, b) => a.arrivalTime - b.arrivalTime)
    .map((p) => {
      time = Math.max(time, p.arrivalTime) + p.executationTime;
      return { ...p, completionTime: time };
    });
}

/**
 * SJF - Shortest Job First (Não preemptivo)
 * Ordena os processos pelo tempo de execução (burst time)
 */
export function sjf(processes: Process[]): Process[] {
  let time = 0;
  let remainingProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let result: Process[] = [];
  let queue: Process[] = [];

  while (remainingProcesses.length > 0 || queue.length > 0) {
    // 🔹 Adiciona processos que chegaram à fila de prontos antes de escolher o próximo
    while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
      queue.push(remainingProcesses.shift()!);
    }

    // 🔹 Se a fila está vazia, avança o tempo até o próximo processo chegar
    if (queue.length === 0) {
      time = remainingProcesses[0].arrivalTime;
      continue;
    }

    // 🔹 Ordena a fila por tempo de execução (menor primeiro)
    queue.sort((a, b) => a.executationTime - b.executationTime);

    // 🔹 Seleciona o processo com menor tempo de execução
    let shortestJob = queue.shift()!;

    // 🔹 Avança o tempo conforme o tempo de execução do processo
    time += shortestJob.executationTime;
    result.push({ ...shortestJob, completionTime: time });

    // 🔹 Reavaliar se novos processos chegaram enquanto o processo estava executando
    while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
      queue.push(remainingProcesses.shift()!);
    }

    // 🔹 Ordena novamente após a chegada de novos processos
    queue.sort((a, b) => a.executationTime - b.executationTime);
  }

  console.log("Resultado SJF:", result);

  return result;
}


/**
 * Round Robin - Considera um quantum fixo
 */
export function roundRobin(processes: Process[], quantum: number, overhead: number): Process[] {
  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))]; // copia dos processos
  let result: Process[] = []; // proc finalizados
  let time = 0; //tempo global

  while (queue.length > 0) {
    let process = queue.shift()!; // Pega o primeiro processo da fila

    let executionTime = Math.min(quantum, process.remainingTime); // remainingTime -> tempo restante do processo
    process.remainingTime -= executionTime;
    time += executionTime;

    // Se o processo ainda não terminou, adicionamos a sobrecarga
    if (process.remainingTime > 0) {
      time += overhead; // Adiciona tempo de sobrecarga
      queue.push(process); // Processo volta para o final da fila
    } else {
      result.push({ ...process, completionTime: time }); // Armazena o tempo de término
    }
  }

  return result;
}


/**
 * EDF - Earliest Deadline First (Não preemptivo)
 * Ordena os processos pelo menor deadline
 */

export function edf(processes: Process[], quantum: number, overhead: number): Process[] {
  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))];
  let result: Process[] = [];
  let time = 0;

  while (queue.length > 0) {
    // Ordena os processos pelo menor deadline
    queue.sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity));

    let process = queue.shift()!; // Remove o primeiro processo (com menor deadline)
    let executionTime = Math.min(quantum, process.remainingTime);

    process.remainingTime -= executionTime;
    time += executionTime;

    if (process.remainingTime > 0) {
      time += overhead; // Aplica a sobrecarga antes de voltar para a fila
      queue.push(process); // Processo volta para a fila
    } else {
      result.push({ ...process, completionTime: time });
    }
  }

  return result;
}


import { Page } from "./types";

/**
 * Algoritmo FIFO (First-In, First-Out)
 * Remove a página mais antiga quando a RAM está cheia.
 */
export function fifoReplacement(memory: Page[], newPage: Page): Page[] {
  return [...memory.slice(1), newPage]; // Remove a primeira página e adiciona a nova
}

/**
 * Algoritmo LRU (Least Recently Used)
 * Remove a página menos recentemente usada.
 */
export function lruReplacement(memory: Page[], newPage: Page): Page[] {
  return [...memory.slice(1), newPage]; // Simplesmente substituímos a primeira página (LRU básico)
}

/**
 * Verifica se todas as páginas de um processo estão na RAM antes da execução.
 * Retorna `true` se o processo pode ser executado, `false` caso contrário.
 */
export function canExecuteProcess(process: Process, memory: Page[]): boolean {
  const processPages = memory.filter((page) => page.processId === process.id);
  return processPages.length >= process.numPages;
}

/**
 * Simula a execução dos processos com delay e controle de memória RAM.
 * Retorna a sequência de execução dos processos.
 */
export async function executeProcessesWithDelay(
  processes: Process[],
  memory: Page[],
  quantum: number,
  delay: number
): Promise<Process[]> {
  let queue = [...processes];
  let result: Process[] = [];
  let time = 0;

  while (queue.length > 0) {
    let process = queue.shift()!;

    if (!canExecuteProcess(process, memory)) {
      console.log(`Processo ${process.id} não pode executar (páginas ausentes na RAM)`);
      queue.push(process);
      continue;
    }

    await new Promise((resolve) => setTimeout(resolve, delay)); // Delay na execução.

    if (process.executationTime > quantum) {
      time += quantum;
      process.executationTime -= quantum;
      queue.push(process);
    } else {
      time += process.executationTime;
      process.executationTime = 0;
      result.push({ ...process, turnaroundTime: time - process.arrivalTime });
    }
  }
  return result;
}

/**
 * Calcula o turnaround médio dos processos.
 * Turnaround = tempo de espera + tempo de execução.
 */
export function calculateTurnaround(processes: Process[]): number {
  let turnaroundSum = processes.reduce((sum, p) => sum + (p.completionTime! - p.arrivalTime), 0);
  return processes.length > 0 ? turnaroundSum / processes.length : 0;
}