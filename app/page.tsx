import { redirect } from "next/navigation"

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24">
      <h1 className="text-4xl font-bold mb-4">SoL2LBot</h1>
      <p className="text-xl mb-8">Self-regulated Learning Bot</p>
      <div className="grid gap-4">
        <a href="/intro" className="px-6 py-2.5 rounded-lg text-white font-medium hover:opacity-90 transition-opacity text-center" style={{ background: "linear-gradient(135deg, #b8892e, #96722d)" }}>
          Get Started
        </a>
        <a href="/api/minimal" className="px-6 py-2.5 rounded-lg border font-medium hover:opacity-80 transition-opacity text-center text-foreground" style={{ borderColor: "hsl(var(--border))" }}>
          Check API Status
        </a>
      </div>
    </main>
  );
}

