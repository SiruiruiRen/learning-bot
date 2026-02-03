# De Sixte Framework Analysis: Three-Version Comparison

## Research Foundation

**Reference**: De Sixte et al. (2020) - Dual-judgment model of post-feedback behavior

**Key Insight**: Addressing **attributional processes** (how students explain failure) BEFORE **appraisal processes** (task value and feasibility) increases post-feedback engagement by ~50%.

---

## Three Versions Tested

### Version 1: 🌟 Warm (Original)
- General encouragement and support
- Growth mindset framing
- Self-efficacy building
- **235 words**

### Version 2: 🧠 Warm with De Sixte Framework
- **Phase 1**: Attributional support (recognize competence, frame gaps as strategy/temporary/controllable)
- **Phase 2**: Appraisal support (task value, feasibility, mastery orientation)
- **263 words**

### Version 3: 📋 Direct
- Minimal encouragement
- Fact-based, concise
- No motivational framing
- **243 words**

---

## Real Claude Output Analysis (LOW Quality, 0/4)

### Greeting Comparison

| Version | Greeting |
|---------|----------|
| **Warm** | "Great that you're working on improving your calculus skills! Let's look at how we can make your learning plan more specific and actionable." |
| **De Sixte** | "Thank you for sharing your learning plan with me! I can see you're taking the first steps toward improving your calculus skills. Let's look at how we can make your plan even stronger! 🌟" |
| **Direct** | "Great that you're working on improving your calculus skills! Let's look at how we can make your learning plan more specific and actionable." |

**Analysis**: 
- De Sixte: ✅ More explicit recognition ("I can see", "first steps", "even stronger")
- All three are still quite similar in greeting

### Guidance Opening (Post-Assessment)

| Version | Opening Line |
|---------|--------------|
| **Warm** | "Your plan needs more specificity to be actionable! Let me help you develop a clear learning objective. 🎯" |
| **De Sixte** | "Great news—you have the foundation to build a strong plan! 💪 Let me help you add the specificity that will make your learning much more effective." |
| **Direct** | "Your plan needs more specificity to be actionable! Let me help you develop a clear learning objective. 🎯" |

**Analysis**:
- De Sixte: ✅ **Recognizes competence first** ("you have the foundation")
- De Sixte: ✅ **Positive framing** ("Great news")
- De Sixte: ✅ **Frames as strategy issue** ("add specificity") vs ability issue
- Warm/Direct: More deficit-focused ("needs", "lacks")

### Attribution Framing

| Version | How Gaps Are Framed |
|---------|---------------------|
| **Warm** | "Your plan **needs** more specificity" (deficit) |
| **De Sixte** | "Let me help you **add** the specificity" (additive, controllable) |
| **Direct** | "Your plan **needs** more specificity" (deficit) |

**Key Difference**: De Sixte frames gaps as things to ADD rather than things that are MISSING.

---

## Theoretical Distinctions

### De Sixte Framework vs Standard Warm

| Aspect | Standard Warm | De Sixte Warm | Impact |
|--------|---------------|---------------|--------|
| **Attribution** | Implicit | **Explicit** | Makes controllability salient |
| **Competence Recognition** | General praise | **Specific** ("you've identified area") | Protects self-concept |
| **Gap Framing** | "Needs improvement" | **"Add specificity"** | Additive vs deficit |
| **Task Value** | Implicit | **Explicit** ("makes studying efficient") | Increases perceived utility |
| **Feasibility** | Implicit | **Explicit** ("just 2-3 additions") | Reduces perceived effort |
| **Mastery Orientation** | Weak | **Strong** ("goal is understanding") | Shifts from performance to learning |

---

## Word Count & Motivational Elements

| Metric | Warm | De Sixte | Direct |
|--------|------|----------|--------|
| **Words** | 235 | 263 (+12%) | 243 (+3%) |
| **Competence Recognition** | 1 | **3** | 1 |
| **Controllable Attribution** | Implicit | **Explicit** | None |
| **Task Value Statements** | 0 | **2** | 0 |
| **Feasibility Cues** | 0 | **1** | 0 |
| **Mastery Framing** | 0 | **1** | 0 |

**De Sixte is more theoretically grounded** but slightly longer.

---

## Research Design Implications

### Proposed Conditions for Study

**Option A: Two Conditions**
1. **Warm-De Sixte** (theoretically grounded)
2. **Direct** (control)

**Advantage**: Clear theoretical foundation, maximizes difference

**Option B: Three Conditions**
1. **Warm-De Sixte** (attributional + appraisal support)
2. **Warm-Original** (general encouragement)
3. **Direct** (control)

**Advantage**: Can test whether De Sixte's specific framework outperforms general warmth

### Hypotheses Based on De Sixte

**H1: Attribution Effects**
- Warm-De Sixte > Warm > Direct on:
  - Adaptive attributions (strategy, not ability)
  - Perceived controllability
  - Post-feedback engagement

**H2: Appraisal Effects**
- Warm-De Sixte > Warm > Direct on:
  - Perceived task value
  - Perceived feasibility
  - Revision attempts

**H3: Learning Outcomes**
- Warm-De Sixte ≥ Warm ≥ Direct on:
  - Final assessment quality
  - Depth of revisions

### Measurement

**Attributions** (post-feedback survey):
- "My score was due to... [ability / effort / strategy / task difficulty]"
- "I can improve by... [working harder / using better strategies / getting smarter]"

**Appraisals**:
- "Revising this will be... [very valuable / somewhat valuable / not valuable]"
- "Improving this will be... [very easy / moderate / very difficult]"

**Behavioral**:
- Revision attempts
- Time on task
- Message count

---

## Recommendation for Lab Meeting

### Pilot Test Design

**Phase 1 (Current)**:
- Collect initial data with **Warm-Original** vs **Direct**
- Verify scoring consistency holds at scale

**Phase 2 (After pilot)**:
- Add **Warm-De Sixte** condition
- Test whether theoretical framework improves outcomes

**Advantage**: 
- Start simple, add complexity
- Can compare De Sixte to both baseline warm and control

---

## Implementation

```python
# Three versions available in code:

# Standard warm
get_prompt("phase2_learning_objectives", style="warm")

# De Sixte framework
get_prompt("phase2_learning_objectives", style="warm_de_sixte")

# Direct
get_prompt("phase2_learning_objectives", style="direct")
```

**Current Production**: Uses "warm" or "direct" based on user onboarding choice

**To Test De Sixte**: Can add third option in onboarding or A/B test within warm condition

---

**Conclusion**: De Sixte framework provides stronger theoretical foundation and may enhance effects, worth testing in Phase 2 of research.
