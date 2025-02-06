import { useState } from "react"; // Importa o hook useState do React
import { Process, Page } from "../lib/types"; // Importa os tipos Process e Page do arquivo types
import { fifo, sjf, edf, roundRobin, calculateTurnaround } from "../lib/utils"; // Importa as funções de escalonamento e cálculo do turnaround

export function useScheduler() { // Cria o hook personalizado useScheduler
  const [originalProcesses, setOriginalProcesses] = useState<Process[]>([]); // Estado para armazenar os processos originais
  const [processes, setProcesses] = useState<Process[]>([]); // Estado para armazenar os processos escalonados
  const [algorithm, setAlgorithm] = useState<"FIFO" | "SJF" | "RR" | "EDF">("FIFO"); // Estado para armazenar o algoritmo selecionado, iniciando com FIFO
  const [quantum, setQuantum] = useState<number>(1); // Estado para armazenar o valor do quantum, padrão 1
  const [overhead, setOverhead] = useState<number>(1); // Estado para armazenar o valor do overhead, padrão 1
  const [turnaroundAvg, setTurnaroundAvg] = useState<number>(0); // Estado para armazenar o turnaround médio, iniciando em 0
  const [isExecuting, setIsExecuting] = useState<boolean>(false); // Estado para indicar se o escalonamento está em execução
  const [isRunning, setIsRunning] = useState<boolean>(false); // Estado para indicar se a simulação está rodando
  const [disk, setDisk] = useState<Page[]>([]); // Estado para armazenar as páginas do disco
  const [memory, setMemory] = useState<Page[]>([]); // Estado para armazenar as páginas da memória

  const setQuantumValue = (value: number) => { // Função para definir o valor do quantum
    setQuantum(value); // Atualiza o estado quantum com o valor informado
  };

  const setOverheadValue = (value: number) => { // Função para definir o valor do overhead
    setOverhead(value); // Atualiza o estado overhead com o valor informado
  };

  // Função para salvar os processos inseridos e armazenar sua ordem original
  const saveProcesses = (newProcesses: Process[]) => {
    setOriginalProcesses(newProcesses); // Salva os processos originais
    setProcesses(newProcesses); // Seta os processos atuais com os novos processos
    setIsRunning(false); // Garante que a simulação não inicie imediatamente
    setDisk([]); // Limpa o estado do disco
    setMemory([]); // Limpa o estado da memória
  };

  // Função que reseta a simulação
  const resetScheduler = () => {
    setProcesses([]); // Limpa os processos atuais
    setIsRunning(false); // Define que a simulação não está rodando
    setDisk([]); // Limpa o estado do disco
    setMemory([]); // Limpa o estado da memória
  };

  // Função para executar o escalonamento utilizando os processos originais sempre para manter a consistência
  const runScheduler = () => {
    if (isExecuting || originalProcesses.length === 0) return; // Se já estiver executando ou não houver processos, retorna sem fazer nada

    setIsExecuting(true); // Indica que o escalonamento começou a ser executado
    setIsRunning(true); // Indica que a simulação está rodando

    // Cria uma cópia dos processos originais para evitar mutação direta dos dados
    const inputProcesses = originalProcesses.map(p => ({ ...p })); // Clona cada processo

    let scheduledProcesses: Process[] = []; // Declara uma variável para armazenar os processos escalonados
    switch (algorithm) { // Verifica qual algoritmo foi selecionado
      case "FIFO":
        scheduledProcesses = fifo(inputProcesses); // Executa o algoritmo FIFO
        break;
      case "SJF":
        scheduledProcesses = sjf(inputProcesses); // Executa o algoritmo SJF
        break;
      case "EDF":
        scheduledProcesses = edf(inputProcesses, quantum, overhead); // Executa o algoritmo EDF com quantum e overhead
        break;
      case "RR":
        scheduledProcesses = roundRobin(inputProcesses, quantum, overhead); // Executa o algoritmo Round Robin com quantum e overhead
        break;
    }

    setProcesses(scheduledProcesses); // Atualiza os processos escalonados no estado
    const turnaround = calculateTurnaround(scheduledProcesses); // Calcula o turnaround médio dos processos escalonados
    setTurnaroundAvg(turnaround); // Atualiza o estado do turnaround médio com o valor calculado

    setTimeout(() => setIsExecuting(false), 1000); // Após 1 segundo, indica que a execução do escalonamento terminou
  };

  return {
    processes,            // Lista dos processos escalonados
    saveProcesses,        // Função para salvar os processos
    algorithm,            // Algoritmo selecionado atualmente
    setAlgorithm,         // Função para definir o algoritmo
    quantum,              // Valor atual do quantum
    setQuantum: setQuantumValue, // Função para alterar o quantum
    overhead,             // Valor atual do overhead
    setOverhead: setOverheadValue, // Função para alterar o overhead
    runScheduler,         // Função para executar o escalonamento
    resetScheduler,       // Função para resetar a simulação
    turnaroundAvg,        // Valor do turnaround médio calculado
    isExecuting,          // Booleano que indica se o escalonamento está em execução
    isRunning,            // Booleano que indica se a simulação está rodando
    disk,                 // Estado das páginas do disco
    memory,               // Estado das páginas da memória
  };
}
