const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const snsClient = new SNSClient({});

exports.handler = async (event) => {
    console.log('Config Compliance Event:', JSON.stringify(event, null, 2));
    
    try {
        const detail = event.detail;
        const newEvaluationResult = detail?.newEvaluationResult;

        // Process only NON_COMPLIANT events for critical rules
        if (newEvaluationResult?.complianceType === 'NON_COMPLIANT') {
            // Load critical rules from environment variables for better flexibility
            const criticalRulesEnv = process.env.CRITICAL_RULES || 's3-bucket-public-access-prohibited,lambda-function-public-access-prohibited,dynamodb-table-encryption-enabled';
            const criticalRules = criticalRulesEnv.split(',').map(rule => rule.trim().toLowerCase());
            
            const ruleName = detail.configRuleName?.toLowerCase();
            if (!ruleName) {
                console.warn('Event is missing configRuleName, skipping.');
                return { statusCode: 200, body: 'Skipped: Missing rule name.' };
            }

            const isCritical = criticalRules.some(rule => ruleName.includes(rule));
            
            if (isCritical) {
                const alertMessage = {
                    severity: 'HIGH',
                    rule: detail.configRuleName,
                    resourceId: detail.resourceId,
                    resourceType: detail.resourceType,
                    awsRegion: event.region,
                    accountId: event.account,
                    compliance: newEvaluationResult.complianceType,
                    annotation: newEvaluationResult.annotation,
                    timestamp: new Date().toISOString(),
                };
                
                const command = new PublishCommand({
                    TopicArn: process.env.SNS_TOPIC_ARN,
                    Subject: `CRITICAL: Config Compliance Violation - ${process.env.PROJECT_NAME}`,
                    Message: JSON.stringify(alertMessage, null, 2)
                });

                await snsClient.send(command);
                
                console.log('Critical compliance violation alert sent:', alertMessage);
            }
        }
        
        return { statusCode: 200, body: 'Success' };
    } catch (error) {
        console.error('Error processing Config compliance event:', error);
        throw error;
    }
};