/* eslint-disable @typescript-eslint/no-explicit-any */ // Desativa a regra do eslint que impede o uso de "any"
"use client"; // Indica que este componente será renderizado no cliente (front-end)
import { useCallback, useEffect, useMemo, useState } from "react"; // Importa hooks do React
import { useMemory } from "../hooks/useMemory"; // Importa o hook customizado para gerenciamento de memória
import { Process } from "../lib/types"; // Importa a tipagem Process a partir dos tipos definidos
import { simulateQueue } from "../lib/utils"; // Importa a função que simula a fila de processos

export default function MemoryView({ // Define e exporta o componente MemoryView
  processes, // Recebe a lista de processos
  algorithm, // Recebe o algoritmo de escalonamento
  quantum, // Recebe o tempo de quantum do escalonamento
  overhead, // Recebe o overhead entre as trocas
  isRunning, // Indica se a simulação está em execução
}: { // Define as tipagens das props do componente
  processes: Process[]; // Array de processos
  algorithm: string; // Algoritmo de escalonamento como string
  substitutionAlgorithm: "FIFO" | "LRU"; // Algoritmo de substituição, limitado a "FIFO" ou "LRU"
  quantum: number; // Valor numérico do quantum
  overhead: number; // Valor numérico do overhead
  isRunning: boolean; // Flag indicando se a simulação está rodando
}) {
  const { memory, pageFaults, loadPage } = useMemory(); // Utiliza o hook useMemory para obter o estado da memória, pageFaults e a função loadPage

  // Cria todas as páginas que devem existir com base nos processos
  const allPages = useMemo(
    () =>
      processes.flatMap((process) =>
        Array.from({ length: process.numPages }, (_, i) => ({
          id: i, // Define o id da página pelo índice
          processId: process.id, // Associa a página ao id do processo
        }))
      ),
    [processes] // Atualiza o valor sempre que a lista de processos mudar
  );

  // Se o total de páginas deve ser 50, calcula quantas "vazias" serão adicionadas (processId === 0)
  const emptyPagesCount = Math.max(0, 50 - allPages.length); // Calcula a quantidade de páginas vazias necessárias

  // Armazena o disco em estado, iniciando com as páginas de todos os processos e as páginas vazias
  const [disk, setDisk] = useState(() => {
    return [
      ...allPages, // Inclui todas as páginas dos processos
      ...Array.from({ length: emptyPagesCount }, (_, i) => ({
        id: i, // Define o id da página vazia
        processId: 0, // Um processId 0 indica que a página está vazia
      })),
    ];
  });

  // (Opcional) Se os processos mudarem, atualiza o disco com as novas páginas e páginas vazias
  useEffect(() => {
    setDisk([
      ...allPages, // Atualiza com as páginas dos processos
      ...Array.from({ length: Math.max(0, 50 - allPages.length) }, (_, i) => ({
        id: i, // Define o id da página vazia
        processId: 0, // Página vazia
      })),
    ]);
  }, [allPages]); // Executa quando allPages mudar

  // Função para remover do disco a página que foi carregada na memória
  const removeDisk = useCallback((pageToRemove: any) => { // Função memorizada para remover a página do disco
    setDisk((prevDisk) =>
      prevDisk.map((page) =>
        page.processId === pageToRemove.processId && page.id === pageToRemove.id // Verifica se a página é a que deve ser removida
          ? { id: page.id, processId: 0 } // Substitui a página removida por uma página vazia (processId 0)
          : page // Retorna a página sem alteração caso não seja a página desejada
      )
    );
  }, []); // useCallback sem dependências

  const history = simulateQueue(processes, algorithm, quantum, overhead); // Simula a fila de execução dos processos
  const [displayIndex, setDisplayIndex] = useState(0); // Estado para controlar o índice de exibição da fila

  // Função que carrega as páginas do processo atual e remove as mesmas do disco
  const loadPages = useCallback(
    (process: Process) => { // Função para carregar as páginas do processo em memória
      if (!isRunning) { // Se a simulação não estiver rodando
        setDisplayIndex(0); // Reseta o display index para 0
        return; // Sai da função
      }
      for (let i = 0; i < process.numPages; i++) { // Itera pelo número de páginas do processo
        loadPage({ id: i, processId: process.id, inMemory: false, lastAccess: 0 }); // Carrega a página no estado de memória com dados iniciais
        // Procura a página correspondente no disco e, se encontrada, remove-a
        const pageFound = disk.find(
          (page) => page.processId === process.id && page.id === i
        ); // Procura a página que corresponde ao processo e índice
        if (pageFound && pageFound.processId !== 0) { // Se a página for encontrada e não estiver vazia
          removeDisk(pageFound); // Remove do disco a página encontrada
        }
      }
    },
    [isRunning, loadPage, disk, removeDisk] // Dependências que disparam a re-criação dessa função
  );

  useEffect(() => { // Hook para lidar com os efeitos da execução da simulação
    if (!isRunning) return; // Se a simulação não estiver rodando, sai do efeito

    const interval = setInterval(() => { // Cria um intervalo para atualizar o displayIndex periodicamente
      setDisplayIndex((prev) => (prev < history.length - 1 ? prev + 1 : prev)); // Incrementa o displayIndex se não estiver no final da fila
    }, 490); // Intervalo de 490ms

    const currentProcess = history[displayIndex]?.processes[0]; // Obtém o processo atual a partir do histórico utilizando o display index
    if (currentProcess) { // Se existir um processo atual
      loadPages(currentProcess); // Carrega as páginas do processo atual
    }
    return () => clearInterval(interval); // Limpa o intervalo ao desmontar ou atualizar o efeito
  }, [displayIndex, history, loadPages, isRunning]); // Executa quando displayIndex, history, loadPages ou isRunning mudarem

  return ( // Retorna o JSX do componente
    <div className="p-4 border rounded bg-gray-700 text-white my-4"> {/* Container principal com estilos */}
      <h2 className="text-xl">Memória RAM e Disco</h2> {/* Título do componente */}
      <p className="text-sm">Total de Page Faults: {pageFaults}</p> {/* Exibe o total de page faults ocorridos */}

      <div className="flex flex-row"> {/* Container flex para exibição lado a lado da memória e do disco */}
        {/* Exibição da memória */}
        {isRunning && ( // Se a simulação estiver em execução, exibe a memória RAM
          <div className="w-1/2"> {/* Divisão ocupando metade da largura */}
            <h3 className="text-center text-lg font-semibold">RAM</h3> {/* Título para a RAM */}
            <div className="grid grid-cols-10 gap-1.5 p-2"> {/* Grid de 10 colunas para as páginas da RAM */}
              {memory.map((page) => ( // Mapeia cada página da memória para exibição
                <div
                  key={`${page.processId}-${page.id}`} // Chave única para cada página baseada no processId e id
                  className={`p-2 text-xs text-center border rounded h-12 flex items-center justify-center ${
                    page.processId === 0 ? "" : "bg-gray-500" // Se a página não estiver vazia, aplica fundo cinza
                  }`}
                >
                  {page.processId !== 0 ? ( // Se a página não estiver vazia
                    <>
                      P{page.processId} {/* Exibe o id do processo */}
                      <br /> {/* Quebra de linha */}
                      {page.id} {/* Exibe o id da página */}
                    </>
                  ) : ( // Se a página estiver vazia
                    <>
                      <br /> {/* Quebra de linha */}
                      {"-"} {/* Exibe "-" para indicar página vazia */}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Exibição do Disco */}
        {isRunning && ( // Se a simulação estiver em execução, exibe o disco
          <div className="w-1/2"> {/* Divisão ocupando metade da largura */}
            <h3 className="text-center text-lg font-semibold">Disco</h3> {/* Título para o Disco */}
            <div className="grid grid-cols-10 gap-1.5 p-2"> {/* Grid de 10 colunas para as páginas do disco */}
              {disk.map((page, index) => ( // Mapeia cada página do disco para exibição
                <div
                  key={`${page.processId}-${page.id}-${index}`} // Chave única incluindo processId, id e índice do mapeamento
                  className={`p-2 text-xs text-center border rounded h-12 flex items-center justify-center ${
                    page.processId === 0 ? "bg-gray-500 text-transparent" : "" // Se a página estiver vazia, aplica fundo cinza e texto transparente
                  }`}
                >
                  {page.processId !== 0 ? ( // Se a página não estiver vazia
                    <>
                      P{page.processId} {/* Exibe o id do processo */}
                      <br /> {/* Quebra de linha */}
                      {page.id} {/* Exibe o id da página */}
                    </>
                  ) : ( // Se a página estiver vazia
                    <>
                      <br /> {/* Quebra de linha */}
                      {"-"} {/* Exibe "-" para indicar que a página está vazia */}
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
