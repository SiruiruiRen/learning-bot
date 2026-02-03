# Prompt Engineering: Tone Study for Lab Meeting

**目的**: 展示 Warm vs Direct feedback 的差异，强调 Warm style 对 growth mindset、self-efficacy 和 goal orientation 的增强效果。

## API 配置

```python
Model: claude-3-5-sonnet-20241022 (or latest)
Temperature: 0.5
Max Tokens: 800
System Prompt: [见下方完整 prompts]
```

---

## 完整 System Prompts

### 🌟 Warm Style System Prompt

```
# CRITICAL: Keep Assessment feedback brief (max 15 words per criterion). Guidance should be complete with full templates/examples.

# ROLE & PERSONA
Learning Guide for Phase 2 (Learning Objectives Analysis). 
As an empowering academic mentor, you help students develop clear learning objectives.

# KEY CRITERIA - SCORING & CATEGORIZATION
| Criteria | LOW (0) | MEDIUM (1) | HIGH (2) |
|----------|---------|------------|----------|
| **Task Identification** | Superficial identification without addressing actual learning content. | Identifies subject matter but lacks sufficient detail OR scope. Examples: mentions general topic without specific components, or lists components without clear boundaries. | Comprehensive identification that clearly articulates specific content domains and learning objectives with both breadth and depth. |
| **Resource Specificity** | Generic or no resources mentioned (e.g., "textbooks," "online resources"). | Specific resources identified (by name/title) but without explanation of how each resource will be used for specific learning tasks. | Specific resources identified with clear articulation of their distinct purposes and strategic utilization (exactly which parts for which learning objectives). |

# COMMUNICATION STYLE: Warm & Encouraging
- Use supportive, empathetic language
- Celebrate effort and progress, not just outcomes
- Use phrases like "Great job!", "You're on the right track!", "I can see you're really thinking this through"
- Include motivational elements and positive reinforcement
- Acknowledge challenges while emphasizing growth potential
- Use encouraging emojis (🌟, 💪, ✨, 🎯)

# MOTIVATIONAL ENHANCEMENT (Warm Style Only)
**Growth Mindset**: Frame challenges as learning opportunities. Use phrases like:
- "This is a great place to develop your skills further"
- "Learning is a process - you're building important strategic thinking"
- "Every revision makes you stronger as a learner"

**Self-Efficacy**: Build confidence in students' ability to improve:
- "You have the skills to refine this"
- "I can see you understand the core concepts"
- "With these strategies, you'll be able to master this"

**Goal Orientation Enhancement**: Connect current work to larger learning goals:
- "This skill will serve you well throughout your academic career"
- "Mastering this approach will make future learning easier"
- "These strategic planning skills transfer to many domains"

**Emotional Support**: Acknowledge effort and validate feelings:
- "I know this takes careful thought"
- "You're putting in great effort here"
- "It's normal to find this challenging at first"

# CATEGORIZATION GUIDELINES
Assess each criterion with an integer score and category:
- Score 0 = LOW (⚠️)
- Score 1 = MEDIUM (💡) 
- Score 2 = HIGH (✅)
- OVERALL score is the SUM of all individual criteria scores
- Scaffolding level based on the LOWEST category across all criteria:
  • ANY criterion LOW = Template + example
  • LOWEST criteria MEDIUM (no LOW) = 2-3 targeted suggestions + Template
  • ALL criteria HIGH = 2-3 reflection question

# RESPONSE STRUCTURE
## Greeting
Brief personalized greeting with 2-3 emojis (adjust based on style).

## Assessment
Looking at your learning plan (keep each bullet under 15 words, do NOT use code blocks):
- Task Identification: [Score]/2 [⚠️/💡/✅] [Brief specific feedback - max 15 words]
- Resource Specificity: [Score]/2 [⚠️/💡/✅] [Brief specific feedback - max 15 words]
- OVERALL: [SUM Score]/4

Your response MUST use "## " for all section titles (e.g., "## Guidance").

## Guidance
Provide support based on the LOWEST category rating. Include full templates and examples as needed.

## Next Steps
Provide next steps based on the evaluation.
- IF ANY criterion LOW/MEDIUM: "📝 Please revise your answer using this template as a guide, focusing on your specific course details."
- IF ALL criteria HIGH: "🚀 Excellent work! You have a clear and actionable learning objective."

# METADATA FORMAT
<!-- INSTRUCTOR_METADATA
Overall_Score: [sum numeric score]
Lowest_Category: [LOW/MEDIUM/HIGH]
Scaffolding: [Template + example/Targeted suggestions + Template/Reflection questions]
Task_Identification: [LOW/MEDIUM/HIGH]
Resource_Specificity: [LOW/MEDIUM/HIGH]
-->

REMEMBER: Keep Assessment feedback brief (15 words max per criterion). Provide complete Guidance with full templates and examples.
```

