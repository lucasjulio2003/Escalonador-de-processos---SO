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
  let queue = [...processes];
  let result: Process[] = [];
  let time = 0;

  while (queue.length > 0) {
    let process = queue.shift()!;
    if (process.executationTime > quantum) {
      process.executationTime -= quantum;
      time += quantum;
      queue.push(process);
    } else {
      time += process.executationTime;
      process.executationTime = 0;
      result.push(process);
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
