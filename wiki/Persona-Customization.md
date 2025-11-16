# Persona Customization

Complete guide to customizing your AI's personality in Garden of Eden V3.

---

## Overview

Garden of Eden V3 features a unique **10-parameter persona system** that lets you customize exactly how the AI behaves. Unlike other AI assistants with fixed personalities, you have complete control.

---

## Accessing Persona Settings

1. Click the settings icon (⚙️) in the top-right
2. Select "Persona Settings"
3. Adjust the 10 sliders to your preference
4. Click "Save" to apply changes

---

## The 10 Personality Parameters

### 1. Formality (격식)

**Range**: 0.0 (Casual) → 1.0 (Formal)

**Controls**: How professional and respectful the AI sounds

**Examples**:

| Value | Korean | English |
|-------|--------|---------|
| 0.0-0.3 | "야! 뭐 도와줄까?" | "Hey! What's up?" |
| 0.4-0.6 | "안녕하세요. 무엇을 도와드릴까요?" | "Hello. How can I help?" |
| 0.7-1.0 | "안녕하십니까. 무엇을 도와드리면 될까요?" | "Good day. How may I assist you?" |

**Use Cases**:
- **Low**: Personal projects, casual chatting
- **High**: Professional work, client-facing tasks

---

### 2. Verbosity (상세도)

**Range**: 0.0 (Concise) → 1.0 (Detailed)

**Controls**: How much detail the AI provides

**Examples**:

**Low (0.2)**:
```
Q: What is React?
A: React is a JavaScript library for building UIs.
```

**Medium (0.5)**:
```
Q: What is React?
A: React is a JavaScript library for building user interfaces.
It uses a component-based architecture and virtual DOM for performance.
```

**High (0.8)**:
```
Q: What is React?
A: React is a JavaScript library developed by Facebook for building
user interfaces. It uses a component-based architecture where UIs
are broken into reusable pieces. React employs a virtual DOM for
efficient updates, only re-rendering changed components. It supports
both class and functional components, with hooks providing state
management in functional components...
```

**Use Cases**:
- **Low**: Quick answers, debugging
- **High**: Learning, comprehensive explanations

---

### 3. Humor (유머)

**Range**: 0.0 (Serious) → 1.0 (Playful)

**Controls**: How much the AI uses jokes, puns, and playful language

**Examples**:

**Low (0.1)**:
```
"The function returns undefined because you didn't return a value."
```

**High (0.8)**:
```
"Oops! Your function is like a magician who forgot the final reveal -
it's returning undefined instead of the rabbit (your value) 🎩✨"
```

**Use Cases**:
- **Low**: Professional work, serious topics
- **High**: Creative projects, casual learning

---

### 4. Emoji Usage (이모지 사용)

**Range**: 0.0 (None) → 1.0 (Frequent)

**Controls**: How many emojis the AI uses

**Examples**:

| Value | Response |
|-------|----------|
| 0.0 | "Great job! Your code works perfectly." |
| 0.5 | "Great job! 👍 Your code works perfectly." |
| 1.0 | "Great job! 🎉👍✨ Your code works perfectly! 🚀💯" |

**Use Cases**:
- **Low**: Professional documentation, formal contexts
- **High**: Friendly chat, creative work

---

### 5. Proactiveness (적극성)

**Range**: 0.0 (Reactive) → 1.0 (Proactive)

**Controls**: How much the AI suggests next steps and asks questions

**Examples**:

**Low (0.2)**:
```
Q: I created a React component
A: Good! The component looks correct.
```

**High (0.8)**:
```
Q: I created a React component
A: Good! The component looks correct. Would you like me to:
1. Add PropTypes for type checking?
2. Suggest unit tests for this component?
3. Optimize it for performance?
4. Add accessibility features?
```

**Use Cases**:
- **Low**: When you know what you want, focused work
- **High**: Learning, exploring options, creative brainstorming

---

### 6. Technical Depth (기술 깊이)

**Range**: 0.0 (Simple) → 1.0 (Advanced)

**Controls**: How technical and detailed explanations are

**Examples**:

**Low (0.2)**:
```
Q: How does React rendering work?
A: React updates the screen when your data changes. It's smart
about only changing what needs to change.
```

**High (0.8)**:
```
Q: How does React rendering work?
A: React uses a virtual DOM reconciliation algorithm. When state
changes, React creates a new virtual DOM tree, diffs it against
the previous tree using a O(n) heuristic algorithm, and batches
DOM updates. The fiber architecture enables interruptible rendering
with priority scheduling...
```

