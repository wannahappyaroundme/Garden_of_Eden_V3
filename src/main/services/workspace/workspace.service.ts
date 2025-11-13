/**
 * Workspace Service
 * Manages workspace detection, project analysis, and active editor detection
 */

import * as path from 'path';
import * as fs from 'fs/promises';
import { exec } from 'child_process';
import { promisify } from 'util';
import log from 'electron-log';
import type {
  Workspace,
  WorkspaceType,
  WorkspaceMarkers,
  ProjectAnalysis,
  ProjectDependency,
  EditorType,
  ActiveEditor,
} from '@shared/types/workspace.types';

const execAsync = promisify(exec);

export class WorkspaceService {
  private currentWorkspace: Workspace | null = null;
  private recentWorkspaces: Workspace[] = [];
  private maxRecentWorkspaces = 10;

  constructor() {
    log.info('Workspace service initialized');
  }

  /**
   * Open and register a workspace
   */
  async openWorkspace(rootPath: string): Promise<Workspace> {
    try {
      log.info('Opening workspace', { rootPath });

      // Validate path exists
      const stats = await fs.stat(rootPath);
      if (!stats.isDirectory()) {
        throw new Error('Path is not a directory');
      }

      // Detect workspace type
      const workspaceType = await this.detectWorkspaceType(rootPath);

      // Get workspace name from path
      const name = path.basename(rootPath);

      // Check if workspace already exists in recent list
      const existingWorkspace = this.recentWorkspaces.find(w => w.rootPath === rootPath);

      let workspace: Workspace;
      if (existingWorkspace) {
        // Update existing workspace
        workspace = {
          ...existingWorkspace,
          lastOpenedAt: Date.now(),
        };

        // Update in recent list
        this.recentWorkspaces = this.recentWorkspaces.filter(w => w.rootPath !== rootPath);
        this.recentWorkspaces.unshift(workspace);
      } else {
        // Create new workspace
        workspace = {
          id: `workspace-${Date.now()}`,
          rootPath,
          name,
          workspaceType,
          createdAt: Date.now(),
          lastOpenedAt: Date.now(),
        };

        // Add to recent workspaces
        this.recentWorkspaces.unshift(workspace);
        if (this.recentWorkspaces.length > this.maxRecentWorkspaces) {
          this.recentWorkspaces.pop();
        }
      }

      // Set as current workspace
      this.currentWorkspace = workspace;

      log.info('Workspace opened successfully', { name, workspaceType });
      return workspace;
    } catch (error) {
      log.error('Failed to open workspace', error);
      throw error;
    }
  }

  /**
   * Get current workspace
   */
  getCurrentWorkspace(): Workspace | null {
    return this.currentWorkspace;
  }

  /**
   * Close current workspace
   */
  closeWorkspace(): boolean {
    if (this.currentWorkspace) {
      log.info('Closing workspace', { name: this.currentWorkspace.name });
      this.currentWorkspace = null;
      return true;
    }
    return false;
  }

  /**
   * Get recent workspaces
   */
  getRecentWorkspaces(limit?: number): Workspace[] {
    const workspaces = [...this.recentWorkspaces];
    return limit ? workspaces.slice(0, limit) : workspaces;
  }

  /**
   * Detect workspace type based on project markers
   */
  async detectWorkspaceType(rootPath: string): Promise<WorkspaceType> {
    try {
      const markers = await this.detectWorkspaceMarkers(rootPath);

      // Node.js project
      if (markers.packageJson) {
        return 'nodejs';
      }

      // Python project
      if (markers.requirementsTxt || markers.pyprojectToml || markers.setupPy || markers.venv) {
        return 'python';
      }

      // Rust project
      if (markers.cargoToml) {
        return 'rust';
      }

      // Go project
      if (markers.goMod) {
        return 'go';
      }

      // Java project
      if (markers.pomXml || markers.buildGradle) {
        return 'java';
      }

      // C# project
      if (markers.csproj || markers.sln) {
        return 'csharp';
      }

      // C/C++ project
      if (markers.cmakeLists || markers.makefile) {
        return 'cpp';
      }

      // Generic project (has .git or IDE markers)
      if (markers.gitDir || markers.vscodeDir || markers.ideaDir) {
        return 'generic';
      }

      return 'generic';
    } catch (error) {
      log.error('Failed to detect workspace type', error);
      return 'generic';
    }
  }

