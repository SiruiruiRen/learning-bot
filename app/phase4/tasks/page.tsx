"use client"

import { useState, useEffect } from "react"
import { motion } from "framer-motion"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Target, ListTodo, ShieldCheck, ArrowRight, CheckCircle } from "lucide-react"
import { Button } from "@/components/ui/button" 
import ModuleBar from "@/components/module-bar"

export default function Phase4TasksPage() {
  const router = useRouter()
  const [completedTasks, setCompletedTasks] = useState<string[]>([]);

  useEffect(() => {
    // On component mount, load completed tasks from localStorage
    const savedProgress = localStorage.getItem("solbot_phase4_completed_tasks");
    if (savedProgress) {
      setCompletedTasks(JSON.parse(savedProgress));
    }
  }, []);

  const tasks = [
    { id: 'mcii', title: 'MCII: Mental Contrasting with Implementation Intentions', description: 'Complete the integrated MCII exercise: Pick a goal, visualize success, identify obstacles, and create implementation intentions.', icon: Target, href: '/phase4/mcii' },
  ];

  const getNextTask = () => {
    return tasks.find(task => !completedTasks.includes(task.id));
  };

  const nextTask = getNextTask();

  const allTasksCompleted = completedTasks.length === tasks.length;

  const accent = "var(--accent-text)"
  const canvasGradient = "linear-gradient(180deg, hsl(var(--background)) 0%, hsl(var(--muted) / 0.85) 100%)"
  const neutralSurface = "hsl(var(--card) / 0.78)"
  const neutralBorder = "hsl(var(--border) / 0.75)"

  return (
    <div
      className="min-h-screen text-foreground py-8"
      style={{ background: canvasGradient }}
    >
      <div className="fixed inset-0 overflow-hidden pointer-events-none -z-10">
        <div className="absolute inset-0 bg-[radial-gradient(120%_120%_at_20%_10%,rgba(216,178,111,0.08),transparent),radial-gradient(140%_120%_at_80%_20%,rgba(0,0,0,0.04),transparent),radial-gradient(160%_140%_at_50%_80%,rgba(216,178,111,0.05),transparent)]"></div>
      </div>
      <div className="container mx-auto px-4">
        <ModuleBar currentPhase={4} />
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto mt-16 text-center"
        >
          <h2 className="text-3xl font-bold" style={{ color: accent }}>Phase 4: Strategic Learning Plan</h2>
          <p className="mt-4 text-lg text-muted-foreground">
            Complete the MCII (Mental Contrasting with Implementation Intentions) exercise to build your strategic learning plan.
          </p>

          <div className="mt-8 space-y-4 text-left">
            {tasks.map((task, index) => {
              const isCompleted = completedTasks.includes(task.id);
              const isNext = nextTask?.id === task.id;
              const isLocked = !isCompleted && !isNext;

              return (
                <Card key={task.id} className={`backdrop-blur-md border transition-all ${isLocked ? 'opacity-50' : ''}`} style={{ borderColor: neutralBorder, backgroundColor: neutralSurface }}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <task.icon className="w-8 h-8" style={{ color: isCompleted ? '#86efac' : accent }} />
                      <div>
                        <h3 className="font-semibold" style={{ color: isCompleted ? undefined : accent }}>{task.title}</h3>
                        <p className="text-sm text-muted-foreground">{task.description}</p>
                      </div>
                    </div>
                    {isCompleted ? (
                      <div className="text-green-500 flex items-center gap-2">
                        <CheckCircle size={20} />
                        <span>Completed</span>
                      </div>
                    ) : isNext ? (
                      <Button onClick={() => router.push(task.href)} className="shadow-md" style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}>
                        Start MCII Exercise
                        <ArrowRight className="w-4 h-4 ml-2" />
                      </Button>
                    ) : null}
                  </CardContent>
                </Card>
              );
            })}
          </div>
            
          {allTasksCompleted && (
             <div className="mt-8">
                <Button onClick={() => router.push('/phase5')} className="text-lg px-8 py-6 shadow-md" style={{ background: "linear-gradient(135deg, #b8892e, #96722d)", color: "#fff" }}>
                    Proceed to Phase 5
                    <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
             </div>
          )}

        </motion.div>
      </div>
    </div>
  );
}

