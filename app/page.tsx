/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import React, { useState } from 'react';
import ProcessForm from "./components/ProcessForm";
import MemoryView from "./components/MemoryView";
import GanttChart from "./components/GanttChart";
import { useScheduler } from "./hooks/useScheduler";
// import SelectInputs from "./components/SelectInputs";

export default function Home() {
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const {
    processes,
    saveProcesses, 
    algorithm,
    setAlgorithm,
    quantum,
    setQuantum,
    overhead,
    setOverhead,
    runScheduler,
    isRunning, 
  } = useScheduler();

  const handleStartSimulation = () => {
    // Verificar se há algum erro nos inputs
    if (quantum <= 0) {
      setErrorMessage('O quantum deve ser maior que 0.');
      return;
    }

    if (processes.some(p => p.executationTime <= 0)) {
      setErrorMessage('O tempo de execução de todos os processos deve ser maior que 0.');
      return;
    }

    if (processes.some(p => p.numPages <= 0)) {
      setErrorMessage('O número de páginas de todos os processos deve ser maior que 0.');
      return;
    }

    // Se não houver erros, iniciar a simulação
    setErrorMessage(null);
    runScheduler();
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Simulador de Escalonamento</h1>

      {/* Formulário de Entrada */}
      <ProcessForm setProcesses={saveProcesses} /> {/* Alterado para salvar antes de rodar */}

      {/* Configuração de Algoritmo */}
      <div className="my-4 flex items-center">
        <label className="mr-4">Escolha o algoritmo:</label>
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as any)} className="p-2 border rounded text-black">
          <option value="FIFO">FIFO</option>
          <option value="SJF">SJF</option>
          <option value="EDF">EDF</option>
          <option value="RR">Round Robin</option>
        </select>

        {/* Exibir campo Quantum apenas se Round Robin for selecionado */}
        {["RR", "EDF"].includes(algorithm) && (
          <div className="inline-block ml-4">
            <label className="block text-white text-sm">Quantum:</label>
            <input
              type="number"
              min={1}
              value={quantum}
              onChange={(e) => setQuantum(Number(e.target.value))}
              className="p-2 border rounded text-black w-20"
              placeholder="Quantum"
            />
          </div>
        )}

        {/* Exibir campo de Sobrecarga apenas se RR ou EDF forem selecionados */}
        {["RR", "EDF"].includes(algorithm) && (
          <div className="inline-block ml-4">
            <label className="block text-white text-sm">Sobrecarga:</label>
            <input
              type="number"
              min={1}
              value={overhead}
              onChange={(e) => setOverhead(Number(e.target.value))}
              className="p-2 border rounded text-black w-20"
              placeholder="Sobrecarga"
            />
          </div>
        )}

        {/* Botão de execução só funciona se os processos foram adicionados */}
        <button
          onClick={handleStartSimulation}
          className={`ml-4 px-4 py-2 rounded ${processes.length === 0 ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"}`}
          disabled={processes.length === 0}
        >
          Executar
        </button>
      </div>

      {/* Mensagem de erro */}
      {errorMessage && <div className="text-red-500">{errorMessage}</div>}

      {/* Gráfico de Gantt */}
      {isRunning && <GanttChart processes={processes} algorithm={algorithm} quantum={quantum} overhead={overhead} isRunning={isRunning} />}

      {/* Exibição da Memória */}
      {isRunning && <MemoryView processes={processes} algorithm={algorithm} quantum={quantum} overhead={overhead} isRunning={isRunning} />}
    </div>
  );
}