  /**
   * Detect workspace markers
   */
  private async detectWorkspaceMarkers(rootPath: string): Promise<WorkspaceMarkers> {
    const markers: WorkspaceMarkers = {};

    const checkFile = async (filename: string): Promise<boolean> => {
      try {
        await fs.access(path.join(rootPath, filename));
        return true;
      } catch {
        return false;
      }
    };

    // Check all markers in parallel
    const results = await Promise.all([
      checkFile('package.json').then(exists => {
        markers.packageJson = exists;
      }),
      checkFile('node_modules').then(exists => {
        markers.nodeModules = exists;
      }),
      checkFile('requirements.txt').then(exists => {
        markers.requirementsTxt = exists;
      }),
      checkFile('pyproject.toml').then(exists => {
        markers.pyprojectToml = exists;
      }),
      checkFile('setup.py').then(exists => {
        markers.setupPy = exists;
      }),
      checkFile('venv').then(exists => {
        markers.venv = exists;
      }),
      checkFile('Cargo.toml').then(exists => {
        markers.cargoToml = exists;
      }),
      checkFile('Cargo.lock').then(exists => {
        markers.cargoLock = exists;
      }),
      checkFile('go.mod').then(exists => {
        markers.goMod = exists;
      }),
      checkFile('go.sum').then(exists => {
        markers.goSum = exists;
      }),
      checkFile('pom.xml').then(exists => {
        markers.pomXml = exists;
      }),
      checkFile('build.gradle').then(exists => {
        markers.buildGradle = exists;
      }),
      checkFile('.git').then(exists => {
        markers.gitDir = exists;
      }),
      checkFile('.vscode').then(exists => {
        markers.vscodeDir = exists;
      }),
      checkFile('.idea').then(exists => {
        markers.ideaDir = exists;
      }),
    ]);

    // Check for .csproj files (may have multiple)
    try {
      const files = await fs.readdir(rootPath);
      markers.csproj = files.some(f => f.endsWith('.csproj'));
      markers.sln = files.some(f => f.endsWith('.sln'));
    } catch {
      // Ignore error
    }

    // Check for CMakeLists.txt or Makefile
    markers.cmakeLists = await checkFile('CMakeLists.txt');
    markers.makefile = await checkFile('Makefile');

    return markers;
  }

  /**
   * Analyze project in depth
   */
  async analyzeProject(rootPath?: string): Promise<ProjectAnalysis> {
    const targetPath = rootPath || this.currentWorkspace?.rootPath;
    if (!targetPath) {
      throw new Error('No workspace is currently open');
    }

    try {
      log.info('Analyzing project', { path: targetPath });

      const workspaceType = await this.detectWorkspaceType(targetPath);
      const markers = await this.detectWorkspaceMarkers(targetPath);

      let dependencies: ProjectDependency[] = [];
      let entryPoints: string[] = [];
      let buildScripts: Record<string, string> = {};
      let testFramework: string | undefined;
      let linter: string | undefined;
      let formatter: string | undefined;
      let techStack: string[] = [];

      // Analyze based on workspace type
      switch (workspaceType) {
        case 'nodejs':
          ({
            dependencies,
            entryPoints,
            buildScripts,
            testFramework,
            linter,
            formatter,
            techStack,
          } = await this.analyzeNodeJsProject(targetPath));
          break;

        case 'python':
          ({
            dependencies,
            entryPoints,
            buildScripts,
            testFramework,
            linter,
            formatter,
            techStack,
          } = await this.analyzePythonProject(targetPath));
          break;

        case 'rust':
          ({
            dependencies,
            entryPoints,
            buildScripts,
            testFramework,
            linter,
            formatter,
            techStack,
          } = await this.analyzeRustProject(targetPath));
          break;

        case 'go':
          ({
            dependencies,
            entryPoints,
            buildScripts,
            testFramework,
            linter,
            formatter,
            techStack,
          } = await this.analyzeGoProject(targetPath));
          break;

        default:
          techStack = ['Generic'];
          break;
      }

      // Count files and estimate size
      const estimatedSize = await this.estimateProjectSize(targetPath);

      const analysis: ProjectAnalysis = {
        workspaceType,
        markers,
        dependencies,
        entryPoints,
        buildScripts,
        testFramework,
        linter,
        formatter,
        techStack,
        estimatedSize,
      };

      log.info('Project analysis complete', {
        type: workspaceType,
        dependencies: dependencies.length,
        entryPoints: entryPoints.length,
      });

      return analysis;
    } catch (error) {
      log.error('Failed to analyze project', error);
      throw error;
    }
  }

