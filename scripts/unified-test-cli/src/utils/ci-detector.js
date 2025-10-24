/**
 * CI Environment Detection Utility
 * 
 * Detects various CI/CD environments and provides appropriate configuration
 * for non-interactive execution and machine-readable output.
 */

class CIDetector {
  constructor() {
    this.ciEnvironments = {
      'github': {
        name: 'GitHub Actions',
        envVars: ['GITHUB_ACTIONS', 'GITHUB_WORKFLOW'],
        features: ['junit-xml', 'json-output', 'artifacts']
      },
      'jenkins': {
        name: 'Jenkins',
        envVars: ['JENKINS_URL', 'BUILD_NUMBER'],
        features: ['junit-xml', 'json-output', 'artifacts']
      },
      'gitlab': {
        name: 'GitLab CI',
        envVars: ['GITLAB_CI', 'CI_JOB_ID'],
        features: ['junit-xml', 'json-output', 'artifacts']
      },
      'azure': {
        name: 'Azure DevOps',
        envVars: ['AZURE_HTTP_USER_AGENT', 'TF_BUILD'],
        features: ['junit-xml', 'json-output', 'artifacts']
      },
      'circleci': {
        name: 'CircleCI',
        envVars: ['CIRCLECI', 'CIRCLE_BUILD_NUM'],
        features: ['junit-xml', 'json-output', 'artifacts']
      },
      'travis': {
        name: 'Travis CI',
        envVars: ['TRAVIS', 'TRAVIS_BUILD_ID'],
        features: ['junit-xml', 'json-output', 'artifacts']
      },
      'buildkite': {
        name: 'Buildkite',
        envVars: ['BUILDKITE', 'BUILDKITE_BUILD_ID'],
        features: ['junit-xml', 'json-output', 'artifacts']
      },
      'teamcity': {
        name: 'TeamCity',
        envVars: ['TEAMCITY_VERSION', 'BUILD_NUMBER'],
        features: ['junit-xml', 'json-output', 'artifacts']
      }
    };
  }

  /**
   * Detect if running in CI environment
   * @returns {boolean} True if CI environment detected
   */
  isCI() {
    // Check for generic CI environment variables
    if (process.env.CI === 'true' || process.env.CONTINUOUS_INTEGRATION === 'true') {
      return true;
    }

    // Check for specific CI environments
    return this.detectCIEnvironment() !== null;
  }

  /**
   * Detect specific CI environment
   * @returns {Object|null} CI environment details or null if not detected
   */
  detectCIEnvironment() {
    for (const [key, config] of Object.entries(this.ciEnvironments)) {
      if (this._hasAnyEnvVar(config.envVars)) {
        return {
          type: key,
          name: config.name,
          features: config.features,
          buildId: this._getBuildId(key),
          buildUrl: this._getBuildUrl(key),
          branch: this._getBranch(key),
          commit: this._getCommit(key)
        };
      }
    }

    return null;
  }

  /**
   * Get CI-specific configuration
   * @returns {Object} Configuration object for CI environment
   */
  getCIConfig() {
    const ciEnv = this.detectCIEnvironment();
    
    if (!ciEnv) {
      return {
        isCI: false,
        nonInteractive: false,
        outputFormats: ['console'],
        artifactDir: './test-results',
        exitOnFailure: false
      };
    }

    return {
      isCI: true,
      nonInteractive: true,
      environment: ciEnv,
      outputFormats: this._getOutputFormats(ciEnv),
      artifactDir: this._getArtifactDir(ciEnv),
      exitOnFailure: true,
      parallelDefault: this._getParallelDefault(ciEnv),
      timeout: this._getTimeout(ciEnv)
    };
  }

  /**
   * Get appropriate exit code for CI environment
   * @param {boolean} success - Whether tests passed
   * @param {number} failedTests - Number of failed tests
   * @returns {number} Exit code
   */
  getExitCode(success, failedTests = 0) {
    if (success) {
      return 0; // Success
    }

    // Different exit codes for different failure types
    if (failedTests > 0) {
      return 1; // Test failures
    }

    return 2; // Other errors (environment, configuration, etc.)
  }

  /**
   * Check if environment supports specific feature
   * @param {string} feature - Feature to check
   * @returns {boolean} True if feature is supported
   */
  supportsFeature(feature) {
    const ciEnv = this.detectCIEnvironment();
    return ciEnv ? ciEnv.features.includes(feature) : false;
  }

  /**
   * Get environment-specific artifact paths
   * @returns {Object} Artifact path configuration
   */
  getArtifactPaths() {
    const ciEnv = this.detectCIEnvironment();
    const baseDir = this._getArtifactDir(ciEnv);

    return {
      testResults: `${baseDir}/test-results`,
      coverage: `${baseDir}/coverage`,
      reports: `${baseDir}/reports`,
      junit: `${baseDir}/junit.xml`,
      json: `${baseDir}/results.json`
    };
  }

  // Private methods

  _hasAnyEnvVar(envVars) {
    return envVars.some(envVar => process.env[envVar]);
  }

