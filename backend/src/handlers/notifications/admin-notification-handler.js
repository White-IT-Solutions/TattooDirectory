/**
 * Admin Notification Handler
 * Processes administrative notifications for system events, user reports, and operational alerts
 */

const { SNSClient, PublishCommand } = require("@aws-sdk/client-sns");
const {
  CloudWatchLogsClient,
  PutLogEventsCommand,
} = require("@aws-sdk/client-cloudwatch-logs");

// Initialize AWS clients
const snsClient = new SNSClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT || undefined,
  credentials: process.env.LOCALSTACK_ENDPOINT
    ? {
        accessKeyId: "test",
        secretAccessKey: "test",
      }
    : undefined,
});

const logsClient = new CloudWatchLogsClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.LOCALSTACK_ENDPOINT || undefined,
  credentials: process.env.LOCALSTACK_ENDPOINT
    ? {
        accessKeyId: "test",
        secretAccessKey: "test",
      }
    : undefined,
});

/**
 * Lambda handler for admin notifications
 */
exports.handler = async (event) => {
  console.log("Admin notification event:", JSON.stringify(event, null, 2));

  try {
    const { notificationType, message, severity, metadata } = JSON.parse(
      event.body || "{}"
    );

    // Validate required fields
    if (!notificationType || !message) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
        },
        body: JSON.stringify({
          error: "Missing required fields: notificationType and message",
        }),
      };
    }

    // Process notification based on type
    const result = await processAdminNotification({
      notificationType,
      message,
      severity: severity || "INFO",
      metadata: metadata || {},
      timestamp: new Date().toISOString(),
    });

    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        success: true,
        notificationId: result.notificationId,
        message: "Admin notification processed successfully",
      }),
    };
  } catch (error) {
    console.error("Error processing admin notification:", error);

    // Log error to CloudWatch
    await logToCloudWatch("admin-notifications-error", {
      error: error.message,
      stack: error.stack,
      event: event,
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
      },
      body: JSON.stringify({
        error: "Internal server error processing admin notification",
      }),
    };
  }
};

/**
 * Process admin notification based on type
 */
async function processAdminNotification(notification) {
  const { notificationType, message, severity, metadata, timestamp } =
    notification;
  const notificationId = `admin-${Date.now()}-${Math.random()
    .toString(36)
    .substr(2, 9)}`;

  // Log notification to CloudWatch
  await logToCloudWatch("admin-notifications", {
    notificationId,
    notificationType,
    message,
    severity,
    metadata,
    timestamp,
  });

  // Send SNS notification based on severity
  if (severity === "CRITICAL" || severity === "HIGH") {
    await sendSNSNotification(notificationType, {
      notificationId,
      message,
      severity,
      metadata,
      timestamp,
    });
  }

  // Handle specific notification types
  switch (notificationType) {
    case "USER_REPORT":
      await handleUserReport(notification);
      break;
    case "SYSTEM_ALERT":
      await handleSystemAlert(notification);
      break;
    case "DATA_QUALITY_ISSUE":
      await handleDataQualityIssue(notification);
      break;
    case "SECURITY_INCIDENT":
      await handleSecurityIncident(notification);
      break;
    default:
      console.log(`Unknown notification type: ${notificationType}`);
  }

  return { notificationId };
}

/**
 * Handle user report notifications
 */
async function handleUserReport(notification) {
  const { metadata } = notification;

  console.log("Processing user report:", {
    reportType: metadata.reportType,
    targetId: metadata.targetId,
    reporterId: metadata.reporterId,
  });

  // Additional user report processing logic would go here
  // e.g., flagging content, notifying moderators, etc.
}

/**
 * Handle system alert notifications
 */
async function handleSystemAlert(notification) {
  const { metadata } = notification;

  console.log("Processing system alert:", {
    alertType: metadata.alertType,
    service: metadata.service,
    metric: metadata.metric,
  });

  // Additional system alert processing logic would go here
  // e.g., triggering auto-scaling, alerting on-call engineers, etc.
}

/**
 * Handle data quality issue notifications
 */
async function handleDataQualityIssue(notification) {
  const { metadata } = notification;

  console.log("Processing data quality issue:", {
    dataSource: metadata.dataSource,
    issueType: metadata.issueType,
    affectedRecords: metadata.affectedRecords,
  });

  // Additional data quality processing logic would go here
  // e.g., quarantining bad data, triggering re-processing, etc.
}

/**
 * Handle security incident notifications
 */
async function handleSecurityIncident(notification) {
  const { metadata } = notification;

  console.log("Processing security incident:", {
    incidentType: metadata.incidentType,
    sourceIP: metadata.sourceIP,
    userAgent: metadata.userAgent,
  });

  // Additional security incident processing logic would go here
  // e.g., blocking IPs, alerting security team, etc.
}

/**
 * Send SNS notification
 */
async function sendSNSNotification(topicType, notification) {
  try {
    const topicArn =
      process.env[`SNS_TOPIC_${topicType.toUpperCase()}`] ||
      process.env.SNS_TOPIC_ADMIN_NOTIFICATIONS;

    if (!topicArn) {
      console.warn(`No SNS topic configured for ${topicType}`);
      return;
    }

    const params = {
      TopicArn: topicArn,
      Message: JSON.stringify(notification),
      Subject: `Admin Notification: ${notification.severity} - ${topicType}`,
    };

    const command = new PublishCommand(params);
    const result = await snsClient.send(command);

    console.log("SNS notification sent:", result.MessageId);
    return result;
  } catch (error) {
    console.error("Error sending SNS notification:", error);
    throw error;
  }
}

/**
 * Log to CloudWatch Logs
 */
async function logToCloudWatch(logGroup, logData) {
  try {
    const logGroupName = `/aws/lambda/${logGroup}`;
    const logStreamName = `${
      new Date().toISOString().split("T")[0]
    }-${Math.random().toString(36).substr(2, 9)}`;

    const params = {
      logGroupName,
      logStreamName,
      logEvents: [
        {
          timestamp: Date.now(),
          message: JSON.stringify(logData),
        },
      ],
    };

    const command = new PutLogEventsCommand(params);
    await logsClient.send(command);

    console.log(`Logged to CloudWatch: ${logGroupName}/${logStreamName}`);
  } catch (error) {
    console.error("Error logging to CloudWatch:", error);
    // Don't throw here to avoid breaking the main flow
  }
}
