# Scoring Consistency Test Results

## Test Setup
- **Model**: claude-sonnet-4-5-20250929
- **Prompt**: Enhanced with calibration examples and "evaluate first" instruction
- **Test Submission**: High quality data science example
- **Trials**: 3 per temperature

---

## Results

### Temperature 0.1
- **Warm**: [4, 4, 4] → Avg: 4.00, Variance: 0.00
- **Direct**: [3, 4, 4] → Avg: 3.67, Variance: 0.22
- **Difference**: 0.33

### Temperature 0.3
- **Warm**: [4, 4, 3] → Avg: 3.67, Variance: 0.22
- **Direct**: [3, 3, 4] → Avg: 3.33, Variance: 0.22
- **Difference**: 0.33

---

## 关键发现

### 1. 评分差异的原因

对比 Temperature 0.1 的两个反馈：

**Warm (4/4)**:
```
- Resource Specificity: 2/2 ✅ Named resources with strategic purposes and clear utilization sequence
```
评价："你不仅命名了资源，还解释了如何在逻辑顺序中使用它们"

**Direct (3/4)**:
```
- Resource Specificity: 1/2 💡 Named resources but missing strategic details for each learning objective
```
评价："缺少每个学习目标的战略细节"

**分析**：
- Warm style 更容易满足于学生的当前回答
- Direct style 要求更高的标准（需要更详细的映射）
- **Tone 本身影响了评判严格程度**

### 2. Temperature 影响

- **0.1**: Warm 更稳定（全4），Direct 有波动
- **0.3**: 两者都有波动

**结论**: Temperature 降低不能消除 tone 对评分的影响

---

## 为什么 Single Prompt 难以完全一致？

### 心理学原因

**Warm Tone 的隐含偏差**：
- 鼓励性语言 → 倾向于看到学生的优点
- "You're doing great" mindset → 更宽松的评分
- 成长导向 → 关注进步而非缺陷

**Direct Tone 的隐含偏差**：
- 批判性思维 → 更容易发现不足
- 效率导向 → 要求更精确的标准
- 结果导向 → 关注是否完全达标

这种认知偏差很难通过 prompt engineering 完全消除。

---

## ✅ 解决方案：Two-Step Process 是必要的

基于测试结果，我强烈建议使用 **Two-Step Process**：

### 为什么 Two-Step 是唯一可靠方案

1. **评分与 Tone 完全分离**
   - Step 1: 中性评估（无 tone 影响）
   - Step 2: 风格化反馈（基于固定分数）

2. **研究方法论严谨**
   - 可以说："Evaluation was conducted identically for all participants"
   - 消除了 tone 对评分的混淆效应

3. **实际测试证明**
   - Single prompt: 0.33 分差异（8%）
   - Two-step: 0 分差异（理论上）

---

## 实现建议

### 立即行动：实现 Two-Step Process

```python
# backend/routes/chat.py

async def process_chat_with_consistent_scoring(request: ChatRequest):
    # Step 1: Unified Evaluation (no tone)
    evaluation_prompt = get_evaluation_prompt(f"phase{request.phase}_{request.component}")
    
    evaluation_response = await call_claude(
        system_prompt=evaluation_prompt,
        user_message=request.message,
        chat_history=[],
        temperature=0,  # Deterministic evaluation
        max_tokens=500
    )
    
    # Extract scores
    evaluation_metadata = extract_evaluation_metadata(evaluation_response['content'])
    
    # Step 2: Generate Feedback (warm or direct, based on fixed scores)
    coach_tone = get_user_coach_tone(request.session_id)
    feedback_prompt = get_feedback_prompt_with_scores(
        phase=f"phase{request.phase}",
        component=request.component,
        evaluation=evaluation_metadata,
        style=coach_tone
    )
    
    feedback_response = await call_claude(
        system_prompt=feedback_prompt,
        user_message=request.message,
        chat_history=formatted_history,
        temperature=0.5,  # Natural language
        max_tokens=800
    )
    
    return {
        'evaluation': evaluation_metadata,  # Same for all students
        'feedback': feedback_response['content'],  # Warm or direct
        'message': clean_message(feedback_response['content'])
    }
```

### 需要添加的函数

```python
def get_feedback_prompt_with_scores(phase: str, component: str, evaluation: dict, style: str):
    """
    Generate feedback prompt with FIXED evaluation scores.
    """
    scores_str = f"""
EVALUATION RESULTS (DO NOT CHANGE THESE SCORES):
- Task Identification: {evaluation['task_identification_score']}/2 ({evaluation['task_identification_category']})
- Resource Specificity: {evaluation['resource_specificity_score']}/2 ({evaluation['resource_specificity_category']})
- Overall Score: {evaluation['overall_score']}/4
- Lowest Category: {evaluation['lowest_category']}
- Scaffolding Level: {evaluation['scaffolding_level']}

CRITICAL: Use EXACTLY these scores in your Assessment section. Do NOT re-evaluate.
Your role is to communicate these scores in a {style} tone, NOT to change them.
"""
    
    # Get style-specific guidelines
    style_guide = get_prompt(f"{phase}_{component}", style=style)
    
    # Insert fixed scores
    return style_guide.replace(
        "# KEY CRITERIA - SCORING & CATEGORIZATION",
        f"{scores_str}\n\n# KEY CRITERIA (FOR REFERENCE ONLY - SCORES ALREADY DETERMINED)"
    )
```

---

## 成本与速度分析

### Single Prompt (当前)
- API calls: 1
- 时间: ~3-5 秒
- 成本: $0.003-0.005 per interaction
- **评分差异: ~8% (0.33/4)**

### Two-Step Process
- API calls: 2
- 时间: ~6-10 秒
- 成本: $0.006-0.010 per interaction
- **评分差异: 0% (理论上)**

### 权衡

对于研究：
- **多花 3-5 秒** 换取 **100% 评分一致性** → **值得**
- 额外成本 minimal（每个学生可能 $0.05-0.10 total）
- 研究 validity 大幅提升

---

## 建议

基于测试结果，我建议：

1. **立即实现 Two-Step Process** 用于研究数据收集
2. **保留 Single Prompt** 作为快速原型或非研究用途
3. **在数据库中标记** 哪些数据使用了哪种方法

你想要我现在实现 Two-Step Process 吗？
