// Post-Task Assessment Questions (After Chatbot)
// These open-ended questions are designed to assess learning across all phases
// Used to compare chatbot group vs. sample answer group

import type { PostTaskQuestion } from "@/components/post-task-assessment"

// Comprehensive post-task questions covering all phases
export const comprehensivePostTaskQuestions: PostTaskQuestion[] = [
  // Phase 1 & 2: Task Analysis & SRL
  {
    id: 'q1_task_analysis',
    category: 'application',
    question: "Think about a specific learning objective from one of your current courses. Describe: (1) the topic it addresses, (2) the level of understanding you will need to achieve (knowledge, comprehension, application, or analysis), and (3) why this level matters for how you'll study.",
    hint: "Consider the verb in the learning objective (e.g., 'recite' suggests knowledge level, 'analyze' suggests analysis level).",
    placeholder: "Example: The learning objective 'Explain how photosynthesis works' addresses the topic of...",
    required: true
  },
  {
    id: 'q2_resources',
    category: 'application',
    question: "List 3-4 specific resources available to you for your target course (e.g., textbook chapters, lecture slides, practice problems, online tutorials). For each resource, explain briefly how you would use it to support your learning.",
    hint: "Think about both digital resources (course website, videos) and offline resources (textbook, notes).",
    placeholder: "Resource 1: [Name] - I would use this to...",
    required: true
  },
  
  // Phase 3: Learning Strategies
  {
    id: 'q3_self_testing',
    category: 'application',
    question: "Describe one specific way you plan to use self-testing (retrieval practice) to study for your target course this semester. Be specific about what you'll test yourself on and when.",
    hint: "Self-testing means actively recalling information, not just rereading. Think about creating questions, using flashcards, or redoing practice problems.",
    placeholder: "I will self-test by...",
    required: true
  },
  {
    id: 'q4_spacing',
    category: 'application',
    question: "Describe how you can combine self-testing and spacing strategies. Give a concrete example using content from your target course.",
    hint: "Spacing means spreading your practice over time. How can you space out your self-testing?",
    placeholder: "I will combine them by...",
    required: true
  },
  {
    id: 'q5_self_explanation',
    category: 'application',
    question: "Explain one way you could use self-explanation to understand a difficult concept in your target course. Describe the specific steps you would take.",
    hint: "Self-explanation means explaining concepts to yourself in your own words, then checking against the source material.",
    placeholder: "For the concept of [X], I would...",
    required: true
  },
  
  // Phase 4: Goal Setting & MCII
  {
    id: 'q6_goal_setting',
    category: 'synthesis',
    question: "Based on what you've learned about goal setting, describe one specific, near-term learning goal for your target course. Explain why it meets the criteria for a good goal (specific, achievable, relevant, time-bound).",
    hint: "A good goal should be something you can accomplish in the next few weeks, not the entire semester.",
    placeholder: "My goal is to... This is a good goal because...",
    required: true
  },
  {
    id: 'q7_mcii',
    category: 'synthesis',
    question: "Think about a learning goal you want to achieve. Describe: (1) what it would feel like to achieve this goal (indulge), (2) one main obstacle that might prevent you from achieving it, and (3) an if-then plan (implementation intention) to overcome that obstacle.",
    hint: "An if-then plan has the format: 'If [obstacle/situation], then I will [specific action].'",
    placeholder: "If I achieve this goal, I would feel... The main obstacle is... If [obstacle], then I will...",
    required: true
  },
  
  // Phase 5: Monitoring
  {
    id: 'q8_monitoring',
    category: 'metacognition',
    question: "Describe a specific method you would use to monitor your progress toward a learning objective in your target course. Be sure to explain what evidence you will use to decide whether you are learning effectively.",
    hint: "Monitoring means checking your understanding, not just checking your grades. Think about self-testing, explaining concepts, or comparing your work to model answers.",
    placeholder: "I will monitor my progress by... The evidence I'll use is...",
    required: true
  },
  {
    id: 'q9_adaptation',
    category: 'reflection',
    question: "Think of a recent time when you realized you didn't understand something as well as you thought. What did you do, and what could you have done differently using the monitoring and adaptation strategies you've learned?",
    hint: "This is a reflection question - there's no right or wrong answer. Be honest about your experience.",
    placeholder: "A recent time was when... I did... I could have improved by...",
    required: true
  },
  
  // Synthesis & Integration
  {
    id: 'q10_integration',
    category: 'synthesis',
    question: "Now that you've completed all phases, describe how you would integrate the four stages of self-regulated learning (define task, set goals, execute plan, monitor) to approach a challenging assignment or exam in your target course.",
    hint: "Think about how these stages work together as a cycle, not just separate steps.",
    placeholder: "For a challenging assignment, I would first... then...",
    required: true
  },
  {
    id: 'q11_strategy_combination',
    category: 'synthesis',
    question: "Describe how you would combine at least two learning strategies (self-testing, spacing, self-explanation) to study for an upcoming exam in your target course. Be specific about your plan.",
    hint: "The best study plans combine multiple strategies. For example, you might space out your self-testing, or use self-explanation to understand concepts before self-testing.",
    placeholder: "I would combine [strategy 1] and [strategy 2] by...",
    required: true
  },
  
  // Metacognitive Reflection
  {
    id: 'q12_metacognition',
    category: 'metacognition',
    question: "Reflect on your learning process throughout this intervention. What did you learn about how you learn? What surprised you, and what will you do differently in your future studying?",
    hint: "This is about thinking about your thinking - metacognition. Consider what strategies felt most useful, what was challenging, and what insights you gained.",
    placeholder: "I learned that I... What surprised me was... In the future, I will...",
    required: true
  }
]

