/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import { useMemory } from "../hooks/useMemory";

export default function MemoryView() {
  const { memory, pageFaults, algorithm, setAlgorithm } = useMemory();


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
      <div className="flex flex-row">
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
        {/* Exibição do Disco */}
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
    </div>
  );
}
