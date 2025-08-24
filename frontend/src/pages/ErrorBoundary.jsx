export default function ErrorBoundary({ error }) {
    return (
      <div className="min-h-screen grid place-items-center bg-[#0B0F19] text-slate-200 p-6">
        <div className="max-w-lg">
          <h1 className="text-2xl font-semibold">Algo deu errado</h1>
          <pre className="mt-4 p-4 rounded-lg bg-[#111827] overflow-auto text-sm">
  {String(error?.message || error)}
          </pre>
        </div>
      </div>
    );
  }
  