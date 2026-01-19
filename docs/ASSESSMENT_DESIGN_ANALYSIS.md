# Assessment Design Analysis and Recommendations

## Current Design Overview

### Pre/Post Test Design (Knowledge Checks)
**Purpose**: Test understanding of SRL concepts and strategies before/after instructional content

**Design Pattern**:
- **Pre-test**: 2 questions (1 definition + 1 scenario) before video
  - Tests prior knowledge
  - If 2/2 correct → can skip video (adaptive learning)
- **Post-test**: 2-3 questions after video
  - Tests comprehension of instructional content
  - Multiple choice with explanations

**Strengths**:
✅ Clear separation: definition vs. scenario-based questions
✅ Adaptive skip logic encourages efficient learning
✅ Immediate feedback helps learning
✅ Tests both conceptual understanding and application

**Potential Issues**:
⚠️ Pre-test might be too easy/hard for some students
⚠️ Only 2 questions might not capture full understanding
⚠️ Post-test questions should be more challenging than pre-test

**Recommendation**: ✅ **SOLID DESIGN**
- The pre/post pattern is well-established in learning science
- Definition + scenario pattern tests both knowledge and application
- Adaptive skip logic is evidence-based (prior knowledge activation)

---

### Chatbot Question Design
**Purpose**: Guided practice applying SRL skills to students' own learning contexts

**Phase 2 (Task Analysis)**:
- Q1: "What are you learning right now?" (goal clarity)
- Q2: "What learning materials and resources do you have access to?" (resources)
- Q3: "How will you use these resources to maximize your learning?" (strategy)

**Phase 4 (MCII)**:
- Q1: Pick a goal
- Q2: Indulge (visualize success)
- Q3: Consider obstacles
- Q4: Create if-then implementation intention

**Phase 5 (Monitoring)**:
- Q1: "How will you check your progress?" (progress checks)
- Q2: "What signals will tell you to change strategy?" (adaptation triggers)
- Q3: "What alternative strategies will you use?" (strategy alternatives)

**Strengths**:
✅ Scaffolded, step-by-step guidance
✅ Contextualized to student's own course
✅ Provides AI feedback with rubrics
✅ Builds practical SRL skills

**Potential Issues**:
⚠️ Questions are very specific to the task (might not transfer)
⚠️ Focus on creating plans, not necessarily testing understanding
⚠️ AI feedback quality depends on prompt engineering

**Recommendation**: ✅ **GOOD DESIGN**
- Guided practice is essential for skill development
- Step-by-step scaffolding helps students apply complex strategies
- Contextualization increases relevance and motivation
- Could benefit from more reflection prompts

---

### POST-Task Assessment Design (Current Issues)

**Current Problems**:
❌ **Q1 (Task Analysis)**: "Describe learning objective and cognitive level" 
   - **REPEATS** chatbot Q1 (goal clarity) - chatbot already asked about learning objectives
   
❌ **Q2 (Resources)**: "List 3-4 resources and how you'd use them"
   - **REPEATS** chatbot Q2 & Q3 (resources and strategy) - chatbot already asked about resources and how to use them

❌ **Q6 (Goal Setting)**: "Describe one specific learning goal"
   - **REPEATS** chatbot MCII Q1 (pick a goal) - chatbot already asked students to pick a goal

❌ **Q7 (MCII)**: "Describe indulge, obstacles, if-then plan"
   - **REPEATS** chatbot MCII Q2-Q4 - chatbot already guided students through full MCII

❌ **Q8 (Monitoring)**: "Describe monitoring method"
   - **REPEATS** chatbot Q1 (progress checks) - chatbot already asked about monitoring methods

**What POST-Task Assessment SHOULD Test**:
1. **Transfer Learning**: Can students apply SRL skills to NEW contexts?
2. **Deep Understanding**: Do they understand WHY strategies work?
3. **Integration**: Can they combine multiple SRL components?
4. **Metacognition**: Can they reflect on their learning process?
5. **Generalization**: Can they adapt strategies to different situations?

---

## Recommended POST-Task Assessment Redesign

