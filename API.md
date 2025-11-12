# API Reference

Complete API documentation for Garden of Eden V3 IPC layer.

---

## Table of Contents

1. [AI Operations](#ai-operations)
2. [Message Operations](#message-operations)
3. [Conversation Operations](#conversation-operations)
4. [File Operations](#file-operations)
5. [Git Operations](#git-operations)
6. [System Operations](#system-operations)
7. [Settings Operations](#settings-operations)

---

## AI Operations

### `window.api.chatStream(args, onToken)`

Send a message to AI and receive streaming response.

**Parameters:**
```typescript
args: {
  message: string;
  conversationId?: string;
  contextLevel?: 1 | 2 | 3;  // Default: 1
}
onToken: (token: string) => void;
```

**Returns:**
```typescript
Promise<{
  conversationId: string;
  messageId: string;
  response: string;
}>
```

**Example:**
```typescript
const response = await window.api.chatStream(
  {
    message: "Hello, how are you?",
    conversationId: "conv-123",
    contextLevel: 1
  },
  (token) => {
    console.log("Received token:", token);
  }
);
```

---

## Message Operations

### `window.api.messageSave(args)`

Save a message to database.

**Parameters:**
```typescript
args: {
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  metadata?: {
    tokens?: number;
    responseTime?: number;
    contextLevel?: 1 | 2 | 3;
  };
}
```

**Returns:**
```typescript
Promise<Message>
```

**Example:**
```typescript
const message = await window.api.messageSave({
  conversationId: "conv-123",
  role: "user",
  content: "Hello!",
  metadata: {
    contextLevel: 1
  }
});
```

### `window.api.messageGetByConversation(args)`

Load messages for a conversation.

**Parameters:**
```typescript
args: {
  conversationId: string;
  limit?: number;   // Default: 100
  offset?: number;  // Default: 0
}
```

**Returns:**
```typescript
Promise<Message[]>
```

### `window.api.messageGetRecent(args)`

Get recent messages for context window.

**Parameters:**
```typescript
args: {
  conversationId: string;
  count?: number;  // Default: 10
}
```

**Returns:**
```typescript
Promise<Message[]>
```

### `window.api.messageUpdateSatisfaction(args)`

Update message satisfaction feedback (thumbs up/down).

**Parameters:**
```typescript
args: {
  messageId: string;
  satisfaction: 'positive' | 'negative';
}
```

**Returns:**
```typescript
Promise<boolean>
```

### `window.api.messageSearch(args)`

Search messages by content.

**Parameters:**
```typescript
args: {
  query: string;
  limit?: number;  // Default: 50
}
```

**Returns:**
```typescript
Promise<Message[]>
```

### `window.api.messageDelete(args)`

Delete a message.

**Parameters:**
```typescript
args: {
  messageId: string;
}
```

**Returns:**
```typescript
Promise<boolean>
```

---

## Conversation Operations

### `window.api.conversationCreate(args)`

Create a new conversation.

**Parameters:**
```typescript
args?: {
  title?: string;
  mode?: 'user-led' | 'ai-led';  // Default: 'user-led'
}
```

**Returns:**
```typescript
Promise<Conversation>
```

**Example:**
```typescript
const conversation = await window.api.conversationCreate({
  title: "Planning my project",
  mode: "user-led"
});
```

### `window.api.conversationGetAll(args)`

Get all conversations.

**Parameters:**
```typescript
args?: {
  limit?: number;   // Default: 50
  offset?: number;  // Default: 0
}
```

**Returns:**
```typescript
Promise<Conversation[]>
```

### `window.api.conversationGetById(args)`

Get a specific conversation.

**Parameters:**
```typescript
args: {
  id: string;
}
```

**Returns:**
```typescript
Promise<Conversation | null>
```

### `window.api.conversationUpdate(args)`

Update conversation properties.

**Parameters:**
```typescript
args: {
  id: string;
  updates: {
    title?: string;
    mode?: 'user-led' | 'ai-led';
  };
}
```

**Returns:**
```typescript
Promise<boolean>
```

### `window.api.conversationDelete(args)`

Delete a conversation (cascade deletes messages).

**Parameters:**
```typescript
args: {
  id: string;
}
```

**Returns:**
```typescript
Promise<boolean>
```

### `window.api.conversationSearch(args)`

Search conversations by title.

**Parameters:**
```typescript
args: {
  query: string;
  limit?: number;  // Default: 20
}
```

**Returns:**
```typescript
Promise<Conversation[]>
```

### `window.api.conversationGetCount()`

Get total conversation count.

**Parameters:** None

**Returns:**
```typescript
Promise<number>
```

---

## File Operations

### `window.api.fileRead(path)`

Read file contents.

**Parameters:**
```typescript
path: string;  // Absolute file path
```

**Returns:**
```typescript
Promise<{ content: string }>
```

### `window.api.fileWrite(path, content)`

Write content to file.

**Parameters:**
```typescript
path: string;
content: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.fileDelete(path)`

Delete a file.

**Parameters:**
```typescript
path: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.fileExists(path)`

Check if file exists.

**Parameters:**
```typescript
path: string;
```

**Returns:**
```typescript
Promise<{ exists: boolean }>
```

### `window.api.fileInfo(path)`

Get file information.

**Parameters:**
```typescript
path: string;
```

**Returns:**
```typescript
Promise<{
  info: {
    size: number;
    isDirectory: boolean;
    isFile: boolean;
    modified: Date;
    created: Date;
    mode: number;
  }
}>
```

### `window.api.fileListDirectory(path)`

List files in directory.

**Parameters:**
```typescript
path: string;
```

**Returns:**
```typescript
Promise<{ files: FileInfo[] }>
```

### `window.api.fileSearch(pattern, options)`

Search for files matching pattern.

**Parameters:**
```typescript
pattern: string;
options?: {
  cwd?: string;
  maxResults?: number;  // Default: 100
  ignore?: string[];    // Glob patterns to ignore
}
```

**Returns:**
```typescript
Promise<{ files: string[] }>
```

### `window.api.fileWorkspaceRoot(startPath)`

Find workspace root (looks for .git, package.json, etc).

**Parameters:**
```typescript
startPath: string;
```

**Returns:**
```typescript
Promise<{ root: string | null }>
```

### `window.api.fileCreateDirectory(path)`

Create directory (recursive).

**Parameters:**
```typescript
path: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.fileCopy(source, destination)`

Copy file.

**Parameters:**
```typescript
source: string;
destination: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.fileMove(source, destination)`

Move/rename file.

**Parameters:**
```typescript
source: string;
destination: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

---

## Git Operations

### `window.api.gitInit(repoPath)`

Initialize Git repository.

**Parameters:**
```typescript
repoPath: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.gitStatus()`

Get repository status.

**Parameters:** None

**Returns:**
```typescript
Promise<{
  status: {
    current: string;
    tracking: string | null;
    ahead: number;
    behind: number;
    files: Array<{
      path: string;
      working_dir: string;
      index: string;
    }>;
    isClean: boolean;
  }
}>
```

### `window.api.gitDiff(filePath?)`

Get uncommitted changes.

**Parameters:**
```typescript
filePath?: string;  // Optional: specific file
```

**Returns:**
```typescript
Promise<{ diff: string }>
```

### `window.api.gitDiffStaged(filePath?)`

Get staged changes.

**Parameters:**
```typescript
filePath?: string;
```

**Returns:**
```typescript
Promise<{ diff: string }>
```

### `window.api.gitAdd(files)`

Stage files for commit.

**Parameters:**
```typescript
files: string | string[];
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.gitReset(files?)`

Unstage files.

**Parameters:**
```typescript
files?: string | string[];
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.gitCommit(message)`

Create commit.

**Parameters:**
```typescript
message: string;
```

**Returns:**
```typescript
Promise<{ commitHash: string }>
```

### `window.api.gitPush(remote?, branch?)`

Push to remote.

**Parameters:**
```typescript
remote?: string;  // Default: 'origin'
branch?: string;  // Default: current branch
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.gitPull(remote?, branch?)`

Pull from remote.

**Parameters:**
```typescript
remote?: string;
branch?: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.gitLog(maxCount?)`

Get commit history.

**Parameters:**
```typescript
maxCount?: number;  // Default: 50
```

**Returns:**
```typescript
Promise<{
  commits: Array<{
    hash: string;
    message: string;
    author_name: string;
    author_email: string;
    date: Date;
  }>
}>
```

### `window.api.gitBranches()`

List all branches.

**Parameters:** None

**Returns:**
```typescript
Promise<{
  branches: Array<{
    name: string;
    current: boolean;
    commit: string;
  }>
}>
```

### `window.api.gitCreateBranch(branchName)`

Create new branch.

**Parameters:**
```typescript
branchName: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.gitCheckout(branchName)`

Switch to branch.

**Parameters:**
```typescript
branchName: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.gitCurrentBranch()`

Get current branch name.

**Parameters:** None

**Returns:**
```typescript
Promise<{ branch: string }>
```

### `window.api.gitRemoteUrl(remote?)`

Get remote URL.

**Parameters:**
```typescript
remote?: string;  // Default: 'origin'
```

**Returns:**
```typescript
Promise<{ url: string }>
```

### `window.api.gitStash(message?)`

Stash changes.

**Parameters:**
```typescript
message?: string;
```

**Returns:**
```typescript
Promise<{ success: boolean }>
```

### `window.api.gitStashPop()`

Apply and remove last stash.

**Parameters:** None

**Returns:**
```typescript
Promise<{ success: boolean }>
```

---

## System Operations

### `window.api.voiceInputStart()`

Start voice recording.

**Parameters:** None

**Returns:**
```typescript
Promise<boolean>
```

**Note:** Currently placeholder, Whisper integration pending.

### `window.api.voiceInputStop()`

Stop voice recording and get transcript.

**Parameters:** None

**Returns:**
```typescript
Promise<string>
```

---

## Settings Operations

### `window.api.getPersona()`

Get current persona settings.

**Parameters:** None

**Returns:**
```typescript
Promise<PersonaSettings>
```

### `window.api.updatePersona(settings)`

Update persona settings.

**Parameters:**
```typescript
settings: PersonaSettings
```

**Returns:**
```typescript
Promise<void>
```

---

## Type Definitions

### Message
```typescript
interface Message {
  id: string;
  conversationId: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    responseTime?: number;
    contextLevel?: 1 | 2 | 3;
    satisfaction?: 'positive' | 'negative' | null;
  };
}
```

### Conversation
```typescript
interface Conversation {
  id: string;
  title: string;
  mode: 'user-led' | 'ai-led';
  createdAt: Date;
  updatedAt: Date;
  messageCount: number;
}
```

### PersonaSettings
```typescript
interface PersonaSettings {
  id?: number;
  formality: number;         // 0-10
  humor: number;            // 0-10
  verbosity: number;        // 0-10
  emojiUsage: number;       // 0-10
  enthusiasm: number;       // 0-10
  empathy: number;          // 0-10
  directness: number;       // 0-10
  technicality: number;     // 0-10
  creativity: number;       // 0-10
  proactivity: number;      // 0-10
  languagePreference: string;      // 'Korean' | 'English'
  codeLanguagePreference: string;  // 'JavaScript' | 'Python' | etc
  patience: number;         // 0-10
  encouragement: number;    // 0-10
  formalityHonorifics: number;  // 0-10
  reasoningDepth: number;   // 0-10
  contextAwareness: number; // 0-10
  // ... 11 more parameters
}
```

---

## Error Handling

All API calls return Promises that can reject with errors. Always use try/catch:

```typescript
try {
  const result = await window.api.someOperation(args);
  // Handle success
} catch (error) {
  console.error('Operation failed:', error);
  // Handle error
}
```

Common errors:
- `Database error`: SQLite operation failed
- `File not found`: File operation on non-existent file
- `Git error`: Git command failed
- `AI model not initialized`: LLM not loaded yet

---

## Platform Information

### `window.api.platform`

Current platform string ('darwin', 'win32', 'linux').

### `window.api.versions`

Object containing version information:
```typescript
{
  node: string;
  chrome: string;
  electron: string;
}
```

---

## Notes

- All file paths must be absolute
- Git operations run in current workspace directory
- AI operations require model to be downloaded first
- Database operations are transactional and safe
- All dates are JavaScript Date objects

---

**For more details, see:**
- `src/preload/index.ts` - Complete API definitions
- `src/main/ipc/` - IPC handler implementations
- `PROJECT_EDEN_V3_MASTER_SPEC.md` - Full specification
