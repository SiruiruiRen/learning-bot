// Knowledge Check Questions based on original intervention design
// Removed pre-tests - now only post-tests after instruction + video
// Questions are from original intervention with full feedback for each option

export interface KnowledgeCheckQuestion {
  id: number
  question: string
  options: string[]
  correctAnswer: string | string[] // Support single answer or multiple (for select all)
  explanation: string
  feedbackForWrongAnswers?: { [key: string]: string } // Specific feedback for each wrong answer
  questionType: 'definition' | 'scenario'
  isSelectAll?: boolean // For questions where multiple options can be correct
}

export interface KnowledgeCheckSet {
  phase: string
  topic: string
  postTest: KnowledgeCheckQuestion[] // 2 questions after video
}

// Phase 2: Task Analysis (SRL - Define Task)
// Flow: Instruction → Video → Post-Test → Chatbot
export const phase2KnowledgeChecks: KnowledgeCheckSet = {
  phase: 'phase2',
  topic: 'Self-Regulated Learning: Define the Task',
  postTest: [
    {
      id: 206,
      questionType: 'definition',
      question: "Why are learning objectives important to study?",
      options: [
        "They are like a study guide where the verb gives you the type of question that the instructor will ask",
        "They should be studied verbatim because the instructor will ask you a question about what the learning objective said.",
        "They aren't important to study and you should ignore them.",
        "They help give you a brief overview of the course concepts so you can gauge the difficulty of the course"
      ],
      correctAnswer: "They are like a study guide where the verb gives you the type of question that the instructor will ask",
      explanation: "Finding your learning objectives is important to your success in the course. Learning objectives reveal a lot about concepts instructors want to emphasize.",
      feedbackForWrongAnswers: {
        "They should be studied verbatim because the instructor will ask you a question about what the learning objective said.": "There is no need to go too in-depth with learning objectives and study them verbatim.",
        "They aren't important to study and you should ignore them.": "Learning objectives are a hidden study guide. You should never underestimate them.",
        "They help give you a brief overview of the course concepts so you can gauge the difficulty of the course": "Learning objectives can give you a brief overview of the course concepts, but that is not why you should study them. Instead, you should study them so that you can understand what the instructor aims to put on their exams."
      }
    },
    {
      id: 207,
      questionType: 'scenario',
      question: "Ms. Anna gave her students the following learning objective to study: \"Identify the characteristics and basic needs of living organisms and ecosystems.\" Based on this learning objective, which student did the best job interpreting the objective and selecting an appropriate learning strategy to enact?",
      options: [
        "Ally finds the information in her textbook and class notes and chooses to rehearse it using retrieval practice strategies every few days",
        "Barry rereads the textbook with this information in it until he is confident he knows the material",
        "Claire studies the basic definition of living organisms and ecosystems using her textbook and her notes she took during the lecture.",
        "Dan decides to focus in lecture whenever the keywords in this learning objective are recited."
      ],
      correctAnswer: "Ally finds the information in her textbook and class notes and chooses to rehearse it using retrieval practice strategies every few days",
      explanation: "We can classify this learning objective as knowledge level which means in order to solidify the knowledge we just need to find the information in our resources and memorize it.",
      feedbackForWrongAnswers: {
        "Barry rereads the textbook with this information in it until he is confident he knows the material": "Rereading it can help passively learn the information, but it is not the most effective strategy.",
        "Claire studies the basic definition of living organisms and ecosystems using her textbook and her notes she took during the lecture.": "Studying the basic definition is the first step, but it's important to read everything the learning objective is asking for. The objective asks for the characteristics and needs. Just studying the definition won't help with understanding this information.",
        "Dan decides to focus in lecture whenever the keywords in this learning objective are recited.": "Listening to lecture just for this learning objective will not help you understand other content that might be relevant to the upcoming test. You should listen to all of lecture to notice what your instructor decides to emphasize as these are concepts that will likely show up on your exam."
      }
    }
  ]
}

