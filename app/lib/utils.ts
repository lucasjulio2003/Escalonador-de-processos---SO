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
  
  const procs = processes.map((p) => ({
    ...p,
    remainingTime: p.executationTime,
    executedTime: 0,
  }));

  let currentTime = 0;
  let activeProcess: Process | null = null;

  
  let overheadTimeLeft = 0;
  let lastOverheadTriggerId: number | null = null;

  
  let sliceTimeLeft = 0;
  let switchingOutProcess: Process | null = null;
  let pendingRequeue: Process | null = null;

  
  const readyQueue: Process[] = [];

  const history: { processes: Process[]; overheadProcess: number | null }[] = [];

  const allDone = () => procs.every((p) => p.remainingTime <= 0);

  while (!allDone() || activeProcess !== null) {
    
    procs.forEach((p) => {
      if (p.arrivalTime === currentTime) {
        readyQueue.push(p);
      }
    });

    if (pendingRequeue) {
      readyQueue.push(pendingRequeue);
      pendingRequeue = null;
    }


    if (overheadTimeLeft > 0) {
      history.push({
        processes: [...readyQueue],
        overheadProcess: lastOverheadTriggerId,
      });
      overheadTimeLeft--;
      currentTime++;

      if (overheadTimeLeft === 0 && switchingOutProcess) {
        pendingRequeue = switchingOutProcess;
        switchingOutProcess = null;
      }
      continue;
    }


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

        activeProcess = readyQueue.shift()!;
        if (algorithm === "RR" || algorithm === "EDF") {
          sliceTimeLeft = Math.min(activeProcess.remainingTime, quantum);
        }
        lastOverheadTriggerId = null; 
      } else {
        
        history.push({ processes: [], overheadProcess: null });
        currentTime++;
        continue;
      }
    }

    
    if (activeProcess) {
      activeProcess.remainingTime--;
      activeProcess.executedTime++;

      
      history.push({
        processes: [activeProcess, ...readyQueue],
        overheadProcess: null,
      });

      currentTime++;

      if (activeProcess.remainingTime <= 0) {
        activeProcess.completionTime = currentTime;
        activeProcess = null;
      }

      else if (algorithm === "RR" || algorithm === "EDF") {
        sliceTimeLeft--;
        if (sliceTimeLeft === 0) {
          
          overheadTimeLeft = overhead;
          lastOverheadTriggerId = activeProcess.id;
          
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
 */
export function sjf(processes: Process[]): Process[] {
  let time = 0;
  let remainingProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime);
  let result: Process[] = [];
  let queue: Process[] = [];

  while (remainingProcesses.length > 0 || queue.length > 0) {

    while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
      queue.push(remainingProcesses.shift()!);
    }

    if (queue.length === 0) {
      time = remainingProcesses[0].arrivalTime;
      continue;
    }

    queue.sort((a, b) => a.executationTime - b.executationTime);

    let shortestJob = queue.shift()!;
    time += shortestJob.executationTime;
    result.push({ ...shortestJob, completionTime: time });

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
 * EDF - Earliest Deadline First (não-preemptivo, demonstrativo)
 * Ordena os processos pelo menor deadline (estático).
 */
export function edf(processes: Process[], quantum: number, overhead: number): Process[] {
  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))];
  let result: Process[] = [];
  let time = 0;

  while (queue.length > 0) {
    
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
 */
let fifoIndex = 0; 

export function fifoReplacement(memory: Page[], newPage: Page): Page[] {
  const emptyIndex = memory.findIndex(page => page.processId === 0);
  if (emptyIndex !== -1) {
    memory[emptyIndex] = newPage;
  } else {
    memory[fifoIndex] = newPage;

    fifoIndex = (fifoIndex + 1) % memory.length;
  }

  return memory;
}



/**
 * Algoritmo LRU (Least Recently Used)
 */

let lruIndex = 0; 
export function lruReplacement(memory: Page[], newPage: Page): Page[] {

  
  const emptyIndex = memory.findIndex(page => page.processId === 0);
  if (emptyIndex !== -1) {
    memory[emptyIndex] = newPage;
    memory[emptyIndex].lastAccess = Date.now();
  } else {
    
    memory[lruIndex] = newPage;
    console.log(lruIndex)

    
    let lruPageIndex = 0;
    let lruPageAccess = memory[0].lastAccess;
    for (let i = 1; i < memory.length; i++) {
      if (memory[i].lastAccess < lruPageAccess) {
        lruPageIndex = i;
        lruPageAccess = memory[i].lastAccess;
      }
    }

    lruIndex = lruPageIndex;
  }

  if (newPage.processId === 1 && newPage.id === 0) {
    console.log("Memory:", memory.map((page) => ({ ...page })));
  }

  return memory;
}



/**
 * verifica se todas as páginas de um processo estão na RAM antes da execução.
 */
export function canExecuteProcess(process: Process, memory: Page[]): boolean {
  const processPages = memory.filter((page) => page.processId === process.id);
  return processPages.length >= process.numPages;
}

/**
 * simula a execução dos processos com delay e controle de memória RAM.
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
 * calcula o turnaround médio dos processos.
 */

export function calculateTurnaround(processes: Process[]): number {
  let turnaroundSum = processes.reduce(
    (sum, p) => sum + (p.completionTime! - p.arrivalTime),
    0
  );
  return processes.length > 0 ? turnaroundSum / processes.length : 0;
}

function getCellColor(
  p: Process,
  timeStep: number,
  step: { processes: Process[]; overheadProcess: number | null },
  algorithm: string
): string {
  // Para EDF, marcar todas as células de preto após o deadline se o processo estiver presente e não durante overhead
  if (
    algorithm === "EDF" &&
    p.deadline !== undefined &&
    (timeStep >= p.arrivalTime + p.deadline + 1) &&
    step.overheadProcess === null &&
    step.processes.some((proc) => proc.id === p.id)
  ) {
    const idx = step.processes.findIndex((proc) => proc.id === p.id);
    if (idx === 0) {
      return "bg-stone-800"; // deadline atingido, pintar de preto
    }
  }

  // Se overhead está ativo neste passo de tempo...
  if (step.overheadProcess !== null) {
    if (step.overheadProcess === p.id) {
      return "bg-red-500"; // bloco de overhead para este processo
    } else if (step.processes.findIndex((proc) => proc.id === p.id) !== -1) {
      return "bg-yellow-500"; // esperando durante overhead
    }
  } else {
    // Nenhum overhead ativo.
    const idx = step.processes.findIndex((proc) => proc.id === p.id);
    if (idx !== -1) {
      if (idx === 0) {
        // Verificar se o processo está além do deadline
        if (
          algorithm === "EDF" &&
          p.deadline !== undefined &&
          timeStep >= p.arrivalTime + p.deadline + 1
        ) {
          return "bg-stone-800"; // deadline atingido, pintar de preto
        }
        return "bg-green-500"; // processo em execução
      } else {
        return "bg-yellow-500"; // processo esperando
      }
    }
  }
  return "bg-gray-500"; // ocioso (processo não presente)
}
