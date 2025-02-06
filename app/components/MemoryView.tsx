/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMemory } from "../hooks/useMemory";
import { Process } from "../lib/types";
import { simulateQueue } from "../lib/utils";

export default function MemoryView({
  processes,
  algorithm,
  quantum,
  overhead,
  isRunning,
}: {
  processes: Process[];
  algorithm: string;
  quantum: number;
  overhead: number;
  isRunning: boolean;
}) {
  const { memory, pageFaults, loadPage, algorithmPage, setAlgorithm } = useMemory();

  // Cria todas as páginas que devem existir com base nos processos
  const allPages = useMemo(
    () =>
      processes.flatMap((process) =>
        Array.from({ length: process.numPages }, (_, i) => ({
          id: i,
          processId: process.id,
        }))
      ),
    [processes]
  );

  // Se o total de páginas deve ser 50, calcula quantas "vazias" (processId === 0) serão adicionadas
  const emptyPagesCount = Math.max(0, 50 - allPages.length);

  // Armazena o disco em estado, iniciando com as páginas de todos os processos e as páginas vazias
  const [disk, setDisk] = useState(() => {
    return [
      ...allPages,
      ...Array.from({ length: emptyPagesCount }, (_, i) => ({
        id: i,
        processId: 0,
      })),
    ];
  });

  // (Opcional) Se os processos mudarem, você pode atualizar o disco
  useEffect(() => {
    setDisk([
      ...allPages,
      ...Array.from({ length: Math.max(0, 50 - allPages.length) }, (_, i) => ({
        id: i,
        processId: 0,
      })),
    ]);
  }, [allPages]);

  // Função para remover do disco a página que foi carregada na memória
  const removeDisk = useCallback((pageToRemove: any) => {
    setDisk((prevDisk) =>
      prevDisk.map((page) =>
        page.processId === pageToRemove.processId && page.id === pageToRemove.id
          ? { id: page.id, processId: 0 } // "Remove" a página, substituindo-a por uma página vazia
          : page
      )
    );
  }, []);

  const history = simulateQueue(processes, algorithm, quantum, overhead);
  const [displayIndex, setDisplayIndex] = useState(0);

  // Função que carrega as páginas do processo atual e remove as mesmas do disco
  const loadPages = useCallback(
    (process: Process) => {
      if (!isRunning) {
        setDisplayIndex(0);
        return;
      }
      for (let i = 0; i < process.numPages; i++) {
        // Carrega a página na memória
        if(process.id === 1 && i === 0) {
          console.log("Passou aqui", i);
        }
        loadPage({ id: i, processId: process.id, inMemory: false, lastAccess: 0 });
        // Procura a página correspondente no disco e, se encontrada, remove-a
        const pageFound = disk.find(
          (page) => page.processId === process.id && page.id === i
        );
        if (pageFound && pageFound.processId !== 0) {
          removeDisk(pageFound);
        }
      }
    },
    [isRunning, loadPage, disk, removeDisk]
  );

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setDisplayIndex((prev) => (prev < history.length - 1 ? prev + 1 : prev));
    }, 490);

    const currentProcess = history[displayIndex]?.processes[0];
    if (currentProcess) {
      if (currentProcess.id === 1) {
        console.log("Process 1 loaded pages");
      }
      loadPages(currentProcess);
    }
    return () => clearInterval(interval);
  }, [displayIndex, history, loadPages, isRunning]);

  return (
    <div className="p-4 border rounded bg-gray-700 text-white my-4">
      <h2 className="text-xl">Memória RAM e Disco</h2>
      <p className="text-sm">Total de Page Faults: {pageFaults}</p>
  
      {/* Escolha do algoritmo */}
      <div className="my-2">
        <label>Algoritmo de Substituição:</label>
        <select
          className="ml-2 p-2 border rounded text-black"
          value={algorithmPage}
          onChange={(e) => setAlgorithm(e.target.value as any)}
        >
          <option value="FIFO">FIFO</option>
          <option value="LRU">LRU</option>
        </select>
      </div>
      <div className="flex flex-row">
        {/* Exibição da memória */}
        {isRunning && (
          <div className="w-1/2">
            <h3 className="text-center text-lg font-semibold">RAM</h3> {/* Título da RAM */}
            <div className="grid grid-cols-10 gap-1.5 p-2">
              {memory.map((page) => (
                <div
                  key={`${page.processId}-${page.id}`}
                  className={`p-2 text-xs text-center border rounded h-12 flex items-center justify-center ${
                    page.processId === 0 ? "" : "bg-gray-500"
                  }`}
                >
                  {page.processId !== 0 ? (
                    <>
                      P{page.processId}
                      <br />
                      {page.id}
                    </>
                  ) : (
                    <>
                      <br />
                      {page.id}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
  
        {/* Exibição do Disco */}
        {isRunning && (
          <div className="w-1/2">
            <h3 className="text-center text-lg font-semibold">Disco</h3> {/* Título do Disco */}
            <div className="grid grid-cols-10 gap-1.5 p-2">
              {disk.map((page, index) => (
                <div
                  key={`${page.processId}-${page.id}-${index}`}
                  className={`p-2 text-xs text-center border rounded h-12 flex items-center justify-center ${
                    page.processId === 0 ? "bg-gray-500 text-transparent" : ""
                  }`}
                >
                  {page.processId !== 0 && (
                    <>
                      P{page.processId}
                      <br />
                      {page.id}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );  
}
