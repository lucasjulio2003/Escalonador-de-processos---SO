/* eslint-disable @typescript-eslint/no-explicit-any */ // Desabilita a regra do eslint que proíbe o uso de "any"
"use client"; // Indica que este componente será renderizado no cliente
import React, { useState } from 'react'; // Importa React e o hook de estado useState
import ProcessForm from "./components/ProcessForm"; // Importa o componente ProcessForm
import MemoryView from "./components/MemoryView"; // Importa o componente MemoryView
import GanttChart from "./components/GanttChart"; // Importa o componente GanttChart
import { useScheduler } from "./hooks/useScheduler"; // Importa o hook de gerenciamento de escalonamento

export default function Home() { // Declara o componente funcional "Home" que será exportado por padrão
  const [errorMessage, setErrorMessage] = useState<string | null>(null); // Declara o estado para armazenar mensagens de erro

  // Desestrutura os valores e funções retornadas pelo hook useScheduler
  const {
    processes, // Lista de processos
    saveProcesses, // Função para salvar os processos
    algorithm, // Algoritmo de escalonamento selecionado
    setAlgorithm, // Função para atualizar o algoritmo
    quantum, // Valor do quantum
    setQuantum, // Função para atualizar o quantum
    overhead, // Valor da sobrecarga
    setOverhead, // Função para atualizar a sobrecarga
    runScheduler, // Função para iniciar a simulação do escalonamento
    resetScheduler, // Função para resetar a simulação e limpar memória/disco
    isRunning, // Booleano que indica se a simulação está em execução
  } = useScheduler();

  // Estado para armazenar o algoritmo de substituição (FIFO ou LRU)
  const [substitutionAlgorithm, setSubstitutionAlgorithm] = useState<'FIFO' | 'LRU'>('FIFO'); 

  // Função para iniciar a simulação
  const handleStartSimulation = () => {
    // Verifica se o quantum é maior que 0
    if (quantum <= 0) {
      setErrorMessage('O quantum deve ser maior que 0.');
      return;
    }

    // Verifica se o tempo de execução de cada processo é maior que 0
    if (processes.some(p => p.executationTime <= 0)) {
      setErrorMessage('O tempo de execução de todos os processos deve ser maior que 0.');
      return;
    }

    // Verifica se o número de páginas de cada processo é maior que 0
    if (processes.some(p => p.numPages <= 0)) {
      setErrorMessage('O número de páginas de todos os processos deve ser maior que 0.');
      return;
    }

    // Se não houver erros, limpa a mensagem de erro e inicia a simulação
    setErrorMessage(null);
    runScheduler();
  };

  // Função para resetar a simulação
  const handleReset = () => {
    resetScheduler(); // Chama a função que reseta a simulação, limpando memória e disco
  };

  return (
    <div className="container mx-auto p-6"> {/* Container principal com classes de estilo */}
      <h1 className="text-3xl font-bold text-center mb-6">Simulador de Escalonamento</h1> {/* Título principal da aplicação */}

      {/* Renderiza o formulário para entrada dos processos */}
      <ProcessForm setProcesses={saveProcesses} /> {/* Componente para entrada de processos, passando a função de salvar processos */}

      {/* Seção para configuração do algoritmo */}
      <div className="my-4 flex items-center">
        <label className="mr-4">Escolha o algoritmo:</label> {/* Rótulo para seleção do algoritmo */}
        <select 
          value={algorithm} // Valor atual do algoritmo selecionado
          onChange={(e) => setAlgorithm(e.target.value as any)} // Atualiza o algoritmo com a opção selecionada
          className="p-2 border rounded text-black" // Classes de estilo para o select
        >
          <option value="FIFO">FIFO</option> {/* Opção FIFO */}
          <option value="SJF">SJF</option> {/* Opção SJF */}
          <option value="EDF">EDF</option> {/* Opção EDF */}
          <option value="RR">Round Robin</option> {/* Opção Round Robin */}
        </select>
        <section className="pb-5">
          {["RR", "EDF"].includes(algorithm) && ( // Se o algoritmo for Round Robin ou EDF, exibe a entrada para Quantum
            <div className="inline-block ml-4">
              <label className="block text-white text-sm">Quantum:</label> {/* Rótulo para Quantum */}
              <input
                type="number" // Input numérico para o quantum
                min={1} // Valor mínimo permitido é 1
                value={quantum} // Valor atual do quantum
                onChange={(e) => setQuantum(Number(e.target.value))} // Atualiza o quantum com o valor digitado
                className="p-2 border rounded text-black w-20" // Classes de estilo para o input
                placeholder="Quantum" // Texto placeholder
              />
            </div>
          )}

          {["RR", "EDF"].includes(algorithm) && ( // Se o algoritmo for Round Robin ou EDF, exibe a entrada para Sobrecarga
            <div className="inline-block ml-4">
              <label className="block text-white text-sm">Sobrecarga:</label> {/* Rótulo para sobrecarga */}
              <input
                type="number" // Input numérico para a sobrecarga
                min={1} // Valor mínimo permitido é 1
                value={overhead} // Valor atual da sobrecarga
                onChange={(e) => setOverhead(Number(e.target.value))} // Atualiza a sobrecarga com o valor digitado
                className="p-2 border rounded text-black w-20" // Classes de estilo para o input
                placeholder="Sobrecarga" // Texto placeholder
              />
            </div>
          )}
        </section>      

        {/* Botão para iniciar a simulação */}
        <button
          onClick={handleStartSimulation} // Ao clicar, inicia a simulação
          className={`ml-4 px-4 py-2 rounded ${processes.length === 0 ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"}`} // Classes de estilo que mudam se não houver processos
          disabled={processes.length === 0} // Desabilita o botão se a lista de processos estiver vazia
        >
          Executar {/* Texto do botão */}
        </button>

        {/* Botão para resetar a simulação */}
        <button
          onClick={handleReset} // Ao clicar, reseta a simulação
          className="ml-4 px-4 py-2 rounded bg-red-500 hover:bg-red-600 text-white" // Classes de estilo para o botão de reset
        >
          Reset {/* Texto do botão */}
        </button>
      </div>

      {/* Seção para escolha do algoritmo de substituição */}
      <div className="my-2">
          <label>Algoritmo de Substituição:</label> {/* Rótulo para selecionar o algoritmo de substituição */}
          <select
            className="ml-2 p-2 border rounded text-black" // Classes de estilo para o select
            value={substitutionAlgorithm} // Valor atual do algoritmo de substituição
            onChange={(e) => setSubstitutionAlgorithm(e.target.value as 'FIFO' | 'LRU')} // Atualiza o algoritmo de substituição com o valor selecionado
          >
            <option value="FIFO">FIFO</option> {/* Opção FIFO */}
            <option value="LRU">LRU</option> {/* Opção LRU */}
          </select>
        </div>

      {/* Exibe a mensagem de erro, se houver */}
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}

      {/* Renderiza o gráfico de Gantt se a simulação estiver em execução */}
      {isRunning && <GanttChart processes={processes} algorithm={algorithm} quantum={quantum} overhead={overhead} isRunning={isRunning} />}

      {/* Renderiza a visualização da memória se a simulação estiver em execução */}
      {isRunning && <MemoryView processes={processes} algorithm={algorithm} substitutionAlgorithm={substitutionAlgorithm} quantum={quantum} overhead={overhead} isRunning={isRunning} />}

    </div> // Fecha o container principal
  );
} // Fim do componente Home
