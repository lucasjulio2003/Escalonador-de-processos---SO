  import { useState } from "react";
  import { Page } from "../lib/types";
  import { fifoReplacement, lruReplacement } from "../lib/utils";

  const MEMORY_SIZE = 50; // Definimos um tamanho fixo para a RAM

  export function useMemory() {
    // Inicializa a memória com páginas do processo 0
    const [memory, setMemory] = useState<Page[]>(Array.from({ length: MEMORY_SIZE }, (_, i) => ({ id: i, processId: 0 , inMemory: true, lastAccess: 0})));
    const [pageFaults, setPageFaults] = useState(0); // Contador de faltas de página
    const [algorithmPage, setAlgorithm] = useState<"FIFO" | "LRU">("FIFO");

    const loadPage = (page: Page) => {
      setMemory((prevMemory) => {
        for (let i = 0; i < prevMemory.length; i++) {
          if (prevMemory[i].processId === page.processId && prevMemory[i].id === page.id) {
            prevMemory[i].lastAccess = Date.now(); // Atualiza o tempo de acesso
            return prevMemory; // ✅ Página já está na memória
          }
        }
    
        setPageFaults((prev) => prev + 1); // ✅ Apenas conta falta de página se realmente for uma nova página
    
        if (prevMemory.length >= MEMORY_SIZE) {
          return algorithmPage === "FIFO"
            ? fifoReplacement(prevMemory, page)
            : lruReplacement(prevMemory, page);
        }
    
        return [...prevMemory, page]; // Adiciona a página se houver espaço
      });
    };

    return { memory, pageFaults, loadPage, algorithmPage, setAlgorithm };
  }
