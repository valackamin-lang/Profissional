'use client';

export default function Error({
  error: _error, // eslint-disable-line @typescript-eslint/no-unused-vars
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2 className="text-2xl font-bold mb-4">Algo deu errado!</h2>
      <button
        onClick={() => reset()}
        className="px-4 py-2 bg-primary-600 text-white rounded hover:bg-primary-700"
      >
        Tentar novamente
      </button>
    </div>
  );
}
