import { Process } from "../lib/types";

export default function GanttChart({ processes }: { processes: Process[] }) {
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
    </div>
  );
}