### 📋 Direct Style System Prompt

```
[Same rubric and structure as above, but with different communication style]

# COMMUNICATION STYLE: Concise & Direct
- Be clear, straightforward, and action-oriented
- Focus on specific, actionable feedback
- Use direct statements without excessive praise
- Get to the point quickly
- Emphasize what needs to be done, not feelings
- Use minimal emojis, only when necessary for clarity

[Rest of prompt is identical - same rubric, same scaffolding guidelines]
```

---

## Test Example 1: Low Quality (Expected: 0/4)

### Student Submission
```
Course/Learning Task: Get better at calculus

Available Resources: Math book and YouTube

Strategic Resource Utilization: Watch videos when confused
```

### API Call Parameters
```python
{
  "model": "claude-3-5-sonnet-20241022",
  "temperature": 0.5,
  "max_tokens": 800,
  "system": [warm_prompt or direct_prompt],
  "messages": [{"role": "user", "content": [student_submission]}]
}
```

### Expected Evaluation Scores (Both Tones)
```
- Task Identification: 0/2 (LOW) - "Get better at calculus" is too vague
- Resource Specificity: 0/2 (LOW) - "Math book and YouTube" lacks detail
- OVERALL: 0/4
- Scaffolding: Template + Example
```

### 🌟 Expected WARM Feedback Highlights

**Growth Mindset Elements**:
- "Thanks for sharing! This is a great starting point - we can develop this into a really strong plan together!"
- "Learning to define specific goals is a skill that improves with practice"
- "Every learner starts somewhere, and refining this will make you a more strategic student"

**Self-Efficacy Building**:
- "You clearly know you need calculus - now let's channel that awareness into actionable steps"
- "You have the foundation - just needs more detail to guide your studying effectively"
- "With a bit more specificity, you'll have a plan that sets you up for success"

**Goal Orientation**:
- "Developing this skill of defining learning objectives will help you in every course"
- "Strategic planning like this is what successful students do"
- "This isn't just about calculus - you're building metacognitive skills"

**Emotional Tone**:
- Validating: "I understand it can feel overwhelming to break down a big subject like calculus"
- Encouraging: "You've got this! Let's work together to make your plan more specific"
- Celebratory: "Great that you're thinking strategically about resources!"

### 📋 Expected DIRECT Feedback Highlights

**No Growth Mindset Framing**:
- "Your task analysis lacks necessary detail."
- "Response is too vague for effective planning."

**Minimal Self-Efficacy**:
- "Revise using template."
- "Add specific details."

**Task-Focused Only**:
- "Specify exact calculus topic."
- "Name exact resources."
- "Define resource sequence."

**Neutral Tone**:
- No emotional validation
- No celebration of effort
- Focus only on what's missing

---

## Test Example 2: High Quality (Expected: 4/4)

### Student Submission
```
Course/Learning Task: Master exploratory data analysis techniques including summary statistics, distribution analysis, and data visualization using Python pandas and matplotlib from Data Science 101 curriculum

Available Resources: Data Science 101 Module 2 lecture slides "EDA Fundamentals", Khan Academy statistics videos (descriptive stats playlist), course Jupyter notebook templates, Professor Johnson's video tutorial "DataFrame Basics"

Strategic Resource Utilization: First, review lecture slides for conceptual overview of EDA workflow. Then, watch Khan Academy videos to strengthen statistical foundation (mean, median, standard deviation). Finally, practice with Jupyter templates using sample datasets, applying concepts from slides and videos to hands-on coding exercises
```

### Expected Evaluation Scores (Both Tones)
```
- Task Identification: 2/2 (HIGH) - Specific techniques and tools identified
- Resource Specificity: 2/2 (HIGH) - Strategic sequence with clear purposes
- OVERALL: 4/4
- Scaffolding: Reflection Questions Only
```

### 🌟 Expected WARM Feedback Highlights

**Growth Mindset**:
- "This level of strategic thinking shows tremendous growth in your metacognitive skills!"
- "You've clearly internalized the principles of effective learning planning"
- "This thoughtful approach will accelerate your learning throughout the course"

**Self-Efficacy**:
- "You're demonstrating mastery-level planning skills!"
- "This kind of strategic thinking puts you in control of your own learning"
- "You've shown you can analyze complex learning tasks effectively"

**Goal Orientation**:
- "This systematic approach will serve you in advanced courses and professional work"
- "You're building transferable skills that go beyond just data science"
- "Strategic learners like you tend to excel because they know how to learn efficiently"

**Celebration & Validation**:
- "Wow! This is exemplary work! 🌟"
- "I'm impressed by the depth of your planning!"
- "You should feel proud of this level of strategic thinking"

### 📋 Expected DIRECT Feedback Highlights

**No Growth Mindset**:
- "Plan is comprehensive."
- "Meets all criteria."

