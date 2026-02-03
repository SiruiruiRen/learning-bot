# 解决评分一致性问题

## 问题

在真实 Claude 4.5 输出中：
- **High Quality 示例（Data Science）**:
  - Warm Style: 3/4 分
  - Direct Style: 4/4 分

这种不一致性会影响研究validity，因为我们需要两种 tone **仅在沟通方式上有差异**，评分应该完全相同。

---

## 解决方案对比

### 方案 1: 增强 Single Prompt 的评分一致性 ⚡️

**做法**：
- 在 prompt 中添加更严格、更明确的评分指导
- 使用评分示例来校准模型
- 降低 temperature（0.3 而非 0.5）提高一致性

**优点**：
- ✅ 快速（single API call）
- ✅ 实现简单
- ✅ 成本低

**缺点**：
- ❌ 仍可能有 5-10% 评分差异
- ❌ Temperature 降低可能影响语言自然度
- ❌ 难以完全消除 LLM 的随机性

**适用场景**：可接受轻微评分差异的研究

---

### 方案 2: Two-Step Process（推荐用于研究）⭐️

**做法**：
1. **Step 1 - 评估**：使用统一的 evaluation prompt（无 tone），temperature=0，获得评分
2. **Step 2 - 生成反馈**：基于固定的评分，使用 warm/direct prompt 生成反馈

**优点**：
- ✅ **100% 评分一致性**（评分只做一次）
- ✅ 评分和反馈分离，清晰的因果关系
- ✅ 研究 validity 最高
- ✅ 可以单独分析评分准确性

**缺点**：
- ❌ 两次 API 调用（稍慢）
- ❌ 成本是方案 1 的 2 倍
- ❌ 实现稍复杂

**适用场景**：**研究发表**（需要严格的方法论）

---

### 方案 3: Structured Output / JSON Mode 🔧

**做法**：
- 使用 Claude 的 structured output 功能
- 强制评分部分使用预定义 JSON schema
- 反馈部分仍然自然语言

**优点**：
- ✅ 评分格式完全一致
- ✅ Single API call
- ✅ 易于解析和分析

**缺点**：
- ❌ 仍可能有评分数值差异（LLM 判断不同）
- ❌ 需要修改 prompt 结构
- ❌ 可能影响反馈的自然度

**适用场景**：需要结构化数据分析的研究

---

## 推荐方案：Two-Step Process（Chain Prompting）

### 实现方式

#### Step 1: Unified Evaluation（无 tone 影响）

```python
# Evaluation Prompt (temperature=0 for consistency)
evaluation_prompt = """
You are an objective evaluator. Score this student submission strictly based on the rubric below.

RUBRIC:
- Task Identification: 0 (generic) | 1 (some detail) | 2 (comprehensive)
- Resource Specificity: 0 (generic) | 1 (named but no strategy) | 2 (strategic mapping)

OUTPUT FORMAT (JSON):
{
  "task_identification_score": 0-2,
  "resource_specificity_score": 0-2,
  "overall_score": 0-4,
  "lowest_category": "LOW|MEDIUM|HIGH",
  "scaffolding_level": "Template + example|Targeted suggestions + Template|Reflection questions",
  "brief_rationale": "..."
}

Student submission: [...]
"""

# Call Claude with temperature=0
evaluation = await call_claude(
    system_prompt=evaluation_prompt,
    user_message=student_submission,
    temperature=0,  # Deterministic evaluation
    max_tokens=500
)
```

#### Step 2: Style-Specific Feedback（基于固定评分）

```python
# Feedback Prompt with FIXED scores
feedback_prompt_warm = f"""
[Warm Style Guidelines]

EVALUATION RESULTS (DO NOT CHANGE):
- Task Identification: {evaluation['task_identification_score']}/2
- Resource Specificity: {evaluation['resource_specificity_score']}/2
- Overall: {evaluation['overall_score']}/4
- Scaffolding: {evaluation['scaffolding_level']}

Generate warm, encouraging feedback using EXACTLY these scores.
Do NOT re-evaluate. Use these scores in your Assessment section.
"""

feedback_prompt_direct = f"""
[Direct Style Guidelines]

EVALUATION RESULTS (DO NOT CHANGE):
[Same scores as above]

Generate concise, direct feedback using EXACTLY these scores.
"""
```

### 代码实现

```python
async def get_consistent_feedback(submission: str, style: str):
    """
    Two-step process ensuring evaluation consistency.
    """
    # Step 1: Evaluate (temperature=0)
    eval_result = await call_claude(
        system_prompt=get_evaluation_prompt(),
        user_message=submission,
        temperature=0,  # Deterministic
        max_tokens=500
    )
    
    # Parse evaluation
    evaluation = extract_evaluation_metadata(eval_result['content'])
    
    # Step 2: Generate style-specific feedback with FIXED scores
    feedback_prompt = get_feedback_prompt(evaluation, style)
    feedback_result = await call_claude(
        system_prompt=feedback_prompt,
        user_message=submission,
        temperature=0.5,  # Natural language generation
        max_tokens=800
    )
    
    return {
        'evaluation': evaluation,  # Same for both styles
        'feedback': feedback_result['content']  # Different based on style
    }
```

