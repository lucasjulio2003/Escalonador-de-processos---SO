"use client";
import { useEffect } from "react";
import { useMemory } from "../hooks/useMemory";
import { Process } from "../lib/types";
import { Page } from "../lib/types";

export default function MemoryView({ processes = [] }: { processes?: Process[] }) {
  const { memory, pageFaults, loadPage, algorithm, setAlgorithm } = useMemory();

  // Carrega as páginas dos processos APENAS quando "processes" mudar
  useEffect(() => {
    processes.forEach((process) => {
      const pages: number[] = Array.from({ length: process.numPages }, (_, i) => i + 1);
      pages.forEach((pageId) => {
        const page: Page = { id: pageId, processId: process.id, inMemory: false };
        
        // Adiciona apenas se ainda não estiver na memória
        if (!memory.some((p) => p.id === page.id && p.processId === page.processId)) {
          loadPage(page);
        }
      });
    });
  }, [processes]); // Remova "loadPage" da dependência para evitar loops infinitos


  // Preenche o restante da memória com páginas vazias
  useEffect(() => {
    const emptyPages = Array.from({ length: 50 - memory.length }, (_, i) => i + 1).map((id) => ({
      id,
      processId: 0,
      inMemory: false,
    }));

    emptyPages.forEach((page) => {
      loadPage(page);
    });
  }, [memory]); // Remova "loadPage" da dependência para evitar loops infinitos
  

  return (
    <div className="p-4 border rounded bg-gray-700 text-black my-4">
      <h2 className="text-xl">Memória RAM e Disco</h2>
      <p className="text-sm">Total de Page Faults: {pageFaults}</p>

      {/* Escolha do algoritmo */}
      <div className="my-2">
        <label>Algoritmo de Substituição:</label>
        <select
          className="ml-2 p-2 border rounded"
          value={algorithm}
          onChange={(e) => setAlgorithm(e.target.value as any)}
        >
          <option value="FIFO">FIFO</option>
          <option value="LRU">LRU</option>
        </select>
      </div>

      {/* Exibição da memória */}
      <div className="grid grid-cols-10 gap-1.5 p-2 w-1/2">
        {memory.map((page) => (
              <div
              key={`${page.processId}-${page.id}`}
              className={`p-2 text-xs text-center border rounded h-12 flex items-center justify-center ${page.processId === 0 ? 'bg-gray-500 text-transparent' : ''}`}
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
  );
}
