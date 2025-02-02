  import { useState } from "react";
  import { Page } from "../lib/types";
  import { fifoReplacement, lruReplacement } from "../lib/utils";

  const MEMORY_SIZE = 50; // Definimos um tamanho fixo para a RAM

  export function useMemory() {
    // Inicializa a memória com páginas do processo 0
    const [memory, setMemory] = useState<Page[]>(Array.from({ length: MEMORY_SIZE }, (_, i) => ({ id: i, processId: 0 , inMemory: true})));
    const [pageFaults, setPageFaults] = useState(0); // Contador de faltas de página
    const [algorithm, setAlgorithm] = useState<"FIFO" | "LRU">("FIFO");

    const loadPage = (page: Page) => {
      setMemory((prevMemory) => {
        if (prevMemory.some((p) => p.id === page.id && p.processId === page.processId)) {
          // Página já está na memória, não há falta de página
          return prevMemory;
        }
    
        setPageFaults((prev) => prev + 1); // ✅ Apenas conta falta de página se realmente for uma nova página
    
        if (prevMemory.length >= MEMORY_SIZE) {
          return algorithm === "FIFO"
            ? fifoReplacement(prevMemory, page)
            : lruReplacement(prevMemory, page);
        }
    
        return [...prevMemory, page]; // Adiciona a página se houver espaço
      });
    };

    return { memory, pageFaults, loadPage, algorithm, setAlgorithm };
  }
