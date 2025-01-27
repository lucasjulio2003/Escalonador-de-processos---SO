export default function ExecutionLog({ logs }: { logs: string[] }) {
    return (
      <div className="p-4 border rounded bg-gray-700 text-white my-4">
        <h2 className="text-xl">Log de Execução</h2>
        <ul>
          {logs.map((log, i) => (
            <li key={i}>{log}</li>
          ))}
        </ul>
      </div>
    );
  }
  