// Importa os hooks useState e useEffect do React
import { useState, useEffect } from "react";
// Importa o tipo Process definido em ../lib/types
import { Process } from "../lib/types";
// Importa a função simulateQueue definida em ../lib/utils
import { simulateQueue } from "../lib/utils";

/**
 * Determina a cor da célula para um processo dado em um determinado passo da simulação,
 * com base no estado da simulação em `step` e no algoritmo de escalonamento.
 *
 * Novas regras:
 * - Se a simulação atingiu o deadline de um processo (para EDF), retorna preto.
 * - Se a sobrecarga está ativa:
 *    - Se este processo é o responsável pela sobrecarga, retorna vermelho.
 *    - Caso contrário, se o processo está na fila de prontos, retorna amarelo.
 * - Se não há sobrecarga ativa:
 *    - Se o processo está presente:
 *         - Se é o primeiro (isto é, está em execução), retorna verde.
 *         - Caso contrário, retorna amarelo.
 * - Caso contrário, retorna cinza (inativo).
 *
 * (Células vermelhas, amarelas, verdes e pretas contam para o turnaround.)
 */
function getCellColor(
  p: Process, // Processo atual
  timeStep: number, // Passo de tempo atual da simulação
  step: { processes: Process[]; overheadProcess: number | null }, // Estado da simulação no passo atual
  algorithm: string // Algoritmo de escalonamento utilizado
): string {
  // Verifica se o algoritmo é EDF e se o deadline foi atingido e se não há sobrecarga ativa,
  // e se o processo está presente; nesse caso, retorna a cor preta (bg-stone-800).
  if (
    algorithm === "EDF" &&
    p.deadline !== undefined &&
    timeStep >= p.arrivalTime + p.deadline &&
    step.overheadProcess === null &&
    step.processes.some((proc) => proc.id === p.id)
  ) {
    return "bg-stone-800";
  }

  // Se há sobrecarga ativa no passo atual...
  if (step.overheadProcess !== null) {
    // Se este processo é o responsável pela sobrecarga, retorna vermelho (bg-red-500)
    if (step.overheadProcess === p.id) {
      return "bg-red-500"; // bloco de sobrecarga para este processo
    // Caso contrário, se o processo está na fila, retorna amarelo (bg-yellow-500)
    } else if (step.processes.findIndex((proc) => proc.id === p.id) !== -1) {
      return "bg-yellow-500"; // aguardando durante a sobrecarga
    }
  } else {
    // Se não há sobrecarga ativa:
    // Procura o índice do processo na lista de processos ativos.
    const idx = step.processes.findIndex((proc) => proc.id === p.id);
    if (idx !== -1) {
      // Se o processo está na primeira posição, retorna verde (bg-green-500), senão amarelo (bg-yellow-500)
      return idx === 0 ? "bg-green-500" : "bg-yellow-500";
    }
  }
  // Se o processo não está presente, retorna cinza (bg-gray-500) indicando inatividade.
  return "bg-gray-500";
}

/**
 * Computa o turnaround médio customizado a partir do histórico da simulação.
 * Para cada passo da simulação e para cada processo, se a cor da célula
 * não for inativa (bg-gray-500), é contabilizado. (Células de deadline em EDF são pretas e contam se o prazo foi atingido.)
 * A média de turnaround é o total contado dividido pelo número de processos.
 */
function computeCustomTurnaround(
  history: { processes: Process[]; overheadProcess: number | null }[], // Histórico da simulação
  processes: Process[], // Lista de processos
  algorithm: string // Algoritmo de escalonamento
): number {
  let totalCount = 0; // Inicializa o contador total
  // Itera sobre cada passo da simulação
  for (let timeStep = 0; timeStep < history.length; timeStep++) {
    const step = history[timeStep]; // Obtém o estado da simulação para o passo atual
    // Para consistência, ordena os processos por id
    const sortedProcs = processes.slice().sort((a, b) => a.id - b.id);
    // Itera sobre cada processo ordenado
    for (const p of sortedProcs) {
      // Obtém a cor da célula para o processo no passo atual
      const cellColor = getCellColor(p, timeStep, step, algorithm);
      // Se a célula não estiver inativa (bg-gray-500), incrementa o contador
      if (cellColor !== "bg-gray-500") {
        totalCount++;
      }
    }
  }
  // Retorna a média de turnaround dividindo o total pelo número de processos, se houver processos
  return processes.length > 0 ? totalCount / processes.length : 0;
}

