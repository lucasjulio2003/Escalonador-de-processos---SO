/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// lib/utils.ts

import { Process, Page } from "./types";

/**
 * A universal, time-stepped simulation that handles FIFO, SJF, RR, EDF 
 * in a way that the Gantt chart can show waiting times (and overhead) correctly.
 */
export function simulateQueue(
  processes: Process[],
  algorithm: string,
  quantum: number,
  overhead: number
) {
  // Copy the processes
  const procs = processes.map((p) => ({
    ...p,
    remainingTime: p.executationTime,
    executedTime: 0,
  }));

  let currentTime = 0;
  let activeProcess: Process | null = null;
  let overheadTimeLeft = 0;
  let sliceTimeLeft = 0;
  // Remember who triggered overhead for Gantt
  let lastOverheadTriggerId: number | null = null;

  const readyQueue: Process[] = [];
  const history: { processes: Process[]; overheadProcess: number | null }[] = [];

  // Helper to check if all processes are complete
  const allDone = () => procs.every((p) => p.remainingTime <= 0);

  while (!allDone() || activeProcess !== null) {
    // 1) Add newly arrived processes to the ready queue
    procs.forEach((p) => {
      if (p.arrivalTime === currentTime) {
        readyQueue.push(p);
      }
    });

    // 2) If CPU is free & no overhead, pick next
    if (!activeProcess && overheadTimeLeft === 0 && readyQueue.length > 0) {
      if (algorithm === "SJF") {
        // Sort by executationTime
        readyQueue.sort((a, b) => a.executationTime - b.executationTime);
      } else if (algorithm === "EDF") {
        // 🔴 DYNAMIC EDF SORT:
        // The "time left to deadline" = (arrivalTime + deadline) - currentTime
        readyQueue.sort((a, b) => {
          const aTimeLeft = (a.deadline ?? Infinity) + a.arrivalTime - currentTime;
          const bTimeLeft = (b.deadline ?? Infinity) + b.arrivalTime - currentTime;
          return aTimeLeft - bTimeLeft;
        });
      }
      // FIFO or RR would just pick front-of-queue with no special sorting

      activeProcess = readyQueue.shift()!;
      if (algorithm === "RR" || algorithm === "EDF") {
        sliceTimeLeft = Math.min(activeProcess.remainingTime, quantum);
      }
      // Clear overhead trigger ID
      lastOverheadTriggerId = null;
    }

    // 3) Overhead time
    if (overheadTimeLeft > 0) {
      // During overhead, CPU is idle, color the Gantt red for the process that triggered the switch
      history.push({
        processes: [...readyQueue], // all waiting, no running process
        overheadProcess: lastOverheadTriggerId,
      });

      overheadTimeLeft--;
      currentTime++;
      continue;
    }

    // 4) Execute if we have a process
    if (activeProcess) {
      activeProcess.remainingTime--;
      activeProcess.executedTime++;

      // Gantt step for normal CPU usage
      history.push({
        processes: [activeProcess, ...readyQueue],
        overheadProcess: null,
      });

      currentTime++;

      // 4a) If finished
      if (activeProcess.remainingTime <= 0) {
        activeProcess.completionTime = currentTime;
        activeProcess = null; // CPU is free
      }
      // 4b) Not finished, check quantum for RR/EDF
      else if (algorithm === "RR" || algorithm === "EDF") {
        sliceTimeLeft--;
        if (sliceTimeLeft === 0) {
          // We incur overhead
          overheadTimeLeft = overhead;
          lastOverheadTriggerId = activeProcess.id;

          // Re-queue if it still has time
          if (activeProcess.remainingTime > 0) {
            readyQueue.push(activeProcess);
          }
          activeProcess = null;
        }
      }
    } else {
      // 5) Idle if no active process and no overhead
      history.push({ processes: [], overheadProcess: null });
      currentTime++;
    }
  }

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
    // 🔹 Adiciona processos que chegaram à fila de prontos
    while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
      queue.push(remainingProcesses.shift()!);
    }

    // 🔹 Se a fila está vazia, avança tempo até o próximo processo chegar
    if (queue.length === 0) {
      time = remainingProcesses[0].arrivalTime;
      continue;
    }

    // 🔹 Ordena a fila por tempo de execução (menor primeiro)
    queue.sort((a, b) => a.executationTime - b.executationTime);

    // 🔹 Seleciona o processo com menor tempo
    let shortestJob = queue.shift()!;
    time += shortestJob.executationTime;
    result.push({ ...shortestJob, completionTime: time });

    // 🔹 Reavaliar se novos processos chegaram nesse intervalo
    while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
      queue.push(remainingProcesses.shift()!);
    }
  }

  return result;
}