**Use Cases**:
- **Low**: Beginners, high-level overview
- **High**: Experienced developers, deep understanding

---

### 7. Empathy (공감)

**Range**: 0.0 (Direct) → 1.0 (Compassionate)

**Controls**: How understanding and supportive the AI is

**Examples**:

**Low (0.2)**:
```
Q: I've been stuck on this bug for 3 hours
A: The issue is on line 42. You're missing a semicolon.
```

**High (0.8)**:
```
Q: I've been stuck on this bug for 3 hours
A: I understand how frustrating that must be! Let's solve this together.
The issue is on line 42 - you're missing a semicolon. These small syntax
errors can be really tricky to spot when you're tired. Take a quick
break after fixing it! 💙
```

**Use Cases**:
- **Low**: Quick fixes, efficiency-focused
- **High**: Learning, emotional support, difficult tasks

---

### 8. Code Examples (코드 예시)

**Range**: 0.0 (Theory) → 1.0 (Practice)

**Controls**: How much code vs. explanations the AI provides

**Examples**:

**Low (0.2)**:
```
Q: How do I use useState?
A: useState is a React hook that lets you add state to functional
components. Call it with an initial value and it returns the current
state and a setter function.
```

**High (0.8)**:
```
Q: How do I use useState?
A: Here's how to use useState:

```typescript
import { useState } from 'react';

function Counter() {
  // Declare state variable 'count' with initial value 0
  const [count, setCount] = useState(0);

  return (
    <div>
      <p>Count: {count}</p>
      <button onClick={() => setCount(count + 1)}>
        Increment
      </button>
    </div>
  );
}
```
```

**Use Cases**:
- **Low**: Conceptual understanding, learning theory
- **High**: Implementation, practical coding

---

### 9. Questioning (질문)

**Range**: 0.0 (Accepting) → 1.0 (Curious)

**Controls**: How often the AI asks clarifying questions

**Examples**:

**Low (0.1)**:
```
Q: Create a form
A: [Creates a basic form]
```

**High (0.8)**:
```
Q: Create a form
A: I'd be happy to create a form! A few questions first:
1. What data should the form collect?
2. Should it have validation?
3. What happens when submitted?
4. What framework are you using (React, Vue, etc.)?
```

**Use Cases**:
- **Low**: Clear requirements, quick tasks
- **High**: Ambiguous requests, ensure correctness

---

### 10. Suggestions (제안)

**Range**: 0.0 (Minimal) → 1.0 (Abundant)

**Controls**: How many additional suggestions and improvements the AI offers

**Examples**:

**Low (0.2)**:
```
Q: Review this code
A: The code works correctly. No issues found.
```

**High (0.8)**:
```
Q: Review this code
A: The code works correctly! Here are some suggestions:

**Performance**:
- Consider memoizing the calculation with useMemo
- Add a debounce to the input handler

**Accessibility**:
- Add ARIA labels to the form inputs
- Ensure keyboard navigation works

**Security**:
- Sanitize user input before displaying
- Add CSRF protection if this is a form

**Testing**:
- Add unit tests for edge cases
- Test with different input lengths

Would you like me to implement any of these?
```

**Use Cases**:
- **Low**: Just answer the question, stay focused
- **High**: Learn best practices, improve code quality

---

## Recommended Presets

### Beginner Friendly
```
Formality: 0.4
Verbosity: 0.7
Humor: 0.5
Emoji Usage: 0.5
Proactiveness: 0.7
Technical Depth: 0.3
Empathy: 0.8
Code Examples: 0.8
Questioning: 0.6
Suggestions: 0.7
```

### Professional Assistant
```
Formality: 0.7
Verbosity: 0.5
Humor: 0.2
Emoji Usage: 0.1
Proactiveness: 0.5
Technical Depth: 0.7
Empathy: 0.4
Code Examples: 0.6
Questioning: 0.5
Suggestions: 0.6
```

### Creative Partner
```
Formality: 0.3
Verbosity: 0.6
Humor: 0.7
Emoji Usage: 0.7
Proactiveness: 0.8
Technical Depth: 0.5
Empathy: 0.7
Code Examples: 0.5
Questioning: 0.7
Suggestions: 0.8
```

### Technical Expert
```
Formality: 0.5
Verbosity: 0.7
Humor: 0.2
Emoji Usage: 0.1
Proactiveness: 0.6
Technical Depth: 0.9
Empathy: 0.3
Code Examples: 0.8
Questioning: 0.4
Suggestions: 0.7
```

---

## Learning System

### How Learning Works

Garden of Eden V3 uses **gradient-based learning** to optimize your persona:

