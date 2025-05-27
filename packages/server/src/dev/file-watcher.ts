import chokidar from "chokidar";
import path from "path";

export interface FileWatcherOptions {
  pagesDir: string;
  apiDir: string;
  publicDir: string;
  onFileChange: (
    filePath: string,
    changeType: "add" | "change" | "unlink",
  ) => void;
}

export class FileWatcher {
  private watcher?: chokidar.FSWatcher;

  constructor(private options: FileWatcherOptions) {}

  start() {
    const { pagesDir, apiDir, publicDir, onFileChange } = this.options;

    // 감시할 디렉토리들
    const watchPaths = [pagesDir, apiDir, publicDir].filter((dir) => dir);

    this.watcher = chokidar.watch(watchPaths, {
      ignored: ["**/node_modules/**", "**/.git/**", "**/dist/**", "**/*.log"],
      ignoreInitial: true,
      persistent: true,
    });

    this.watcher
      .on("add", (filePath) => {
        console.log(`📁 File added: ${this.getRelativePath(filePath)}`);
        onFileChange(filePath, "add");
      })
      .on("change", (filePath) => {
        console.log(`📝 File changed: ${this.getRelativePath(filePath)}`);
        onFileChange(filePath, "change");
      })
      .on("unlink", (filePath) => {
        console.log(`🗑️  File deleted: ${this.getRelativePath(filePath)}`);
        onFileChange(filePath, "unlink");
      })
      .on("error", (error) => {
        console.error("❌ File watcher error:", error);
      });

    console.log("👀 File watcher started");
  }

  stop() {
    if (this.watcher) {
      this.watcher.close();
      console.log("🛑 File watcher stopped");
    }
  }

  private getRelativePath(filePath: string): string {
    return path.relative(process.cwd(), filePath);
  }
}
