/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { useMemory } from "../hooks/useMemory";
import { Process } from "../lib/types";
import { simulateQueue } from "../lib/utils";

export default function MemoryView({
  processes, // array de processos
  algorithm, // algoritmo de escalonamento
  substitutionAlgorithm,  // algoritmo de substituição (FIFO ou LRU)
  quantum, // valor do quantum para o escalonamento
  overhead, // custo overhead para o escalonamento
  isRunning, // flag que indica se a simulação está em execução
}: {
  processes: Process[]; // tipagem dos processos
  algorithm: string; // tipagem do algoritmo de escalonamento como string
  substitutionAlgorithm: "FIFO" | "LRU"; // tipagem para o algoritmo de substituição
  quantum: number; // tipagem do quantum como número
  overhead: number; // tipagem do overhead como número
  isRunning: boolean; // tipagem da flag de execução como boolean
}) {
  const { memory, pageFaults, loadPage } = useMemory(); // obtém memória, contagem de pageFaults e função loadPage do hook useMemory

  // Cria todas as páginas que devem existir com base nos processos
  const allPages = useMemo(
    () =>
      processes.flatMap((process) =>
        Array.from({ length: process.numPages }, (_, i) => ({
          id: i, // identificador da página
          processId: process.id, // associa a página ao identificador do processo
        }))
      ),
    [processes] // recalcula quando os processos mudam
  );

  // Calcula quantas páginas "vazias" (processId === 0) serão adicionadas para completar 50 páginas
  const emptyPagesCount = Math.max(0, 50 - allPages.length);

  // Inicializa o estado do disco com as páginas dos processos e as páginas vazias
  const [disk, setDisk] = useState(() => {
    return [
      ...allPages, // páginas dos processos
      ...Array.from({ length: emptyPagesCount }, (_, i) => ({
        id: i, // identificador da página vazia
        processId: 0, // processId 0 indica página vazia
      })),
    ];
  });

  // Atualiza o estado do disco sempre que allPages mudar
  useEffect(() => {
    setDisk([
      ...allPages, // páginas dos processos
      ...Array.from({ length: Math.max(0, 50 - allPages.length) }, (_, i) => ({
        id: i, // identificador da página vazia
        processId: 0, // processId 0 indica página vazia
      })),
    ]);
  }, [allPages]);

  // Função para remover do disco a página que foi carregada na memória
  const removeDisk = useCallback((pageToRemove: any) => {
    setDisk((prevDisk) =>
      prevDisk.map((page) =>
        page.processId === pageToRemove.processId && page.id === pageToRemove.id
          ? { id: page.id, processId: 0 } // substitui a página encontrada por uma página vazia
          : page // mantém a página inalterada se não for a que deve ser removida
      )
    );
  }, []);

  // Simula a fila de processos de acordo com o algoritmo, quantum e overhead
  const history = simulateQueue(processes, algorithm, quantum, overhead);
  const [displayIndex, setDisplayIndex] = useState(0); // índice que controla o processo atual na exibição

  // Carrega as páginas do processo atual e remove as páginas carregadas do disco
  const loadPages = useCallback(
    (process: Process) => {
      if (!isRunning) {
        setDisplayIndex(0); // reinicia o índice se a simulação não estiver rodando
        return;
      }
      for (let i = 0; i < process.numPages; i++) {
        // Carrega a página na memória
        loadPage({ id: i, processId: process.id, inMemory: false, lastAccess: 0 });
        // Procura a página correspondente no disco
        const pageFound = disk.find(
          (page) => page.processId === process.id && page.id === i
        );
        if (pageFound && pageFound.processId !== 0) {
          removeDisk(pageFound); // remove a página do disco se não for vazia
        }
      }
    },
    [isRunning, loadPage, disk, removeDisk] // dependências do useCallback
  );

  // useEffect para controlar a atualização da simulação
  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      // Atualiza o índice de exibição para o próximo processo, se existir
      setDisplayIndex((prev) => (prev < history.length - 1 ? prev + 1 : prev));
    }, 490); // intervalo de 490ms entre cada atualização

    // Obtém o processo atual da simulação
    const currentProcess = history[displayIndex]?.processes[0];
    if (currentProcess) {
      loadPages(currentProcess); // carrega as páginas do processo atual
    }
    // Limpa o intervalo quando o componente desmonta ou as dependências mudam
    return () => clearInterval(interval);
  }, [displayIndex, history, loadPages, isRunning]);

  return (
    <div className="p-4 border rounded bg-gray-700 text-white my-4">
      <h2 className="text-xl">Memória RAM e Disco</h2> {/* Título da seção */}
      <p className="text-sm">Total de Page Faults: {pageFaults}</p> {/* Exibe o total de page faults */}

      <div className="flex flex-row">
        {/* Se a simulação está em execução, exibe a memória RAM */}
        {isRunning && (
          <div className="w-1/2">
            <h3 className="text-center text-lg font-semibold">RAM</h3>
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
                      P{page.processId} {/* Exibe o id do processo */}
                      <br />
                      {page.id} {/* Exibe o id da página */}
                    </>
                  ) : (
                    <>
                      <br />
                      {"-"} {/* Exibe "-" para páginas vazias */}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Se a simulação está em execução, exibe o disco */}
        {isRunning && (
          <div className="w-1/2">
            <h3 className="text-center text-lg font-semibold">Disco</h3>
            <div className="grid grid-cols-10 gap-1.5 p-2">
              {disk.map((page, index) => (
                <div
                  key={`${page.processId}-${page.id}-${index}`}
                  className={`p-2 text-xs text-center border rounded h-12 flex items-center justify-center ${
                    page.processId === 0 ? "bg-gray-500 text-transparent" : ""
                  }`}
                >
                  {page.processId !== 0 ? (
                    <>
                      P{page.processId} {/* Exibe o id do processo */}
                      <br />
                      {page.id} {/* Exibe o id da página */}
                    </>
                  ) : (
                    <>
                      <br />
                      {"-"} {/* Exibe "-" para páginas vazias */}
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

