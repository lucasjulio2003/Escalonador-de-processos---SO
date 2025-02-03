// lib/utils.ts
import { Process, Page } from "./types";

// FIFO pointer for page replacement
let fifoIndex = 0;

/**
 * Simulates process scheduling using a time‐stepped approach.
 * Supports "EDF", "FIFO", "RR", and "SJF".
 *
 * For each time unit, new arrivals are added to a ready queue.
 * When a process runs:
 *   - For EDF and RR the process executes for min(remainingTime, quantum);
 *   - If it isn’t finished, an overhead period is simulated by inserting the overhead marker (-1)
 *     (without any extra idle delay), and then the process is immediately re-queued.
 *
 * This function returns an object with two properties:
 *   - history: an array of simulation steps (each step is an object with the snapshot of the ready queue and an overheadProcess marker)
 *   - finalProcesses: the final state of each process (with computed completionTime) for turnaround calculations.
 */
export function simulateQueue(
  processes: Process[],
  algorithm: string,
  quantum: number,
  overhead: number
): { history: { processes: Process[]; overheadProcess: number | null }[]; finalProcesses: Process[] } {
  // Create a deep copy and add helper properties.
  const procs = processes.map((p, index) => ({
    ...p,
    originalIndex: index,
    remainingTime: p.executationTime,
    executedTime: 0
  }));

  const finishedProcesses: Process[] = [];

  // Initially sort by arrivalTime (and then by original index)
  procs.sort((a, b) => a.arrivalTime - b.arrivalTime || a.originalIndex - b.originalIndex);

  let currentTime = 0;
  let activeProcess: Process | null = null;

  // Overhead and quantum tracking for RR/EDF.
  let overheadTimeLeft = 0;
  let lastOverheadTriggerId: number | null = null;
  let sliceTimeLeft = 0;
  // We no longer use pendingRequeue—when overhead is done, we requeue immediately.
  let switchingOutProcess: Process | null = null;

  // Ready queue for processes that have arrived.
  const readyQueue: Process[] = [];
  // History for the Gantt chart.
  const history: { processes: Process[]; overheadProcess: number | null }[] = [];

  // Helper: check if all processes are finished.
  const allDone = () => procs.every((p) => p.remainingTime <= 0);

  while (!allDone() || activeProcess !== null) {
    // (B) Add new arrivals (those with arrivalTime equal to the current time)
    procs.forEach((p) => {
      if (p.arrivalTime === currentTime) {
        readyQueue.push(p);
      }
    });

    // (C) If overhead is active, record overhead steps and decrement overhead counter.
    if (overheadTimeLeft > 0) {
      history.push({
        processes: [...readyQueue],
        overheadProcess: lastOverheadTriggerId
      });
      overheadTimeLeft--;
      currentTime++;
      // When overhead finishes, immediately requeue the process that just ran.
      if (overheadTimeLeft === 0 && switchingOutProcess) {
        readyQueue.push(switchingOutProcess);
        switchingOutProcess = null;
      }
      continue;
    }

    // (D) If no active process, select one from the ready queue.
    if (!activeProcess) {
      if (readyQueue.length > 0) {
        if (algorithm === "SJF") {
          readyQueue.sort((a, b) => a.executationTime - b.executationTime);
        } else if (algorithm === "EDF") {
          readyQueue.sort((a, b) => {
            const aEff = ((a.deadline ?? Infinity) + a.arrivalTime) - currentTime;
            const bEff = ((b.deadline ?? Infinity) + b.arrivalTime) - currentTime;
            if (aEff === bEff) {
              return a.arrivalTime - b.arrivalTime || a.originalIndex - b.originalIndex;
            }
            return aEff - bEff;
          });
        }
        // For FIFO and RR, use FIFO order.
        activeProcess = readyQueue.shift()!;
        if (algorithm === "RR" || algorithm === "EDF") {
          sliceTimeLeft = Math.min(activeProcess.remainingTime, quantum);
        }
        lastOverheadTriggerId = null;
      } else {
        // CPU idle.
        history.push({ processes: [], overheadProcess: null });
        currentTime++;
        continue;
      }
    }

    // (E) Execute the active process for one time unit.
    if (activeProcess) {
      activeProcess.remainingTime--;
      activeProcess.executedTime++;
      history.push({
        processes: [activeProcess, ...readyQueue],
        overheadProcess: null
      });
      currentTime++;

      // (E1) If the process finished executing, record its completion.
      if (activeProcess.remainingTime <= 0) {
        activeProcess.completionTime = currentTime;
        finishedProcesses.push(activeProcess);
        activeProcess = null;
      }
      // (E2) For preemptive algorithms (RR/EDF), check if the quantum has expired.
      else if (algorithm === "RR" || algorithm === "EDF") {
        sliceTimeLeft--;
        if (sliceTimeLeft === 0) {
          // Trigger overhead immediately (simulate overhead steps).
          overheadTimeLeft = overhead;
          lastOverheadTriggerId = activeProcess.id;
          switchingOutProcess = activeProcess;
          activeProcess = null;
        }
      }
    }
  }

  return { history, finalProcesses: finishedProcesses };
}

/**
 * FIFO page replacement: if a free slot (processId === 0) exists, use it;
 * otherwise, replace the page at the current FIFO pointer.
 */
export function fifoReplacement(memory: Page[], newPage: Page): Page[] {
  const emptyIndex = memory.findIndex((page) => page.processId === 0);
  if (emptyIndex !== -1) {
    memory[emptyIndex] = newPage;
  } else {
    memory[fifoIndex] = newPage;
    fifoIndex = (fifoIndex + 1) % memory.length;
  }
  return memory;
}

/**
 * LRU page replacement: a simple implementation which removes the first page and appends the new one.
 */
export function lruReplacement(memory: Page[], newPage: Page): Page[] {
  return [...memory.slice(1), newPage];
}
