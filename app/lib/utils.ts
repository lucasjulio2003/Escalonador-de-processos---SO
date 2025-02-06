/* eslint-disable prefer-const */ // Desabilita a regra eslint prefer-const
import { Page, Process } from "./types"; // Importa os tipos Page e Process do arquivo "./types"

/**
 * Uma simulação universal, com passos de tempo, que lida com FIFO, SJF, RR, EDF
 * de forma a possibilitar que o gráfico de Gantt mostre corretamente os tempos de espera (e overhead).
 *
 * Para RR/EDF, quando o quantum de um processo expira:
 * - Disparamos overhead e *não* reencaminhamos imediatamente esse processo.
 * - Marcamos o processo como "pendente de reencaminhamento" somente após o tempo de overhead ser pago.
 * - Na próxima iteração (após adicionar novas chegadas para aquela unidade de tempo),
 *   o processo pendente é adicionado à fila pronta—assim as novas chegadas ficam na frente.
 */
// Função que simula a fila de processos baseada no algoritmo selecionado
export function simulateQueue(
  processes: Process[], // Vetor de processos a serem simulados
  algorithm: string,    // Algoritmo de escalonamento (ex: "FIFO", "SJF", "RR", "EDF")
  quantum: number,      // Quantum utilizado nos algoritmos RR e EDF
  overhead: number      // Tempo de overhead a ser aplicado quando o quantum expira
) {
  
  const procs = processes.map((p) => ({ // Cria uma cópia dos processos e adiciona propriedades de tempo
    ...p,                           // Mantém todas as propriedades originais do processo
    remainingTime: p.executationTime, // Inicializa o tempo restante com o tempo de execução do processo
    executedTime: 0,                // Inicializa o tempo já executado com zero
  }));

  let currentTime = 0; // Variável que guarda o tempo atual da simulação
  let activeProcess: Process | null = null; // Processo atualmente ativo, inicia sem nenhum processo

  
  let overheadTimeLeft = 0; // Tempo restante do overhead, inicia em zero
  let lastOverheadTriggerId: number | null = null; // Armazena o ID do processo que acionou o overhead, inicia como nulo

  
  let sliceTimeLeft = 0; // Tempo restante do fatiamento (quantum) para os algoritmos RR/EDF
  let switchingOutProcess: Process | null = null; // Processo que será realocado após o término do quantum, inicia como nulo
  let pendingRequeue: Process | null = null; // Processo pendente a ser reencaminhado para a fila pronta, inicia como nulo

  
  const readyQueue: Process[] = []; // Fila dos processos prontos para execução

  const history: { processes: Process[]; overheadProcess: number | null }[] = []; // Histórico da simulação para fins de visualização
  const allDone = () => procs.every((p) => p.remainingTime <= 0); // Função que verifica se todos os processos terminaram

  // Loop principal da simulação, executa enquanto não todos os processos estiverem finalizados ou houver um processo ativo
  while (!allDone() || activeProcess !== null) {
    
    procs.forEach((p) => { // Verifica cada processo para ver se chegou no tempo atual
      if (p.arrivalTime === currentTime) { // Se o tempo de chegada do processo for igual ao tempo atual
        readyQueue.push(p); // Adiciona o processo à fila de prontos
      }
    });

    if (pendingRequeue) { // Se houver um processo pendente para reencaminhamento
      readyQueue.push(pendingRequeue); // Adiciona o processo pendente à fila pronta
      pendingRequeue = null; // Reseta a variável de reencaminhamento pendente
    }

    if (overheadTimeLeft > 0) { // Se ainda houver tempo de overhead
      history.push({ // Adiciona ao histórico o estado atual da fila e o processo que disparou o overhead
        processes: [...readyQueue], // Clona a fila de processos prontos
        overheadProcess: lastOverheadTriggerId, // Registra o ID do processo que causou o overhead
      });
      overheadTimeLeft--; // Decrementa o tempo restante de overhead
      currentTime++;     // Incrementa o tempo atual

      if (overheadTimeLeft === 0 && switchingOutProcess) { // Se o overhead terminou e há um processo para reencaminhar
        pendingRequeue = switchingOutProcess; // Marca o processo como pendente para reencaminhamento
        switchingOutProcess = null; // Reseta o processo a ser reencaminhado
      }
      continue; // Pula para a próxima iteração do loop
    }

    if (!activeProcess) { // Se não houver um processo ativo no momento
      if (readyQueue.length > 0) { // E se a fila de prontos não estiver vazia
        if (algorithm === "SJF") { // Se o algoritmo selecionado é SJF
          readyQueue.sort((a, b) => a.executationTime - b.executationTime); // Ordena a fila de prontos pelo tempo de execução
        } else if (algorithm === "EDF") { // Se o algoritmo é EDF
          readyQueue.sort((a, b) => { // Ordena a fila considerando os deadlines dos processos
            const aTimeLeft = (a.deadline ?? Infinity) + a.arrivalTime - currentTime; // Calcula o tempo restante para o deadline do processo a
            const bTimeLeft = (b.deadline ?? Infinity) + b.arrivalTime - currentTime; // Calcula o tempo restante para o deadline do processo b
            return aTimeLeft - bTimeLeft; // Ordena em ordem crescente de tempo restante para o deadline
          });
        }

        activeProcess = readyQueue.shift()!; // Remove o primeiro processo da fila pronta e o define como o processo ativo
        if (algorithm === "RR" || algorithm === "EDF") { // Se o algoritmo for RR ou EDF
          sliceTimeLeft = Math.min(activeProcess.remainingTime, quantum); // Define o tempo do fatiamento como o mínimo entre o tempo restante e o quantum
        }
        lastOverheadTriggerId = null; // Reseta o ID do overhead disparado
      } else {
        history.push({ processes: [], overheadProcess: null }); // Adiciona ao histórico um registro indicando que não há processos prontos
        currentTime++; // Incrementa o tempo atual
        continue; // Pula para a próxima iteração do loop
      }
    }

    if (activeProcess) { // Se houver um processo ativo
      activeProcess.remainingTime--; // Decrementa o tempo restante do processo ativo
      activeProcess.executedTime++; // Incrementa o tempo que o processo já foi executado

      history.push({ // Registra o estado atual no histórico
        processes: [activeProcess, ...readyQueue], // Inclui o processo ativo e os processos na fila pronta
        overheadProcess: null, // Nenhum overhead está ocorrendo neste momento
      });

      currentTime++; // Incrementa o tempo atual

      if (activeProcess.remainingTime <= 0) { // Se o processo ativo terminou sua execução
        activeProcess.completionTime = currentTime; // Registra o tempo de conclusão do processo
        activeProcess = null; // Remove o processo ativo (finalizado)
      } else if (algorithm === "RR" || algorithm === "EDF") { // Se o algoritmo for RR ou EDF e o processo ainda não terminou
        sliceTimeLeft--; // Decrementa o tempo restante do fatiamento
        if (sliceTimeLeft === 0) { // Se o fatiamento terminou
          overheadTimeLeft = overhead; // Define o tempo do overhead conforme especificado
          lastOverheadTriggerId = activeProcess.id; // Registra o ID do processo que acionou o overhead
          switchingOutProcess = activeProcess; // Marca o processo ativo para reencaminhamento após o overhead
          activeProcess = null; // Remove o processo ativo, pois seu fatiamento acabou
        }
      }
    }
  }

  return history; // Retorna o histórico completo da simulação
}