  _getBuildId(ciType) {
    const buildIdMap = {
      'github': process.env.GITHUB_RUN_ID,
      'jenkins': process.env.BUILD_NUMBER,
      'gitlab': process.env.CI_JOB_ID,
      'azure': process.env.BUILD_BUILDID,
      'circleci': process.env.CIRCLE_BUILD_NUM,
      'travis': process.env.TRAVIS_BUILD_ID,
      'buildkite': process.env.BUILDKITE_BUILD_ID,
      'teamcity': process.env.BUILD_NUMBER
    };

    return buildIdMap[ciType] || 'unknown';
  }

  _getBuildUrl(ciType) {
    const urlMap = {
      'github': process.env.GITHUB_SERVER_URL && process.env.GITHUB_REPOSITORY && process.env.GITHUB_RUN_ID
        ? `${process.env.GITHUB_SERVER_URL}/${process.env.GITHUB_REPOSITORY}/actions/runs/${process.env.GITHUB_RUN_ID}`
        : process.env.GITHUB_RUN_ID ? `https://github.com/actions/runs/${process.env.GITHUB_RUN_ID}` : null,
      'jenkins': process.env.BUILD_URL,
      'gitlab': process.env.CI_JOB_URL,
      'azure': process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI && process.env.SYSTEM_TEAMPROJECT && process.env.BUILD_BUILDID
        ? `${process.env.SYSTEM_TEAMFOUNDATIONCOLLECTIONURI}${process.env.SYSTEM_TEAMPROJECT}/_build/results?buildId=${process.env.BUILD_BUILDID}`
        : null,
      'circleci': process.env.CIRCLE_BUILD_URL,
      'travis': process.env.TRAVIS_BUILD_WEB_URL,
      'buildkite': process.env.BUILDKITE_BUILD_URL,
      'teamcity': process.env.BUILD_URL
    };

    return urlMap[ciType] || null;
  }

  _getBranch(ciType) {
    const branchMap = {
      'github': process.env.GITHUB_REF_NAME,
      'jenkins': process.env.GIT_BRANCH,
      'gitlab': process.env.CI_COMMIT_REF_NAME,
      'azure': process.env.BUILD_SOURCEBRANCHNAME,
      'circleci': process.env.CIRCLE_BRANCH,
      'travis': process.env.TRAVIS_BRANCH,
      'buildkite': process.env.BUILDKITE_BRANCH,
      'teamcity': process.env.BUILD_VCS_BRANCH
    };

    return branchMap[ciType] || process.env.GIT_BRANCH || 'unknown';
  }

  _getCommit(ciType) {
    const commitMap = {
      'github': process.env.GITHUB_SHA,
      'jenkins': process.env.GIT_COMMIT,
      'gitlab': process.env.CI_COMMIT_SHA,
      'azure': process.env.BUILD_SOURCEVERSION,
      'circleci': process.env.CIRCLE_SHA1,
      'travis': process.env.TRAVIS_COMMIT,
      'buildkite': process.env.BUILDKITE_COMMIT,
      'teamcity': process.env.BUILD_VCS_NUMBER
    };

    return commitMap[ciType] || process.env.GIT_COMMIT || 'unknown';
  }

  _getOutputFormats(ciEnv) {
    const formats = ['console'];
    
    if (ciEnv.features.includes('junit-xml')) {
      formats.push('junit');
    }
    
    if (ciEnv.features.includes('json-output')) {
      formats.push('json');
    }
    
    return formats;
  }

  _getArtifactDir(ciEnv) {
    if (!ciEnv) {
      return './test-results';
    }

    // Environment-specific artifact directories
    const artifactDirMap = {
      'github': process.env.RUNNER_TEMP ? `${process.env.RUNNER_TEMP}/test-results` : './test-results',
      'jenkins': process.env.WORKSPACE ? `${process.env.WORKSPACE}/test-results` : './test-results',
      'gitlab': './test-results',
      'azure': process.env.AGENT_TEMPDIRECTORY ? `${process.env.AGENT_TEMPDIRECTORY}/test-results` : './test-results',
      'circleci': './test-results',
      'travis': './test-results',
      'buildkite': './test-results',
      'teamcity': './test-results'
    };

    return artifactDirMap[ciEnv.type] || './test-results';
  }

  _getParallelDefault(ciEnv) {
    // Enable parallel execution by default in CI environments
    // that support it well
    const parallelFriendly = ['github', 'gitlab', 'azure', 'circleci'];
    return parallelFriendly.includes(ciEnv.type);
  }

  _getTimeout(ciEnv) {
    // Longer timeouts in CI environments
    const timeoutMap = {
      'github': 30 * 60 * 1000, // 30 minutes
      'jenkins': 45 * 60 * 1000, // 45 minutes
      'gitlab': 30 * 60 * 1000,  // 30 minutes
      'azure': 30 * 60 * 1000,   // 30 minutes
      'circleci': 20 * 60 * 1000, // 20 minutes
      'travis': 20 * 60 * 1000,   // 20 minutes
      'buildkite': 30 * 60 * 1000, // 30 minutes
      'teamcity': 45 * 60 * 1000   // 45 minutes
    };

    return timeoutMap[ciEnv.type] || 15 * 60 * 1000; // Default 15 minutes
  }
}

export { CIDetector };