// Knowledge Check Questions based on original intervention design
// These questions are clearer, more scenario-based, and better aligned with research

export interface KnowledgeCheckQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: string
  explanation: string
  feedbackForWrongAnswers?: { [key: string]: string } // Specific feedback for each wrong answer
  questionType: 'definition' | 'scenario'
}

export interface KnowledgeCheckSet {
  phase: string
  topic: string
  preTest: KnowledgeCheckQuestion[] // 2 questions: 1 definition + 1 scenario
  postTest: KnowledgeCheckQuestion[] // 2-3 questions after video
}

// Phase 2: Task Analysis (SRL - Define Task)
export const phase2KnowledgeChecks: KnowledgeCheckSet = {
  phase: 'phase2',
  topic: 'Self-Regulated Learning: Define the Task',
  preTest: [
    {
      id: 1,
      questionType: 'definition',
      question: "What is self-regulated learning?",
      options: [
        "It is when students regulate their peer's learning and monitor their performance to give them tips of improvement",
        "It is when students take charge of their learning and monitor their progress throughout the learning process",
        "It is when students ask their teacher how they learn best and copy that learning strategy",
        "It is when students plan how to learn a lot of information two days before a test"
      ],
      correctAnswer: "It is when students take charge of their learning and monitor their progress throughout the learning process",
      explanation: "Self-regulated learning means you actively take control of your own learning process, set goals, choose strategies, and monitor your progress to adjust as needed.",
      feedbackForWrongAnswers: {
        "It is when students regulate their peer's learning and monitor their performance to give them tips of improvement": "Self-regulated learning is about managing YOUR OWN learning, not others' learning.",
        "It is when students ask their teacher how they learn best and copy that learning strategy": "While learning from teachers is valuable, self-regulated learning is about developing your own strategies and monitoring your own progress.",
        "It is when students plan how to learn a lot of information two days before a test": "Self-regulated learning involves ongoing planning and monitoring throughout the learning process, not just cramming before a test."
      }
    },
    {
      id: 2,
      questionType: 'scenario',
      question: "The first stage in self-regulated learning is defining a task. Which student effectively completes the first stage?",
      options: [
        "Alice consults the course schedule and assigns blocks on her own calendar to complete all the assigned readings. During those times, she pays close attention to the key vocabulary words highlighted in the text.",
        "Barry develops a system that he applies when he completes each assigned reading: he color codes all his material while studying and assigns a color to each concept definition",
        "Cora seeks out the syllabus to review the course objectives her instructor lists, and the assigned content for the upcoming lessons in the unit. She then reads the learning objectives that precedes the textbook sections she is to read, and commits them to memory.",
        "Dana considers what she will need to learn in order to succeed in the course and begins by consulting the learning objectives in the syllabus and those listed at the beginning of each assigned lesson or reading. She first considers the topic to be covered, then considers the level of understanding she will need to demonstrate, when tested on it on course exams."
      ],
      correctAnswer: "Dana considers what she will need to learn in order to succeed in the course and begins by consulting the learning objectives in the syllabus and those listed at the beginning of each assigned lesson or reading. She first considers the topic to be covered, then considers the level of understanding she will need to demonstrate, when tested on it on course exams.",
      explanation: "Dana's approach is best because she not only identifies the topics but also considers the LEVEL of understanding required (knowledge, comprehension, application, etc.). This helps her understand what the instructor expects and how deeply she needs to learn the material.",
      feedbackForWrongAnswers: {
        "Alice consults the course schedule and assigns blocks on her own calendar to complete all the assigned readings. During those times, she pays close attention to the key vocabulary words highlighted in the text.": "Alice is organized but doesn't consider the instructor's objectives or the level of understanding required. She might focus on the wrong things.",
        "Barry develops a system that he applies when he completes each assigned reading: he color codes all his material while studying and assigns a color to each concept definition": "Barry has a good system but doesn't start by understanding what the instructor expects or what level of understanding is needed.",
        "Cora seeks out the syllabus to review the course objectives her instructor lists, and the assigned content for the upcoming lessons in the unit. She then reads the learning objectives that precedes the textbook sections she is to read, and commits them to memory.": "Cora gets off to a great start by reading learning objectives, but she needs to go further and analyze which objectives require factual knowledge versus deeper conceptual understanding."
      }
    }
  ],
  postTest: [
    {
      id: 3,
      questionType: 'definition',
      question: "List all stages of the four-stage model of self-regulated learning.",
      options: [
        "Stage 1: Define the task | Stage 2: Set goals and develop a plan | Stage 3: Execute the plan | Stage 4: Monitor your learning (and adapt if needed)",
        "Stage 1: Study hard | Stage 2: Take notes | Stage 3: Review | Stage 4: Take exam",
        "Stage 1: Read textbook | Stage 2: Do homework | Stage 3: Study | Stage 4: Test",
        "Stage 1: Plan | Stage 2: Act | Stage 3: Review | Stage 4: Repeat"
      ],
      correctAnswer: "Stage 1: Define the task | Stage 2: Set goals and develop a plan | Stage 3: Execute the plan | Stage 4: Monitor your learning (and adapt if needed)",
      explanation: "The four stages are: (1) Define the task - understand what you need to learn and at what level, (2) Set goals and develop a plan - create specific, achievable goals and strategies, (3) Execute the plan - actually study using your chosen strategies, (4) Monitor your learning - check your understanding and adapt your approach if needed."
    },
    {
      id: 4,
      questionType: 'scenario',
      question: "Consider the following learning objective: 'Recite the limit definition of derivative.' What level of understanding does this learning objective suggest you would need to achieve?",
      options: [
        "Knowledge level - you need to memorize and recall the definition",
        "Comprehension level - you need to understand what it means",
        "Application level - you need to apply it to solve problems",
        "Analysis level - you need to break it down into parts"
      ],
      correctAnswer: "Knowledge level - you need to memorize and recall the definition",
      explanation: "The verb 'recite' indicates this is a knowledge-level objective. You need to memorize and be able to recall the definition, not necessarily understand it deeply or apply it to problems.",
      feedbackForWrongAnswers: {
        "Comprehension level - you need to understand what it means": "While understanding is helpful, the verb 'recite' specifically asks for recall, which is knowledge level.",
        "Application level - you need to apply it to solve problems": "If the objective asked you to 'apply' or 'solve problems using' the definition, then it would be application level.",
        "Analysis level - you need to break it down into parts": "Analysis would require verbs like 'analyze', 'compare', or 'break down'."
      }
    }
  ]
}

