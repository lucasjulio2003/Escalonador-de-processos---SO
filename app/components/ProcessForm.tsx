// Importa o hook useState do React
import { useState } from "react";
// Importa o tipo Process definido no arquivo ../lib/types
import { Process } from "../lib/types";
// import { useScheduler } from "../hooks/useScheduler"; // Importação comentada: hook para escalonamento

// Define a interface Props com a função setProcesses recebendo um array de Process
interface Props {
  setProcesses: (newProcesses: Process[]) => void;
}

// Função componente ProcessForm que recebe as props conforme definido
export default function ProcessForm({ setProcesses }: Props) {

  // Hook comentado: Desestrutura os valores do hook useScheduler
  // const { algorithm, setAlgorithm, quantum, setQuantum } = useScheduler()

  // Cria o estado processesList, que armazena um array de processos
  const [processesList, setProcessesList] = useState<Process[]>([]);

  // const [readyToExecute, setReadyToExecute] = useState(false); // Estado comentado

  // Cria o estado draftProcess que representa o processo a ser adicionado
  const [draftProcess, setDraftProcess] = useState<Process>({
    id: 0,
    arrivalTime: 0,
    executationTime: 1,
    remainingTime: 1,
    deadline: 0,
    numPages: 1,
    systemOverhead: 0,
    executedTime: 0,
  });

  // Função para adicionar um novo processo à lista
  const addProcess = () => {
    // Cria novo processo baseado no draftProcess e ajusta o id e remainingTime
    const newProcess: Process = {
      ...draftProcess,
      id: processesList.length + 1, 
      remainingTime: draftProcess.executationTime,
    };
    
    // Atualiza o estado processesList adicionando o novo processo
    setProcessesList((prev) => [...prev, newProcess]);
    
    // Reseta o draftProcess para os valores padrão
    setDraftProcess({
      id: 0,
      arrivalTime: 0,
      executationTime: 1,
      remainingTime: 1,
      deadline: 0,
      numPages: 1,
      systemOverhead: 0,
      executedTime: 0,
    });
  };

  // Função para atualizar um campo específico de um processo
  const updateProcess = (id: number, field: keyof Process, value: number) => {
    if (value < 0) return; // Se o valor for negativo, não atualiza
  
    // Atualiza o processo correspondente com o novo valor no campo especificado
    setProcessesList((prev) =>
      prev.map((process) =>
        process.id === id ? { ...process, [field]: value } : process
      )
    );
  };
  
  // Função para remover um processo da lista
  const deleteProcess = (id: number) => {
    // Filtra a lista removendo o processo com o id correspondente
    setProcessesList((prev) => prev.filter((process) => process.id !== id));
  };

  // Função para enviar a lista de processos para o escalonamento através da prop setProcesses
  const submitProcesses = () => {
    setProcesses(processesList);
  };
  
  // JSX retornado pelo componente
  return (
    // Container principal com classes de estilização
    <div className="p-4 flex flex-col gap-5 space-x-4 border rounded bg-gray-800 text-white">
      {/* Título do formulário */}
      <h2 className="text-xl mb-4">Gerenciamento de Processos</h2>
      {/* Início da seção para criação de um novo processo */}
      <h3 className="text-lg">Novo Processo</h3>
      <div className="flex flex-col border rounded bg-gray-700 p-4 max-w-xl">
        
        {/* Seção do formulário com grid para organizar os inputs */}
        <section className="grid grid-cols-2 gap-4 m-2 space-y-2">
          {/* Primeira coluna dos inputs */}
          <section className="grid m-2 px-4">
            <div>
              {/* Label e input para definir o tempo de chegada */}
              <label>Chegada:</label>
              <input
                type="number"
                min={0}
                value={draftProcess.arrivalTime}
                onChange={(e) =>
                  setDraftProcess({ ...draftProcess, arrivalTime: Number(e.target.value) })
                }
                className="p-2 m-2 border rounded text-black w-32"
              />
            </div>

            <div>
              {/* Label e input para definir o tempo de execução */}
              <label>Execução:</label>
              <input
                type="number"
                min={1}
                value={draftProcess.executationTime}
                onChange={(e) =>
                  setDraftProcess({ ...draftProcess, executationTime: Number(e.target.value) })
                }
                className="p-2 m-2 border rounded text-black w-32"
              />
            </div>
          </section>
          {/* Segunda coluna dos inputs */}
          <section className="grid grid-cols-1 m-2 px-4 ">   
            <div>
              {/* Label e input para definir o deadline */}
              <label>Deadline:</label>
              <input
                type="number"
                min={0}
                value={draftProcess.deadline}
                onChange={(e) =>
                  setDraftProcess({ ...draftProcess, deadline: Number(e.target.value) })
                }
                className="p-2 m-2 border rounded text-black w-32"
              />
            </div>

            <div className="flex flex-col">
              {/* Label e input para definir o número de páginas */}
              <label>Páginas:</label>
              <input
                type="number"
                min={1}
                max={10}
                value={draftProcess.numPages}
                onChange={(e) =>
                  setDraftProcess({ ...draftProcess, numPages: Number(e.target.value) })
                }
                className="p-2 m-2 border rounded text-black w-32"
              />
            </div>
          </section>
        </section>

        {/* Botão para adicionar o novo processo */}
        <button
          onClick={addProcess}
          className="mt-2 bg-green-500 hover:bg-green-600 px-4 py-2 rounded"
        >
          Adicionar Processo
        </button>
      </div>

      {/* Seção para listar os processos adicionados */}
      <div className="grid grid-cols-1 space-x-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5  gap-4 px-4 ">
        {processesList.map((process) => (
          // Container para cada processo individual com key única
          <div key={process.id} className="flex flex-col border rounded bg-gray-700 p-4">
            {/* Cabeçalho identificando o processo */}
            <h3 className="text-lg">P{process.id}</h3>
            <section className="grid grid-cols-2 space-y-1">
              {/* Coluna 1: Inputs de Chegada e Execução */}
              <section className="grid grid-cols-1 gap-4 px-4 ">
              <div>
                {/* Input para modificar o tempo de chegada */}
                <label>Chegada:</label>
                <input
                  type="number"
                  min={0}
                  value={process.arrivalTime}
                  onChange={(e) =>
                    updateProcess(process.id, "arrivalTime", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />
              </div>
             
              <div>
                {/* Input para modificar o tempo de execução; também atualiza o tempo restante */}
                <label>Execução:</label>
                <input
                  type="number"
                  min={1}
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

              {/* Coluna 2: Inputs de Deadline e Páginas */}
              <section className="grid grid-cols-1 gap-4 px-4 ">
              <div>
                {/* Input para modificar o deadline */}
                <label>Deadline:</label>
                <input
                  type="number"
                  min={0}
                  value={process.deadline}
                  onChange={(e) =>
                    updateProcess(process.id, "deadline", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />

                {/* Código comentado para o input de sobrecarga do sistema */}
                {/* <label>Sobrecarga do Sistema:</label>
                <input 
                type="number" 
                value={draftProcess.systemOverhead} 
                onChange={(e) => 
                  setDraftProcess({ ...draftProcess, systemOverhead: Number(e.target.value) })
                } 
                className="p-2 m-2 border rounded text-white w-32" 
                /> */}
              </div>

              <div>
                {/* Input para modificar o número de páginas */}
                <label>Páginas:</label>
                <input
                  type="number"
                  min={1}
                  max={10}
                  value={process.numPages}
                  onChange={(e) =>
                    updateProcess(process.id, "numPages", Number(e.target.value))
                  }
                  className="p-2 m-2 border rounded text-black w-full"
                />
              </div>
              </section>
            </section>

            {/* Botão para excluir o processo */}
            <button
              onClick={() => deleteProcess(process.id)}
              className="mt-2 bg-red-500 hover:bg-red-700 px-4 py-2 rounded"
            >
              Remover Processo
            </button>
          </div>
        ))}
      </div>

      {/* Botão para enviar a lista de processos para o escalonamento */}
      <button
        onClick={submitProcesses}
        className="mt-4 bg-blue-500 px-4 py-2 rounded"
      >
        Enviar Processos para Escalonamento
      </button>
    </div>
  );
}