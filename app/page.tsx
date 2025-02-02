/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";
import ProcessForm from "./components/ProcessForm";
import MemoryView from "./components/MemoryView";
import GanttChart from "./components/GanttChart";
// import ExecutionLog from "./components/ExecutionLogs";
import { useScheduler } from "./hooks/useScheduler";
// import SelectInputs from "./components/SelectInputs";

export default function Home() {

  const {
    processes,
    saveProcesses, // Alterado para armazenar os processos sem executar
    algorithm,
    setAlgorithm,
    quantum,
    setQuantum,
    overhead,
    setOverhead,
    runScheduler,
    isRunning, // Estado que controla se os processos estão prontos
  } = useScheduler();
  // const [overhead, setOverhead] = useState(1);


  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold text-center mb-6">Simulador de Escalonamento</h1>

      {/* Formulário de Entrada */}
      <ProcessForm setProcesses={saveProcesses} /> {/* Alterado para salvar antes de rodar */}

      {/* Configuração de Algoritmo */}
      <div className="my-4">
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
          onClick={runScheduler}
          className={`ml-4 px-4 py-2 rounded ${processes.length === 0 ? "bg-gray-500 cursor-not-allowed" : "bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white"}`}
          disabled={processes.length === 0}
        >
          Executar
        </button>
      </div>
      
      {/* Gráfico de Gantt */}
      {isRunning && (
        <GanttChart processes={processes} algorithm={algorithm} quantum={quantum} overhead={overhead} />
      )}

      {/* { !isRunning &&
        <MemoryView processes={processes} algorithm={algorithm} quantum={quantum} overhead={overhead} isRunning/>} */}

      {/* Exibição da Memória */}
      { isRunning &&
        <MemoryView processes={processes} algorithm={algorithm} quantum={quantum} overhead={overhead} isRunning/>}

      {/* Log de Execução */}
      
    </div>
  );
}
