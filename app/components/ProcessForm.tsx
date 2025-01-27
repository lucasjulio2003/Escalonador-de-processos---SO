import { useState } from "react";
import { Process } from "../lib/types";

interface Props {
  setProcesses: (callback: (prev: Process[]) => Process[]) => void;
}

export default function ProcessForm({ setProcesses }: Props) {
  const [arrivalTime, setArrivalTime] = useState(0);
  const [burstTime, setBurstTime] = useState(0);

  const addProcess = () => {
    setProcesses((prevProcesses) => [
      ...prevProcesses,
      {
        id: prevProcesses.length + 1,
        arrivalTime,
        burstTime,
        remainingTime: burstTime,
      }
    ]);
  };

  return (
    <div className="p-4 border rounded bg-gray-800 text-black">
      <h2 className="text-xl">Adicionar Processo</h2>
      <input
        type="number"
        placeholder="Tempo de chegada"
        value={arrivalTime}
        onChange={(e) => setArrivalTime(Number(e.target.value))}
        className="p-2 m-2 border rounded"
      />
      <input
        type="number"
        placeholder="Tempo de execução"
        value={burstTime}
        onChange={(e) => setBurstTime(Number(e.target.value))}
        className="p-2 m-2 border rounded"
      />
      <button onClick={addProcess} className="ml-4 bg-green-500 px-4 py-2 rounded">
        Adicionar
      </button>
    </div>
  );
}
