/**
 * Static condition sample answers for each phase.
 * Used by StaticGuidedActivity to show pre-written model responses
 * instead of AI chatbot feedback.
 *
 * These mirror the exact questions from the Bot condition's guided components:
 * - Phase 2: GuidedLearningObjective (3 questions)
 * - Phase 4: GuidedMCII (4 questions)
 * - Phase 5: GuidedMonitoring (3 questions)
 */

export const PHASE2_STATIC_QUESTIONS = [
  {
    id: "goal_clarity",
    prompt: "For your chosen course/task: What are you learning right now? Describe the key topics, skills, and objectives involved.",
    placeholder: "Think about what topics you're covering right now in your course.",
    sampleAnswer:
      "I am currently learning Data Structures and Algorithms. The key topics include arrays, linked lists, stacks, queues, trees, graphs, and hash tables. I'm also learning important algorithmic techniques such as sorting, searching, dynamic programming, and greedy algorithms. The main objectives are to understand how to choose appropriate data structures for different problems, analyze time and space complexity using Big-O notation, and implement efficient solutions to computational problems.",
  },
  {
    id: "background_connection",
    prompt: "What learning materials and resources do you have access to?",
    placeholder: "What do you use when you study for this course?",
    sampleAnswer:
      "I have access to the course textbook (Introduction to Algorithms by Cormen et al.), lecture slides and recorded videos from my professor, weekly problem sets with solutions posted after the due date, a course discussion forum where TAs answer questions, and online resources like LeetCode and GeeksforGeeks for extra practice. I also have access to office hours twice a week and a study group with three classmates.",
  },
  {
    id: "study_resources",
    prompt: "How will you use these resources to maximize your learning?",
    placeholder: "How do you plan to use these materials?",
    sampleAnswer:
      "I plan to first review the lecture slides before each class to preview the material, then attend lectures and take active notes. After class, I will read the relevant textbook chapter and work through the examples. For each topic, I'll solve the assigned problem set independently before checking solutions, then do 3-5 additional practice problems on LeetCode focusing on that data structure. I will attend office hours when I'm stuck for more than 30 minutes on a problem. My study group meets weekly to review difficult concepts and explain solutions to each other, which helps reinforce my understanding.",
  },
]

export const PHASE4_STATIC_QUESTIONS = [
  {
    id: "pick_goal",
    prompt: "Pick a goal you would like to achieve. For the purposes of this module, please choose a goal related to the course containing this module. State the goal you selected below.",
    placeholder: "Pick something specific you want to achieve in this course.",
    sampleAnswer:
      "My goal is to achieve at least a B+ (87%) on the upcoming midterm exam in Data Structures and Algorithms. This exam covers the first six weeks of material including arrays, linked lists, stacks, queues, trees, and sorting algorithms. I want to demonstrate strong understanding of both the theoretical concepts and practical implementation.",
  },
  {
    id: "indulge",
    prompt: "Take a moment and consider how it would feel to achieve the goal – Why would achieving this goal be so satisfying? Imagine the relevant events and experiences as vividly as possible – really let your mind go! Elaborate in writing on what it would feel like to achieve the goal.",
    placeholder: "Let your imagination go — what would success feel like?",
    sampleAnswer:
      "Achieving a B+ on the midterm would feel incredibly satisfying. I imagine opening my grade portal and seeing that score — I would feel a wave of relief and pride. It would validate all the hours I've spent studying and practicing problems. I'd feel confident walking into the second half of the semester, knowing I have a solid foundation. My parents would be proud, and I'd feel more confident about my ability to pursue a career in software engineering. It would also motivate me to maintain this level of effort for the rest of the course. I can picture telling my study group about our collective success and celebrating together.",
  },
  {
    id: "consider_obstacles",
    prompt: "Sometimes things do not work out as well as we would have liked. Think about the obstacles that might prevent you from achieving your goal. What is the most challenging obstacle that stands in your way? What other obstacles might make it hard for you to achieve your goal? Consider your own thoughts and habits – what obstacles of your own creation might make it harder to achieve your goal? Spend some time reflecting on these obstacles. In the space provided, name the central obstacle. Think about it deeply and imagine the relevant events and experiences as vividly as possible, then elaborate in writing on what could prevent you from achieving your goal.",
    placeholder: "What personal habits or tendencies could get in your way?",
    sampleAnswer:
      "My central obstacle is procrastination — I tend to put off studying until the last few days before an exam, which leads to cramming and surface-level understanding. I often get distracted by social media when I sit down to study, spending 20-30 minutes scrolling before I even start. Another obstacle is that I sometimes avoid difficult problems instead of working through them, which means I don't build deep understanding of harder topics like tree traversals and dynamic programming. I also have a tendency to passively read solutions instead of actively attempting problems first, which gives me a false sense of understanding. Additionally, my part-time job takes up 15 hours per week, limiting my available study time.",
  },
  {
    id: "implementation_intention",
    prompt: 'Now please make an implementation intention that will help you to approach your goal. You may find it useful to think of the main obstacle that you identified and create an implementation intention that can help you overcome this obstacle in particular. To remind you, an implementation intention should have the following format: "If (I am in a situation X), then (I will do Y)." Please complete your implementation intention below.',
    placeholder: "Write a concrete 'If __, then I will __' plan.",
    sampleAnswer:
      'If I sit down to study and feel the urge to check my phone or social media, then I will put my phone in my backpack, set a 45-minute timer on my laptop, and work through at least two practice problems before taking any break. If I encounter a problem that I cannot solve after 20 minutes of genuine effort, then I will write down exactly where I got stuck and what I tried, then move to the next problem and bring my notes to office hours. If it is Sunday evening and I have not completed my weekly practice goal of 10 extra problems, then I will cancel non-essential plans and dedicate 2 hours to focused practice before bed.',
  },
]