  /**
   * Analyze Node.js project
   */
  private async analyzeNodeJsProject(rootPath: string): Promise<{
    dependencies: ProjectDependency[];
    entryPoints: string[];
    buildScripts: Record<string, string>;
    testFramework?: string;
    linter?: string;
    formatter?: string;
    techStack: string[];
  }> {
    const packageJsonPath = path.join(rootPath, 'package.json');
    const dependencies: ProjectDependency[] = [];
    let entryPoints: string[] = [];
    let buildScripts: Record<string, string> = {};
    let testFramework: string | undefined;
    let linter: string | undefined;
    let formatter: string | undefined;
    const techStack: string[] = ['Node.js'];

    try {
      const packageJson = JSON.parse(await fs.readFile(packageJsonPath, 'utf-8'));

      // Extract dependencies
      if (packageJson.dependencies) {
        for (const [name, version] of Object.entries(packageJson.dependencies)) {
          dependencies.push({
            name,
            version: version as string,
            type: 'runtime',
          });
        }
      }

      if (packageJson.devDependencies) {
        for (const [name, version] of Object.entries(packageJson.devDependencies)) {
          dependencies.push({
            name,
            version: version as string,
            type: 'dev',
          });
        }
      }

      // Extract entry points
      if (packageJson.main) {
        entryPoints.push(packageJson.main);
      }
      if (packageJson.module) {
        entryPoints.push(packageJson.module);
      }

      // Extract build scripts
      if (packageJson.scripts) {
        buildScripts = packageJson.scripts;
      }

      // Detect frameworks and tools
      const allDeps = { ...packageJson.dependencies, ...packageJson.devDependencies };

      // Test frameworks
      if (allDeps.jest) testFramework = 'Jest';
      else if (allDeps.mocha) testFramework = 'Mocha';
      else if (allDeps.vitest) testFramework = 'Vitest';

      // Linters
      if (allDeps.eslint) linter = 'ESLint';

      // Formatters
      if (allDeps.prettier) formatter = 'Prettier';

      // Tech stack detection
      if (allDeps.react) techStack.push('React');
      if (allDeps.vue) techStack.push('Vue');
      if (allDeps['@angular/core']) techStack.push('Angular');
      if (allDeps.next) techStack.push('Next.js');
      if (allDeps.express) techStack.push('Express');
      if (allDeps.typescript) techStack.push('TypeScript');
      if (allDeps.electron) techStack.push('Electron');
      if (allDeps.vite) techStack.push('Vite');
      if (allDeps.webpack) techStack.push('Webpack');
    } catch (error) {
      log.error('Failed to analyze Node.js project', error);
    }

    return {
      dependencies,
      entryPoints,
      buildScripts,
      testFramework,
      linter,
      formatter,
      techStack,
    };
  }