// Phase 3: Learning Strategies (Self-testing, Spacing, Self-explanation)
// Flow: Instruction → Video → Post-Test → (No chatbot for Phase 3)
export const phase3KnowledgeChecks: KnowledgeCheckSet = {
  phase: 'phase3',
  topic: 'Learning Strategies: Self-testing, Spacing, and Self-explanation',
  postTest: [
    {
      id: 193,
      questionType: 'definition',
      question: "Self-testing is a useful learning strategy for what reason? (Select all that apply)",
      options: [
        "It helps emphasize retrieval practice and bring back information you already know",
        "It helps students remember key information for a longer period of time",
        "It helps with future learning",
        "It helps with setting goals"
      ],
      correctAnswer: [
        "It helps emphasize retrieval practice and bring back information you already know",
        "It helps students remember key information for a longer period of time",
        "It helps with future learning"
      ],
      isSelectAll: true,
      explanation: "Self-testing is useful in many ways, but these three choices highlight the most important reasons.",
      feedbackForWrongAnswers: {
        "It helps with setting goals": "Self-testing is a learning strategy. It does not help with setting goals. Instead, self-testing helps emphasize retrieval practice and bring back information you already know, it helps student remember key information for a longer period of time, and it helps with future learning."
      }
    },
    {
      id: 194,
      questionType: 'scenario',
      question: "You just began a unit of a course and have 4 weeks of topics to cover before the unit exam. For each new lesson, the guided reading questions and course outlines make clear that there are a number of facts, definitions, and properties that you'll need to be able to recall when the exam comes. Pick the best strategy, from those below, that will enable you to rehearse this knowledge and ensure you can recall it.",
      options: [
        "Block out the entire day before the exam. Redo all your homework questions to be sure you've rehearsed fully.",
        "Block out the entire day before the exam. Reread all the chapters to be sure you're on top of all the material.",
        "After reading each chapter in advance of the day it is covered, reread each chapter repeatedly in advance of the exam.",
        "After turning in a homework assignment by the deadline, set up reminders in your calendar to re-complete that homework again at least a few times before the exam."
      ],
      correctAnswer: "After turning in a homework assignment by the deadline, set up reminders in your calendar to re-complete that homework again at least a few times before the exam.",
      explanation: "This plan does the best job of providing many opportunities to practice retrieving the knowledge, and it also spaces out the practice. Those gaps between attempts can be used for restudying topics you struggled on, and can make each retrieval attempt more powerful.",
      feedbackForWrongAnswers: {
        "Block out the entire day before the exam. Redo all your homework questions to be sure you've rehearsed fully.": "It's good to redo all these homework before the exam to strengthen your ability to recall the knowledge. This plan involves retrieval practice on a blocked schedule, which is good, but doesn't take advantage of the benefits of spacing out this effort, which further strengthens the effects of the studying on your recall.",
        "Block out the entire day before the exam. Reread all the chapters to be sure you're on top of all the material.": "Spending your final day rereading will require massive effort and, unfortunately, rereading is an inefficient strategy. Plus, you risk convincing yourself you are more prepared than you really are. It is better to actively engage in retrieval practice; make sure you are actively asking and answering questions if you feel unprepared.",
        "After reading each chapter in advance of the day it is covered, reread each chapter repeatedly in advance of the exam.": "This plan is a good example of spacing, but it doesn't give you a chance to practice retrieving. That means your time would be spent less efficiently than it would be if you quizzed yourself, and you wouldn't be able to know what topics you know well or less well. You should choose to practice test instead of reread."
      }
    }
  ]
}

// Phase 4: MCII (Mental Contrasting with Implementation Intentions)
// Flow: Instruction → Video → Post-Test → Chatbot
export const phase4KnowledgeChecks: KnowledgeCheckSet = {
  phase: 'phase4',
  topic: 'MCII: Mental Contrasting with Implementation Intentions',
  postTest: [
    {
      id: 'mcii_def',
      questionType: 'definition',
      question: "Which of these best describes the components of MCII?",
      options: [
        "MCII consists of a) a sustained mental focus on visualizing achieving your goals and ignoring obstacles that could interfere with the goal pursuit, and b) formation of implementation intentions.",
        "MCII consists of a) contrasting the imagined positive outcomes of goal achievement with the obstacles that might prevent you from achieving the goal, and b) formation of implementation intentions.",
        "MCII consists of a) mentally contrasting your goals with the goals imposed on you by others, and b) thinking positively about achieving your goals."
      ],
      correctAnswer: "MCII consists of a) contrasting the imagined positive outcomes of goal achievement with the obstacles that might prevent you from achieving the goal, and b) formation of implementation intentions.",
      explanation: "MCII consists of mental contrasting and implementation intentions. Mental contrasting involves contrasting the image of achieving your dreams with the obstacles you will have to overcome to make that imagined future come true. Implementation intentions are concrete if-then plans that help you create habitual behaviors to surmount the obstacles to your achievement.",
      feedbackForWrongAnswers: {
        "MCII consists of a) a sustained mental focus on visualizing achieving your goals and ignoring obstacles that could interfere with the goal pursuit, and b) formation of implementation intentions.": "That answer is incorrect because it says that mental contrasting involves ignoring obstacles while the opposite is true of the technique. MCII consists of mental contrasting and implementation intentions. Mental contrasting involves contrasting the image of achieving your dreams with the obstacles you will have to overcome to make that imagined future come true. Implementation intentions are concrete if-then plans that help you create habitual behaviors to surmount the obstacles to your achievement.",
        "MCII consists of a) mentally contrasting your goals with the goals imposed on you by others, and b) thinking positively about achieving your goals.": "That answer is incorrect because it incorrectly describes mental contrasting and does not describe implementation intentions as part of the technique. MCII consists of mental contrasting and implementation intentions. Mental contrasting involves contrasting the image of achieving your dreams with the obstacles you will have to overcome to make that imagined future come true. Implementation intentions are concrete if-then plans that help you create habitual behaviors to surmount the obstacles to your achievement."
      }
    },
    {
      id: 'ii_quality',
      questionType: 'scenario',
      question: "Which student effectively utilizes implementation intentions towards the following goal: Student wants to lose 5 pounds?",
      options: [
        "Anna makes a schedule of her day to go to the gym before her classes at 7:30 AM so that she has time in her day.",
        "Barry decides to go to the gym whenever he has time throughout his day.",
        "Claire can't find a close gym, find time to go to the gym and make healthy meals, and needs someone to babysit her daughter. Because of this she creates a detailed schedule to overcome all of these obstacles.",
        "Derek decides to go to the gym after he cooks a healthy meal, until he sees visible results"
      ],
      correctAnswer: "Anna makes a schedule of her day to go to the gym before her classes at 7:30 AM so that she has time in her day.",
      explanation: "This is the correct answer because Anna's implementation intention is specific and focuses on the one obstacle she wants to overcome.",
      feedbackForWrongAnswers: {
        "Barry decides to go to the gym whenever he has time throughout his day.": "These implementation intentions are too vague and not specific enough.",
        "Claire can't find a close gym, find time to go to the gym and make healthy meals, and needs someone to babysit her daughter. Because of this she creates a detailed schedule to overcome all of these obstacles.": "Claire is trying to focus on many obstacles at once and creating multiple implementation intentions for it. This will get too confusing for Claire. Remember, less is more!",
        "Derek decides to go to the gym after he cooks a healthy meal, until he sees visible results": "These implementation intentions are too vague and not specific enough."
      }
    }
  ]
}

