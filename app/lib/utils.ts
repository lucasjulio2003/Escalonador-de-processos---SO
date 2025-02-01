// lib/utils.ts
import { Process } from "./types";

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

  while (remainingProcesses.length > 0) {
    // Filtrar processos disponíveis no tempo atual
    let availableProcesses = remainingProcesses.filter((p) => p.arrivalTime <= time);

    // Se não há processos disponíveis, avançamos o tempo até o próximo chegar
    if (availableProcesses.length === 0) {
      time = remainingProcesses[0].arrivalTime;
      availableProcesses = [remainingProcesses[0]];
    }

    // Escolher o processo com menor tempo de execução
    let shortestJob = availableProcesses.reduce((prev, curr) => 
      prev.executationTime < curr.executationTime ? prev : curr
    );

    // Executar o processo pelo tempo correto
    time += shortestJob.executationTime;
    
    result.push({ ...shortestJob, completionTime: time });

    // Remover processo concluído
    remainingProcesses = remainingProcesses.filter((p) => p.id !== shortestJob.id);
  }

  return result;
}

/**
 * Round Robin - Considera um quantum fixo
 */
export function roundRobin(processes: Process[], quantum: number, overhead: number): Process[] {

  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))];
  let result: Process[] = [];
  let time = 0;

  let executionHistory: { id: number; executedTime: number }[] = [];

  while (queue.length > 0) {
    let process = queue.shift()!;
    let executionTime = Math.min(quantum, process.remainingTime);

    process.remainingTime -= executionTime;
    time += executionTime;

    // Adiciona sobrecarga apenas se o processo ainda tiver tempo restante
    if (process.remainingTime > 0) {
      time += overhead;
      queue.push(process);
    } else {
      result.push({ ...process, completionTime: time });
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
    queue.sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity)); // Ordena pelo menor deadline
    let process = queue.shift()!;
    let executionTime = Math.min(quantum, process.remainingTime);

    process.remainingTime -= executionTime;
    time += executionTime;

    // Adiciona sobrecarga se o processo não terminou
    if (process.remainingTime > 0) {
      time += overhead;
      queue.push(process);
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