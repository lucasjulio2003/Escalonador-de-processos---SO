// hooks/useMemory.ts
import { useState } from "react";
import { Page } from "../lib/types";
import { fifoReplacement, lruReplacement } from "../lib/utils";

const MEMORY_SIZE = 50; // Fixed RAM size (number of pages)

export function useMemory() {
  // Initialize memory with pages belonging to process 0 (i.e. free pages)
  const [memory, setMemory] = useState<Page[]>(
    Array.from({ length: MEMORY_SIZE }, (_, i) => ({ id: i, processId: 0, inMemory: true }))
  );
  const [pageFaults, setPageFaults] = useState(0);
  // Define a state for the page replacement algorithm: "FIFO" or "LRU"
  const [algorithm, setAlgorithm] = useState<"FIFO" | "LRU">("FIFO");

  const loadPage = (page: Page) => {
    setMemory((prevMemory) => {
      // If the page is already in memory, no page fault occurs.
      if (prevMemory.some((p) => p.id === page.id && p.processId === page.processId)) {
        return prevMemory;
      }

      // Count the page fault only if the page is not already loaded.
      setPageFaults((prev) => prev + 1);

      // Since memory is fixed-size (already full), use replacement.
      return algorithm === "FIFO"
        ? fifoReplacement([...prevMemory], page)
        : lruReplacement([...prevMemory], page);
    });
  };

  return { memory, pageFaults, loadPage, algorithm, setAlgorithm };
}