// Sample answers for control group (traditional sample answer condition)
export const sampleAnswers: { [questionId: string]: string } = {
  q1_task_analysis: `The learning objective "Analyze the relationship between supply and demand in market economics" addresses the topic of economic market forces. This requires an analysis level of understanding because the verb "analyze" asks me to break down the relationship, compare different scenarios, and understand how these concepts interact. This matters because I'll need to use analysis strategies like creating comparison charts, working through different market scenarios, and explaining cause-and-effect relationships, rather than just memorizing definitions.`,
  
  q2_resources: `1. Course textbook (Chapters 5-7) - I would use this to read the core concepts, then create self-test questions from the key points.\n2. Lecture slides - I would review these after class, then try to explain the main ideas in my own words (self-explanation).\n3. Practice problem sets - I would use these for self-testing, spacing them out over several days before the exam.\n4. Online video tutorials - I would watch these when I'm struggling with a concept, then pause to explain what I learned.`,
  
  q3_self_testing: `I will use self-testing by creating flashcards for key definitions and concepts from my biology course. After reading each chapter, I'll write questions on one side of the card and answers on the other. Then, I'll test myself on these cards 2-3 times per week, spacing out the practice. I'll focus on chapters 8-10 which cover cellular processes, and I'll start testing myself this week, then again in 3 days, then a week later before the exam.`,
  
  q4_spacing: `I will combine self-testing and spacing by creating a study schedule where I self-test on the same material multiple times with increasing gaps. For example, after learning about photosynthesis in my biology course, I'll self-test on it that day, then again 3 days later, then a week later, and once more before the exam. Each time I self-test, I'll actively recall the process, check my understanding, and identify gaps. This spaced retrieval practice will help me remember the information much longer than if I just tested myself once right before the exam.`,
  
  q5_self_explanation: `For the difficult concept of cellular respiration, I would use self-explanation by: (1) First reading the textbook section on cellular respiration to get a general understanding, (2) Closing the book and explaining the process in my own words - how glucose is broken down, where ATP is produced, and why this matters for the cell, (3) Opening the book again and comparing my explanation to the text, highlighting any gaps or misunderstandings, (4) Restudying the parts I missed, then trying to explain again. This helps me identify what I truly understand versus what I'm just familiar with.`,
  
  q6_goal_setting: `My specific, near-term learning goal is: "By the end of next week, I will be able to explain the process of photosynthesis in my own words and correctly answer 8 out of 10 practice questions about it." This is a good goal because: (1) It's specific - I know exactly what I need to do, (2) It's achievable - one week is realistic, (3) It's relevant - this is important for my upcoming exam, and (4) It's time-bound - I have a clear deadline.`,
  
  q7_mcii: `Goal: Master the concept of statistical hypothesis testing for my data science course.\n\n(1) Indulge: If I achieve this goal, I would feel confident going into the exam, understand how to apply hypothesis testing to real data problems, and be able to help my classmates who are struggling with this topic.\n\n(2) Obstacle: The main obstacle is that I often get distracted by my phone when studying, which breaks my focus and makes it hard to understand complex concepts.\n\n(3) If-then plan: If I notice myself reaching for my phone while studying hypothesis testing, then I will put my phone in another room and set a timer for 25 minutes of focused study, after which I can take a 5-minute break.`,
  
  q8_monitoring: `I will monitor my progress toward understanding hypothesis testing by: (1) After each study session, I'll try to explain the concept to myself without looking at my notes, (2) I'll create practice problems and attempt to solve them, comparing my answers to the solutions, (3) I'll rate my confidence on a scale of 1-5 for each key component (null hypothesis, p-values, significance levels). The evidence I'll use: If I can explain it clearly and solve practice problems correctly, I'm making progress. If I struggle or can't explain certain parts, I know I need to restudy those areas.`,
  
  q9_adaptation: `A recent time was when I thought I understood the concept of derivatives in calculus, but when I tried to solve problems on my own, I realized I couldn't apply the rules correctly. What I did: I just kept rereading the textbook, hoping it would click. What I could have done differently: I should have used self-explanation to identify exactly where my understanding broke down, then self-tested on those specific gaps. I also should have monitored my understanding earlier by trying to explain the concept or solve problems, rather than waiting until I was stuck.`,
  
  q10_integration: `For a challenging assignment on analyzing market trends, I would integrate the four stages: (1) Define the task - I'd identify the specific learning objectives, determine what level of understanding is needed (analysis level), and list available resources, (2) Set goals - I'd create specific, near-term goals like "By Tuesday, I'll understand how to interpret trend data," (3) Execute the plan - I'd use self-explanation to understand the concepts, then self-test on practice problems, spacing my practice over several days, (4) Monitor - I'd regularly check if I can explain the concepts and solve problems, adapting my strategy if something isn't working. This creates a cycle where I'm constantly refining my approach.`,
  
  q11_strategy_combination: `I would combine self-testing and spacing to study for my chemistry exam: (1) After each chapter, I'll create self-test questions covering key concepts, (2) I'll test myself on Chapter 5 material today, then again in 3 days, then a week later, (3) For Chapter 6, I'll start self-testing tomorrow, then space it out similarly, (4) I'll also use self-explanation when I get questions wrong - I'll explain why my answer was incorrect and what the correct reasoning is. This way, I'm actively retrieving information (self-testing), spacing it out over time, and deepening my understanding through explanation.`,
  
  q12_metacognition: `I learned that I often overestimate how well I understand material just from rereading. What surprised me was how much more effective self-testing is compared to passive review - I thought rereading was helping, but I was just becoming familiar with the text without truly understanding it. I also learned that spacing out my practice feels harder in the moment but leads to much better long-term retention. In the future, I will: (1) Always self-test after studying, not just reread, (2) Space out my practice sessions instead of cramming, (3) Use self-explanation to identify gaps in my understanding, and (4) Monitor my progress regularly by checking if I can actually explain and apply concepts, not just recognize them.`
}