  /**
   * Analyze Python project
   */
  private async analyzePythonProject(rootPath: string): Promise<{
    dependencies: ProjectDependency[];
    entryPoints: string[];
    buildScripts: Record<string, string>;
    testFramework?: string;
    linter?: string;
    formatter?: string;
    techStack: string[];
  }> {
    const dependencies: ProjectDependency[] = [];
    const entryPoints: string[] = [];
    const buildScripts: Record<string, string> = {};
    let testFramework: string | undefined;
    let linter: string | undefined;
    let formatter: string | undefined;
    const techStack: string[] = ['Python'];

    try {
      // Try to read requirements.txt
      const requirementsPath = path.join(rootPath, 'requirements.txt');
      try {
        const requirementsContent = await fs.readFile(requirementsPath, 'utf-8');
        const lines = requirementsContent.split('\n');

        for (const line of lines) {
          const trimmed = line.trim();
          if (trimmed && !trimmed.startsWith('#')) {
            const match = trimmed.match(/^([a-zA-Z0-9\-_.]+)([=<>!~]+(.+))?/);
            if (match) {
              dependencies.push({
                name: match[1],
                version: match[3] || undefined,
                type: 'runtime',
              });
            }
          }
        }
      } catch {
        // requirements.txt not found
      }

      // Try to read pyproject.toml
      const pyprojectPath = path.join(rootPath, 'pyproject.toml');
      try {
        const pyprojectContent = await fs.readFile(pyprojectPath, 'utf-8');

        // Simple TOML parsing for dependencies
        if (pyprojectContent.includes('pytest')) testFramework = 'pytest';
        if (pyprojectContent.includes('unittest')) testFramework = 'unittest';
        if (pyprojectContent.includes('pylint')) linter = 'pylint';
        if (pyprojectContent.includes('flake8')) linter = 'flake8';
        if (pyprojectContent.includes('black')) formatter = 'black';

        // Tech stack detection
        if (pyprojectContent.includes('django')) techStack.push('Django');
        if (pyprojectContent.includes('flask')) techStack.push('Flask');
        if (pyprojectContent.includes('fastapi')) techStack.push('FastAPI');
      } catch {
        // pyproject.toml not found
      }

      // Look for common entry points
      const commonEntryPoints = ['main.py', 'app.py', '__main__.py', 'run.py'];
      for (const entry of commonEntryPoints) {
        try {
          await fs.access(path.join(rootPath, entry));
          entryPoints.push(entry);
        } catch {
          // Entry point not found
        }
      }
    } catch (error) {
      log.error('Failed to analyze Python project', error);
    }

    return {
      dependencies,
      entryPoints,
      buildScripts,
      testFramework,
      linter,
      formatter,
      techStack,
    };
  }

