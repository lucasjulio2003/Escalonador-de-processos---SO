  import { useState } from "react";
  import { Page } from "../lib/types";
  import { fifoReplacement, lruReplacement } from "../lib/utils";

  const MEMORY_SIZE = 50; // tam fixo para a RAM

  export function useMemory() {
    
    const [memory, setMemory] = useState<Page[]>(Array.from({ length: MEMORY_SIZE }, (_, i) => ({ id: i, processId: 0 , inMemory: true, lastAccess: 0})));
    const [pageFaults, setPageFaults] = useState(0); 
    const [algorithmPage, setAlgorithm] = useState<"FIFO" | "LRU">("FIFO");

    const loadPage = (page: Page) => {
      setMemory((prevMemory) => {
        for (let i = 0; i < prevMemory.length; i++) {
          if (prevMemory[i].processId === page.processId && prevMemory[i].id === page.id) {
            prevMemory[i].lastAccess = Date.now(); 
            return prevMemory; 
          }
        }
    
        setPageFaults((prev) => prev + 1); 
    
        if (prevMemory.length >= MEMORY_SIZE) {
          return algorithmPage === "FIFO"
            ? fifoReplacement(prevMemory, page)
            : lruReplacement(prevMemory, page);
        }
    
        return [...prevMemory, page];
      });
    };

    return { memory, pageFaults, loadPage, algorithmPage, setAlgorithm };
  }
