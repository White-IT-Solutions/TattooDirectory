// Worker script for handling performance test tasks
self.onmessage = async function(event) {
  const { taskId, type, data, timeout } = event.data;
  const startTime = performance.now();

  try {
    let result;

    switch (type) {
      case 'screenshot':
        result = await handleScreenshotTask(data);
        break;
      case 'performance-audit':
        result = await handlePerformanceAudit(data);
        break;
      case 'accessibility-check':
        result = await handleAccessibilityCheck(data);
        break;
      case 'visual-comparison':
        result = await handleVisualComparison(data);
        break;
      case 'memory-analysis':
        result = await handleMemoryAnalysis(data);
        break;
      default:
        throw new Error(`Unknown task type: ${type}`);
    }

    const duration = performance.now() - startTime;

    self.postMessage({
      taskId,
      success: true,
      data: result,
      duration
    });

  } catch (error) {
    const duration = performance.now() - startTime;
    
    self.postMessage({
      taskId,
      success: false,
      error: error.message,
      duration
    });
  }
};

async function handleScreenshotTask(data) {
  const { url, viewport, options } = data;
  
  // Simulate screenshot capture
  await new Promise(resolve => setTimeout(resolve, 100));
  
  return {
    url,
    viewport,
    timestamp: Date.now(),
    size: Math.floor(Math.random() * 1000000) + 500000 // Simulate file size
  };
}

async function handlePerformanceAudit(data) {
  const { url, metrics } = data;
  
  // Simulate performance audit
  await new Promise(resolve => setTimeout(resolve, 200));
  
  return {
    url,
    metrics: {
      lcp: Math.random() * 3000 + 1000,
      fid: Math.random() * 100 + 50,
      cls: Math.random() * 0.2,
      fcp: Math.random() * 2000 + 500,
      ttfb: Math.random() * 500 + 100
    },
    score: Math.floor(Math.random() * 40) + 60 // 60-100 score
  };
}

async function handleAccessibilityCheck(data) {
  const { url, rules } = data;
  
  // Simulate accessibility check
  await new Promise(resolve => setTimeout(resolve, 150));
  
  const violations = Math.floor(Math.random() * 5);
  
  return {
    url,
    violations,
    issues: Array.from({ length: violations }, (_, i) => ({
      id: `issue-${i}`,
      impact: ['minor', 'moderate', 'serious', 'critical'][Math.floor(Math.random() * 4)],
      description: `Accessibility issue ${i + 1}`,
      element: `element-${i}`
    })),
    passed: violations === 0
  };
}

async function handleVisualComparison(data) {
  const { baselineImage, currentImage, threshold } = data;
  
  // Simulate visual comparison
  await new Promise(resolve => setTimeout(resolve, 300));
  
  const difference = Math.random() * 0.1; // 0-10% difference
  
  return {
    difference,
    passed: difference < (threshold || 0.05),
    diffImage: `diff-${Date.now()}.png`,
    regions: Math.floor(Math.random() * 3) // Number of different regions
  };
}

async function handleMemoryAnalysis(data) {
  const { url, duration } = data;
  
  // Simulate memory analysis
  await new Promise(resolve => setTimeout(resolve, 250));
  
  return {
    url,
    peakMemory: Math.floor(Math.random() * 100) + 50, // MB
    averageMemory: Math.floor(Math.random() * 80) + 30, // MB
    memoryLeaks: Math.random() > 0.8, // 20% chance of memory leak
    gcEvents: Math.floor(Math.random() * 10) + 1
  };
}

self.onerror = function(error) {
  console.error('Worker error:', error);
};