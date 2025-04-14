import { redirect } from "next/navigation"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">SoLBot</h1>
      <p className="text-xl mb-8">Self-regulated Learning Bot</p>
      <div className="grid gap-4">
        <a href="/intro" className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600">
          Get Started
        </a>
        <a href="/api/minimal" className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
          Check API Status
        </a>
      </div>
    </main>
  );
}

