# Enhanced SoLBot Scaffolding Rubrics

These rubrics are designed for CrewAI implementation, with specific scaffolding recommendations for each scoring level.

## Usage Guide for Agents

1. **Scoring Process**:
   - Evaluate student responses against relevant criteria
   - Calculate overall score for the component using one of these methods:
     * **Primary Method**: Take the average score across all applicable criteria to determine overall scaffolding level
     * **Minimum Score Method**: Use the lowest criterion score to determine scaffolding level (ensures weakest areas get sufficient support)
     * **Criterion-Specific Method**: Provide targeted scaffolding for each criterion based on its individual score
   - For each criterion that scores below 3, provide specific feedback and scaffolding for that particular gap
   - Determine scaffolding level based on overall score:
     * **Score 1-3 Scale**:
       * 1 = Needs Improvement
       * 2 = Satisfactory
       * 3 = Excellent
     * **Scaffolding Levels**:
       * Score 1: Level 1 (High Support)
       * Score 2: Level 2 (Medium Support)
       * Score 3: Level 3 (Low Support)

2. **Response Structure**:
   - Begin with positive acknowledgment
   - Provide specific feedback based on criteria
   - Implement scaffolding appropriate to level
   - End with next step guidance

## Phase 2: Learning Objective Analysis Rubrics

### Learning Objective Definition Rubric

| Criterion | Needs Improvement (1) | Satisfactory (2) | Excellent (3) |
|-----------|---------------|----------------|----------------|
| **Specificity** | General topic without action verb | Action verb with topic but no measurable outcome | Complete with topic, action verb, and measurable outcome |
| **Cognitive Level** | No clear cognitive level | Implied but mismatched cognitive level | Explicit, appropriate cognitive level |
| **Prior Knowledge** | No connection to existing knowledge | Vague connection to prior learning | Explicit connection to specific prior knowledge |

**Scaffolding by Level:**
- **Level 1 (High)**: Provide structured templates with blanks to fill in, specific examples for each component, and guided questions for each element
- **Level 2 (Medium)**: Offer examples of strong objectives, highlight missing elements, provide sentence starters
- **Level 3 (Low)**: Ask reflective questions about how to strengthen the objective, suggest minor refinements

### Resource Identification Rubric

| Criterion | Needs Improvement (1) | Satisfactory (2) | Excellent (3) |
|-----------|---------------|----------------|----------------|
| **Resource Diversity** | Single resource type | 2-3 resource types without clear purposes | 3+ complementary resources across modalities |
| **Specificity** | Generic resources without details | Named resources without specific sections | Named resources with specific sections tied to objectives |
| **Accessibility Plan** | No concrete access plan | Basic where/when but lacks details | Complete when, where, how with contingencies |

**Scaffolding by Level:**
- **Level 1 (High)**: Provide resource lists with categories, structured planning template, specific examples for each resource type
- **Level 2 (Medium)**: Suggest resource categories to explore, provide guiding questions about access plans
- **Level 3 (Low)**: Ask reflective questions about resource gaps, suggest considerations for accessibility

## Phase 4: Strategic Planning Rubrics

### Long-term Goal Rubric

| Criterion | Needs Improvement (1) | Satisfactory (2) | Excellent (3) |
|-----------|---------------|----------------|----------------|
| **Alignment** | Weak connection to learning objectives | Partial alignment with objectives | Direct, clear connection to all objectives |
| **Timeframe** | No clear timeframe | General timeframe without milestones | Specific start/end dates with milestone timeline |
| **Measurability** | No success indicators | Vague indicators | Specific, quantifiable success metrics |

**Scaffolding by Level:**
- **Level 1 (High)**: Provide goal templates, specific examples, step-by-step goal building process, visual timeline tools
- **Level 2 (Medium)**: Offer partial examples with guided questions to complete missing elements
- **Level 3 (Low)**: Ask refining questions, provide light feedback on specificity or measurability

### Short-term Goals Rubric

| Criterion | Needs Improvement (1) | Satisfactory (2) | Excellent (3) |
|-----------|---------------|----------------|----------------|
| **SMART Elements** | Missing 3+ SMART elements | Missing 1-2 SMART elements | Complete SMART goals |
| **Progressive Sequence** | Disconnected goals | Partial logical progression | Clear building sequence toward larger goal |
| **Long-term Alignment** | Unclear connection to long-term goal | Partial connection to long-term goal | Direct contribution to long-term goal |

**Scaffolding by Level:**
- **Level 1 (High)**: Provide SMART templates with examples for each element, visual progression tools, explicit connection prompts
- **Level 2 (Medium)**: Highlight missing SMART elements, suggest progression improvements
- **Level 3 (Low)**: Offer minimal guidance on refining goals, focus on subtle improvements

### IF-THEN Contingency Strategies Rubric

