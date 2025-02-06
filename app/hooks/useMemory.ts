  // Importa o hook useState do React
  import { useState } from "react";
  // Importa o tipo Page do arquivo de tipos
  import { Page } from "../lib/types";
  // Importa as funções para substituição de páginas FIFO e LRU
  import { fifoReplacement, lruReplacement } from "../lib/utils";

  // Define o tamanho fixo da memória RAM
  const MEMORY_SIZE = 50; // tam fixo para a RAM

  // Cria o hook useMemory para manipulação da memória e falhas de página
  export function useMemory() {
    
    // Inicializa o estado 'memory' com um array de páginas, onde cada página possui um id, processId 0, está na memória e lastAccess 0
    const [memory, setMemory] = useState<Page[]>(Array.from({ length: MEMORY_SIZE }, (_, i) => ({ id: i, processId: 0 , inMemory: true, lastAccess: 0})));
    // Inicializa o estado 'pageFaults' com o valor 0, que conta as faltas de página
    const [pageFaults, setPageFaults] = useState(0); 
    // Define o algoritmo atual utilizado para substituição de páginas, podendo ser "FIFO" ou "LRU", iniciando com "FIFO"
    const [algorithmPage, setAlgorithm] = useState<"FIFO" | "LRU">("FIFO");

    // Define a função loadPage que recebe uma página e atualiza a memória
    const loadPage = (page: Page) => {
    // Atualiza o estado do array de memória
    setMemory((prevMemory) => {
      // Percorre todas as páginas existentes na memória
      for (let i = 0; i < prevMemory.length; i++) {
      // Se encontrar a página com o mesmo processId e id, atualiza o momento do acesso
      if (prevMemory[i].processId === page.processId && prevMemory[i].id === page.id) {
        prevMemory[i].lastAccess = Date.now(); // Atualiza o lastAccess para o timestamp atual
        return prevMemory; // Retorna a memória atualizada
      }
      }
    
      // Incrementa o número de faltas de página, pois a página não estava na memória
      setPageFaults((prev) => prev + 1); 
    
      // Verifica se a memória está cheia
      if (prevMemory.length >= MEMORY_SIZE) {
      // Se a memória estiver cheia, aplica o algoritmo de substituição conforme o valor de algorithmPage
      return algorithmPage === "FIFO"
        ? fifoReplacement(prevMemory, page) // Aplica FIFO
        : lruReplacement(prevMemory, page); // Aplica LRU
      }
    
      // Se ainda houver espaço, adiciona a página à memória
      return [...prevMemory, page];
    });
    };

    // Retorna os estados e funções para uso em componentes que consumirem este hook
    return { memory, pageFaults, loadPage, algorithmPage, setAlgorithm };
  }
