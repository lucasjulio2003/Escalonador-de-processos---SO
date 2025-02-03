/* eslint-disable prefer-const */
import { Page, Process } from "./types";

/**
 * A universal, time-stepped simulation that handles FIFO, SJF, RR, EDF 
 * in a way that the Gantt chart can show waiting times (and overhead) correctly.
 *
 * For RR/EDF, when a process’s quantum expires:
 * - We trigger overhead and *do not* immediately re-queue that process.
 * - We mark the process as "pending requeue" only after the overhead time is paid.
 * - In the next iteration (after adding new arrivals for that time unit),
 *   the pending process is added to the ready queue—thus new arrivals are ahead.
 */
export function simulateQueue(
  processes: Process[],
  algorithm: string,
  quantum: number,
  overhead: number
) {
  // Make a local copy of processes
  const procs = processes.map((p) => ({
    ...p,
    remainingTime: p.executationTime,
    executedTime: 0,
  }));

  let currentTime = 0;
  let activeProcess: Process | null = null;

  // Overhead tracking variables
  let overheadTimeLeft = 0;
  let lastOverheadTriggerId: number | null = null;

  // For RR/EDF, track how many time units remain in the current quantum slice
  let sliceTimeLeft = 0;

  // When a process's quantum expires, we store it here until overhead finishes.
  let switchingOutProcess: Process | null = null;
  // After overhead finishes, we store the process here, then add it to readyQueue.
  let pendingRequeue: Process | null = null;

  // The queue of ready processes
  const readyQueue: Process[] = [];

  // For the Gantt chart history: each step shows which processes are ready and if overhead is active.
  const history: { processes: Process[]; overheadProcess: number | null }[] = [];

  // Helper: Are all processes complete?
  const allDone = () => procs.every((p) => p.remainingTime <= 0);

  while (!allDone() || activeProcess !== null) {
    // 1) Add newly arrived processes for the current time
    procs.forEach((p) => {
      if (p.arrivalTime === currentTime) {
        readyQueue.push(p);
      }
    });

    // 1.5) After adding new arrivals, if there's a pending process from overhead,
    // add it now—this ensures any new arrivals at this time are ahead.
    if (pendingRequeue) {
      readyQueue.push(pendingRequeue);
      pendingRequeue = null;
    }

    // 2) If overhead is active, process it
    if (overheadTimeLeft > 0) {
      history.push({
        processes: [...readyQueue],
        overheadProcess: lastOverheadTriggerId,
      });
      overheadTimeLeft--;
      currentTime++;

      // When overhead just finishes, mark the process as pending requeue.
      if (overheadTimeLeft === 0 && switchingOutProcess) {
        pendingRequeue = switchingOutProcess;
        switchingOutProcess = null;
      }
      continue;
    }

    // 3) If no active process, pick one from the ready queue (if available)
    if (!activeProcess) {
      if (readyQueue.length > 0) {
        if (algorithm === "SJF") {
          readyQueue.sort((a, b) => a.executationTime - b.executationTime);
        } else if (algorithm === "EDF") {
          readyQueue.sort((a, b) => {
            const aTimeLeft = (a.deadline ?? Infinity) + a.arrivalTime - currentTime;
            const bTimeLeft = (b.deadline ?? Infinity) + b.arrivalTime - currentTime;
            return aTimeLeft - bTimeLeft;
          });
        }
        // FIFO or RR: simply pick the front of the queue.
        activeProcess = readyQueue.shift()!;
        if (algorithm === "RR" || algorithm === "EDF") {
          sliceTimeLeft = Math.min(activeProcess.remainingTime, quantum);
        }
        lastOverheadTriggerId = null; // Clear previous overhead ID
      } else {
        // No process is ready: CPU idle
        history.push({ processes: [], overheadProcess: null });
        currentTime++;
        continue;
      }
    }

    // 4) Execute the active process for one time unit
    if (activeProcess) {
      activeProcess.remainingTime--;
      activeProcess.executedTime++;

      // Record normal execution in the Gantt history
      history.push({
        processes: [activeProcess, ...readyQueue],
        overheadProcess: null,
      });

      currentTime++;

      // 4a) If the active process finishes, mark its completion and free the CPU
      if (activeProcess.remainingTime <= 0) {
        activeProcess.completionTime = currentTime;
        activeProcess = null;
      }
      // 4b) If it's not finished and we're using RR/EDF, check the quantum
      else if (algorithm === "RR" || algorithm === "EDF") {
        sliceTimeLeft--;
        if (sliceTimeLeft === 0) {
          // Quantum expires: trigger overhead
          overheadTimeLeft = overhead;
          lastOverheadTriggerId = activeProcess.id;
          // Do not re-queue immediately: hold the process until overhead completes.
          switchingOutProcess = activeProcess;
          activeProcess = null;
        }
      }
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

let lruIndex = 0; // Índice de substituição LRU
export function lruReplacement(memory: Page[], newPage: Page): Page[] {

  // Se houver um espaço vazio (processId === 0), insere a página nova nele
  const emptyIndex = memory.findIndex(page => page.processId === 0);
  if (emptyIndex !== -1) {
    memory[emptyIndex] = newPage;
    memory[emptyIndex].lastAccess = Date.now();
  } else {
    // Substitui a página menos recentemente usada (LRU) pelo novo processo
    memory[lruIndex] = newPage;

    // Procura a página menos recentemente usada
    let lruPageIndex = 0;
    let lruPageAccess = memory[0].lastAccess;
    for (let i = 1; i < memory.length; i++) {
      if (memory[i].lastAccess < lruPageAccess) {
        lruPageIndex = i;
        lruPageAccess = memory[i].lastAccess;
      }
    }

    // Atualiza o índice LRU para a próxima posição de substituição
    lruIndex = lruPageIndex;
  }

  // Printa uma copia da memória
  console.log("Memory:", memory.map((page) => ({ ...page })));

  return memory;
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