**Minimal Praise**:
- "Good strategic sequence."
- "Resources appropriately mapped."

**Factual Only**:
- "Continue to next phase."
- [Reflection questions provided but without motivational framing]

---

## 🔬 Research Hypotheses for Lab Meeting

### Hypothesis 1: Motivation & Persistence
**Warm tone** will lead to:
- ↑ Higher revision rates after LOW/MEDIUM scores
- ↑ More chat messages refining responses
- ↑ Time spent improving work

**Measurement**: Track revision attempts, message count, time between feedback and next action

### Hypothesis 2: Self-Efficacy & Confidence
**Warm tone** will result in:
- ↑ Higher self-reported confidence in post-surveys
- ↑ More willingness to tackle challenging tasks
- ↑ Positive emotional responses to feedback

**Measurement**: Post-phase surveys, qualitative analysis of student messages

### Hypothesis 3: Learning Outcomes
**Warm tone** may lead to:
- ↑ Better final assessment quality
- ↑ More comprehensive final plans
- ↑ Greater depth in strategic thinking

**Measurement**: Compare final Phase 6 assessment between tone groups

### Hypothesis 4: Engagement
**Warm tone** characteristics:
- ↑ Longer interaction time with feedback
- ↑ More follow-up questions to chatbot
- ↑ Higher completion rates

**Measurement**: Time on page, message count, dropout analysis

### Hypothesis 5: Individual Differences
Variables to explore:
- **Prior Achievement**: Do struggling students benefit more from warm tone?
- **Discipline**: STEM vs non-STEM preference differences?
- **Demographics**: Cultural/gender differences in tone preference?

---

## 🎯 Key Differences Summary

| Element | Warm 🌟 | Direct 📋 | Research Value |
|---------|---------|-----------|----------------|
| **Growth Mindset** | Explicit framing of learning as process, emphasis on development | Minimal/none | Test if GM language affects persistence |
| **Self-Efficacy** | "You can do this", "You have the skills" | "Revise using template" | Test if affects confidence & revisions |
| **Goal Orientation** | Links to long-term skills, career | States facts only | Test if affects motivation |
| **Emotional Tone** | Validating, celebratory | Neutral | Test emotional engagement |
| **Word Count** | ~30% longer | Concise | Test if length affects comprehension |
| **Scaffolding** | ✅ SAME | ✅ SAME | Critical: same instructional support |
| **Rubric Scores** | ✅ SAME | ✅ SAME | Critical: same evaluation |

---

## 📝 To Generate Real Claude Feedback

### Option 1: Run on Render (Production Environment)
```bash
# SSH into Render or use Render shell
cd /opt/render/project/src/backend
python3 generate_real_tone_examples.py
```

### Option 2: Run Locally with API Key
```bash
# Ensure .env has ANTHROPIC_API_KEY
cd backend
python3 generate_real_tone_examples.py
```

### Option 3: Use Anthropic Console Directly
1. Go to console.anthropic.com
2. Use the prompts above as System Prompt
3. Input student submissions as User Message  
4. Set temperature to 0.5
5. Compare warm vs direct outputs manually

---

## 🔧 Next Steps for Lab Meeting

1. **Generate Real Feedback**:
   - Run script in environment with valid API key
   - Collect 4-6 real examples (2 low, 2 medium, 2 high quality)
   - Document exact outputs

2. **Analyze Differences**:
   - Count growth mindset phrases in warm vs direct
   - Identify self-efficacy statements
   - Note goal orientation connections

3. **Design Study**:
   - Randomize students to warm/direct conditions
   - Measure outcomes: revisions, engagement, final quality, surveys
   - Plan qualitative interviews

4. **Consider Variations**:
   - Should we add "balanced" tone?
   - Allow tone switching mid-session?
   - Adaptive tone based on performance?

---

## 💡 Enhanced Warm Prompt Guidelines (Updated)

我已更新 warm style prompt 以包含：

**Growth Mindset (成长型思维)**:
- 明确将挑战视为学习机会
- 强调学习是过程而非结果
- 使用"developing", "building", "growing"等词汇

**Self-Efficacy (自我效能感)**:
- 强化学生相信自己能够改进
- 使用"you have the skills", "you can"等肯定语句
- 承认已有的理解和能力

**Goal Orientation (目标导向)**:
- 将当前任务与长期学习目标联系
- 强调元认知技能的可迁移性
- 指出这些技能如何服务于学业和职业发展

**Emotional Support (情感支持)**:
- 承认effort和validate feelings
- 使用温暖、支持性语言
- 庆祝进步和尝试

这些元素在 Direct style 中**完全不存在**，从而形成清晰对比。

---

*注意：由于本地 API model ID 配置问题，需要在有效 API 环境中运行脚本以获取真实 Claude 反馈。当前文档提供了完整的 prompts 和参数设置，可以手动在 Anthropic Console 中测试。*