/**
 * FIFO - Escalonamento First In, First Out
 */
export function fifo(processes: Process[]): Process[] {
  let time = 0; // Inicializa a variável de tempo com zero
  return [...processes] // Cria uma cópia do array de processos
    .sort((a, b) => a.arrivalTime - b.arrivalTime) // Ordena os processos pelo tempo de chegada (arrivalTime)
    .map((p) => { // Para cada processo ordenado...
      time = Math.max(time, p.arrivalTime) + p.executationTime; // Atualiza o tempo: garante que o tempo atual seja maior ou igual à chegada e soma o tempo de execução do processo
      return { ...p, completionTime: time }; // Retorna o processo com o tempo de conclusão (completionTime) atualizado
    });
}

/**
 * SJF - Shortest Job First (Não preemptivo)
 */
export function sjf(processes: Process[]): Process[] {
  let time = 0; // Inicializa o tempo atual da simulação com zero
  let remainingProcesses = [...processes].sort((a, b) => a.arrivalTime - b.arrivalTime); // Cria uma cópia dos processos e os ordena pelo tempo de chegada
  let result: Process[] = []; // Array para armazenar os processos finalizados com seus tempos de conclusão
  let queue: Process[] = []; // Fila para armazenar os processos prontos para execução

  // Enquanto houver processos restantes ou na fila...
  while (remainingProcesses.length > 0 || queue.length > 0) {

    // Move para a fila todos os processos que chegaram até o tempo atual
    while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
      queue.push(remainingProcesses.shift()!); // Remove o primeiro processo dos restantes e adiciona à fila
    }

    if (queue.length === 0) { // Se não há nenhum processo na fila...
      time = remainingProcesses[0].arrivalTime; // Avança o tempo para a chegada do próximo processo
      continue; // Continua para a próxima iteração do loop
    }

    // Ordena a fila pelo tempo de execução em ordem crescente para executar o trabalho mais curto
    queue.sort((a, b) => a.executationTime - b.executationTime);

    let shortestJob = queue.shift()!; // Remove e seleciona o processo com menor tempo de execução
    time += shortestJob.executationTime; // Incrementa o tempo atual com o tempo de execução do processo selecionado
    result.push({ ...shortestJob, completionTime: time }); // Adiciona ao resultado o processo com o tempo de conclusão atualizado

    // Move para a fila quaisquer processos que chegaram durante a execução do processo atual
    while (remainingProcesses.length > 0 && remainingProcesses[0].arrivalTime <= time) {
      queue.push(remainingProcesses.shift()!); // Remove o processo da lista de restantes e adiciona à fila
    }
  }

  return result; // Retorna o array de processos finalizados com seus tempos de conclusão
}
/**
 * Round Robin - Considera um quantum fixo
 */
