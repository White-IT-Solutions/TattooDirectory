export interface WorkerTask {
  id: string;
  type: string;
  data: any;
  priority?: number;
  timeout?: number;
}
e
xport interface WorkerResult {
  taskId: string;
  success: boolean;
  data?: any;
  error?: string;
  duration: number;
}

export interface WorkerPoolOptions {
  maxWorkers: number;
  taskTimeout: number;
  retryAttempts: number;
  queueLimit: number;
}

export class WorkerPool {
  private workers: Worker[] = [];
  private taskQueue: WorkerTask[] = [];
  private activeTasks = new Map<string, WorkerTask>();
  private results = new Map<string, WorkerResult>();
  private options: WorkerPoolOptions;

  constructor(options: Partial<WorkerPoolOptions> = {}) {
    this.options = {
      maxWorkers: options.maxWorkers || 4,
      taskTimeout: options.taskTimeout || 30000,
      retryAttempts: options.retryAttempts || 2,
      queueLimit: options.queueLimit || 100
    };
  }

  async initialize(): Promise<void> {
    // Initialize worker pool
    for (let i = 0; i < this.options.maxWorkers; i++) {
      const worker = new Worker(new URL('./worker.js', import.meta.url));
      worker.onmessage = this.handleWorkerMessage.bind(this);
      worker.onerror = this.handleWorkerError.bind(this);
      this.workers.push(worker);
    }
  }

  async addTask(task: WorkerTask): Promise<string> {
    if (this.taskQueue.length >= this.options.queueLimit) {
      throw new Error('Task queue limit exceeded');
    }

    // Add default priority if not specified
    if (task.priority === undefined) {
      task.priority = 0;
    }

    // Sort by priority (higher priority first)
    const insertIndex = this.taskQueue.findIndex(t => (t.priority || 0) < (task.priority || 0));
    if (insertIndex === -1) {
      this.taskQueue.push(task);
    } else {
      this.taskQueue.splice(insertIndex, 0, task);
    }

    this.processQueue();
    return task.id;
  }

  async getResult(taskId: string, timeout: number = 30000): Promise<WorkerResult> {
    return new Promise((resolve, reject) => {
      const checkResult = () => {
        const result = this.results.get(taskId);
        if (result) {
          this.results.delete(taskId);
          resolve(result);
          return;
        }

        // Check if task is still active
        if (this.activeTasks.has(taskId)) {
          setTimeout(checkResult, 100);
          return;
        }

        reject(new Error(`Task ${taskId} not found or timed out`));
      };

      // Set timeout
      setTimeout(() => {
        reject(new Error(`Task ${taskId} timed out after ${timeout}ms`));
      }, timeout);

      checkResult();
    });
  }

  async executeTask(task: WorkerTask): Promise<WorkerResult> {
    const taskId = await this.addTask(task);
    return this.getResult(taskId, task.timeout || this.options.taskTimeout);
  }

  async executeBatch(tasks: WorkerTask[]): Promise<WorkerResult[]> {
    const taskIds = await Promise.all(tasks.map(task => this.addTask(task)));
    return Promise.all(taskIds.map(id => this.getResult(id)));
  }

  private processQueue(): void {
    while (this.taskQueue.length > 0 && this.activeTasks.size < this.options.maxWorkers) {
      const task = this.taskQueue.shift();
      if (task) {
        this.executeTaskOnWorker(task);
      }
    }
  }

  private executeTaskOnWorker(task: WorkerTask): void {
    const availableWorker = this.workers.find(w => !Array.from(this.activeTasks.values()).some(t => t.id === task.id));
    
    if (availableWorker) {
      this.activeTasks.set(task.id, task);
      
      // Set task timeout
      const timeout = setTimeout(() => {
        this.handleTaskTimeout(task.id);
      }, task.timeout || this.options.taskTimeout);

      availableWorker.postMessage({
        taskId: task.id,
        type: task.type,
        data: task.data,
        timeout: timeout
      });
    }
  }

  private handleWorkerMessage(event: MessageEvent): void {
    const { taskId, success, data, error, duration } = event.data;
    
    const result: WorkerResult = {
      taskId,
      success,
      data,
      error,
      duration
    };

    this.results.set(taskId, result);
    this.activeTasks.delete(taskId);
    
    // Process next task in queue
    this.processQueue();
  }

  private handleWorkerError(error: ErrorEvent): void {
    console.error('Worker error:', error);
    // Handle worker errors and potentially restart workers
  }

  private handleTaskTimeout(taskId: string): void {
    const task = this.activeTasks.get(taskId);
    if (task) {
      const result: WorkerResult = {
        taskId,
        success: false,
        error: `Task timed out after ${task.timeout || this.options.taskTimeout}ms`,
        duration: task.timeout || this.options.taskTimeout
      };

      this.results.set(taskId, result);
      this.activeTasks.delete(taskId);
      this.processQueue();
    }
  }

  async shutdown(): Promise<void> {
    // Wait for active tasks to complete or timeout
    const activeTaskIds = Array.from(this.activeTasks.keys());
    if (activeTaskIds.length > 0) {
      await Promise.allSettled(
        activeTaskIds.map(id => this.getResult(id, 5000).catch(() => null))
      );
    }

    // Terminate all workers
    this.workers.forEach(worker => worker.terminate());
    this.workers = [];
    this.taskQueue = [];
    this.activeTasks.clear();
    this.results.clear();
  }

  getStats() {
    return {
      activeWorkers: this.workers.length,
      queuedTasks: this.taskQueue.length,
      activeTasks: this.activeTasks.size,
      pendingResults: this.results.size
    };
  }
}

export default WorkerPool;