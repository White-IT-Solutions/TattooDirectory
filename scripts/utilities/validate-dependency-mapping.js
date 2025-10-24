#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

// Load the dependency analysis report
const reportPath = path.join(__dirname, '..', 'dependency-analysis-report.json');
const mappingPath = path.join(__dirname, '..', 'IMPORT_UPDATE_MAPPING.json');

function validateDependencyMapping() {
    console.log('🔍 Validating dependency mapping completeness...\n');
    
    // Load reports
    const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
    const mapping = JSON.parse(fs.readFileSync(mappingPath, 'utf8'));
    
    let validationErrors = [];
    let validationWarnings = [];
    
    // Check that all files with local imports have mapping entries
    report.fileAnalysis.forEach(fileAnalysis => {
        if (fileAnalysis.localImports > 0) {
            const fileName = fileAnalysis.file;
            
            // Skip core system files that stay in root
            const coreFiles = ['data-cli.js', 'data-config.js', 'package.json', 'jest.config.js'];
            if (coreFiles.includes(fileName)) {
                if (!mapping.coreSystemFiles[fileName]) {
                    validationErrors.push(`Missing core system file mapping for: ${fileName}`);
                }
                return;
            }
            
            // Check if file has mapping entry
            if (!mapping.importUpdateMapping[fileName]) {
                validationErrors.push(`Missing import mapping for file: ${fileName}`);
                return;
            }
            
            const fileMappingEntry = mapping.importUpdateMapping[fileName];
            
            // Validate that all local imports are accounted for
            const localImports = fileAnalysis.imports.filter(imp => 
                imp.path.startsWith('./') || 
                imp.path.startsWith('../') ||
                !imp.path.includes('/')
            );
            
            localImports.forEach(localImport => {
                // Skip Node.js built-in modules
                const builtInModules = ['fs', 'path', 'crypto', 'os', 'events', 'http', 'https', 'url', 'child_process', 'perf_hooks'];
                if (builtInModules.includes(localImport.path)) {
                    return;
                }
                
                // Check if this import has an update mapping
                const hasMapping = fileMappingEntry.importUpdates.some(update => 
                    update.currentImport === localImport.path
                );
                
                if (!hasMapping) {
                    // Check if it's a reference to a file that will also move
                    const referencedFile = resolveImportToFile(localImport.path, fileName);
                    if (referencedFile && mapping.importUpdateMapping[referencedFile]) {
                        validationWarnings.push(
                            `File ${fileName} imports ${localImport.path} (line ${localImport.line}) but no mapping found. ` +
                            `Referenced file: ${referencedFile}`
                        );
                    }
                }
            });
        }
    });
    
    // Check cross-references are properly handled
    Object.entries(report.crossReferences).forEach(([fileName, refs]) => {
        if (refs.dependencies.length > 0) {
            refs.dependencies.forEach(dep => {
                // Check if the dependency relationship is properly mapped
                const fileMapping = mapping.importUpdateMapping[fileName] || mapping.coreSystemFiles[fileName];
                if (fileMapping && fileMapping.importUpdates) {
                    const hasDepMapping = fileMapping.importUpdates.some(update => 
                        update.currentImport === dep.importPath
                    );
                    
                    if (!hasDepMapping && !isBuiltInModule(dep.importPath)) {
                        validationWarnings.push(
                            `Cross-reference not mapped: ${fileName} depends on ${dep.file} via "${dep.importPath}"`
                        );
                    }
                }
            });
        }
    });
    
    // Validate package.json script updates
    const packageJsonPath = path.join(__dirname, '..', 'package.json');
    if (fs.existsSync(packageJsonPath)) {
        const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
        
        Object.entries(packageJson.scripts || {}).forEach(([scriptName, scriptCommand]) => {
            // Check if script references files that will move
            const referencesMovedFile = Object.keys(mapping.importUpdateMapping).some(fileName => {
                return scriptCommand.includes(fileName);
            });
            
            if (referencesMovedFile) {
                const hasScriptUpdate = mapping.packageJsonScriptUpdates[scriptName];
                if (!hasScriptUpdate) {
                    validationWarnings.push(
                        `Package.json script "${scriptName}" may reference moved files but no update mapping found: ${scriptCommand}`
                    );
                }
            }
        });
    }
    
    // Report results
    console.log('📊 VALIDATION RESULTS');
    console.log('====================\n');
    
    if (validationErrors.length === 0) {
        console.log('✅ No critical validation errors found!');
    } else {
        console.log(`❌ Found ${validationErrors.length} critical errors:`);
        validationErrors.forEach((error, index) => {
            console.log(`   ${index + 1}. ${error}`);
        });
    }
    
    if (validationWarnings.length === 0) {
        console.log('✅ No validation warnings!');
    } else {
        console.log(`\n⚠️  Found ${validationWarnings.length} warnings:`);
        validationWarnings.forEach((warning, index) => {
            console.log(`   ${index + 1}. ${warning}`);
        });
    }
    
    // Summary statistics
    console.log('\n📈 MAPPING STATISTICS');
    console.log('====================');
    console.log(`Total files analyzed: ${report.fileAnalysis.length}`);
    console.log(`Files with import mappings: ${Object.keys(mapping.importUpdateMapping).length}`);
    console.log(`Core system files: ${Object.keys(mapping.coreSystemFiles).length}`);
    console.log(`Package.json script updates: ${Object.keys(mapping.packageJsonScriptUpdates).length}`);
    
    const totalImportUpdates = Object.values(mapping.importUpdateMapping)
        .reduce((sum, fileMapping) => sum + fileMapping.importUpdates.length, 0);
    console.log(`Total import updates required: ${totalImportUpdates}`);
    
    console.log('\n✅ Dependency mapping validation complete!');
    
    return {
        errors: validationErrors,
        warnings: validationWarnings,
        isValid: validationErrors.length === 0
    };
}

