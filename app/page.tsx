"use client";
import { useState } from "react";
import ProcessForm from "./components/ProcessForm";
import MemoryView from "./components/MemoryView";
import GanttChart from "./components/GanttChart";
import ExecutionLog from "./components/ExecutionLogs";
import { useScheduler } from "./hooks/useScheduler";

export default function Home() {
  const { processes, setProcesses, algorithm, setAlgorithm, runScheduler } = useScheduler();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Simulador de Escalonamento</h1>

      {/* Formulário de Entrada */}
      <ProcessForm processes={processes} setProcesses={setProcesses} />

      {/* Configuração de Algoritmo */}
      <div className="my-4">
        <label className="mr-4">Escolha o algoritmo:</label>
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as any)} className="p-2 border rounded text-black">
          <option value="FIFO">FIFO</option>
          <option value="SJF">SJF</option>
        </select>
        <button onClick={runScheduler} className="ml-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-2 rounded">Executar</button>
      </div>

      {/* Exibição da Memória */}
      <MemoryView />

      {/* Gráfico de Gantt */}
      <GanttChart processes={processes} />

      {/* Log de Execução */}
    </div>
  );
}