1. **Give Feedback**: Use 👍 (thumbs up) or 👎 (thumbs down) on AI responses
2. **AI Analyzes**: System analyzes which persona settings led to that response
3. **Gradual Adjustment**: Parameters shift slightly toward (👍) or away from (👎) current values
4. **Continuous Improvement**: Over time, persona converges to your preferences

### Learning Algorithm

- **Learning Rate**: 0.1 (10% adjustment per feedback)
- **Method**: Gradient descent optimization
- **Memory**: Last 100 feedback events
- **Persistence**: Learning state saved to local database

### Viewing Learning Stats

Go to Settings > Persona to see:
- **Total Feedback**: Number of 👍 and 👎 given
- **Optimization Rounds**: How many times persona was adjusted
- **Success Rate**: Ratio of positive to total feedback

### Manual Optimization

Click "Optimize Persona" button to:
- Analyze all past feedback
- Calculate optimal parameter values
- Suggest new persona settings
- You can accept or reject the suggestions

---

## System Prompt Preview

The "Preview System Prompt" button shows the exact prompt sent to the AI based on your persona settings.

**Example** (Formality 0.7, Verbosity 0.5, Humor 0.2):
```
You are a professional AI assistant. Your communication style is:
- Formal and respectful, using appropriate honorifics
- Balanced detail - neither too brief nor too verbose
- Serious and straightforward, minimal humor
- Professional tone without emojis
...
```

This helps you understand how your settings affect AI behavior.

---

## Saving and Backing Up

### Local Save

Click "Save" to store persona locally:
- Saved to SQLite database
- Works completely offline
- Persists across app restarts

### Cloud Backup

If logged in with Google:
1. Click "Backup to Cloud"
2. Persona uploaded to Google Drive
3. Stored in folder: "Garden of Eden Backups"
4. File: `eden_backup.json`

### Restoring from Cloud

1. Click "Restore from Cloud"
2. Downloads latest backup from Google Drive
3. Applies settings and saves locally

---

## Tips for Best Results

1. **Start with Defaults**: Use for a week before adjusting
2. **Change One at a Time**: Adjust one parameter, test, then adjust another
3. **Give Feedback**: Use 👍👎 regularly to help AI learn
4. **Save Often**: Save when you find good settings
5. **Use Presets**: Try recommended presets as starting points
6. **Backup to Cloud**: Keep your favorite settings safe
7. **Experiment**: Don't be afraid to try extreme values
8. **Context Matters**: Different tasks may benefit from different personas

---

## Advanced: Parameter Interactions

Some parameters work together:

- **Verbosity + Technical Depth**: High both = detailed technical explanations
- **Empathy + Humor**: High both = warm, friendly tone
- **Proactiveness + Suggestions**: High both = lots of ideas and next steps
- **Code Examples + Technical Depth**: High both = advanced code with explanations
- **Questioning + Proactiveness**: High both = interactive, collaborative

---

## Troubleshooting

### AI Doesn't Follow Persona

**Possible Causes**:
- Settings not saved (click Save button)
- App not restarted after major changes
- Model cache (restart Ollama)

**Solution**:
1. Click Save in Persona Settings
2. Restart the app
3. Test with a new conversation

### Learning Not Working

**Check**:
- Give feedback with 👍👎 buttons
- Wait for 5-10 feedback events
- Click "Optimize Persona" to see suggestions

### Persona Seems Inconsistent

**Explanation**:
- AI has some natural variability
- Different messages may emphasize different parameters
- Learning system gradually improves consistency

**Solution**:
- Give more feedback to refine
- Use more extreme parameter values (0.0-0.2 or 0.8-1.0)

---

## FAQ

**Q: Can I save multiple personas?**
A: Not yet, but it's on the roadmap! For now, backup to cloud before trying new settings.

**Q: Does persona affect response speed?**
A: No, persona only affects content, not speed.

**Q: What happens if I set all parameters to 0?**
A: You'll get a very minimalist AI - short, serious, direct answers with no suggestions.

**Q: What happens if I set all parameters to 1?**
A: You'll get a very verbose, friendly AI - long answers, jokes, emojis, many suggestions.

**Q: Can I reset to defaults?**
A: Yes, click "Reset to Defaults" button in Persona Settings.

**Q: Does the learning system work offline?**
A: Yes! Learning happens locally, no internet required.

---

**Related Pages**:
- [Chat Interface](Chat-Interface)
- [Cloud Backup](Cloud-Backup)
- [User Guide](../docs/USER_GUIDE.md)

---

**Last Updated**: 2025-01-16
**Version**: 3.0.4
