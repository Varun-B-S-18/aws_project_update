export interface MemoryExtractionResult {
  shouldSave: boolean;
  content?: string;
  category?: 'preference' | 'project' | 'identity' | 'education' | 'general';
}

/**
 * Evaluates whether a user message represents a permanent fact, preference,
 * project detail, or identity attribute, rather than a transient question or greeting.
 */
export function extractMemoryFromMessage(message: string): MemoryExtractionResult {
  const trimmed = message.trim();

  // 1. Never store questions as personal memories
  if (trimmed.endsWith('?')) {
    return { shouldSave: false };
  }

  const lower = trimmed.toLowerCase();

  // Question beginnings
  const questionStarters = [
    'what',
    'who',
    'where',
    'when',
    'why',
    'how',
    'which',
    'is it',
    'can you',
    'could you',
    'tell me',
    'explain',
    'describe',
    'calculate',
    'define',
    'list',
    'write a',
    'generate',
    'show me',
  ];

  for (const starter of questionStarters) {
    if (lower.startsWith(starter + ' ') || lower === starter) {
      return { shouldSave: false };
    }
  }

  // Common transient greetings & pleasantries
  const transientPhrases = [
    'hi',
    'hello',
    'hey',
    'good morning',
    'good afternoon',
    'good evening',
    'thanks',
    'thank you',
    'bye',
    'goodbye',
    'ping',
    'test',
    'ok',
    'okay',
    'yes',
    'no',
  ];

  if (transientPhrases.includes(lower)) {
    return { shouldSave: false };
  }

  // 2. Explicit memory commands
  const explicitPrefixes = [
    'remember that',
    'remember:',
    'please remember that',
    'please remember:',
    'remember',
    'note that',
    'keep in mind that',
    'don\'t forget that',
  ];

  for (const prefix of explicitPrefixes) {
    if (lower.startsWith(prefix + ' ') || lower.startsWith(prefix + ':')) {
      const extracted = trimmed.substring(prefix.length).replace(/^[:\s]+/, '').trim();
      if (extracted.length > 3) {
        return {
          shouldSave: true,
          content: extracted,
          category: 'general',
        };
      }
    }
  }

  // 3. Project & Secret code names (e.g., "My secret project code name is BlueTiger739")
  if (lower.includes('project') || lower.includes('code name') || lower.includes('secret')) {
    return {
      shouldSave: true,
      content: trimmed,
      category: 'project',
    };
  }

  // 4. Preferences & Habits (e.g., "I prefer C++ for DSA", "I prefer dark mode")
  if (lower.includes('i prefer') || lower.includes('my preference is') || lower.includes('i like to use') || lower.includes('i always use')) {
    return {
      shouldSave: true,
      content: trimmed,
      category: 'preference',
    };
  }

  // 5. Personal identity, Education & Career (e.g., "My name is Varun", "I study at Dayananda Sagar University", "I am learning AWS")
  if (
    lower.startsWith('my name is') ||
    lower.startsWith('i am currently studying') ||
    lower.includes('studying at') ||
    lower.includes('i study at') ||
    lower.includes('i am learning') ||
    lower.includes('i am building') ||
    lower.includes('i work as') ||
    lower.includes('i work at') ||
    lower.includes('i live in')
  ) {
    const category = lower.includes('study') || lower.includes('university') ? 'education' : 'identity';
    return {
      shouldSave: true,
      content: trimmed,
      category,
    };
  }

  // 6. Generic declarative statements that contain first-person statements with substance
  if (
    (lower.startsWith('i am ') || lower.startsWith('i have ') || lower.startsWith('my ')) &&
    trimmed.length >= 15 &&
    !trimmed.includes('?')
  ) {
    return {
      shouldSave: true,
      content: trimmed,
      category: 'general',
    };
  }

  return { shouldSave: false };
}

