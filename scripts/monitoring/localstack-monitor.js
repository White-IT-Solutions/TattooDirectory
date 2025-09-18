#!/usr/bin/env node

/**
 * LocalStack Service Monitor
 * Provides monitoring and debugging tools for LocalStack services
 */

const axios = require('axios');
const chalk = require('chalk');
const fs = require('fs');
const path = require('path');

class LocalStackMonitor {
  constructor() {
    this.baseUrl = process.env.LOCALSTACK_URL || 'http://localhost:4566';
    this.services = [
      'dynamodb',
      'opensearch', 
      's3',
      'apigateway',
      'lambda',
      'iam',
      'secretsmanager'
    ];
  }

  async checkHealth() {
    try {
      console.log(chalk.blue('🔍 Checking LocalStack health...'));
      
      const response = await axios.get(`${this.baseUrl}/_localstack/health`);
      const health = response.data;
      
      console.log(chalk.green('✅ LocalStack is running'));
      console.log(chalk.gray('─'.repeat(50)));
      
      // Check each service
      for (const service of this.services) {
        const status = health.services[service];
        const statusColor = status === 'running' ? chalk.green : 
                           status === 'starting' ? chalk.yellow : chalk.red;
        
        console.log(`${statusColor(status.padEnd(10))} ${service}`);
      }
      
      console.log(chalk.gray('─'.repeat(50)));
      return true;
    } catch (error) {
      console.log(chalk.red('❌ LocalStack is not accessible'));
      console.log(chalk.red(`Error: ${error.message}`));
      return false;
    }
  }

  async listDynamoDBTables() {
    try {
      console.log(chalk.blue('📊 DynamoDB Tables:'));
      
      const response = await axios.post(`${this.baseUrl}/`, {
        'Action': 'ListTables',
        'Version': '20120810'
      }, {
        headers: {
          'Content-Type': 'application/x-amz-json-1.0',
          'X-Amz-Target': 'DynamoDB_20120810.ListTables'
        }
      });
      
      const tables = response.data.TableNames || [];
      
      if (tables.length === 0) {
        console.log(chalk.yellow('  No tables found'));
      } else {
        for (const table of tables) {
          console.log(chalk.green(`  ✓ ${table}`));
          
          // Get table details
          const describeResponse = await axios.post(`${this.baseUrl}/`, {
            'Action': 'DescribeTable',
            'TableName': table,
            'Version': '20120810'
          }, {
            headers: {
              'Content-Type': 'application/x-amz-json-1.0',
              'X-Amz-Target': 'DynamoDB_20120810.DescribeTable'
            }
          });
          
          const tableDesc = describeResponse.data.Table;
          console.log(chalk.gray(`    Status: ${tableDesc.TableStatus}`));
          console.log(chalk.gray(`    Items: ${tableDesc.ItemCount || 0}`));
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to list DynamoDB tables: ${error.message}`));
    }
  }

  async listS3Buckets() {
    try {
      console.log(chalk.blue('🪣 S3 Buckets:'));
      
      const response = await axios.get(`${this.baseUrl}/`);
      
      // Parse XML response (simplified)
      const buckets = [];
      const bucketMatches = response.data.match(/<Name>([^<]+)<\/Name>/g);
      
      if (bucketMatches) {
        bucketMatches.forEach(match => {
          const bucket = match.replace(/<\/?Name>/g, '');
          buckets.push(bucket);
        });
      }
      
      if (buckets.length === 0) {
        console.log(chalk.yellow('  No buckets found'));
      } else {
        for (const bucket of buckets) {
          console.log(chalk.green(`  ✓ ${bucket}`));
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to list S3 buckets: ${error.message}`));
    }
  }

