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
      numPages:1,
    };
    setProcessesList((prev) => [...prev, newProcess]);
  };

  // Função para atualizar um processo existente
  const updateProcess = (id: number, field: keyof Process, value: number) => {
    setProcessesList((prev) =>
      prev.map((process) =>
        process.id === id ? { ...process, [field]: value } : process
      )
    );
  };

  // Função para remover um processo
  const deleteProcess = (id: number) => {
    setProcessesList((prev) => prev.filter((process) => process.id !== id));
  };

  // Função para enviar todos os processos para o escalonador
  const submitProcesses = () => {
    setProcesses(() => processesList);
  };

return (
    <main >
        <div></div>

    </main>
);

