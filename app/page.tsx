"use client";
import { useState } from "react";
import ProcessForm from "./components/ProcessForm";
import MemoryView from "./components/MemoryView";
import GanttChart from "./components/GanttChart";
import ExecutionLog from "./components/ExecutionLogs";
import { useScheduler } from "./hooks/useScheduler";
import SelectInputs from "./components/SelectInputs";

export default function Home() {
  const { processes, setProcesses, algorithm, setAlgorithm, quantum, setQuantum, overHead, setOverHead, runScheduler } = useScheduler();

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Simulador de Escalonamento</h1>

      {/* Formulário de Entrada */}
      <ProcessForm setProcesses={setProcesses} />

      {/* Configuração de Algoritmo */}
      <div className="my-4">
        <label className="mr-4">Escolha o algoritmo:</label>
        <select value={algorithm} onChange={(e) => setAlgorithm(e.target.value as any)} className="p-2 border rounded text-black">
          <option value="FIFO">FIFO</option>
          <option value="SJF">SJF</option>
          <option value="EDF">EDF</option>
          <option value="RR">Round Robin</option>
        </select>

        { /*<SelectInputs/> */ }
        {/* Exibir campo Quantum apenas se Round Robin for selecionado */}
        { ( algorithm === "RR" || algorithm === "EDF") && (
          <section className="mt-4 mb-4">
          <div className="inline-block space-x-4">
            <label className="text-white text-sm">Quantum:</label>
            <input
              type="number"
              value={quantum}
              onChange={(e) => setQuantum(Number(e.target.value))}
              className="p-2 border rounded text-black w-20"
              placeholder="Quantum"
            />
          </div>

          <div className="inline-block space-x-4  ml-4 ">
            <label className="text-white text-sm">Sobrecarga</label>
            <input 
              type="number"
              value={overHead}
              onChange={(e) => setOverHead(Number(e.target.value))}
              placeholder = "Sobrecarga"
              className="p-2 border rounded text-black w-20"/>
          </div>
          </section>
        )}

        <button onClick={runScheduler} className="ml-4 bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white px-4 py-2 rounded">Executar</button>
      </div>

      {/* Exibição da Memória */}
      <MemoryView processes={processes} />

      {/* Gráfico de Gantt */}
      <GanttChart processes={processes} />

      {/* Log de Execução */}
      
    </div>
  );
}
