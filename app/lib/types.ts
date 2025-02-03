export interface Process {
    originalIndex: number;
    id: number;
    arrivalTime: number; // Tempo de chegada
    executationTime: number; // Tempo de execução
    remainingTime: number; // Para Round Robin
    deadline?: number,
    numPages: number,
    systemOverhead: number,
    turnaroundTime?: number;
    completionTime?: number;
    executedTime: number;
  }
  
export interface Page {
  id: number;
  processId: number; // ID do processo dono da página
  inMemory: boolean; // Se está na RAM
}
