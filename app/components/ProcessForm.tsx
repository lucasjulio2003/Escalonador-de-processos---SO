import { useState } from "react";
import { Process } from "../lib/types";

interface Props {
  setProcesses: (callback: (prev: Process[]) => Process[]) => void;
}

export default function ProcessForm({ setProcesses }: Props) {
  const [arrivalTime, setArrivalTime] = useState(0);
  const [executationTime, setExecutationTime] = useState(1);
  const [deadline, setDeadline] = useState(0);
  const [numPages, setNumPages] = useState(0);


  const addProcess = () => {
    setProcesses((prevProcesses) => [
      ...prevProcesses,
      {
        id: prevProcesses.length + 1,
        arrivalTime,
        executationTime,
        remainingTime: executationTime,
        deadline: deadline,
        numPages: numPages
      }
    ]);
  };

  return (
    <div className="p-4 border rounded bg-gray-800 text-black">
      <h2 className="text-xl">Adicionar Processo</h2>
      <label className="text-white">Tempo de chegada</label>
      <input
        type="number"
        placeholder="Tempo de chegada"
        value={arrivalTime}
        onChange={(e) => setArrivalTime(Number(e.target.value))}
        min={0}
        className="p-2 m-2 w-20 border rounded"
      />
      <label className="text-white">Tempo de execução</label>
      <input
        type="number"
        placeholder="Tempo de execução"
        value={executationTime}
        onChange={(e) => setExecutationTime(Number(e.target.value))}
        min={1}
        className="p-2 m-2 w-20 border rounded"
      />
      <label className="text-white">Deadline</label>
      <input
        type="number"
        placeholder="Deadline"
        value={deadline}
        onChange={(e) => setDeadline(Number(e.target.value))}
        min={1}
        className="p-2 m-2 w-20 border rounded"
      />
      <label className="text-white">Tempo de execução</label>
      <input
        type="number"
        placeholder="numero de paginas"
        value={numPages}
        onChange={(e) => setNumPages(Number(e.target.value))}
        min={1}
        className="p-2 m-2 w-20 border rounded"
      />
      <button onClick={addProcess} className="ml-4 bg-green-500 px-4 py-2 rounded">
        Adicionar
      </button>
    </div>
  );
}
