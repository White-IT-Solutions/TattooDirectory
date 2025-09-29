#!/usr/bin/env node

/**
 * Complete Documentation Pipeline Runner
 * Orchestrates the entire documentation consolidation process in the correct order
 * Now with interactive stage selection
 */

const { execSync } = require('child_process');
const path = require('path');
const readline = require('readline');

// Set the correct project root
const projectRoot = path.resolve(__dirname, '../../..');

/**
 * Execute a command and handle errors
 */
function executeCommand(command, description, dryRun = false) {
  console.log(`\n🔄 ${description}...`);
  console.log(`   Command: ${command}`);
  
  if (dryRun) {
    console.log(`   🔍 DRY RUN: Would execute command (skipping actual execution)`);
    return true;
  }
  
  try {
    execSync(command, { 
      cwd: projectRoot, 
      stdio: 'inherit',
      encoding: 'utf8'
    });
    console.log(`✅ ${description} completed successfully`);
    return true;
  } catch (error) {
    console.error(`❌ ${description} failed:`, error.message);
    return false;
  }
}

/**
 * Create readline interface for user input
 */
function createReadlineInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

/**
 * Ask user a yes/no question
 */
function askQuestion(rl, question) {
  return new Promise((resolve) => {
    rl.question(question, (answer) => {
      const normalizedAnswer = answer.toLowerCase().trim();
      resolve(normalizedAnswer === 'y' || normalizedAnswer === 'yes');
    });
  });
}

/**
 * Display stage selection menu
 */
async function selectStages(pipeline) {
  const rl = createReadlineInterface();
  const selectedStages = [];
  
  console.log('\n📋 Documentation Pipeline Stages');
  console.log('=' .repeat(50));
  console.log('Select which stages you want to run (y/n for each):\n');
  
  for (let i = 0; i < pipeline.length; i++) {
    const stage = pipeline[i];
    console.log(`${i + 1}. ${stage.phase}`);
    console.log(`   ${stage.description}`);
    console.log(`   Steps: ${stage.steps.length}`);
    
    let selected = false;
    try {
      selected = await askQuestion(rl, `   Run this stage? (y/n): `);
    } catch (error) {
      console.log(`   ⚠️  Input error, skipping stage: ${error.message}`);
      selected = false;
    }
    
    if (selected) {
      selectedStages.push(i);
      console.log(`   ✅ Selected`);
    } else {
      console.log(`   ⏭️  Skipped`);
    }
    console.log('');
  }
  
  rl.close();
  return selectedStages;
}

/**
 * Check if we can run in interactive mode
 */
function canRunInteractive() {
  // Check if stdin is a TTY (terminal) and not being piped
  return process.stdin.isTTY && process.stdout.isTTY;
}

/**
 * Main pipeline execution
 */