### Design Principles
1. **No Direct Repetition**: Don't ask what chatbot already asked
2. **Transfer Focus**: Test application to NEW contexts/scenarios
3. **Synthesis**: Require combining multiple SRL components
4. **Metacognitive Reflection**: Test understanding of learning process
5. **Generalization**: Test ability to adapt strategies

### New Question Structure

#### Phase 2 POST-Task (After Task Analysis Chatbot)
**Current**: ❌ Repeats chatbot questions
**New**: ✅ Transfer and synthesis questions

1. **Transfer Question** (NEW context):
   - "Imagine you're starting a NEW course next semester. Describe how you would analyze the learning objectives for that course, even though you haven't seen the syllabus yet. What questions would you ask? What information would you need?"
   - Tests: Can they transfer task analysis skills to unfamiliar context

2. **Synthesis Question** (Combining concepts):
   - "You've learned about cognitive levels (knowledge, comprehension, application, analysis). How would knowing the cognitive level help you choose between different learning strategies (like self-testing vs. self-explanation)?"
   - Tests: Integration of task analysis with strategy selection

#### Phase 4 POST-Task (After MCII Chatbot)
**Current**: ❌ Repeats MCII steps
**New**: ✅ Transfer and reflection questions

1. **Transfer Question** (Different goal type):
   - "You created an MCII plan for a course-related goal. Now think about a DIFFERENT type of goal (e.g., fitness, hobby, personal development). How would you adapt the MCII process for this different type of goal? What would stay the same? What might change?"
   - Tests: Can they generalize MCII beyond academic context

2. **Reflection Question** (Understanding the process):
   - "Reflect on the MCII process you just completed. What was the most challenging part? Why do you think mental contrasting (indulging + obstacles) might be more effective than just visualizing success? What did you learn about yourself?"
   - Tests: Metacognitive understanding of why MCII works

#### Phase 5 POST-Task (After Monitoring Chatbot)
**Current**: ❌ Repeats monitoring questions
**New**: ✅ Integration and adaptation questions

1. **Integration Question** (Combining all phases):
   - "You've now completed all phases: task analysis, goal setting (MCII), and monitoring. Describe how these three phases work together as a cycle. Give a concrete example of how you might cycle through all three phases when working on a challenging project."
   - Tests: Understanding of SRL as integrated system

2. **Adaptation Question** (Real-world application):
   - "Think about a time when your initial study plan didn't work. Using what you've learned about monitoring and adaptation, describe: (1) What signals would have told you earlier that the plan wasn't working? (2) How would you have adapted? (3) What would you do differently next time?"
   - Tests: Transfer of monitoring skills to real situations

#### Final Synthesis Questions (After All Phases)
**Keep these** - they're good:
- Q10: Integration of four stages ✅
- Q11: Strategy combination ✅
- Q12: Metacognitive reflection ✅

---

## Research Design Considerations

### Control Group vs. Experimental Group
- **Experimental Group**: Chatbot-guided practice → POST-task assessment
- **Control Group**: Sample answers (no chatbot) → POST-task assessment

**Key Question**: Does chatbot-guided practice lead to better POST-task performance?

**What POST-task should measure**:
1. **Skill Transfer**: Can students apply SRL skills to new contexts?
2. **Deep Understanding**: Do they understand principles, not just procedures?
3. **Metacognitive Awareness**: Can they reflect on their learning?

**Current POST-task issues**:
- If questions repeat chatbot content, control group (with sample answers) might perform similarly
- Need questions that test TRANSFER, not just recall of what they practiced

---

## Recommendations Summary

### ✅ Keep Current Design:
1. **Pre/Post Tests**: Well-designed knowledge checks
2. **Chatbot Questions**: Good guided practice structure

### 🔄 Redesign POST-Task Assessment:
1. **Remove repetitive questions** (Q1, Q2, Q6, Q7, Q8)
2. **Add transfer questions** (new contexts)
3. **Add synthesis questions** (combining components)
4. **Add metacognitive questions** (understanding why)
5. **Keep integration questions** (Q10, Q11, Q12)

### 📊 Research Validity:
- POST-task should test **transfer learning**, not **recall**
- Questions should be **related** to chatbot content but **not identical**
- Control group should be able to answer based on sample answers + general understanding
- Experimental group should show advantage through guided practice + deeper understanding
