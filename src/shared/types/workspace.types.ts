/**
 * Workspace Types
 * Type definitions for workspace detection and project analysis
 */

export type WorkspaceType =
  | 'nodejs'
  | 'python'
  | 'rust'
  | 'go'
  | 'java'
  | 'csharp'
  | 'cpp'
  | 'generic';

export type EditorType =
  | 'vscode'
  | 'intellij'
  | 'pycharm'
  | 'webstorm'
  | 'goland'
  | 'rider'
  | 'clion'
  | 'sublime'
  | 'vim'
  | 'neovim'
  | 'emacs'
  | 'atom'
  | null;

export interface WorkspaceMarkers {
  // Node.js
  packageJson?: boolean;
  nodeModules?: boolean;

  // Python
  requirementsTxt?: boolean;
  pyprojectToml?: boolean;
  setupPy?: boolean;
  venv?: boolean;

  // Rust
  cargoToml?: boolean;
  cargoLock?: boolean;

  // Go
  goMod?: boolean;
  goSum?: boolean;

  // Java
  pomXml?: boolean;
  buildGradle?: boolean;

  // C#
  csproj?: boolean;
  sln?: boolean;

  // C/C++
  cmakeLists?: boolean;
  makefile?: boolean;

  // Git
  gitDir?: boolean;

  // IDE
  vscodeDir?: boolean;
  ideaDir?: boolean;
}

export interface ProjectDependency {
  name: string;
  version?: string;
  type: 'runtime' | 'dev' | 'peer';
}

export interface ProjectAnalysis {
  workspaceType: WorkspaceType;
  markers: WorkspaceMarkers;
  dependencies: ProjectDependency[];
  entryPoints: string[];
  buildScripts: Record<string, string>;
  testFramework?: string;
  linter?: string;
  formatter?: string;
  techStack: string[];
  estimatedSize: {
    files: number;
    linesOfCode?: number;
  };
}

export interface Workspace {
  id: string;
  rootPath: string;
  name: string;
  workspaceType: WorkspaceType;
  createdAt: number;
  lastOpenedAt: number;
  metadata?: {
    description?: string;
    version?: string;
    author?: string;
  };
}

export interface ActiveEditor {
  editor: EditorType;
  processName: string;
  pid: number;
  workspacePath?: string;
}

export interface WorkspaceChannels {
  'workspace:open': {
    request: { rootPath: string };
    response: { workspace: Workspace };
  };
  'workspace:current': {
    request: void;
    response: { workspace: Workspace | null };
  };
  'workspace:analyze': {
    request: { rootPath?: string };
    response: { analysis: ProjectAnalysis };
  };
  'workspace:recent': {
    request: { limit?: number };
    response: { workspaces: Workspace[] };
  };
  'workspace:detect-type': {
    request: { rootPath: string };
    response: { workspaceType: WorkspaceType };
  };
  'workspace:detect-editor': {
    request: void;
    response: { editor: ActiveEditor | null };
  };
  'workspace:close': {
    request: void;
    response: { success: boolean };
  };
}
