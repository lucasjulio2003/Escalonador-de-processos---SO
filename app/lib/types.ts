export interface Process {
    id: number;
    arrivalTime: number; // Tempo de chegada
    burstTime: number; // Tempo de execução
    remainingTime: number; // Para Round Robin
  }
  
  export interface Page {
    id: number;
    processId: number; // ID do processo dono da página
    inMemory: boolean; // Se está na RAM
  }
  