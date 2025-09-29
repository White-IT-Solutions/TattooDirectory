# App Monitoring Module (15-app-monitoring)

## Overview
The App Monitoring module creates comprehensive application monitoring and alerting infrastructure for the tattoo artist directory platform. It monitors API Gateway, Lambda functions, DynamoDB, and OpenSearch performance, providing operational visibility and automated alerting for application health.

## Purpose
- Monitors application performance and availability across all components
- Provides automated alerting for operational issues and performance degradation
- Creates dashboards for operational visibility and troubleshooting
- Enables proactive identification and resolution of application problems

## Resources Created

### SNS Topics and Subscriptions
- **aws_sns_topic.critical_alerts**: Critical application issues requiring immediate attention
- **aws_sns_topic.warning_alerts**: Warning-level issues for operational awareness
- **aws_sns_topic_subscription.critical_email**: Email notifications for critical alerts
- **aws_sns_topic_subscription.warning_email**: Email notifications for warning alerts

### API Gateway Alarms
- **aws_cloudwatch_metric_alarm.api_gateway_4xx_errors**: Client error rate monitoring
- **aws_cloudwatch_metric_alarm.api_gateway_5xx_errors**: Server error rate monitoring
- **aws_cloudwatch_metric_alarm.api_gateway_latency**: API response time monitoring

### Lambda Function Alarms
- **aws_cloudwatch_metric_alarm.lambda_errors**: Error rate monitoring per function
- **aws_cloudwatch_metric_alarm.lambda_duration**: Execution time monitoring per function

### DynamoDB Alarms
- **aws_cloudwatch_metric_alarm.dynamodb_throttles**: Throttling detection
- **aws_cloudwatch_metric_alarm.dynamodb_errors**: System error monitoring

### OpenSearch Alarms
- **aws_cloudwatch_metric_alarm.opensearch_cluster_status**: Cluster health monitoring
- **aws_cloudwatch_metric_alarm.opensearch_cpu_utilization**: Resource utilization monitoring

### Dashboards and Queries
- **aws_cloudwatch_dashboard.main**: Comprehensive application overview dashboard
- **aws_cloudwatch_query_definition**: Pre-built Log Insights queries for troubleshooting

## Key Features

### Multi-Tier Monitoring
- **API Layer**: API Gateway performance and error rates
- **Compute Layer**: Lambda function execution metrics
- **Data Layer**: DynamoDB and OpenSearch performance
- **Infrastructure Layer**: Resource utilization and health

### Automated Alerting
- **Critical Alerts**: Issues requiring immediate response (5xx errors, system failures)
- **Warning Alerts**: Performance degradation and elevated error rates
- **Escalation**: Different notification channels based on severity

### Operational Dashboards
- **Real-Time Metrics**: Live application performance data
- **Historical Trends**: Performance trends over time
- **Error Analysis**: Error rate breakdowns and patterns

## Alarm Thresholds and Configuration

### API Gateway Monitoring
- **4xx Errors**: >10 errors in 10 minutes (warning level)
- **5xx Errors**: >5 errors in 10 minutes (critical level)
- **Latency**: >5000ms average over 10 minutes (warning level)
- **Evaluation**: 2 consecutive periods for stability

### Lambda Function Monitoring
- **Errors**: >5 errors in 10 minutes per function (critical level)
- **Duration**: >25 seconds average (warning level)
- **Throttles**: Any throttling events (critical level)
- **Memory**: Memory utilization monitoring (warning at 80%)

### DynamoDB Monitoring
- **Throttles**: Any throttled requests (critical level)
- **System Errors**: Any system errors (critical level)
- **Consumed Capacity**: Monitoring for capacity planning
- **Item Size**: Large item size warnings

### OpenSearch Monitoring
- **Cluster Status**: Non-green status (critical level)
- **CPU Utilization**: >80% average over 10 minutes (warning level)
- **Memory Utilization**: >85% JVM heap usage (warning level)
- **Storage**: >80% storage utilization (warning level)

## Dependencies
- **API Module**: Requires API Gateway ID for monitoring
- **Compute Module**: Requires Lambda function names and ARNs
- **App Storage Module**: Requires DynamoDB table name
- **Search Module**: Requires OpenSearch domain name
- **Foundation Module**: Uses main KMS key for SNS encryption

## Outputs
- **critical_alerts_topic_arn**: SNS topic ARN for critical alerts
- **warning_alerts_topic_arn**: SNS topic ARN for warning alerts
- **dashboard_url**: CloudWatch dashboard URL for operational visibility

## Integration with Other Modules

### API Module
- Monitors API Gateway performance metrics
- Tracks request rates, error rates, and latency

### Compute Module
- Monitors all Lambda function executions
- Tracks errors, duration, and concurrency metrics