| Criterion | Needs Improvement (1) | Satisfactory (2) | Excellent (3) |
|-----------|---------------|----------------|----------------|
| **Challenge Specificity** | Vague challenges | Somewhat specific challenges | Precise challenges with clear triggers |
| **Response Clarity** | Vague responses | General but actionable responses | Specific actions with implementation steps |
| **Feasibility** | Unrealistic responses | Generally feasible with limitations | Completely realistic with resource consideration |

**Scaffolding by Level:**
- **Level 1 (High)**: Provide structured IF-THEN tables, common challenge examples, response templates, feasibility checklist
- **Level 2 (Medium)**: Suggest common challenges, provide partial examples to complete
- **Level 3 (Low)**: Ask refining questions about trigger specificity and response feasibility

## Phase 5: Monitoring & Adaptation Rubrics

### Progress Monitoring System Rubric

| Criterion | Needs Improvement (1) | Satisfactory (2) | Excellent (3) |
|-----------|---------------|----------------|----------------|
| **Check-in Specificity** | Generic check-ins | Somewhat specific check-ins | Precise check-ins with clear metrics |
| **Frequency** | No defined schedule | Inconsistent schedule | Regular check-ins aligned with milestones |
| **Action Connection** | No follow-up actions | Implied follow-up actions | Explicit actions for each check-in result |

**Scaffolding by Level:**
- **Level 1 (High)**: Provide monitoring templates, scheduling tools, decision trees for follow-up actions, specific examples
- **Level 2 (Medium)**: Offer examples of strong monitoring questions, suggest scheduling approaches
- **Level 3 (Low)**: Ask refining questions, suggest minor improvements to existing plan

### Adaptation Strategy Rubric

| Criterion | Needs Improvement (1) | Satisfactory (2) | Excellent (3) |
|-----------|---------------|----------------|----------------|
| **Trigger Clarity** | Vague adaptation triggers | Somewhat clear triggers | Precise triggers with thresholds |
| **Strategy Specificity** | Generic strategies | General strategies without details | Detailed alternative approaches |
| **Resource Adjustment** | No resource considerations | Basic resource adjustments | Comprehensive resource reallocation |

**Scaffolding by Level:**
- **Level 1 (High)**: Provide adaptation strategy templates, common trigger examples, strategy libraries, resource allocation tools
- **Level 2 (Medium)**: Suggest potential triggers from student's work, offer partial strategy examples
- **Level 3 (Low)**: Ask reflective questions about plan flexibility, suggest minor contingency improvements

### Success Criteria Rubric

| Criterion | Needs Improvement (1) | Satisfactory (2) | Excellent (3) |
|-----------|---------------|----------------|----------------|
| **Measurability** | Subjective criteria | Mix of subjective/objective criteria | Fully objective, observable criteria |
| **Alignment** | Weak connection to objectives | Partial alignment with objectives | Perfect alignment with all objectives |
| **Granularity** | Single success level | 2-3 success levels | Multiple defined success levels |

**Scaffolding by Level:**
- **Level 1 (High)**: Provide success criteria templates, example rubrics, measurability checklist, alignment mapping tools
- **Level 2 (Medium)**: Offer examples to model, suggest objective measures for subjective criteria
- **Level 3 (Low)**: Ask refining questions, suggest subtle improvements to granularity

## Implementation Notes for CrewAI

1. **Agent Integration**:
   - Manager Agent should pass the relevant rubric to specialist agents when delegating tasks
   - Specialist agents should return both the score and detailed feedback for each criterion
   - Manager Agent should track score patterns to adjust scaffolding levels over time

2. **Storage Format**:
   - Store rubric scores in Supabase as structured data:
     ```
     {
       "user_id": "123",
       "phase": "2A",
       "criterion": "specificity",
       "score": 2,
       "timestamp": "2023-06-15T14:30:00Z"
     }
     ```

3. **Scaffolding Transitions**:
   - Increase support level immediately when score drops below threshold
   - Decrease support level only after consistent high performance (3+ instances)
   - Always provide explicit rationale when changing scaffolding levels 
 
4. Scoring 
### Immediate Component Scoring
Score individual criteria immediately when a student provides a response
For incomplete responses, only score the components they've addressed
Example: If they've defined a learning objective but haven't mentioned prior knowledge connections, score only the "Specificity" and "Cognitive Level" criteria
### Complete Assessment Scoring
Perform a full rubric assessment at key completion points:
End of each scaffolding step
Completion of a phase component (e.g., Learning Objective Definition)
Phase transitions
### Handling Incomplete Responses
First interaction: Score available components, use scaffolding to prompt for missing elements
"I notice you've defined your topic clearly. Let's also consider how this connects to your prior knowledge..."

Follow-up interaction: Add scores for newly addressed criteria

If student still doesn't address certain criteria after prompting, score those as 1 (Beginning)

Final assessment: Ensure all criteria have been scored before calculating the overall scaffolding level