export function roundRobin(processes: Process[], quantum: number, overhead: number): Process[] {
  // Cria uma cópia dos processos, inicializando o 'remainingTime' com o tempo de execução (executationTime)
  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))]; 
    let result: Process[] = []; // Array para armazenar os processos finalizados
  let time = 0; // Variável que representa o tempo atual da simulação

  while (queue.length > 0) { // Loop enquanto houver processos na fila
    let process = queue.shift()!; // Remove o primeiro processo da fila
    // Define o tempo de execução real como o mínimo entre o quantum e o tempo restante do processo
    let executionTime = Math.min(quantum, process.remainingTime); 
    process.remainingTime -= executionTime; // Reduz o tempo restante do processo pelo tempo de execução
    time += executionTime; // Incrementa o tempo atual com o tempo de execução

    if (process.remainingTime > 0) { // Se o processo não terminou sua execução
      time += overhead; // Adiciona o tempo de overhead ao tempo atual
      queue.push(process); // Reinsere o processo no final da fila
    } else { // Se o processo finalizou a execução
      // Adiciona o processo finalizado ao resultado, registrando o tempo de conclusão
      result.push({ ...process, completionTime: time }); 
    }
  }

  return result; // Retorna os processos finalizados com seus tempos de conclusão
}

/**
 * EDF - Earliest Deadline First (não-preemptivo, demonstrativo)
 * Ordena os processos pelo menor deadline (estático).
 */
export function edf(processes: Process[], quantum: number, overhead: number): Process[] {
  // Cria uma cópia dos processos, inicializando 'remainingTime' com o tempo de execução (executationTime)
  let queue = [...processes.map(p => ({ ...p, remainingTime: p.executationTime }))]; 
  let result: Process[] = []; // Array para armazenar os processos finalizados
  let time = 0; // Variável que representa o tempo atual da simulação

  while (queue.length > 0) { // Loop enquanto houver processos na fila
    // Ordena a fila de processos pelo deadline, considerando valores inexistentes como Infinity
    queue.sort((a, b) => (a.deadline ?? Infinity) - (b.deadline ?? Infinity)); 

    let process = queue.shift()!; // Remove o processo com o menor deadline da fila
    // Define o tempo de execução real como o mínimo entre o quantum e o tempo restante do processo
    let executionTime = Math.min(quantum, process.remainingTime); 
    process.remainingTime -= executionTime; // Reduz o tempo restante pelo tempo de execução
    time += executionTime; // Incrementa o tempo atual com o tempo de execução

    if (process.remainingTime > 0) { // Se o processo não terminou sua execução
      time += overhead; // Adiciona o tempo de overhead ao tempo atual
      queue.push(process); // Reinsere o processo na fila
    } else { // Se o processo finalizou a execução
      // Registra o processo no resultado com o tempo de conclusão
      result.push({ ...process, completionTime: time }); 
    }
  }
  return result; // Retorna os processos finalizados com seus tempos de conclusão
}

/** 
 * Exemplos de substituição de página...
 */
let fifoIndex = 0;  // Índice utilizado para a substituição de páginas no método FIFO

export function fifoReplacement(memory: Page[], newPage: Page): Page[] {
  // Procura por um índice de página vazia (identificada por processId igual a 0)
  const emptyIndex = memory.findIndex(page => page.processId === 0); 
  if (emptyIndex !== -1) { // Se encontrar uma página vazia na memória
    memory[emptyIndex] = newPage; // Insere a nova página na posição encontrada
  } else { // Se não houver página vazia
    memory[fifoIndex] = newPage; // Substitui a página na posição fifoIndex

    fifoIndex = (fifoIndex + 1) % memory.length; // Atualiza o índice FIFO para o próximo, de forma circular
  }

  return memory; // Retorna a memória atualizada
}


/**
 * Algoritmo LRU (Least Recently Used)
 */