// Phase 5: Monitoring & Adaptation
// Flow: Instruction → Video → Post-Test → Chatbot
export const phase5KnowledgeChecks: KnowledgeCheckSet = {
  phase: 'phase5',
  topic: 'Monitoring Your Learning',
  postTest: [
    {
      id: 211,
      questionType: 'definition',
      question: "What does monitoring your learning effectively mean?",
      options: [
        "Adapt your learning to accommodate what you don't know",
        "Watching other students perform their learning task and following them",
        "Rereading textbook passages on all of the important topics",
        "Reread missed questions and their answer choices until you memorize the correct answer"
      ],
      correctAnswer: "Adapt your learning to accommodate what you don't know",
      explanation: "Effective monitoring is about self-assessment and adapting your strategies based on what you find is not working for you. It's an active process of checking your understanding and changing your approach accordingly.",
      feedbackForWrongAnswers: {
        "Watching other students perform their learning task and following them": "You should be monitoring yourself rather than others, as strategies that work for them might not work for you.",
        "Rereading textbook passages on all of the important topics": "As we know, rereading the textbook is incredibly ineffective, but this strategy also does not help with monitoring your learning.",
        "Reread missed questions and their answer choices until you memorize the correct answer": "Using flashcards or memorization can be helpful tools but with no sort of \"check-in\" involved, you won't be able to see if your strategy is helping you study most effectively, and adapt your ways if not."
      }
    },
    {
      id: 305,
      questionType: 'scenario',
      question: "Which student monitors their learning the best?",
      options: [
        "Anish monitors what his friends are doing and tries to copy their learning strategies",
        "Bria rereads the textbook until the information is well memorized and understood",
        "Carrie continues to test herself with flashcards repetitively",
        "After Denise completes one self-test, she asks herself if she is retaining the information with this strategy."
      ],
      correctAnswer: "After Denise completes one self-test, she asks herself if she is retaining the information with this strategy.",
      explanation: "Denise monitors her learning by asking herself if the self-testing she is completing is helping her learn the information or not. If it isn't she can choose a new strategy, but if it is, she can continue utilizing the same strategy.",
      feedbackForWrongAnswers: {
        "Anish monitors what his friends are doing and tries to copy their learning strategies": "Anish should be monitoring himself rather than his friends as strategies that work for them might not work for him.",
        "Bria rereads the textbook until the information is well memorized and understood": "As we know, rereading the textbook is incredibly ineffective, but this strategy also does not help with monitoring your learning.",
        "Carrie continues to test herself with flashcards repetitively": "Using flashcards for memorization can be a helpful tool but with no sort of \"check-in\" involved, Carrie won't be able to see if flashcards is helping her study the most effectively, and adapt her ways if not."
      }
    }
  ]
}