function resolveImportToFile(importPath, fromFile) {
    // Simple resolution logic - in a real scenario this would be more sophisticated
    if (importPath.startsWith('./') || importPath.startsWith('../')) {
        const resolved = path.resolve(path.dirname(fromFile), importPath);
        const relativePath = path.relative(__dirname, resolved);
        
        // Try different extensions
        const possibleFiles = [
            relativePath,
            relativePath + '.js',
            relativePath + '.mjs',
            path.basename(relativePath),
            path.basename(relativePath) + '.js',
            path.basename(relativePath) + '.mjs'
        ];
        
        // Check which one exists in our file list
        const allFiles = [
            'backward-compatibility.js', 'build-enhanced-components.js', 'comparison-validator.js',
            'validation/comprehensive-studio-validation.js', 'comprehensive-system-test.js', 'config-validator.js',
            'database-seeder.js', 'docker-compatibility.js', 'documentation-consolidation-pipeline.js',
            'error-handler.js', 'final-cleanup.js', 'final-validation-test.js', 'frontend-sync-processor.js',
            'health-monitor.js', 'image-processor.js', 'incremental-processor.js', 'migrate-data-model.js',
            'migration-utility.js', 'pipeline-engine.js', 'platform-utils.js', 'run-frontend-sync-error-tests.js',
            'run-incremental-processing-tests.js', 'run-performance-tests.js', 'seed-opensearch.mjs',
            'state-manager.js', 'state-tracker.js', 'test-cross-service-synchronization.js',
            'test-docker-cross-platform-compatibility.js', 'test-documentation-system.js',
            'test-force-refresh-mode.js', 'test-frontend-sync-error-handling-simple.js',
            'test-frontend-sync-processor-error-handling.js', 'test-incremental-processing.js',
            'test-npm-commands.js', 'test-performance-regression.js', 'test-studio-image-processor.js',
            'unified-data-manager.js', 'validation/validate-studio-data-e2e.js', 'data-cli.js', 'data-config.js'
        ];
        
        for (const possible of possibleFiles) {
            if (allFiles.includes(possible)) {
                return possible;
            }
        }
    }
    
    return null;
}

function isBuiltInModule(modulePath) {
    const builtInModules = [
        'fs', 'path', 'crypto', 'os', 'events', 'http', 'https', 'url', 
        'child_process', 'perf_hooks', 'aws-sdk', 'sharp'
    ];
    return builtInModules.includes(modulePath);
}

// Run validation if called directly
if (require.main === module) {
    validateDependencyMapping();
}

module.exports = { validateDependencyMapping };