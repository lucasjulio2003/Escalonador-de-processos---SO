import { useState } from "react";
import { Process } from "../lib/types";
// import { useScheduler } from "../hooks/useScheduler";

interface Props {
  setProcesses: (newProcesses: Process[]) => void; // Modificado para aceitar um array diretamente
}


export default function ProcessForm({ setProcesses }: Props) {
  // const { algorithm, setAlgorithm, quantum, setQuantum } = useScheduler()
  const [processesList, setProcessesList] = useState<Process[]>([]);
  // const [readyToExecute, setReadyToExecute] = useState(false);
  const [draftProcess, setDraftProcess] = useState<Process>({
    id: 0, // ID temporário (não usado na lista final
    arrivalTime: 0,
    executationTime: 1,
    remainingTime: 1,
    deadline: 0,
    numPages: 1,
    systemOverhead: 0, // Nova propriedade de sobrecarga do sistema
  });

  const addProcess = () => {
    const newProcess: Process = {
      ...draftProcess,
      id: processesList.length + 1, // Gera ID único baseado no tamanho da lista
      remainingTime: draftProcess.executationTime, // Mantém o tempo restante igual ao de execução
    };
    
    setProcessesList((prev) => [...prev, newProcess]);
    
    // Reseta o draft para valores padrão
    setDraftProcess({
      id: 0,
      arrivalTime: 0,
      executationTime: 1,
      remainingTime: 1,
      deadline: 0,
      numPages: 1,
      systemOverhead: 0,
    });
  };

  const updateProcess = (id: number, field: keyof Process, value: number) => {
    if (value < 0) return; // Impede valores negativos
  
    setProcessesList((prev) =>
      prev.map((process) =>
        process.id === id ? { ...process, [field]: value } : process
      )
    );
  };
  

  const deleteProcess = (id: number) => {
    setProcessesList((prev) => prev.filter((process) => process.id !== id));
  };

  const submitProcesses = () => {
    setProcesses(processesList); // Apenas salva os processos sem rodar imediatamente
  };
  
  

  return (
    <div className="p-4 flex flex-col gap-5 space-x-4 border rounded bg-gray-800 text-white">
      <h2 className="text-xl mb-4">Gerenciamento de Processos</h2>
      {/* Formulário do Draft (sempre visível) */}
      <h3 className="text-lg">Novo Processo</h3>
      <div className="flex flex-col border rounded bg-gray-700 p-4 max-w-xl">
        
        <section className="grid grid-cols-2 gap-4 m-2 space-y-2">
          {/*  */}
          <section className="grid m-2 px-4">
            <div>
              <label>Chegada:</label>
              <input
                type="number"
                value={draftProcess.arrivalTime}
                onChange={(e) =>
                  setDraftProcess({ ...draftProcess, arrivalTime: Number(e.target.value) })
                }
                className="p-2 m-2 border rounded text-black w-32"
              />
            </div>

            <div>
              <label>Execução:</label>
              <input
                type="number"
                value={draftProcess.executationTime}
                onChange={(e) =>
                  setDraftProcess({ ...draftProcess, executationTime: Number(e.target.value) })
                }
                className="p-2 m-2 border rounded text-black w-32"
              />
            </div>
          </section>
          <section className="grid grid-cols-1 m-2 px-4 ">   
            <div>
              <label>Deadline:</label>
              <input
                type="number"
                value={draftProcess.deadline}
                onChange={(e) =>
                  setDraftProcess({ ...draftProcess, deadline: Number(e.target.value) })
                }
                className="p-2 m-2 border rounded text-black w-32"
              />
            </div>

            <div className="flex flex-col">
              <label>Páginas:</label>
              <input
                type="number"
                value={draftProcess.numPages}
                onChange={(e) =>
                  setDraftProcess({ ...draftProcess, numPages: Number(e.target.value) })
                }
                className="p-2 m-2 border rounded text-black w-32"
              />
            </div>
          </section>
        </section>

        <button
          onClick={addProcess}
          className="mt-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
        >
          Adicionar Processo
        </button>
      </div>

      {/* Lista de processos adicionados */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5  gap-4 px-4 ">
        {processesList.map((process) => (
          <div key={process.id} className="flex flex-col border rounded bg-gray-700 p-4 w-64 Object-cove">
            <h3 className="text-lg">P{process.id}</h3>
            <section className="grid grid-cols-2 space-y-1">
              {/*coluna 1 */}
              <section className="grid grid-cols-1 gap-4 px-4 ">
              <div>
                <label>Chegada:</label>
                <input
                  type="number"
                  value={process.arrivalTime}
                  onChange={(e) =>
                    updateProcess(process.id, "arrivalTime", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />
              </div>
             
              <div>
                <label>Execução:</label>
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
              </section>

              {/* coluna 2 */}  
              <section className="grid grid-cols-1 gap-4 px-4 ">
              <div>
                <label>Deadline:</label>
                <input
                  type="number"
                  value={process.deadline}
                  onChange={(e) =>
                    updateProcess(process.id, "deadline", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />

                {/* <label>Sobrecarga do Sistema:</label>
                <input 
                type="number" 
                value={draftProcess.systemOverhead} 
                onChange={(e) => 
                  setDraftProcess({ ...draftProcess, systemOverhead: Number(e.target.value) })
                } 
                className="p-2 m-2 border rounded text-black w-32" 
                /> */}
              </div>

              <div>
                <label>Páginas:</label>
                <input
                  type="number"
                  value={process.numPages}
                  onChange={(e) =>
                    updateProcess(process.id, "numPages", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />
              </div>
              </section>
            </section>

            <button
              onClick={() => deleteProcess(process.id)}
              className="mt-2 bg-red-500 hover:bg-red-700 px-4 py-2 rounded"
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