// Instruction guides for different phases
export const phaseInstructions = {
  phase2: {
    title: "How to Complete Task Analysis",
    instructions: [
      "Review your course syllabus and identify learning objectives for upcoming topics",
      "For each objective, determine the cognitive level required (knowledge, comprehension, application, or analysis)",
      "Identify specific resources available to you (textbook, lecture notes, practice problems, etc.)",
      "Consider how your prior knowledge relates to the new material",
      "Think about which resources will be most helpful for each type of learning objective"
    ],
    tips: [
      "The verb in the learning objective tells you the cognitive level (e.g., 'define' = knowledge, 'analyze' = analysis)",
      "Different cognitive levels require different study strategies",
      "Be specific about resources - not just 'textbook' but 'Chapter 5, sections 3-4 on cellular respiration'",
      "Consider both digital and offline resources"
    ],
    examples: [
      {
        title: "Example: Knowledge Level Objective",
        content: "Learning objective: 'Recite the definition of photosynthesis.' This is knowledge level. I would use flashcards and spaced repetition to memorize the definition."
      },
      {
        title: "Example: Analysis Level Objective",
        content: "Learning objective: 'Analyze the relationship between supply and demand.' This is analysis level. I would create comparison charts and work through different scenarios to understand the relationship."
      }
    ]
  },
  phase3: {
    title: "How to Use Learning Strategies Effectively",
    instructions: [
      "Self-testing: Actively recall information without looking at your notes",
      "Spacing: Spread your practice sessions over time with increasing intervals",
      "Self-explanation: Explain concepts in your own words, then check against the source",
      "Combine strategies: Use self-testing with spacing, or self-explanation before self-testing",
      "Monitor your understanding: If you can't explain it or recall it, you need more practice"
    ],
    tips: [
      "Self-testing feels harder than rereading, but it's much more effective for long-term learning",
      "Spacing works best with increasing intervals: review today, then in 3 days, then in a week",
      "Self-explanation helps you identify gaps - if you can't explain it, you don't really understand it",
      "Don't just recognize information - actively generate it from memory",
      "It's normal to struggle during self-testing - that struggle strengthens your memory"
    ],
    examples: [
      {
        title: "Self-Testing Example",
        content: "After reading about cellular respiration, close your book and write down everything you remember about how ATP is produced. Then check your notes to see what you missed."
      },
      {
        title: "Spacing Example",
        content: "Study Chapter 5 today, then test yourself on it in 3 days, then again in a week. This spaced practice creates stronger memories than studying it all in one day."
      },
      {
        title: "Self-Explanation Example",
        content: "After reading about photosynthesis, pause and explain to yourself: 'So plants use sunlight to convert CO2 and water into glucose, and this happens in the chloroplasts because...' Then check if your explanation matches the textbook."
      }
    ]
  },
  phase4: {
    title: "How to Set Effective Goals and Create Implementation Plans",
    instructions: [
      "Pick a specific, challenging yet achievable goal related to your course",
      "Indulge: Imagine vividly what it would feel like to achieve this goal",
      "Consider obstacles: Think about what might prevent you from achieving the goal",
      "Create if-then plans: For each obstacle, create a specific 'If [situation], then I will [action]' plan",
      "Keep implementation intentions specific and focused - don't try to address too many obstacles at once"
    ],
    tips: [
      "Good goals are specific, achievable, relevant, and time-bound (near-term)",
      "Mental contrasting works best when you indulge first, then consider obstacles",
      "If-then plans work because they link specific situations to specific actions",
      "Focus on 1-2 main obstacles rather than trying to plan for everything",
      "Practice your if-then plan mentally a few times to strengthen the connection"
    ],
    examples: [
      {
        title: "Goal Example",
        content: "Good goal: 'By next Friday, I will complete all practice problems for Chapter 6 and score at least 80% on a self-test.' This is specific, achievable, relevant, and time-bound."
      },
      {
        title: "If-Then Plan Example",
        content: "Obstacle: I often get distracted by social media. If-then plan: 'If I feel the urge to check my phone while studying, then I will put my phone in another room and set a 25-minute timer for focused study.'"
      }
    ]
  },
  phase5: {
    title: "How to Monitor Your Learning Effectively",
    instructions: [
      "Regularly check your understanding, not just at the end",
      "Use self-testing to see if you can recall information",
      "Try explaining concepts to yourself or others",
      "Compare your work to model answers or solutions",
      "Identify gaps and adjust your strategy accordingly"
    ],
    tips: [
      "Monitoring means checking during learning, not just after",
      "If you can't explain it, you don't really understand it yet",
      "Use learning objectives as a checklist - can you meet each one?",
      "It's okay to realize you don't understand something - that's valuable information",
      "Adapt your strategy based on what monitoring tells you"
    ],
    examples: [
      {
        title: "Monitoring Method Example",
        content: "After studying a chapter, try to explain the main concepts without looking at your notes. If you can explain them clearly, you're making progress. If you struggle, you need to restudy."
      },
      {
        title: "Adaptation Example",
        content: "If you find that rereading isn't helping you understand a concept, switch to self-explanation: explain it in your own words, identify gaps, then restudy those specific areas."
      }
    ]
  }
}