async function runCompletePipeline() {
  // Check for command line arguments
  const args = process.argv.slice(2);
  const dryRun = args.includes('--dry-run') || args.includes('-n');
  const forceAll = args.includes('--all') || args.includes('-a');
  
  // Check for stage selection arguments
  const stageArgs = args.filter(arg => arg.startsWith('--stages='));
  const hasStageSelection = stageArgs.length > 0;
  
  const interactive = !forceAll && !hasStageSelection && canRunInteractive();
  
  console.log('🚀 Documentation Pipeline Runner\n');
  if (dryRun) {
    console.log('🔍 DRY RUN MODE: Commands will be displayed but not executed\n');
  }
  
  if (!interactive && !forceAll) {
    console.log('⚠️  Non-interactive environment detected (piped input or non-TTY)');
    console.log('   Running all stages. Use --all to suppress this message.\n');
  }
  
  const startTime = Date.now();
  let successCount = 0;
  let totalSteps = 0;

  const pipeline = [
    // Phase 1: Foundation Setup
    {
      phase: 'Foundation Setup',
      description: 'Creates foundation files and runs initial analysis',
      steps: [
        {
          command: 'npm run docs:generate-foundation',
          description: 'Generate foundation documentation files'
        },
        {
          command: 'npm run docs:gap-analysis',
          description: 'Run initial gap analysis'
        }
      ]
    },
    
    // Phase 2: Legacy Migration & Cleanup
    {
      phase: 'Legacy Migration & Cleanup',
      description: 'Migrates legacy content and fixes outdated references',
      steps: [
        {
          command: 'cd scripts/documentation-analysis && npm run migrate-legacy',
          description: 'Migrate legacy commands and documentation'
        },
        {
          command: 'cd scripts/documentation-analysis && npm run cross-reference',
          description: 'Cross-reference commands for consistency'
        },
        {
          command: 'npm run docs:fix-outdated',
          description: 'Fix outdated content references'
        },
        {
          command: 'cd scripts/documentation-analysis && npm run cleanup',
          description: 'Clean up old documentation (dry run)'
        }
      ]
    },
    
    // Phase 3: Main Consolidation
    {
      phase: 'Main Consolidation',
      description: 'Runs the core consolidation engine to merge documentation',
      steps: [
        {
          command: 'npm run docs:consolidate',
          description: 'Run main consolidation pipeline'
        }
      ]
    },
    
    // Phase 4: Post-Consolidation Enhancement
    {
      phase: 'Post-Consolidation Enhancement',
      description: 'Creates missing docs, maps files, and handles duplicates',
      steps: [
        {
          command: 'npm run docs:create-missing',
          description: 'Create missing documentation files'
        },
        {
          command: 'npm run docs:file-mapping',
          description: 'Generate file mapping analysis'
        },
        {
          command: 'npm run docs:consolidate-duplicates',
          description: 'Consolidate duplicate files'
        },
        {
          command: 'npm run docs:delete-duplicates',
          description: 'Delete confirmed duplicates'
        }
      ]
    },
    
    // Phase 5: Final Validation
    {
      phase: 'Final Validation',
      description: 'Validates all documentation and generates health reports',
      steps: [
        {
          command: 'npm run docs:validate',
          description: 'Validate consolidated documentation'
        },
        {
          command: 'cd scripts/documentation-analysis && npm run validate',
          description: 'Run comprehensive validation'
        },
        {
          command: 'npm run docs:health-summary',
          description: 'Generate final health summary'
        }
      ]
    }
  ];

  // Select stages to run
  let selectedStageIndices;
  
  if (hasStageSelection) {
    // Parse stage selection from command line
    const stageNumbers = stageArgs[0].split('=')[1].split(',').map(n => parseInt(n.trim()) - 1);
    selectedStageIndices = stageNumbers.filter(n => n >= 0 && n < pipeline.length);
    
    console.log('🎯 Stages selected via --stages argument:');
    selectedStageIndices.forEach(index => {
      console.log(`   • ${pipeline[index].phase}`);
    });
    console.log('');
    
    if (selectedStageIndices.length === 0) {
      console.log('❌ No valid stages selected. Use --stages=1,2,3 format');
      return;
    }
  } else if (interactive) {
    try {
      selectedStageIndices = await selectStages(pipeline);
      
      if (selectedStageIndices.length === 0) {
        console.log('❌ No stages selected. Exiting...');
        return;
      }
      
      console.log('🎯 Selected Stages:');
      selectedStageIndices.forEach(index => {
        console.log(`   • ${pipeline[index].phase}`);
      });
      console.log('');
    } catch (error) {
      console.log('⚠️  Interactive selection failed, running all stages');
      console.log(`   Error: ${error.message}\n`);
      selectedStageIndices = pipeline.map((_, index) => index);
    }
  } else {
    selectedStageIndices = pipeline.map((_, index) => index);
    const reason = forceAll ? '--all flag detected' : 'non-interactive environment';
    console.log(`🎯 Running all stages (${reason})\n`);
  }

  console.log('=' .repeat(60));

  // Execute selected pipeline stages
  for (const stageIndex of selectedStageIndices) {
    const phase = pipeline[stageIndex];
    console.log(`\n📋 Phase: ${phase.phase}`);
    console.log('-' .repeat(40));
    
    for (const step of phase.steps) {
      totalSteps++;
      const success = executeCommand(step.command, step.description, dryRun);
      if (success) {
        successCount++;
      } else if (!dryRun) {
        console.log(`\n⚠️  Step failed but continuing with pipeline...`);
      }
    }
  }

  // Final summary
  const duration = Date.now() - startTime;
  const successRate = Math.round((successCount / totalSteps) * 100);
  
  console.log('\n' + '=' .repeat(60));
  console.log('📊 Pipeline Execution Summary');
  console.log('=' .repeat(60));
  console.log(`⏱️  Total Duration: ${Math.round(duration / 1000)}s`);
  console.log(`✅ Successful Steps: ${successCount}/${totalSteps} (${successRate}%)`);
  
  if (dryRun) {
    console.log('\n🔍 DRY RUN COMPLETED');
    console.log('   • All commands were displayed but not executed');
    console.log('   • Run without --dry-run flag to execute the pipeline');
    console.log('   • Review the commands above to ensure they look correct');
  } else if (successCount === totalSteps) {
    console.log('\n🎉 Complete documentation pipeline executed successfully!');
    console.log('\n📍 Next Steps:');
    console.log('   • Review the consolidated documentation in docs/consolidated/');
    console.log('   • Check the gap analysis report for any remaining issues');
    console.log('   • Update any broken references manually if needed');
    console.log('   • Consider running: npm run docs:health-summary');
  } else {
    console.log('\n⚠️  Pipeline completed with some failures');
    console.log('   • Check the error messages above');
    console.log('   • Some steps may need manual intervention');
    console.log('   • You can re-run individual commands as needed');
  }
  
  console.log('\n📚 Available Documentation Commands:');
  console.log('   • npm run docs:validate - Validate documentation');
  console.log('   • npm run docs:health-summary - Check documentation health');
  console.log('   • npm run docs:gap-analysis - Analyze documentation gaps');
  console.log('   • npm run docs:file-mapping - Compare original vs consolidated');
}

