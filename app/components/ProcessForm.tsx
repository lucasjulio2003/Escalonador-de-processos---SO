import { useState } from "react";
import { Process } from "../lib/types";

interface Props {
  setProcesses: (callback: (prev: Process[]) => Process[]) => void;
}

export default function ProcessForm({ setProcesses }: Props) {
  const [processesList, setProcessesList] = useState<Process[]>([]);

  // Função para adicionar um novo processo
  const addProcess = () => {
    const newProcess: Process = {
      id: processesList.length + 1, // Gera um ID único
      arrivalTime: 0,
      executationTime: 1,
      remainingTime: 1,
      deadline: 0,
      numPages:1,
    };
    setProcessesList((prev) => [...prev, newProcess]);
  };


  const updateProcess = (id: number, field: keyof Process, value: number) => {
    setProcessesList((prev) =>
      prev.map((process) =>
        process.id === id ? { ...process, [field]: value } : process
      )
    );

    console.log("processesList", processesList);

  };

  const deleteProcess = (id: number) => {
    setProcessesList((prev) => prev.filter((process) => process.id !== id));
  };

  const submitProcesses = () => {
    setProcesses(() => processesList);
  };


  return (
    <div className="p-4 flex flex-col gap-5  space-x-4 border rounded bg-gray-800 text-white ">
      <h2 className="text-xl mb-4">Gerenciamento de Processos</h2>

      {/* Botão para adicionar um novo processo */}
      <button
        onClick={addProcess}
        className="mb-4 bg-green-500 hover:bg-green-600 active:bg-green-700 px-4 py-2 rounded"
      >
       Adicionar Processo
      </button>
    
      {/* Lista de processos */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-4">
        {processesList.map((process) => (
          <div key={process.id} className="flex flex-col border rounded bg-gray-700 p4 w-64">
            <h3 className="text-lg">P{process.id}</h3>
            <div className="">
              
              <div className="flex flex-row wrap">
                <label>Tempo de Chegada:</label>
                <input
                  type="number"
                  value={process.arrivalTime}
                  onChange={(e) =>
                    updateProcess(process.id, "arrivalTime", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />
              </div>

              <div className="flex flex-row justify-center ">
                <label>Tempo de Execução:</label>
                <input
                  type="number"
                  value={process.executationTime}
                  onChange={(e) => 
                    {
                      updateProcess(process.id, "executationTime", Number(e.target.value));
                      updateProcess(process.id, "remainingTime", Number(e.target.value));
                    }
                  }
                  className="p-2 m-2 border rounded text-black w-full" 
                />
              </div>
              
              <div className="flex flex-row justify-ce p-2">
                <label>Deadline:</label>
                <input
                  type="number"
                  value={process.deadline}
                  onChange={(e) =>
                    updateProcess(process.id, "deadline", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />
              </div>
              <div className="flex flex-row justify-ce p-2">
                <label>Numero de Paginas:</label>
                <input
                  type="number"
                  value={process.numPages}
                  onChange={(e) =>
                    updateProcess(process.id, "numPages", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />
              </div>
            </div>

            <button
              onClick={() => deleteProcess(process.id)}
              className="mt-2 bg-red-500 px-4 py-2 rounded"
            >
              Remover Processo
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={submitProcesses}
        className="mt-4 bg-blue-500 px-4 py-2 rounded"
      >
        Enviar Processos para Escalonamento
      </button>
      
    </div>
  );
}