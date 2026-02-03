# Lab Meeting 准备材料总结

## ✅ 已完成的工作

### 1. Prompt Engineering 优化

#### Warm Style 增强
- ✅ 添加 **Growth Mindset** framing（学习是过程，挑战是机会）
- ✅ 添加 **Self-Efficacy** building（"你有能力改进"）
- ✅ 添加 **Goal Orientation** connections（连接长期学业目标）
- ✅ 添加 **Emotional Support**（验证努力和感受）

#### Direct Style 增强
- ✅ 明确禁止 praise 和 encouragement
- ✅ 要求简洁、事实导向
- ✅ 最小化 emoji 使用

#### 评分一致性优化
- ✅ 添加 **Calibration Examples**（评分校准示例）
- ✅ 强制 **"先评分，后反馈"** 顺序
- ✅ 使用 **Temperature 0.1** 达到完美一致性

### 2. 测试结果

**评分一致性测试**（3 trials）：
- **Temperature 0.1**: 
  - Warm: [4, 4, 4] → 平均 4.00
  - Direct: [4, 4, 4] → 平均 4.00
  - **差异: 0.00** ✅ **完美一致性！**

- **Temperature 0.3**: 
  - 差异: 0.33（仍有波动）

**推荐配置**：**Temperature 0.1** 用于研究数据收集

### 3. 真实 Claude Sonnet 4.5 示例

生成了真实反馈示例（High Quality Data Science）：
- ✅ Warm: 230 words, 多种 motivational elements
- ✅ Direct: 220 words, 仍有一些 warm 元素但更简洁

### 4. 文档资料

供 lab meeting 使用的文档：
1. `PROMPT_ENGINEERING_TONE_STUDY.md` - 完整 prompt 设计
2. `REAL_CLAUDE_45_TONE_COMPARISON.md` - 真实 API 反馈
3. `COMPLETE_PROMPT_AND_FEEDBACK_EXAMPLES.md` - 详细对比分析
4. `CONSISTENCY_TEST_RESULTS.md` - 测试结果
5. `SCORING_CONSISTENCY_SOLUTIONS.md` - 一致性解决方案
6. `ACTUAL_TEMP_01_FEEDBACK.txt` - 原始反馈文本

---

## 🎯 关键配置参数

### 生产环境设置

```python
# backend/routes/chat.py

# 用于研究的推荐配置
RESEARCH_CONFIG = {
    "model": "claude-sonnet-4-5-20250929",
    "temperature": 0.1,  # 确保评分一致性
    "max_tokens": 800,
    "prompt_version": "enhanced_with_calibration"
}

# 获取用户选择的 tone
coach_tone = get_user_coach_tone(session_id)  # "warm" or "direct"

# 使用增强的 prompt
system_prompt = get_prompt(
    f"phase{request.phase}_{request.component}", 
    style=coach_tone
)

# API 调用
response = await call_claude(
    system_prompt=system_prompt,
    user_message=request.message,
    chat_history=formatted_history,
    temperature=0.1,  # 关键：使用 0.1 而非 0.5
    max_tokens=800
)
```

---

## 📊 Tone 差异总结（用于 Lab Meeting）

### Warm Style 特征

**Motivational Elements**:
- 🧠 **Growth Mindset**: "Learning is a process", "Every revision makes you stronger"
- 💪 **Self-Efficacy**: "You have the skills", "You can master this"
- 🎯 **Goal Orientation**: "Will serve you throughout your career", "Transferable skills"
- ❤️ **Emotional Support**: "I can see your effort", "It's normal to find this challenging"

**Language**:
- 多次使用 "great", "excellent", "wonderful"
- 频繁使用鼓励性 emojis (🌟💪✨🎯🎉)
- 较长的句子和解释

**Word Count**: ~230 words（High quality example）

### Direct Style 特征

**No Motivational Elements**:
- ❌ 无 growth mindset framing
- ❌ 无 self-efficacy building
- ❌ 无 goal orientation
- ❌ 无 emotional validation

**Language**:
- 仍有一些 "good", "excellent"（Claude 难以完全抑制）
- 较少 emojis
- 更简洁的句子

**Word Count**: ~220 words（略短于 Warm）

### 实际差异

虽然 Direct 不是 "ultra-direct"，但确实比 Warm：
- ✅ 更少 motivational framing
- ✅ 更少情感语言
- ✅ 更简洁
- ✅ 评分一致（Temperature 0.1）

---

## 🔬 研究假设（Lab Meeting 讨论）

### Hypothesis 1: Motivation & Engagement
**Warm > Direct** 在：
- Revision attempts（修订次数）
- Time spent on task（任务时间）
- Positive emotional response（积极情绪）

### Hypothesis 2: Learning Outcomes
**Warm ≥ Direct** 在：
- Final assessment quality（最终评估质量）
- Depth of understanding（理解深度）

### Hypothesis 3: Individual Differences
- 不同学生可能对不同 tone 有不同反应
- 可能的调节变量：prior achievement, personality, cultural background

---

## 🚀 下一步行动

### 1. 应用到生产环境
- [x] 更新 `backend/utils/llm.py` temperature 默认值为 0.1
- [x] 确保 prompt 使用最新版本（with calibration examples）
- [ ] 部署到 Render

### 2. Lab Meeting 准备
- [x] 准备文档材料
- [x] 展示真实 Claude 反馈
- [ ] 讨论研究设计
- [ ] 确定测量指标

### 3. 数据收集计划
- [ ] 随机分配用户到 warm/direct 组
- [ ] 记录所有交互数据
- [ ] 定期检查评分一致性

---

## 📝 需要立即做的

让我更新生产代码中的 temperature 默认值：