  async checkOpenSearch() {
    try {
      console.log(chalk.blue('🔍 OpenSearch Status:'));
      
      const response = await axios.get(`${this.baseUrl}/_cluster/health`);
      const health = response.data;
      
      const statusColor = health.status === 'green' ? chalk.green :
                         health.status === 'yellow' ? chalk.yellow : chalk.red;
      
      console.log(`  Status: ${statusColor(health.status)}`);
      console.log(chalk.gray(`  Cluster: ${health.cluster_name}`));
      console.log(chalk.gray(`  Nodes: ${health.number_of_nodes}`));
      console.log(chalk.gray(`  Indices: ${health.active_primary_shards}`));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to check OpenSearch: ${error.message}`));
    }
  }

  async listAPIGateways() {
    try {
      console.log(chalk.blue('🌐 API Gateways:'));
      
      const response = await axios.get(`${this.baseUrl}/restapis`);
      const apis = response.data.items || [];
      
      if (apis.length === 0) {
        console.log(chalk.yellow('  No APIs found'));
      } else {
        for (const api of apis) {
          console.log(chalk.green(`  ✓ ${api.name} (${api.id})`));
          console.log(chalk.gray(`    Description: ${api.description || 'N/A'}`));
        }
      }
    } catch (error) {
      console.log(chalk.red(`❌ Failed to list API Gateways: ${error.message}`));
    }
  }

  async generateReport() {
    const timestamp = new Date().toISOString();
    const report = {
      timestamp,
      health: null,
      services: {}
    };

    console.log(chalk.bold.green('📋 Generating LocalStack Status Report...'));
    console.log(chalk.gray('═'.repeat(60)));

    // Health check
    report.health = await this.checkHealth();
    console.log();

    if (report.health) {
      // DynamoDB
      await this.listDynamoDBTables();
      console.log();

      // S3
      await this.listS3Buckets();
      console.log();

      // OpenSearch
      await this.checkOpenSearch();
      console.log();

      // API Gateway
      await this.listAPIGateways();
      console.log();
    }

    // Save report
    const reportPath = path.join(__dirname, '../logs/localstack-report.json');
    const logDir = path.dirname(reportPath);
    
    if (!fs.existsSync(logDir)) {
      fs.mkdirSync(logDir, { recursive: true });
    }
    
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(chalk.green(`📄 Report saved to: ${reportPath}`));
  }

  async watchServices(interval = 30000) {
    console.log(chalk.blue(`👀 Watching LocalStack services (every ${interval/1000}s)...`));
    console.log(chalk.gray('Press Ctrl+C to stop'));

    const watch = async () => {
      console.clear();
      console.log(chalk.bold.blue(`🕐 ${new Date().toLocaleTimeString()} - LocalStack Monitor`));
      console.log(chalk.gray('═'.repeat(60)));
      
      await this.checkHealth();
      console.log();
      
      setTimeout(watch, interval);
    };

    await watch();

    process.on('SIGINT', () => {
      console.log(chalk.yellow('\n👋 Stopping monitor...'));
      process.exit(0);
    });
  }

  async resetServices() {
    console.log(chalk.yellow('🔄 Resetting LocalStack services...'));
    
    try {
      // Reset DynamoDB
      const tablesResponse = await axios.post(`${this.baseUrl}/`, {
        'Action': 'ListTables',
        'Version': '20120810'
      }, {
        headers: {
          'Content-Type': 'application/x-amz-json-1.0',
          'X-Amz-Target': 'DynamoDB_20120810.ListTables'
        }
      });
      
      const tables = tablesResponse.data.TableNames || [];
      
      for (const table of tables) {
        console.log(chalk.gray(`  Deleting table: ${table}`));
        await axios.post(`${this.baseUrl}/`, {
          'Action': 'DeleteTable',
          'TableName': table,
          'Version': '20120810'
        }, {
          headers: {
            'Content-Type': 'application/x-amz-json-1.0',
            'X-Amz-Target': 'DynamoDB_20120810.DeleteTable'
          }
        });
      }
      
      console.log(chalk.green('✅ LocalStack services reset'));
      
    } catch (error) {
      console.log(chalk.red(`❌ Failed to reset services: ${error.message}`));
    }
  }

  showHelp() {
    console.log(chalk.bold('LocalStack Monitor Usage:'));
    console.log('');
    console.log('  node localstack-monitor.js [command]');
    console.log('');
    console.log('Commands:');
    console.log('  health         Check service health status');
    console.log('  report         Generate comprehensive status report');
    console.log('  watch          Watch services in real-time');
    console.log('  reset          Reset all LocalStack services');
    console.log('  help           Show this help message');
    console.log('');
    console.log('Environment Variables:');
    console.log('  LOCALSTACK_URL    LocalStack endpoint [default: http://localhost:4566]');
  }
}

// CLI handling
const monitor = new LocalStackMonitor();
const command = process.argv[2] || 'health';

switch (command) {
  case 'health':
    monitor.checkHealth();
    break;
  case 'report':
    monitor.generateReport();
    break;
  case 'watch':
    monitor.watchServices();
    break;
  case 'reset':
    monitor.resetServices();
    break;
  case 'help':
  case '--help':
  case '-h':
    monitor.showHelp();
    break;
  default:
    console.log(chalk.red(`Unknown command: ${command}`));
    monitor.showHelp();
    process.exit(1);
}