---

## 方案 1 改进：增强 Single Prompt 一致性

如果坚持使用 single prompt（速度优先），可以通过以下方式提高一致性：

### 改进措施

1. **降低 Temperature**：0.3 而非 0.5
2. **明确评分示例**：在 prompt 中添加 calibration examples
3. **强制评分顺序**：要求先评分，再生成 guidance
4. **添加自检机制**：让模型验证自己的评分

### 更新后的 Prompt Structure

```python
ENHANCED_SINGLE_PROMPT = """
# EVALUATION FIRST, THEN FEEDBACK

## Step 1: Score Strictly Based on Rubric (Do this FIRST)

Review the submission against EACH criterion independently:

Task Identification Rubric:
- 0 = Generic topic only (e.g., "learn calculus")
- 1 = Specific topic but lacks scope (e.g., "learn derivatives")
- 2 = Specific topic WITH clear scope (e.g., "master derivative rules: power, product, chain rule for composite functions")

Resource Specificity Rubric:
- 0 = Generic (e.g., "textbook, videos")
- 1 = Named but no usage (e.g., "Stewart Calculus Ch 3, Khan Academy")
- 2 = Named WITH strategic usage (e.g., "Stewart Ch3 for concept foundation, Khan for visual examples of chain rule")

SCORE THE SUBMISSION:
- Task Identification: [0, 1, or 2]
- Resource Specificity: [0, 1, or 2]
- OVERALL: [sum]

## Step 2: Generate Feedback Using YOUR Scores

Now generate feedback in [warm/direct] style using the scores you just determined.
Your Assessment section MUST use the exact scores from Step 1.

[Rest of prompt...]
"""
```

### Temperature 降低的影响

| Temperature | Evaluation Consistency | Language Quality |
|-------------|------------------------|------------------|
| 0.0 | 100% consistent | Repetitive, robotic |
| 0.3 | ~95% consistent | Natural but slightly less varied |
| 0.5 | ~85% consistent | Natural and varied |
| 0.7 | ~75% consistent | Very natural but inconsistent |

**建议**：Temperature = 0.3 平衡一致性和自然度

---

## 实验设计：测试评分一致性

### 测试方法

```python
async def test_scoring_consistency(submission: str, n_trials: int = 10):
    """
    Test how consistent scoring is for the same submission.
    """
    warm_scores = []
    direct_scores = []
    
    for i in range(n_trials):
        # Warm
        warm_result = await call_claude(
            system_prompt=get_prompt("phase2_learning_objectives", "warm"),
            user_message=submission,
            temperature=0.5,
            max_tokens=800
        )
        warm_eval = extract_scores(warm_result['content'])
        warm_scores.append(warm_eval['overall_score'])
        
        # Direct
        direct_result = await call_claude(
            system_prompt=get_prompt("phase2_learning_objectives", "direct"),
            user_message=submission,
            temperature=0.5,
            max_tokens=800
        )
        direct_eval = extract_scores(direct_result['content'])
        direct_scores.append(direct_eval['overall_score'])
    
    print(f"Warm scores: {warm_scores}")
    print(f"Direct scores: {direct_scores}")
    print(f"Warm mean: {sum(warm_scores)/len(warm_scores)}")
    print(f"Direct mean: {sum(direct_scores)/len(direct_scores)}")
    print(f"Score difference: {abs(sum(warm_scores)/len(warm_scores) - sum(direct_scores)/len(direct_scores))}")
```

---

## 我的建议

### 对于你的研究（发表为目标）

**推荐：Two-Step Process**

理由：
1. **Method Section 更清晰**："All submissions were first evaluated by a single rubric-based prompt (temperature=0), then feedback was generated in warm/direct styles based on these fixed scores"
2. **Eliminates Confound**：评分差异不会混淆 tone 效果
3. **Reviewers 会认可**：这是更严谨的实验设计
4. **可以报告**："Inter-rater reliability = 100% (same evaluator for both conditions)"

### 实现步骤

1. **创建 evaluation prompt**（无 tone，只评分）
2. **修改 chat.py** 使用 two-step process
3. **在数据库中记录**：evaluation_score 和 feedback_style
4. **分析时**：可以验证评分确实一致

### 速度权衡

- Single prompt: ~3-5 秒
- Two-step: ~6-10 秒（多一次 API 调用）

对于教育应用，额外 3-5 秒是可接受的，特别是如果能确保研究质量。

---

## 立即可行的改进（无需修改架构）

如果现在就想提高一致性：

1. **降低 Temperature 到 0.3**
2. **在 prompt 开头添加**：
```
CRITICAL: Score FIRST based on rubric, THEN generate feedback.
Your scores in Assessment section MUST match your initial rubric evaluation.
Do NOT let communication style influence your scoring - use identical standards for all students.
```

3. **添加 Calibration Examples** 在 prompt 中：
```
SCORING CALIBRATION:
Example 1: "Learn Python" = Task ID: 0/2 (too vague)
Example 2: "Master Python pandas library for data manipulation" = Task ID: 2/2 (specific)
```

想要我实现哪个方案？
