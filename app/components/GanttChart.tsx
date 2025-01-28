import { Process } from "../lib/types";

export default function GanttChart({ processes }: { processes: Process[] }) {

  let currentTime = 0;
  const limitTime = 10;

  // Historico da fila de execução
  const history: Process[][] = [];

  for (let i = 0; i < limitTime; i++) {
    // Fila de execução
    const queue: Process[] = [];
    // Adiciona processos na fila
    processes.forEach((p) => {
      if (p.arrivalTime <= currentTime && p.burstTime > 0) {
        queue.push(p);
      }
    });

    history.push([...queue]);

    currentTime++;
  }

  console.log(history);

  return (
    <div className="p-4 border rounded bg-gray-700 text-white my-4">
      <h2 className="text-xl">Gráfico de Gantt</h2>
      <div className="flex space-x-2">
        {processes.map((p, i) => (
          <div key={i} className="bg-blue-500 text-white p-2">
            P{p.id}
          </div>
          
        ))}
      </div>

      <div className="flex space-x-2">
        {history.map((queue, i) => (
          <div key={i} className="flex space-x-2">
            {queue.map((p) => (
              <div key={p.id} className="bg-blue-500 text-white p-2">
                P{p.id}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}
