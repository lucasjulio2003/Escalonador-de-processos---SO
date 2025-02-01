// lib/utils.ts
import { Process } from "./types";

/**
 * FIFO - Escalonamento First In, First Out
 * Ordena os processos pelo tempo de chegada
 */
export function fifo(processes: Process[]): Process[] {
  return [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
}

/**
 * SJF - Shortest Job First (Não preemptivo)
 * Ordena os processos pelo tempo de execução (burst time)
 */
export function sjf(processes: Process[]): Process[] {
  return [...processes].sort((a, b) => a.executationTime - b.executationTime);
}

/**
 * Round Robin - Considera um quantum fixo
 */
export function roundRobin(processes: Process[], quantum: number): Process[] {
  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))];
  let result: Process[] = [];
  let time = 0;

  let executionHistory: { id: number; executedTime: number }[] = [];

  while (queue.length > 0) {
    let process = queue.shift()!;
    
    let executionTime = Math.min(quantum, process.remainingTime); // Garante que não exceda o tempo restante
    process.remainingTime -= executionTime;
    time += executionTime;

    executionHistory.push({ id: process.id, executedTime: executionTime });

    if (process.remainingTime > 0) {
      queue.push(process); // Se ainda tem tempo restante, volta para a fila
    } else {
      process.turnaroundTime = time - process.arrivalTime;
      result.push(process);
    }
  }

  console.log("Histórico de Execução Round Robin:", executionHistory);
  return result;
}


/**
 * EDF - Earliest Deadline First (Não preemptivo)
 * Ordena os processos pelo menor deadline
 */
export function edf(processes: Process[]): Process[] {
  return [...processes].sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity));
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
  let currentTime = 0;
  let turnaroundSum = 0;

  processes.forEach((process) => {
    const turnaround = currentTime - process.arrivalTime + process.executationTime;
    turnaroundSum += turnaround;
    currentTime += process.executationTime;
  });

  return processes.length > 0 ? turnaroundSum / processes.length : 0;
}