// Post-Task Assessment Questions (After Chatbot)
// These open-ended questions are designed to assess learning across all phases
// Used to compare chatbot group vs. sample answer group

import type { PostTaskQuestion } from "@/components/post-task-assessment"

// Comprehensive post-task questions covering all phases
// These questions test TRANSFER LEARNING - applying SRL skills to new contexts
// They are RELATED to chatbot content but NOT REPETITIVE
export const comprehensivePostTaskQuestions: PostTaskQuestion[] = [
  // Phase 2: Task Analysis Transfer & Synthesis
  {
    id: 'q1_task_analysis_transfer',
    category: 'application',
    question: "Imagine you're starting a NEW course next semester that you know nothing about yet. Describe how you would analyze the learning objectives for that course BEFORE you see the syllabus. What questions would you ask yourself? What information would you need to gather? How would you determine what level of understanding you'll need?",
    hint: "Think about how you would apply task analysis skills to an unfamiliar situation. What steps would you take?",
    placeholder: "For a new course, I would start by... I would ask myself...",
    required: true
  },
  {
    id: 'q2_synthesis_cognitive_strategies',
    category: 'synthesis',
    question: "You've learned about cognitive levels (knowledge, comprehension, application, analysis) and learning strategies (self-testing, self-explanation, spacing). Explain how knowing the cognitive level of a learning objective would help you choose which learning strategies to use. Give a specific example.",
    hint: "Different cognitive levels might require different strategies. For example, knowledge-level objectives might benefit more from self-testing, while analysis-level objectives might need self-explanation.",
    placeholder: "If a learning objective requires [cognitive level], I would use [strategy] because...",
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
  
  // Phase 4: MCII Transfer & Reflection
  {
    id: 'q6_mcii_transfer',
    category: 'application',
    question: "You created an MCII plan for a course-related learning goal. Now think about a DIFFERENT type of goal (e.g., fitness, hobby, personal development, social skill). How would you adapt the MCII process (mental contrasting + implementation intentions) for this different type of goal? What would stay the same? What might change?",
    hint: "MCII principles can apply to many types of goals, but the obstacles and if-then plans might be different. Think about how you'd adapt the process.",
    placeholder: "For a [different goal type], I would... The MCII process would be similar in... but different in...",
    required: true
  },
  {
    id: 'q7_mcii_reflection',
    category: 'metacognition',
    question: "Reflect on the MCII process you just completed. What was the most challenging part for you? Why do you think mental contrasting (visualizing success AND considering obstacles) might be more effective than just visualizing success? What did you learn about yourself through this process?",
    hint: "This is about understanding WHY MCII works, not just how to do it. Think about the psychology behind mental contrasting.",
    placeholder: "The most challenging part was... Mental contrasting might be more effective because... I learned that I...",
    required: true
  },
  
  // Phase 5: Monitoring Integration & Adaptation
  {
    id: 'q8_monitoring_integration',
    category: 'synthesis',
    question: "You've now completed task analysis (Phase 2), goal setting with MCII (Phase 4), and monitoring (Phase 5). Describe how these three phases work together as a cycle. Give a concrete example of how you might cycle through all three phases when working on a challenging project or exam preparation.",
    hint: "SRL is not linear - you might go back and revise your task analysis, adjust your goals, or change your monitoring methods based on what you learn.",
    placeholder: "These phases work together by... For example, when working on [project], I would first... then... and if...",
    required: true
  },
  {
    id: 'q9_adaptation_transfer',
    category: 'application',
    question: "Think about a time when your initial study plan didn't work as expected. Using what you've learned about monitoring and adaptation, describe: (1) What signals would have told you EARLIER that the plan wasn't working? (2) How would you have adapted your strategy? (3) What would you do differently next time to catch problems sooner?",
    hint: "This tests whether you can apply monitoring principles to real situations, not just create a plan.",
    placeholder: "A time when my plan didn't work was... Earlier signals would have been... I would adapt by...",
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
// These answers demonstrate understanding without chatbot practice
export const sampleAnswers: { [questionId: string]: string } = {
  q1_task_analysis_transfer: `For a new course I know nothing about, I would start by researching the course name and department to understand the general subject area. I would ask myself: "What is this course typically about? What prerequisites does it assume? What skills or knowledge would I need?" I would look for course descriptions online, check if there are similar courses, and maybe ask students who've taken it. To determine the level of understanding needed, I would look for clues in the course description - words like "analyze," "create," or "evaluate" suggest higher cognitive levels, while "identify" or "define" suggest knowledge level. I would also consider the course level (introductory vs. advanced) and the department's typical expectations.`,
  
  q2_synthesis_cognitive_strategies: `Knowing the cognitive level helps me choose strategies because different levels require different types of thinking. For example, if a learning objective requires knowledge level (like "define photosynthesis"), I would use self-testing with flashcards to memorize the definition. But if it requires analysis level (like "analyze the factors affecting photosynthesis"), I would use self-explanation to break down the concept into parts and understand relationships. Application-level objectives might benefit from both self-testing (to practice applying concepts) and self-explanation (to understand when and why to apply them). The cognitive level tells me whether I need to memorize, understand, apply, or analyze, which guides my strategy choice.`,
  
  q3_self_testing: `I will use self-testing by creating flashcards for key definitions and concepts from my biology course. After reading each chapter, I'll write questions on one side of the card and answers on the other. Then, I'll test myself on these cards 2-3 times per week, spacing out the practice. I'll focus on chapters 8-10 which cover cellular processes, and I'll start testing myself this week, then again in 3 days, then a week later before the exam.`,
  
  q4_spacing: `I will combine self-testing and spacing by creating a study schedule where I self-test on the same material multiple times with increasing gaps. For example, after learning about photosynthesis in my biology course, I'll self-test on it that day, then again 3 days later, then a week later, and once more before the exam. Each time I self-test, I'll actively recall the process, check my understanding, and identify gaps. This spaced retrieval practice will help me remember the information much longer than if I just tested myself once right before the exam.`,
  
  q5_self_explanation: `For the difficult concept of cellular respiration, I would use self-explanation by: (1) First reading the textbook section on cellular respiration to get a general understanding, (2) Closing the book and explaining the process in my own words - how glucose is broken down, where ATP is produced, and why this matters for the cell, (3) Opening the book again and comparing my explanation to the text, highlighting any gaps or misunderstandings, (4) Restudying the parts I missed, then trying to explain again. This helps me identify what I truly understand versus what I'm just familiar with.`,
  
  q6_mcii_transfer: `For a fitness goal like "run a 5K in under 25 minutes," I would adapt MCII like this: (1) Mental contrasting - I would visualize crossing the finish line feeling strong and accomplished, but also consider obstacles like lack of time, bad weather, or motivation dips. (2) Implementation intention - If I feel too tired to run after work, then I will change into running clothes immediately when I get home and commit to at least 10 minutes, knowing I can stop if I'm truly exhausted. What stays the same: The process of visualizing success, identifying obstacles, and creating if-then plans. What changes: The obstacles are different (time/weather vs. academic challenges), and the if-then plans address different situations (physical vs. cognitive). The core MCII structure works the same way.`,
  
  q7_mcii_reflection: `The most challenging part was honestly considering obstacles - it's easier to just imagine success. But I think mental contrasting is more effective because: (1) It prepares you for reality - if you only visualize success, you're surprised when obstacles arise. (2) It creates stronger motivation - when you contrast success with obstacles, you feel more committed to overcoming them. (3) It helps you plan - by thinking about obstacles ahead of time, you can create if-then plans. I learned that I tend to avoid thinking about potential problems, but facing them head-on actually makes me feel more prepared and motivated.`,
  
  q8_monitoring_integration: `These three phases work together as a cycle: (1) Task analysis helps me understand what I need to learn and at what level, (2) MCII helps me set specific goals and plan for obstacles, (3) Monitoring tells me if my plan is working. For example, when preparing for a challenging exam: First, I'd analyze the learning objectives to understand what's required (task analysis). Then, I'd set a goal like "master chapters 5-7 by next Friday" and create an MCII plan for obstacles like procrastination (goal setting). As I study, I'd monitor by self-testing - if I'm not meeting my practice quiz targets, that's a signal. This might lead me back to task analysis - maybe I misunderstood what level of understanding was needed. Or back to goal setting - maybe my goal was too ambitious. The cycle continues as I adapt.`,
  
  q9_adaptation_transfer: `A time when my plan didn't work was when I tried to study for a chemistry exam by just rereading chapters. Earlier signals would have been: (1) I couldn't explain concepts without looking at my notes, (2) I kept putting off practice problems, (3) I felt anxious but kept telling myself I was "studying." I would adapt by: Switching to active strategies - self-testing on key concepts, then using self-explanation when I got questions wrong. I would also break down the material into smaller chunks and set mini-goals. Next time, I would catch problems sooner by: (1) Testing my understanding after each chapter (not waiting until the end), (2) Paying attention to avoidance behaviors (like putting off practice problems), (3) Using objective measures (can I explain it? can I solve problems?) rather than just feelings.`,
  
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
