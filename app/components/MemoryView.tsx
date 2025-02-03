/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useState } from "react";
import { useMemory } from "../hooks/useMemory";
import { Process } from "../lib/types";
import { simulateQueue } from "../lib/utils";

export default function MemoryView({
  processes,
  algorithm,
  quantum,
  overhead,
  isRunning
}: {
  processes: Process[];
  algorithm: string;
  quantum: number;
  overhead: number;
  isRunning: boolean;
}) {
  const { memory, pageFaults, loadPage, algorithm: memAlgo, setAlgorithm } = useMemory();

  // Destructure simulationResult to obtain history only.
  const simulationResult = simulateQueue(processes, algorithm, quantum, overhead);
  const history = simulationResult.history;
  const [displayIndex, setDisplayIndex] = useState(0);

  // Function to load pages for the currently running process.
  const loadPages = useCallback((process: Process) => {
    if (!process) return;
    for (let i = 0; i < process.numPages; i++) {
      loadPage({ id: i, processId: process.id, inMemory: false });
    }
  }, [loadPage]);

  useEffect(() => {
    const interval = setInterval(() => {
      setDisplayIndex((prev) => (prev < history.length - 1 ? prev + 1 : prev));
    }, 490);
    const currentProcess = history[displayIndex]?.processes[0];
    console.log("Current Process: ", currentProcess);
    loadPages(currentProcess);
    console.log(displayIndex);
    return () => clearInterval(interval);
  }, [displayIndex, loadPages, history]);

  return (
    <div className="p-4 border rounded bg-gray-700 text-black my-4">
      <h2 className="text-xl">Memória RAM e Disco</h2>
      <p className="text-sm">Total de Page Faults: {pageFaults}</p>

      {/* Seleção do algoritmo de substituição */}
      <div className="my-2">
        <label>Algoritmo de Substituição:</label>
        <select
          className="ml-2 p-2 border rounded"
          value={memAlgo}
          onChange={(e) => setAlgorithm(e.target.value as any)}
        >
          <option value="FIFO">FIFO</option>
          <option value="LRU">LRU</option>
        </select>
      </div>
      <div className="flex flex-row">
        {/* Exibição da RAM */}
        { isRunning && (
          <div className="grid grid-cols-10 gap-1.5 p-2 w-1/2">
            {memory.map((page) => (
              <div
                key={`${page.processId}-${page.id}`}
                className={`p-2 text-xs text-center border rounded h-12 flex items-center justify-center ${page.processId === 0 ? '' : 'bg-gray-500'}`}
              >
                {page.processId !== 0 ? (
                  <>
                    P{page.processId} <br /> {page.id}
                  </>
                ) : (
                  <>
                    <br /> {page.id}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
        {/* Exibição do Disco (páginas fora da RAM) */}
        { isRunning && (
          <div className="grid grid-cols-10 gap-1.5 p-2 w-1/2">
            {memory.map((page) => (
              <div
                key={`${page.processId}-${page.id}`}
                className={`p-2 text-xs text-center border rounded h-12 flex items-center justify-center ${page.processId === 0 ? 'bg-gray-500 text-transparent' : ''}`}
              >
                {page.processId !== 0 && (
                  <>
                    P{page.processId} <br /> {page.id}
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