  /**
   * Analyze Rust project
   */
  private async analyzeRustProject(rootPath: string): Promise<{
    dependencies: ProjectDependency[];
    entryPoints: string[];
    buildScripts: Record<string, string>;
    testFramework?: string;
    linter?: string;
    formatter?: string;
    techStack: string[];
  }> {
    const dependencies: ProjectDependency[] = [];
    const entryPoints: string[] = [];
    const buildScripts: Record<string, string> = {
      build: 'cargo build',
      test: 'cargo test',
      run: 'cargo run',
    };
    const testFramework = 'Built-in';
    const linter = 'clippy';
    const formatter = 'rustfmt';
    const techStack: string[] = ['Rust'];

    try {
      const cargoTomlPath = path.join(rootPath, 'Cargo.toml');
      const cargoContent = await fs.readFile(cargoTomlPath, 'utf-8');

      // Simple TOML parsing for dependencies
      const dependencySection = cargoContent.match(/\[dependencies\]([\s\S]*?)(?=\[|$)/);
      if (dependencySection) {
        const deps = dependencySection[1].split('\n');
        for (const dep of deps) {
          const match = dep.match(/^([a-zA-Z0-9\-_]+)\s*=\s*["']([^"']+)["']/);
          if (match) {
            dependencies.push({
              name: match[1],
              version: match[2],
              type: 'runtime',
            });
          }
        }
      }

      // Tech stack detection
      if (cargoContent.includes('tokio')) techStack.push('Tokio (async)');
      if (cargoContent.includes('actix-web')) techStack.push('Actix Web');
      if (cargoContent.includes('rocket')) techStack.push('Rocket');
      if (cargoContent.includes('tauri')) techStack.push('Tauri');

      // Entry points
      const srcMain = path.join(rootPath, 'src', 'main.rs');
      const srcLib = path.join(rootPath, 'src', 'lib.rs');
      try {
        await fs.access(srcMain);
        entryPoints.push('src/main.rs');
      } catch {}
      try {
        await fs.access(srcLib);
        entryPoints.push('src/lib.rs');
      } catch {}
    } catch (error) {
      log.error('Failed to analyze Rust project', error);
    }

    return {
      dependencies,
      entryPoints,
      buildScripts,
      testFramework,
      linter,
      formatter,
      techStack,
    };
  }

  /**
   * Analyze Go project
   */
  private async analyzeGoProject(rootPath: string): Promise<{
    dependencies: ProjectDependency[];
    entryPoints: string[];
    buildScripts: Record<string, string>;
    testFramework?: string;
    linter?: string;
    formatter?: string;
    techStack: string[];
  }> {
    const dependencies: ProjectDependency[] = [];
    const entryPoints: string[] = [];
    const buildScripts: Record<string, string> = {
      build: 'go build',
      test: 'go test ./...',
      run: 'go run .',
    };
    const testFramework = 'testing (built-in)';
    const linter = 'golint';
    const formatter = 'gofmt';
    const techStack: string[] = ['Go'];

    try {
      const goModPath = path.join(rootPath, 'go.mod');
      const goModContent = await fs.readFile(goModPath, 'utf-8');

      // Parse dependencies
      const requireSection = goModContent.match(/require\s*\(([\s\S]*?)\)/);
      if (requireSection) {
        const deps = requireSection[1].split('\n');
        for (const dep of deps) {
          const match = dep.trim().match(/^([^\s]+)\s+([^\s]+)/);
          if (match) {
            dependencies.push({
              name: match[1],
              version: match[2],
              type: 'runtime',
            });
          }
        }
      }

      // Tech stack detection
      if (goModContent.includes('gin-gonic/gin')) techStack.push('Gin');
      if (goModContent.includes('gorilla/mux')) techStack.push('Gorilla Mux');
      if (goModContent.includes('fiber')) techStack.push('Fiber');

      // Look for main.go
      const mainGo = path.join(rootPath, 'main.go');
      try {
        await fs.access(mainGo);
        entryPoints.push('main.go');
      } catch {}
    } catch (error) {
      log.error('Failed to analyze Go project', error);
    }

    return {
      dependencies,
      entryPoints,
      buildScripts,
      testFramework,
      linter,
      formatter,
      techStack,
    };
  }

  /**
   * Estimate project size
   */
  private async estimateProjectSize(
    rootPath: string
  ): Promise<{ files: number; linesOfCode?: number }> {
    try {
      // Use find command to count files (excluding node_modules, .git, etc.)
      const { stdout } = await execAsync(
        `find "${rootPath}" -type f ! -path "*/node_modules/*" ! -path "*/.git/*" ! -path "*/venv/*" ! -path "*/target/*" ! -path "*/dist/*" ! -path "*/build/*" | wc -l`,
        { timeout: 5000 }
      );

      const files = parseInt(stdout.trim(), 10);

      return { files };
    } catch (error) {
      log.error('Failed to estimate project size', error);
      return { files: 0 };
    }
  }

  /**
   * Detect active code editor
   */
  async detectActiveEditor(): Promise<ActiveEditor | null> {
    try {
      const platform = process.platform;

      if (platform === 'darwin') {
        // macOS
        return await this.detectActiveEditorMac();
      } else if (platform === 'win32') {
        // Windows
        return await this.detectActiveEditorWindows();
      } else {
        // Linux
        return await this.detectActiveEditorLinux();
      }
    } catch (error) {
      log.error('Failed to detect active editor', error);
      return null;
    }
  }

  /**
   * Detect active editor on macOS
   */
  private async detectActiveEditorMac(): Promise<ActiveEditor | null> {
    try {
      const { stdout } = await execAsync('ps aux | grep -E "(Code|idea|pycharm|goland|sublime)"');

      const editors: { pattern: RegExp; type: EditorType; name: string }[] = [
        { pattern: /Visual Studio Code\.app/i, type: 'vscode', name: 'Visual Studio Code' },
        { pattern: /IntelliJ IDEA\.app/i, type: 'intellij', name: 'IntelliJ IDEA' },
        { pattern: /PyCharm\.app/i, type: 'pycharm', name: 'PyCharm' },
        { pattern: /WebStorm\.app/i, type: 'webstorm', name: 'WebStorm' },
        { pattern: /GoLand\.app/i, type: 'goland', name: 'GoLand' },
        { pattern: /Rider\.app/i, type: 'rider', name: 'Rider' },
        { pattern: /CLion\.app/i, type: 'clion', name: 'CLion' },
        { pattern: /Sublime Text\.app/i, type: 'sublime', name: 'Sublime Text' },
      ];

      for (const editor of editors) {
        if (editor.pattern.test(stdout)) {
          // Extract PID
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (editor.pattern.test(line)) {
              const parts = line.trim().split(/\s+/);
              const pid = parseInt(parts[1], 10);

              return {
                editor: editor.type,
                processName: editor.name,
                pid,
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect active editor on Windows
   */
  private async detectActiveEditorWindows(): Promise<ActiveEditor | null> {
    try {
      const { stdout } = await execAsync('tasklist /FI "STATUS eq running"');

      const editors: { pattern: RegExp; type: EditorType; name: string }[] = [
        { pattern: /Code\.exe/i, type: 'vscode', name: 'Visual Studio Code' },
        { pattern: /idea64\.exe/i, type: 'intellij', name: 'IntelliJ IDEA' },
        { pattern: /pycharm64\.exe/i, type: 'pycharm', name: 'PyCharm' },
        { pattern: /webstorm64\.exe/i, type: 'webstorm', name: 'WebStorm' },
        { pattern: /goland64\.exe/i, type: 'goland', name: 'GoLand' },
        { pattern: /rider64\.exe/i, type: 'rider', name: 'Rider' },
        { pattern: /clion64\.exe/i, type: 'clion', name: 'CLion' },
        { pattern: /sublime_text\.exe/i, type: 'sublime', name: 'Sublime Text' },
      ];

      for (const editor of editors) {
        if (editor.pattern.test(stdout)) {
          // Extract PID
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (editor.pattern.test(line)) {
              const parts = line.trim().split(/\s+/);
              const pid = parseInt(parts[1], 10);

              return {
                editor: editor.type,
                processName: editor.name,
                pid,
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Detect active editor on Linux
   */
  private async detectActiveEditorLinux(): Promise<ActiveEditor | null> {
    try {
      const { stdout } = await execAsync('ps aux | grep -E "(code|idea|pycharm|goland|sublime)"');

      const editors: { pattern: RegExp; type: EditorType; name: string }[] = [
        { pattern: /code/i, type: 'vscode', name: 'Visual Studio Code' },
        { pattern: /idea/i, type: 'intellij', name: 'IntelliJ IDEA' },
        { pattern: /pycharm/i, type: 'pycharm', name: 'PyCharm' },
        { pattern: /webstorm/i, type: 'webstorm', name: 'WebStorm' },
        { pattern: /goland/i, type: 'goland', name: 'GoLand' },
        { pattern: /rider/i, type: 'rider', name: 'Rider' },
        { pattern: /clion/i, type: 'clion', name: 'CLion' },
        { pattern: /sublime/i, type: 'sublime', name: 'Sublime Text' },
      ];

      for (const editor of editors) {
        if (editor.pattern.test(stdout)) {
          // Extract PID
          const lines = stdout.split('\n');
          for (const line of lines) {
            if (editor.pattern.test(line)) {
              const parts = line.trim().split(/\s+/);
              const pid = parseInt(parts[1], 10);

              return {
                editor: editor.type,
                processName: editor.name,
                pid,
              };
            }
          }
        }
      }

      return null;
    } catch (error) {
      return null;
    }
  }

  /**
   * Cleanup resources
   */
  async cleanup(): Promise<void> {
    log.info('Cleaning up workspace service');
    this.currentWorkspace = null;
    this.recentWorkspaces = [];
  }
}

// Singleton instance
let workspaceServiceInstance: WorkspaceService | null = null;

export function getWorkspaceService(): WorkspaceService {
  if (!workspaceServiceInstance) {
    workspaceServiceInstance = new WorkspaceService();
  }
  return workspaceServiceInstance;
}

export async function cleanupWorkspaceService(): Promise<void> {
  if (workspaceServiceInstance) {
    await workspaceServiceInstance.cleanup();
    workspaceServiceInstance = null;
  }
}