let lruIndex = 0; // Variável que armazena o índice a ser substituído na próxima vez
export function lruReplacement(memory: Page[], newPage: Page): Page[] { // Função que realiza a substituição de página utilizando o algoritmo LRU

  const emptyIndex = memory.findIndex(page => page.processId === 0); // Procura o índice de uma página vazia (processId igual a 0)
  if (emptyIndex !== -1) { // Se encontrar uma página vazia
    memory[emptyIndex] = newPage; // Insere a nova página na posição vazia
    memory[emptyIndex].lastAccess = Date.now(); // Atualiza o timestamp de último acesso da página recém inserida
  } else { // Caso não haja página vazia
    memory[lruIndex] = newPage; // Insere a nova página na posição definida pelo lruIndex
    console.log(lruIndex); // Exibe no console o índice utilizado para substituição

    let lruPageIndex = 0; // Inicializa o índice da página menos recentemente utilizada com 0
    let lruPageAccess = memory[0].lastAccess; // Armazena o timestamp do último acesso da primeira página
    for (let i = 1; i < memory.length; i++) { // Percorre a memória a partir da segunda página
      if (memory[i].lastAccess < lruPageAccess) { // Se encontrar uma página com timestamp menor (menos recente)
        lruPageIndex = i; // Atualiza o índice da página LRU
        lruPageAccess = memory[i].lastAccess; // Atualiza o timestamp com o da nova página menos recentemente utilizada
      }
    }

    lruIndex = lruPageIndex; // Atualiza lruIndex com o índice da página que foi menos utilizada
  }

  if (newPage.processId === 1 && newPage.id === 0) { // Se a nova página pertencer ao processo 1 e tiver o id 0
    console.log("Memory:", memory.map((page) => ({ ...page }))); // Exibe no console o estado atual da memória
  }

  return memory; // Retorna a memória atualizada após a substituição
}

/**
 * verifica se todas as páginas de um processo estão na RAM antes da execução.
 */
export function canExecuteProcess(process: Process, memory: Page[]): boolean { // Função que verifica se um processo tem todas as suas páginas carregadas na memória
  const processPages = memory.filter((page) => page.processId === process.id); // Filtra as páginas que pertencem ao processo
  return processPages.length >= process.numPages; // Retorna true se o número de páginas encontradas for maior ou igual ao necessário para o processo
}

/**
 * simula a execução dos processos com delay e controle de memória RAM.
 */
export async function executeProcessesWithDelay(
  processes: Process[], // Vetor de processos a serem executados
  memory: Page[], // Estado atual da memória RAM (páginas em memória)
  quantum: number, // Quantum de tempo para a execução de cada processo
  delay: number // Delay em milissegundos para simular a execução
): Promise<Process[]> { // Retorna uma promise que resolve um vetor de processos executados
  let queue = [...processes]; // Cria uma cópia do vetor de processos para manipulação da fila
  let result: Process[] = []; // Vetor que armazenará os processos finalizados
  let time = 0; // Variável que representa o tempo total decorrido

  while (queue.length > 0) { // Enquanto houver processos na fila
    let process = queue.shift()!; // Remove o primeiro processo da fila

    if (!canExecuteProcess(process, memory)) { // Verifica se o processo não tem todas as páginas na RAM
      queue.push(process); // Se não tiver, reinsere o processo no final da fila
      continue; // Pula para a próxima iteração
    }

    await new Promise((resolve) => setTimeout(resolve, delay)); // Aguarda o delay para simular o tempo de execução

    if (process.executationTime > quantum) { // Se o tempo de execução do processo for maior que o quantum
      time += quantum; // Incrementa o tempo total com o valor do quantum
      process.executationTime -= quantum; // Reduz o tempo de execução do processo pelo quantum
      queue.push(process); // Reinsere o processo no final da fila para futuras execuções
    } else { // Se o tempo de execução do processo for menor ou igual ao quantum
      time += process.executationTime; // Incrementa o tempo total com o tempo restante de execução do processo
      process.executationTime = 0; // Zera o tempo de execução, indicando que o processo terminou
      result.push({ ...process, turnaroundTime: time - process.arrivalTime }); // Adiciona o processo finalizado ao resultado com o seu turnaround calculado
    }
  }
  return result; // Retorna o vetor de processos finalizados com seus tempos de turnaround
}

/**
 * calcula o turnaround médio dos processos.
 */
export function calculateTurnaround(processes: Process[]): number { // Função que calcula o tempo médio de turnaround dos processos
  let turnaroundSum = processes.reduce(
    (sum, p) => sum + (p.completionTime! - p.arrivalTime), // Calcula a soma dos turnarounds individuais (tempo de conclusão - tempo de chegada)
    0 // Valor inicial da soma
  );
  return processes.length > 0 ? turnaroundSum / processes.length : 0; // Retorna a média dividindo a soma pelo número de processos, ou 0 se nenhum processo existir
}