// Phase 3: Learning Strategies (Self-testing, Spacing, Self-explanation)
export const phase3KnowledgeChecks: KnowledgeCheckSet = {
  phase: 'phase3',
  topic: 'Learning Strategies: Self-testing, Spacing, and Self-explanation',
  preTest: [
    {
      id: 1,
      questionType: 'definition',
      question: "Self-testing is a useful learning strategy for what reason? (Select all that apply)",
      options: [
        "It helps emphasize retrieval practice and bring back information you already know",
        "It helps students remember key information for a longer period of time",
        "It helps with future learning",
        "It helps with setting goals"
      ],
      correctAnswer: "It helps emphasize retrieval practice and bring back information you already know", // For single-select, we'll use the first benefit
      explanation: "Self-testing helps in multiple ways: (1) It emphasizes retrieval practice - actively recalling information strengthens memory, (2) It helps you remember information longer - retrieval practice creates stronger long-term memories, (3) It helps with future learning - identifying gaps helps you focus your studying. Self-testing is not primarily about goal-setting.",
      feedbackForWrongAnswers: {
        "It helps with setting goals": "Self-testing is about practicing retrieval and identifying knowledge gaps, not about setting goals. Goal-setting is a separate skill."
      }
    },
    {
      id: 2,
      questionType: 'scenario',
      question: "You just began a unit of a course and have 4 weeks of topics to cover before the unit exam. For each new lesson, the guided reading questions and course outlines make clear that there are a number of facts, definitions, and properties that you'll need to be able to recall when the exam comes. Pick the best strategy, from those below, that will enable you to rehearse this knowledge and ensure you can recall it.",
      options: [
        "Block out the entire day before the exam. Redo all your homework questions to be sure you've rehearsed fully.",
        "Block out the entire day before the exam. Reread all the chapters to be sure you're on top of all the material.",
        "After reading each chapter in advance of the day it is covered, reread each chapter repeatedly in advance of the exam.",
        "After turning in a homework assignment by the deadline, set up reminders in your calendar to re-complete that homework again at least a few times before the exam."
      ],
      correctAnswer: "After turning in a homework assignment by the deadline, set up reminders in your calendar to re-complete that homework again at least a few times before the exam.",
      explanation: "This strategy combines retrieval practice (actively recalling by re-doing homework) with spacing (spreading practice over time). Research shows that spaced retrieval practice leads to much better long-term retention than cramming or passive rereading.",
      feedbackForWrongAnswers: {
        "Block out the entire day before the exam. Redo all your homework questions to be sure you've rehearsed fully.": "While redoing homework is good retrieval practice, doing it all in one day (massed practice) is less effective than spacing it out over time.",
        "Block out the entire day before the exam. Reread all the chapters to be sure you're on top of all the material.": "Rereading is a passive strategy that's less effective than active retrieval. Plus, cramming everything into one day doesn't take advantage of spacing.",
        "After reading each chapter in advance of the day it is covered, reread each chapter repeatedly in advance of the exam.": "This plan uses spacing well, but rereading is passive. Active retrieval practice (like re-doing problems) is much more effective than passive rereading."
      }
    }
  ],
  postTest: [
    {
      id: 3,
      questionType: 'definition',
      question: "Which learning strategy does research suggest is more effective in improving later performance?",
      options: [
        "Rereading learning materials",
        "Rehearsing the information by repeatedly testing whether you can recall it"
      ],
      correctAnswer: "Rehearsing the information by repeatedly testing whether you can recall it",
      explanation: "Research consistently shows that active retrieval practice (testing yourself) produces better long-term learning than passive rereading. While rereading might make you feel more familiar with the material in the short term, self-testing creates stronger, longer-lasting memories.",
      feedbackForWrongAnswers: {
        "Rereading learning materials": "Rereading can make you feel like you know the material better, but this is often an illusion. Active retrieval practice (self-testing) is much more effective for long-term learning."
      }
    },
    {
      id: 4,
      questionType: 'scenario',
      question: "Pick the study plan that makes best use of the spacing effect.",
      options: [
        "After each class period, Ana downloaded the class outline and looked it over, then she looked them all over right before the exam.",
        "Brad downloaded the course outlines dutifully, and reviewed all that had been released every single night up until the exam.",
        "Cora set up a schedule where she would review the materials from a lesson that night, then again three days later, then a week later, then once more right before the exam.",
        "Deneshia downloaded the resources from the course site, and in the week before the exam, she reviewed them every other day."
      ],
      correctAnswer: "Cora set up a schedule where she would review the materials from a lesson that night, then again three days later, then a week later, then once more right before the exam.",
      explanation: "Cora's approach uses optimal spacing with increasing intervals (that night → 3 days → 1 week → before exam). Research shows that spacing with progressively longer delays is most effective for long-term retention.",
      feedbackForWrongAnswers: {
        "After each class period, Ana downloaded the class outline and looked it over, then she looked them all over right before the exam.": "Ana's plan doesn't space out the practice - she only reviews right after class and then right before the exam. There's no spaced retrieval in between.",
        "Brad downloaded the course outlines dutifully, and reviewed all that had been released every single night up until the exam.": "Brad is diligent, but reviewing everything every night means he's not spending enough time on each item, and he's not creating the gaps that make spaced practice effective.",
        "Deneshia downloaded the resources from the course site, and in the week before the exam, she reviewed them every other day.": "Deneshia uses spacing, but waiting until the week before the exam doesn't give enough time to master all the material. Starting earlier with spaced practice would be better."
      }
    },
    {
      id: 5,
      questionType: 'definition',
      question: "What is self-explanation?",
      options: [
        "It's when you work out a math problem in front of a classroom full of peers",
        "It's when you are trying to explain new information to yourself and make sense of the content",
        "It's when you repeatedly review tests you've already taken",
        "It's when you attend a peer-review session and they explain the concept to you"
      ],
      correctAnswer: "It's when you are trying to explain new information to yourself and make sense of the content",
      explanation: "Self-explanation involves actively making sense of new material by explaining it to yourself in your own words. This helps you integrate new information with what you already know, which deepens understanding significantly.",
      feedbackForWrongAnswers: {
        "It's when you work out a math problem in front of a classroom full of peers": "Working problems in front of peers can be helpful, but self-explanation is specifically about explaining to YOURSELF, not others.",
        "It's when you repeatedly review tests you've already taken": "Reviewing tests is good, but self-explanation is about actively generating explanations for new material, not just reviewing old work.",
        "It's when you attend a peer-review session and they explain the concept to you": "Self-explanation means YOU do the explaining, not someone else explaining to you. The 'self' part is key!"
      }
    }
  ]
}

// Helper function to check if pre-test allows video skip (2/2 correct)
export function canSkipVideo(preTestAnswers: { [questionId: number]: string }, questions: KnowledgeCheckQuestion[]): boolean {
  if (questions.length !== 2) return false
  return questions.every(q => preTestAnswers[q.id] === q.correctAnswer)
}
