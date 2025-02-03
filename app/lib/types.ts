export interface Process {
    id: number;
    arrivalTime: number; 
    executationTime: number; 
    remainingTime: number;
    deadline?: number,
    numPages: number,
    systemOverhead: number,
    turnaroundTime?: number;
    completionTime?: number;
    executedTime: number;
  }
  
export interface Page {
  id: number;
  processId: number; 
  inMemory: boolean; 
  lastAccess: number;
}
