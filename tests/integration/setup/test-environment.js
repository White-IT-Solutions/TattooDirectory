import { exec } from 'child_process';
import util from 'util';
import path from 'path';

const execPromise = util.promisify(exec);
 
const DOCKER_COMPOSE_FILE = 'dev-tools/docker/docker-compose.local.yml';
const DOCKER_START_COMMAND = `docker-compose -f ${DOCKER_COMPOSE_FILE} up -d`;
const DOCKER_STOP_COMMAND = `docker-compose -f ${DOCKER_COMPOSE_FILE} down --volumes --remove-orphans`;
const DOCKER_HEALTH_CHECK_COMMAND = `docker-compose -f ${DOCKER_COMPOSE_FILE} ps --services --filter "status=running"`;
const NULL_DEVICE = process.platform === 'win32' ? 'NUL' : '/dev/null';
// Check if LocalStack is ready and initialization scripts have completed
const LOCALSTACK_HEALTH_CHECK_COMMAND = `curl --silent --fail --output ${NULL_DEVICE} "http://localhost:4566/_localstack/health"`;
const MAX_RETRIES = 10;
const RETRY_DELAY = 10000; // 10 seconds
const PROJECT_ROOT = path.resolve(process.cwd(), '../../');

/**
 * Executes a shell command and returns a promise.
 * @param {string} command The command to execute.
 * @returns {Promise<{stdout: string, stderr: string}>}
 */
async function runCommand(command, options = {}) {
  try {
    const execOptions = { cwd: PROJECT_ROOT, ...options };
    console.log(`Executing: ${command} in ${execOptions.cwd}`);
    const { stdout, stderr } = await execPromise(command, execOptions);
    if (stderr) {
      console.error(`Stderr for ${command}:\n${stderr}`);
    }
    return { stdout, stderr };
  } catch (error) {
    console.error(`Error executing command: ${command}`);
    console.error(error);
    throw error;
  }
}

/**
 * Starts the Docker environment and waits for it to be healthy.
 */
export async function initializeTestEnvironment() {
  console.log('Starting local Docker environment...');
  await runCommand(DOCKER_START_COMMAND);

  console.log('Waiting for services to become healthy...');
  const servicesToMonitor = ['localstack', 'backend', 'frontend', 'swagger-ui'];

  for (let i = 0; i < MAX_RETRIES; i++) {
    try {
      const { stdout } = await runCommand(DOCKER_HEALTH_CHECK_COMMAND);
      const healthyServices = stdout.trim().split('\n').filter(s => s);
      console.log(`Healthy services found: [${healthyServices.join(', ')}]`);

      const allHealthy = servicesToMonitor.every(service => healthyServices.includes(service));

      if (allHealthy) {
        console.log('All Docker containers are running. Verifying LocalStack is ready...');
        try {
          // Check if LocalStack is healthy
          await runCommand(LOCALSTACK_HEALTH_CHECK_COMMAND);
          console.log('LocalStack is ready.');
          
          // Give additional time for initialization scripts to complete
          console.log('Waiting for LocalStack initialization scripts to complete...');
          console.log('Note: OpenSearch binary download may take several minutes on first run');
          await new Promise(res => setTimeout(res, 60000)); // Wait 60 seconds for init scripts
          
          console.log('LocalStack initialization phase complete.');
          
          // Test backend API connection
          console.log('Testing backend API connection...');
          const { testAPIConnection } = await import('./test-clients.js');
          
          let apiReady = false;
          for (let i = 0; i < 5; i++) {
            apiReady = await testAPIConnection();
            if (apiReady) {
              console.log('Backend API is responding.');
              break;
            }
            console.log(`API connection test ${i + 1}/5 failed, retrying in 5 seconds...`);
            await new Promise(res => setTimeout(res, 5000));
          }
          
          if (!apiReady) {
            console.warn('Backend API is not responding, tests may fail.');
          }
        } catch (lsError) {
          console.log('LocalStack not ready yet, retrying...');
          // Throw an error to trigger the retry mechanism of the parent loop.
          throw new Error('LocalStack not ready');
        }

        console.log('All required services are healthy.');
        return;
      }
    } catch (error) {
      // Ignore errors from the ps command if it fails transiently
    }
    console.log(`Health check attempt ${i + 1} of ${MAX_RETRIES} failed. Retrying in ${RETRY_DELAY / 1000}s...`);
    await new Promise(res => setTimeout(res, RETRY_DELAY));
  }
  throw new Error('Test environment failed to become healthy after multiple retries.');
}

/**
 * Stops the Docker environment.
 */
export async function cleanupTestEnvironment() {
  console.log('Stopping and cleaning up local Docker environment...');
  await runCommand(DOCKER_STOP_COMMAND);
  console.log('Docker environment stopped.');
}