// Handle command line arguments
const args = process.argv.slice(2);

if (args.includes('--help') || args.includes('-h')) {
  console.log(`
Interactive Documentation Pipeline Runner

Usage:
  npm run docs:pipeline [options]

This script runs the documentation consolidation pipeline with interactive stage selection.

Available Stages:

1. Foundation Setup
   • Generate foundation documentation files from templates
   • Run initial gap analysis to identify missing content

2. Legacy Migration & Cleanup
   • Migrate legacy commands and documentation
   • Cross-reference commands for consistency
   • Fix outdated content references
   • Clean up old documentation files

3. Main Consolidation
   • Run the core consolidation engine
   • Merge duplicate documentation files
   • Resolve content conflicts

4. Post-Consolidation Enhancement
   • Create missing documentation files
   • Generate file mapping analysis
   • Consolidate remaining duplicate files
   • Delete confirmed duplicates

5. Final Validation
   • Validate all consolidated documentation
   • Run comprehensive validation checks
   • Generate final health summary report

Options:
  --all, -a        Run all stages without interactive selection
  --stages=1,2,3   Run specific stages by number (comma-separated)
  --dry-run, -n    Show commands that would be executed without running them
  --help, -h       Show this help message

Interactive Mode (default):
  • Select which stages to run using y/n prompts
  • Skip stages you don't need
  • Perfect for targeted fixes or partial runs

Examples:
  npm run docs:pipeline                    # Interactive mode
  npm run docs:pipeline --all              # Run all stages
  npm run docs:pipeline --stages=1,3,5     # Run stages 1, 3, and 5
  npm run docs:pipeline --dry-run          # Preview commands only
  npm run docs:pipeline --all -n           # Preview all commands
  npm run docs:pipeline --stages=2,4 -n    # Preview stages 2 and 4

The pipeline will continue even if individual steps fail, providing a summary at the end.
`);
  process.exit(0);
}

// Run the pipeline
runCompletePipeline().catch(error => {
  console.error('\n❌ Pipeline execution failed:', error.message);
  process.exit(1);
});