/**
 * Round Robin - Considera um quantum fixo
 */
export function roundRobin(processes: Process[], quantum: number, overhead: number): Process[] {
  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))]; // copia dos processos
  let result: Process[] = [];
  let time = 0;

  while (queue.length > 0) {
    let process = queue.shift()!; 
    let executionTime = Math.min(quantum, process.remainingTime);
    process.remainingTime -= executionTime;
    time += executionTime;

    // Se não terminou, adiciona overhead + re-insere no final da fila
    if (process.remainingTime > 0) {
      time += overhead;
      queue.push(process);
    } else {
      // Terminou
      result.push({ ...process, completionTime: time });
    }
  }

  return result;
}

/**
 * EDF - Earliest Deadline First (não-preemptivo, demonstrativo)
 * Ordena os processos pelo menor deadline (estático).
 * 
 * NOTE: For a truly time-stepped, dynamic EDF approach,
 * use the 'simulateQueue' with `algorithm="EDF"`.
 */
export function edf(processes: Process[], quantum: number, overhead: number): Process[] {
  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))];
  let result: Process[] = [];
  let time = 0;

  while (queue.length > 0) {
    // Ordena por deadline estático (no real scenario you'd do dynamic)
    queue.sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity));

    let process = queue.shift()!;
    let executionTime = Math.min(quantum, process.remainingTime);
    process.remainingTime -= executionTime;
    time += executionTime;

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
 * Page replacement examples...
 * (unchanged from your code)
 */
let fifoIndex = 0; // Índice de substituição FIFO

export function fifoReplacement(memory: Page[], newPage: Page): Page[] {
  // Se houver um espaço vazio (processId === 0), insere a página nova nele
  const emptyIndex = memory.findIndex(page => page.processId === 0);
  if (emptyIndex !== -1) {
    memory[emptyIndex] = newPage;
  } else {
    // Substitui a página mais antiga (FIFO) pelo novo processo
    memory[fifoIndex] = newPage;

    // Atualiza o índice FIFO para a próxima posição de substituição
    fifoIndex = (fifoIndex + 1) % memory.length;
  }

  return memory;
}



/**
 * Algoritmo LRU (Least Recently Used)
 * Remove a página menos recentemente usada.
 */
export function lruReplacement(memory: Page[], newPage: Page): Page[] {
  return [...memory.slice(1), newPage];
}

/**
 * Verifica se todas as páginas de um processo estão na RAM antes da execução.
 */
export function canExecuteProcess(process: Process, memory: Page[]): boolean {
  const processPages = memory.filter((page) => page.processId === process.id);
  return processPages.length >= process.numPages;
}

/**
 * Simula a execução dos processos com delay e controle de memória RAM.
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

    await new Promise((resolve) => setTimeout(resolve, delay));

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
 */
export function calculateTurnaround(processes: Process[]): number {
  let turnaroundSum = processes.reduce(
    (sum, p) => sum + (p.completionTime! - p.arrivalTime),
    0
  );
  return processes.length > 0 ? turnaroundSum / processes.length : 0;
}