export const PHASE5_STATIC_QUESTIONS = [
  {
    id: "progress_checks",
    prompt: "How will you check your progress to know if you're on track?",
    placeholder: "How will you know if your studying is actually working?",
    sampleAnswer:
      "I will check my progress in three ways: (1) After studying each topic, I will attempt 5 practice problems without looking at notes — if I can solve at least 4 correctly, I know I understand the material. (2) Every Sunday, I will review the week's topics by doing a timed mini-quiz of 10 mixed problems in 30 minutes, simulating exam conditions. (3) I will track my accuracy on problem sets — I aim for at least 80% correct on first attempts. I'll keep a simple spreadsheet logging my scores to spot trends.",
  },
  {
    id: "adaptation_triggers",
    prompt: "What specific signals will tell you that you need to change your learning strategy?",
    placeholder: "What would tell you it's time to try something different?",
    sampleAnswer:
      "I need to change my strategy if: (1) My accuracy on practice problems for a topic drops below 60% after two study sessions — this means passive reading isn't enough and I need to try active recall or teach the concept to someone. (2) I spend more than 40 minutes stuck on the same type of problem repeatedly — this signals I'm missing a foundational concept and should go back to basics or seek help. (3) I feel anxious or avoid studying a particular topic — this emotional signal means I should address it immediately rather than let it snowball. (4) My weekly mini-quiz scores are declining instead of improving.",
  },
  {
    id: "strategy_alternatives",
    prompt: "What alternative learning strategies will you use if your first approach isn't effective? Give specific examples.",
    placeholder: "What would you switch to if your current approach isn't working?",
    sampleAnswer:
      "If reading the textbook isn't helping, I will switch to watching visual explanations on YouTube (channels like Abdul Bari or mycodeschool) and then immediately code the implementation myself. If I can't solve problems alone, I will try the 'rubber duck' technique — explaining my approach out loud step by step before looking at hints. If practice problems feel overwhelming, I will break them down by difficulty (easy → medium → hard) and ensure I master the easy ones first. If my study group isn't productive, I will try teaching a concept to a non-CS friend, which forces me to truly understand it. If time management is the issue, I will use the Pomodoro technique (25 min study / 5 min break) and block distracting websites during study sessions.",
  },
]