### App Storage Module
- Monitors DynamoDB table performance
- Tracks read/write capacity and throttling

### Search Module
- Monitors OpenSearch cluster health
- Tracks search performance and resource utilization

## Dashboard Configuration

### Overview Section
- **Request Volume**: API requests per minute
- **Error Rates**: 4xx and 5xx error percentages
- **Response Times**: API latency percentiles (p50, p95, p99)
- **System Health**: Overall system status indicators

### API Gateway Section
- **Request Metrics**: Count, rate, and distribution
- **Error Analysis**: Error breakdown by status code
- **Latency Analysis**: Response time distribution
- **Integration Performance**: Lambda integration metrics

### Lambda Functions Section
- **Execution Metrics**: Invocations, duration, errors per function
- **Concurrency**: Current and maximum concurrent executions
- **Memory Usage**: Memory utilization per function
- **Cold Starts**: Cold start frequency and duration

### Data Layer Section
- **DynamoDB Metrics**: Read/write capacity, throttling, item counts
- **OpenSearch Metrics**: Search latency, indexing rate, cluster health
- **Cache Performance**: Hit rates and response times

## Log Insights Queries

### API Error Analysis
```sql
fields @timestamp, @message, status, errorMessage, errorType
| filter status >= 400
| sort @timestamp desc
| limit 100
```

### Lambda Error Analysis
```sql
fields @timestamp, @message, @requestId
| filter @message like /ERROR/
| sort @timestamp desc
| limit 100
```

### Performance Analysis
```sql
fields @timestamp, responseLength, requestTime, httpMethod, routeKey
| filter responseLength > 1000000 or requestTime > 5000
| sort @timestamp desc
| limit 50
```

## Alert Severity Classification

### Critical Alerts (Immediate Response Required)
- **5xx Errors**: Server errors indicating system failures
- **Lambda Errors**: Function execution failures
- **DynamoDB Throttles**: Database capacity issues
- **OpenSearch Red Status**: Search cluster failures
- **High Error Rates**: >5% error rate sustained

### Warning Alerts (Operational Awareness)
- **4xx Errors**: Client errors indicating potential issues
- **High Latency**: Response times exceeding thresholds
- **Resource Utilization**: High CPU, memory, or storage usage
- **Performance Degradation**: Gradual performance decline

## Notification Configuration

### Email Notifications
- **Critical**: Immediate email to on-call team
- **Warning**: Email to operations team during business hours
- **Format**: Structured email with alarm details and runbook links
- **Frequency**: Immediate for new alarms, suppressed for ongoing issues

### Integration Options
- **Slack**: Real-time notifications to operations channels
- **PagerDuty**: On-call escalation for critical issues
- **Webhook**: Custom integrations with external systems
- **Mobile**: SMS notifications for critical alerts

## Operational Runbooks

### High Error Rate Response
1. **Check Dashboard**: Review error patterns and affected endpoints
2. **Analyze Logs**: Use Log Insights queries to identify root cause
3. **Check Dependencies**: Verify DynamoDB and OpenSearch health
4. **Scale Resources**: Increase Lambda concurrency if needed
5. **Escalate**: Contact development team if application issue

### Performance Degradation Response
1. **Identify Bottleneck**: Review latency metrics across components
2. **Check Capacity**: Verify DynamoDB and OpenSearch capacity
3. **Analyze Queries**: Review slow queries and optimization opportunities
4. **Scale Resources**: Increase provisioned capacity if needed
5. **Optimize**: Implement performance improvements

## Cost Optimization

### Alarm Management
- **Threshold Tuning**: Regular review of alarm thresholds
- **Alarm Consolidation**: Combine related alarms where possible
- **Retention Policies**: Appropriate retention for metrics and logs

### Dashboard Efficiency
- **Widget Optimization**: Use efficient CloudWatch widgets
- **Refresh Rates**: Appropriate refresh intervals for different metrics
- **Data Retention**: Balance visibility with cost

## Operational Benefits
- **Proactive Monitoring**: Early detection of issues before user impact
- **Rapid Troubleshooting**: Pre-built queries and dashboards speed resolution
- **Performance Optimization**: Continuous visibility enables optimization
- **Capacity Planning**: Historical data supports capacity planning decisions

## Cost Implications
- **CloudWatch Alarms**: Per-alarm monthly charges (~$0.10/alarm)
- **Dashboard**: Per-dashboard monthly charges (~$3/dashboard)
- **Log Insights**: Query execution charges
- **SNS**: Per-notification charges for alerts
- **Metrics Storage**: Custom metrics storage charges

## Compliance and Audit
- **Audit Trail**: All monitoring activities logged
- **Retention**: Metrics and logs retained per compliance requirements
- **Reporting**: Regular performance and availability reports
- **SLA Monitoring**: Service level agreement compliance tracking