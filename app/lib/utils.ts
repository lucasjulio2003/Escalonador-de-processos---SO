/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable prefer-const */
// lib/utils.ts

/**
 * A universal, time-stepped simulation that handles FIFO, SJF, RR, EDF 
 * in a way that the Gantt chart can show waiting times correctly.
 */
import { Process } from "./types";

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
  // A new variable to remember who triggered overhead
  let lastOverheadTriggerId: number | null = null;

  const readyQueue: Process[] = [];
  const history: { processes: Process[]; overheadProcess: number | null }[] = [];

  // Helper to check if we’re done
  const allDone = () => procs.every((p) => p.remainingTime <= 0);

  while (!allDone() || activeProcess !== null) {
    // 1) Add newly arrived processes
    procs.forEach((p) => {
      if (p.arrivalTime === currentTime) {
        readyQueue.push(p);
      }
    });

    // 2) If CPU is free & no overhead, pick next
    if (!activeProcess && overheadTimeLeft === 0 && readyQueue.length > 0) {
      if (algorithm === "SJF") {
        readyQueue.sort((a, b) => a.executationTime - b.executationTime);
      } else if (algorithm === "EDF") {
        readyQueue.sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity));
      }
      // FIFO/RR default is just the front

      activeProcess = readyQueue.shift()!;
      if (algorithm === "RR" || algorithm === "EDF") {
        sliceTimeLeft = Math.min(activeProcess.remainingTime, quantum);
      }
      // Clear last overhead ID if we’re switching to a new process
      lastOverheadTriggerId = null;
    }

    // 3) Overhead time
    if (overheadTimeLeft > 0) {
      // During overhead, the CPU is effectively idle.
      // No active process runs. The overhead is attributed
      // to the last process that triggered the switch.
      history.push({
        processes: [...readyQueue],        // all are waiting
        overheadProcess: lastOverheadTriggerId // used by Gantt to color overhead in red
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
          // We will incur overhead
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
      // 5) Idle
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