// Componente de React para o gráfico de Gantt
export default function GanttChart({
  processes,  // Lista de processos
  algorithm,  // Algoritmo de escalonamento a ser utilizado
  quantum,    // Quantum de tempo para o escalonamento (se aplicável)
  overhead,   // Tempo de sobrecarga
  isRunning   // Booleano que indica se a simulação está rodando
}: {
  processes: Process[];
  algorithm: string;
  quantum: number;
  overhead: number;
  isRunning: boolean;
}) {
  // Estado para armazenar o histórico da simulação
  const [history, setHistory] = useState<
    { processes: Process[]; overheadProcess: number | null }[]
  >([]);
  // Estado para controlar o índice de exibição no histórico
  const [displayIndex, setDisplayIndex] = useState(0);
  // Estado para armazenar o turnaround médio calculado
  const [turnaround, setTurnaround] = useState<number>(0);

  // useEffect que roda quando a simulação está ativa e quando há mudanças nas dependências
  useEffect(() => {
    // Se a simulação não está rodando, não executa nada
    if (!isRunning) return;
    // Roda a simulação para obter o histórico completo
    const newHistory = simulateQueue(processes, algorithm, quantum, overhead);
    setHistory(newHistory); // Atualiza o estado do histórico
    setDisplayIndex(0); // Reseta o índice de exibição

    // Calcula o turnaround médio customizado com base no histórico da simulação
    const customTurnaround = computeCustomTurnaround(newHistory, processes, algorithm);
    setTurnaround(customTurnaround); // Atualiza o estado do turnaround médio
  }, [processes, algorithm, quantum, overhead, isRunning]);

  // useEffect que incrementa o índice de exibição a cada intervalo de tempo para animar o gráfico
  useEffect(() => {
    // Se o índice de exibição ainda não atingiu o final do histórico...
    if (displayIndex < history.length - 1) {
      const intervalId = setInterval(() => {
        // Incrementa o índice de exibição
        setDisplayIndex((prev) => prev + 1);
      }, 500); // Intervalo de 500 milissegundos
      // Limpa o intervalo ao desmontar o componente ou ao atualizar dependências
      return () => clearInterval(intervalId);
    }
  }, [displayIndex, history]);

  return (
    // Container principal do gráfico de Gantt com estilo Tailwind CSS
    <div className="p-4 border rounded bg-gray-700 text-white my-4">
      {/* Título do gráfico */}
      <h2 className="text-xl">Gráfico de Gantt</h2>

      {/* Legenda explicativa */}
      <div className="flex space-x-4 my-2">
        {/* Legenda para processo executando */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500" />
          <span>Executando</span>
        </div>
        {/* Legenda para processo esperando */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-yellow-500" />
          <span>Esperando</span>
        </div>
        {/* Legenda para célula ociosa */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-gray-500" />
          <span>Ocioso</span>
        </div>
        {/* Legenda para sobrecarga */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-red-500" />
          <span>Sobrecarga</span>
        </div>
        {/* Legenda para execução após deadline */}
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-stone-800" />
          <span>Execução após deadline</span>
        </div>
      </div>

      {/* Renderização do gráfico de Gantt */}
      {(
        <div className="flex space-x-2 overflow-auto">
          {/* Coluna dos rótulos */}
          <div className="flex flex-col space-y-2">
            {/* Rótulo do tempo */}
            <div className="bg-gray-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">
              t
            </div>
            {/* Rótulos para cada processo */}
            {processes
              .slice()
              .sort((a, b) => a.id - b.id)
              .map((p) => (
                <div
                  key={p.id}
                  className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center"
                >
                  P{p.id}
                </div>
              ))}
          </div>
          {/* Colunas do gráfico com base no histórico até o índice de exibição */}
          {history.slice(0, displayIndex + 1).map((step, i) => (
            <div key={i} className="flex flex-col space-y-2">
              {/* Rótulo da coluna que indica o passo de tempo */}
              <div className="bg-blue-500 text-white p-1 text-[8px] h-4 flex justify-center items-center">
                {i}
              </div>
              {/* Linha para cada processo no passo atual */}
              {processes
                .slice()
                .sort((a, b) => a.id - b.id)
                .map((p) => {
                  let color = "bg-gray-500"; // Cor padrão: inativo (cinza)
                  // Se há sobrecarga ativa...
                  if (step.overheadProcess !== null) {
                    // Se este processo é o que causa a sobrecarga, define a cor para vermelho
                    if (step.overheadProcess === p.id) {
                      color = "bg-red-500";
                    } else {
                      // Caso contrário, se o processo está presente, define a cor para amarelo
                      const idx = step.processes.findIndex(
                        (proc) => proc.id === p.id
                      );
                      if (idx !== -1) {
                        color = "bg-yellow-500";
                      }
                    }
                  } else {
                    // Se não há sobrecarga ativa, verifica se o processo está presente
                    const idx = step.processes.findIndex(
                      (proc) => proc.id === p.id
                    );
                    if (idx !== -1) {
                      // Se o processo está em execução (primeiro da fila)
                      if (idx === 0) {
                        // Se o algoritmo é EDF e o deadline foi ultrapassado, define a cor para pedra escura
                        if (
                          algorithm === "EDF" &&
                          p.deadline !== undefined &&
                          i >= p.arrivalTime + p.deadline + 1
                        ) {
                          color = "bg-stone-800";
                        } else {
                          // Caso contrário, define a cor para verde (executando)
                          color = "bg-green-500";
                        }
                      } else {
                        // Se não é o primeiro, define a cor para amarelo (esperando)
                        color = "bg-yellow-500";
                      }
                    }
                  }
                  // Renderiza a célula com a cor determinada
                  return (
                    <div key={p.id} className={`${color} text-white p-2 h-4`} />
                  );
                })}
            </div>
          ))}
        </div>
      )}

      {/* Exibe o turnaround médio calculado */}
      <div className="mt-4 text-white text-lg">
        <h3>
          Turnaround Médio: {turnaround.toFixed(2)} unidades de tempo
        </h3>
      </div>
    </div>
  );
}
