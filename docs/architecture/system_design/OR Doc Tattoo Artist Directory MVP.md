# **Operations Guide**

# **Operational Runbook: Automated NAT Gateway EIP Rotation**

| Runbook ID: | TAD-MVP-RUN-001 |
| :---- | :---- |
| Title: | Automated NAT Gateway EIP Rotation for Scraper IP Blocks |
| Version: | 1.0 |
| Date: | July 17, 2025 |
| Owner: | Joseph White, AWS Technical Architect |

---

## **1.0 Objective**

The purpose of this runbook is to provide a rapid, semi-automated procedure to restore data aggregation functionality when the system's outbound IP address is suspected of being blocked by target websites (e.g., Instagram).

The procedure involves programmatically replacing the **Elastic IP (EIP)** associated with the primary **NAT Gateway**, effectively changing the scraper fleet's public-facing IP address.

* **System Link:** [Tattoo Artist Directory \- High Level Design](https://www.google.com/search?q=https://link-to-your-hld&authuser=1)  
* **Severity:** **High**. An IP block halts the core data aggregation pipeline.  
* **Expected Resolution Time:** \< 15 minutes.

---

## **2.0 Trigger**

This runbook is initiated when the following CloudWatch Alarm enters the ALARM state:

* **Alarm Name:** HighScraperErrorRateAlarm  
* **Metric:** A custom metric Scraper4xxErrorCount published by the Fargate scraper tasks.  
* **Threshold:** Sum of Scraper4xxErrorCount \> 100 over a 5-minute period.  
* **Notification:** The alarm triggers an **SNS (Simple Notification Service)** topic, which sends a formatted email to the on-call engineer.

---

## **3.0 Triage & Diagnosis**

Before executing the remediation, the on-call engineer **must** perform these diagnostic steps to confirm the issue is an IP block and not a code-level bug.

1. **Acknowledge the Alert:** Acknowledge the alert in your incident management tool.  
2. **Inspect Fargate Logs:**  
   * Navigate to the CloudWatch Log Group for the Fargate scraper tasks (/ecs/tattoo-artist-scraper).  
   * Filter the logs for the last 15 minutes.  
   * **Confirm** a high volume of HTTP 403 Forbidden, HTTP 429 Too Many Requests, or persistent connection timeout errors specifically from the target domains. A code bug would likely present as a different error (e.g., Python stack trace, KeyError).  
3. **Review CloudWatch Metrics:**  
   * View the HighScraperErrorRateAlarm metric graph in CloudWatch.  
   * **Confirm** that the spike in errors is sustained and correlates with a drop in successful data writes to DynamoDB (monitor the SuccessfulPutItem metric).  
4. **Check for Recent Deployments:**  
   * Review the GitHub Actions deployment history.  
   * **Confirm** that no new code was deployed to the Fargate service immediately preceding the alarm.

If the diagnosis confirms an external block, proceed to Remediation. If a code bug is suspected, escalate according to the standard application support runbook.

---

## **4.0 Remediation Procedure**

This procedure uses a pre-configured Lambda function to automate the EIP rotation. A manual fallback is provided if the automated step fails.

#### **4.1 Automated Remediation (Primary)**

1. **Locate the SNS Notification:** Open the email sent by the HighScraperErrorRateAlarm SNS topic.  
2. **Invoke the Lambda Function:** The email will contain a secure, unique URL. Click this link.  
   * **Note:** This is a Lambda Function URL secured with AWS\_IAM authentication. You must be logged into the AWS console with your authorised IAM user in the same browser session for the invocation to succeed.  
3. **Action:** Invoking the URL triggers the rotate-nat-gateway-eip Lambda function. The function will:  
   * Identify the production NAT Gateway.  
   * Allocate a new EIP.  
   * Associate the new EIP with the NAT Gateway.  
   * *Disassociate* but **does not release** the old EIP for 24 hours to allow for rollback.  
   * Send a success/failure notification back to the SNS topic.

#### **4.2 Manual Fallback Procedure (If Lambda Fails)**

If the Lambda function fails or the URL is unavailable, use the provided helper script to perform the rotation via the AWS CLI. This script automates the process of allocating a new EIP and associating it with a specific NAT Gateway.

**Prerequisites:**
- You must have the AWS CLI installed and configured with appropriate permissions (the same permissions as the Lambda function).
- You must have the project repository checked out locally.
- You must know the **NAT Gateway ID** (e.g., `nat-xxxxxxxxxxxxxxxxx`) of the gateway you are targeting. This can be found in the AWS VPC Console or via Terraform outputs.

**Execute the script:**

1.  Navigate to the `scripts/` directory in the project's root folder.
2.  Make the script executable (if it's the first time):
    ```bash
    chmod +x rotate-nat-eip-manual.sh
    ```
3.  Run the script:
    ```bash
    ./rotate-nat-eip-manual.sh <nat_gateway_id>
    ```
    **Example:**
    ```bash
    ./rotate-nat-eip-manual.sh nat-0a1b2c3d4e5f67890
    ```

The script will provide real-time feedback on its progress and will exit with an error if any step fails. If an error occurs after the new EIP is allocated but before it's associated, the script will automatically release the unused EIP to prevent orphaned resources.
---

## **5.0 Validation**

1. **Monitor Logs:** Within 5-10 minutes, check the Fargate task CloudWatch Logs again. The HTTP 4xx errors should cease, and you should see successful data processing logs.  
2. **Monitor Metrics:** The Scraper4xxErrorCount metric in CloudWatch should return to its baseline (near zero).  
3. **Confirm Data Flow:** Check the tattoo-artist-profiles DynamoDB table for new updatedAt timestamps on artist items, confirming that the end-to-end data flow is restored.  
4. **Resolve the Incident:** Once validated, resolve the incident and document the event.

---

## **6.0 Rollback Procedure**

If the EIP rotation worsens the issue or was performed in error, use the provided helper script to re-associate the *previous* EIP and revert the change.

**Prerequisites:**
- You must have the AWS CLI installed and configured with appropriate permissions.
- You must have the project repository checked out locally.
- You must know the **NAT Gateway ID** (e.g., `nat-xxxxxxxxxxxxxxxxx`) of the gateway you are targeting. This can be found in the AWS VPC Console or via Terraform outputs.
- You must know the **Allocation ID** of the EIP you want to roll back to (e.g., `eipalloc-xxxxxxxxxxxxxxxxx`). This ID is provided in the success notification from the initial rotation.

**Execute the script:**

1.  Navigate to the `scripts/` directory in the project's root folder.
2.  Make the script executable (if it's the first time):
    ```bash
    chmod +x rollback-nat-eip-manual.sh
    ```
3.  Run the script, providing the old EIP Allocation ID as an argument:
    ```bash
    ./rollback-nat-eip-manual.sh <nat_gateway_id> <old_eip_allocation_id>
    ```
    **Example:**
    ```bash
    ./rollback-nat-eip-manual.sh nat-0a1b2c3d4e5f67890 eipalloc-0a1b2c3d4e5f67890
    ```

The script will perform the re-association on the specified NAT Gateway, restoring the previous state.
---

## **7.0 Appendix: Implementation Details**

#### **A.1 Lambda IAM Role Policy**

The `rotate-nat-gateway-eip-role` requires the following IAM policy. This policy is configured to follow the principle of least privilege, matching the secure configuration in the Terraform infrastructure-as-code.

**Key Security Controls:**
- The `ec2:AssociateAddress` permission is restricted by a `Condition` to only allow association with a network interface that has the specific tag `Name: TAD-MVP-NAT-Gateway`. This prevents the function from accidentally modifying other critical network resources.
- The `ec2:DisassociateAddress` permission is not included because the `ec2:AssociateAddress` API call automatically handles the disassociation of any previously attached EIP.
- Permissions for `ec2:DescribeNatGateways` and `ec2:AllocateAddress` must use a wildcard (`*`) for the resource, as required by AWS for these specific actions.

**JSON**  
{  
    "Version": "2012-10-17",  
    "Statement": \[  
        {  
            "Sid": "DescribeNATGateway",
            "Effect": "Allow",  
            "Action": "ec2:DescribeNatGateways",
            "Resource": "\*"  
        },  
        {  
            "Sid": "AllocateEIP",
            "Effect": "Allow",
            "Action": "ec2:AllocateAddress",
            "Resource": "\*"
        },
        {
            "Sid": "AssociateEIPWithNATGatewayENI",
            "Effect": "Allow",
            "Action": "ec2:AssociateAddress",
            "Resource": "arn:aws:ec2:eu-west-2:123456789012:network-interface/\*",
            "Condition": {
                "StringEquals": {
                    "ec2:ResourceTag/Name": "TAD-MVP-NAT-Gateway"
                }
            }
        },
        {  
            "Sid": "PublishSNSNotification",
            "Effect": "Allow",  
            "Action": "sns:Publish",  
            "Resource": "arn:aws:sns:eu-west-2:123456789012:TAD-MVP-critical-alerts"  
        }  
    \]  
}

#### **A.2 Lambda Function Code (rotate\_eip.py)**

**Python**  
import boto3  
import os  
import json  
from datetime import datetime

\# Environment variables to be set in Lambda config  
NAT\_GATEWAY\_TAG\_VALUE \= os.environ\['NAT\_GATEWAY\_TAG\_VALUE'\]  
SNS\_TOPIC\_ARN \= os.environ\['SNS\_TOPIC\_ARN'\]

ec2 \= boto3.client('ec2')  
sns \= boto3.client('sns')

def lambda\_handler(event, context):  
    """  
    Finds a NAT Gateway by tag, allocates a new EIP,  
    and associates it, disassociating the old one.  
    """  
    try:  
        \# 1\. Find the NAT Gateway by tag  
        response \= ec2.describe\_nat\_gateways(  
            Filters=\[{'Name': 'tag:Name', 'Values': \[NAT\_GATEWAY\_TAG\_VALUE\]}\]  
        )  
        if not response\['NatGateways'\]:  
            raise Exception(f"No NAT Gateway found with tag Name={NAT\_GATEWAY\_TAG\_VALUE}")

        nat\_gateway \= response\['NatGateways'\]\[0\]  
        nat\_gateway\_id \= nat\_gateway\['NatGatewayId'\]  
          
        if not nat\_gateway.get('NatGatewayAddresses'):  
             raise Exception(f"NAT Gateway {nat\_gateway\_id} has no associated EIPs.")

        old\_association \= nat\_gateway\['NatGatewayAddresses'\]\[0\]  
        network\_interface\_id \= old\_association\['NetworkInterfaceId'\]  
        old\_allocation\_id \= old\_association\['AllocationId'\]

        \# 2\. Allocate a new EIP  
        new\_eip\_response \= ec2.allocate\_address(Domain='vpc')  
        new\_allocation\_id \= new\_eip\_response\['AllocationId'\]  
        new\_public\_ip \= new\_eip\_response\['PublicIp'\]

        \# 3\. Associate the new EIP  
        ec2.associate\_address(  
            AllocationId=new\_allocation\_id,  
            NetworkInterfaceId=network\_interface\_id  
        )

        \# 4\. Disassociate the old EIP (but do not release it for rollback)  
        \# Note: The above association automatically disassociates the old one.  
        \# This is just for logging clarity.

        message \= (  
            f"✅ SUCCESS: Rotated EIP for NAT Gateway {nat\_gateway\_id}.\\n"  
            f"New Public IP: {new\_public\_ip} (Allocation ID: {new\_allocation\_id})\\n"  
            f"Old Allocation ID was: {old\_allocation\_id}. It has been disassociated "  
            f"and will be released automatically in 24 hours if not rolled back."  
        )  
          
        sns.publish(TopicArn=SNS\_TOPIC\_ARN, Subject="SUCCESS: NAT Gateway EIP Rotated", Message=message)

        return {  
            'statusCode': 200,  
            'body': json.dumps({'message': message})  
        }

    except Exception as e:  
        error\_message \= f"❌ FAILED to rotate EIP: {str(e)}"  
        sns.publish(TopicArn=SNS\_TOPIC\_ARN, Subject="FAILED: NAT Gateway EIP Rotation", Message=error\_message)  
        return {  
            'statusCode': 500,  
            'body': json.dumps({'error': error\_message})  
        }

# **Operational Runbook: Cost Anomaly Detection and Response**

| Runbook ID: | TAD-MVP-RUN-002 |
| :---- | :---- |
| Title: | Cost Anomaly Detection and Response |
| Version: | 1.0 |
| Date: | July 17, 2025 |
| Owner: | Joseph White, AWS Technical Architect |

---

## **1.0 Objective**

The purpose of this runbook is to provide a structured procedure for **investigating, identifying, and containing** unexpected increases in daily AWS expenditure. The goal is to rapidly determine the root cause of a cost spike and take corrective action to prevent budget overruns.

* **System Link:** [Tattoo Artist Directory \- High Level Design](https://www.google.com/search?q=https://link-to-your-hld&authuser=1)  
* **Severity:** **Medium** (can be escalated to High if the anomaly is significant).  
* **Expected Investigation Time:** \< 60 minutes.

---

## **2.0 Trigger**

This runbook is initiated when the following **AWS Budgets** alert is triggered:

* **Budget Name:** TAD-MVP-Daily-Spend-Alert  
* **Budget Type:** Cost  
* **Period:** Daily  
* **Threshold:** An alert is triggered when actual daily spend exceeds **£20** (approx. 150% of the projected daily average of £13.33).  
* **Notification:** The budget alert publishes a message to an **SNS topic**, which sends a formatted email to the project owner.

---

## **3.0 Triage & Initial Assessment**

Upon receiving the SNS alert, perform a quick assessment to determine urgency.

1. **Acknowledge the Alert:** Note the time the alert was received.  
2. **Assess the Magnitude:** Navigate to **AWS Budgets** in the console. Review the budget that triggered the alert. Is the forecasted spend slightly over the threshold, or is it trending towards a massive overrun (e.g., 500%+)?  
3. **Identify the Time Window:** Use the budget details page to see when the cost began to spike. Did it happen suddenly in the last hour, or has it been a gradual increase over the day? A sudden, sharp increase is more likely to be a bug or unintended activity.

---

## **4.0 Investigation Procedure**

Follow this drill-down procedure to pinpoint the source of the cost increase.

Step 1: Broad Analysis with AWS Cost Explorer 🔎

This is your primary tool for identifying the source service or region.

1. Open **AWS Cost Explorer** and launch it.  
2. Set the time range to **"Today"**.  
3. In the "Group by" filter on the right, select **"Service"**. This will immediately show which AWS service (e.g., EC2, Fargate, DynamoDB) is responsible for the largest portion of the cost.  
4. Once the service is identified, change the "Group by" filter to **"Usage Type"** and/or **"Region"** to get more specific. For example, for EC2 costs, this will differentiate between DataTransfer-Out-Bytes and BoxUsage:t4g.small.

Step 2: Granular Analysis with AWS Cost and Usage Report (CUR) & Athena 📊

If Cost Explorer is not granular enough (e.g., you need to identify a specific Fargate task or S3 bucket), query the CUR.

1. Navigate to the **Amazon Athena** query editor.  
2. Use a pre-saved query to find the most expensive line items for the day, grouped by resource ID.

SQL

\-- Find top 10 most expensive resources for today  
SELECT  
  line\_item\_resource\_id,  
  product\_servicename,  
  SUM(line\_item\_unblended\_cost) AS daily\_cost  
FROM  
  "your\_cur\_database"."your\_cur\_table"  
WHERE  
  line\_item\_usage\_start\_date \>= date\_trunc('day', current\_date)  
GROUP BY  
  1, 2  
ORDER BY  
  daily\_cost DESC  
LIMIT 10;

This query will pinpoint the exact resource (e.g., a specific NAT Gateway, an OpenSearch domain) driving the cost.

Step 3: Correlate Cost Data with System Activity ↔️

Once the resource is identified, find out why it's incurring cost.

1. Navigate to **AWS CloudTrail \-\> Event history**.  
2. Filter events by the **Resource name** (identified in Step 2\) and the time window of the cost spike.  
3. Look for relevant API calls. For example, if Fargate is the cause, look for a high volume of RunTask or StopTask events. If a new EBS volume is the cause, look for the CreateVolume event to see who created it.  
4. Check the relevant service logs in **CloudWatch Logs** for unusual activity or errors.

---

## **5.0 Common Causes & Remediation Steps**

Here are common scenarios for this specific architecture and how to address them.

| Scenario | Diagnosis | Remediation |
| :---- | :---- | :---- |
| **A. Fargate Scraper Loop** | Cost Explorer shows a spike in **Fargate CPU/memory usage**. CloudTrail shows thousands of RunTask events. | **1\. Disable the Trigger:** Immediately disable the EventBridge rule that starts the Step Functions workflow. **2\. Stop the Tasks:** Manually stop all running Fargate tasks for the scraper service. **3\. Investigate & Roll Back:** Identify the faulty code commit and roll back the application. |
| **B. Unintended Data Transfer** | Cost Explorer shows a spike in DataTransfer-Out-Bytes or DataTransfer-Regional-Bytes. | **1\. Check VPC Flow Logs:** Identify the source and destination of the traffic. **2\. Remediate:** The most common cause is a service in one AZ communicating with another AZ. Ensure all components of a workflow (e.g., Fargate, DynamoDB) are co-located or use **VPC Gateway Endpoints** for S3 and DynamoDB to keep traffic off the public internet. |
| **C. Logging Spam** | Cost Explorer shows a spike in **CloudWatch** costs, specifically DataProcessing-Logs or TimedStorage-ByteHrs. | **1\. Check Log Groups:** Find the Log Group with the highest ingestion volume. **2\. Revert Code:** Identify and roll back the code change that introduced verbose logging. **3\. Adjust Retention:** Temporarily lower the log group's retention period to purge the excess data. |
| **D. Malicious Activity** | Unfamiliar resources are found in the CUR (e.g., large EC2 instances for crypto mining). Unrecognized API calls in CloudTrail. | **IMMEDIATE ESCALATION.** This is a security incident. **1\. Isolate:** Immediately revoke the suspected IAM role's permissions by attaching a DenyAll policy. **2\. Report:** Contact the security lead. **3\. Follow Security IRP:** Do not proceed without guidance. |

---

## **6.0 Post-Incident Review**

After any cost anomaly is resolved:

1. **Document the RCA:** Create a brief "lessons learned" document detailing the root cause.  
2. **Refine Alarms:** If the anomaly could have been caught earlier, create a more specific CloudWatch metric alarm (e.g., alarm on Fargate task count).  
3. **Adjust Budget:** If the increased spend was legitimate (e.g., due to planned growth), adjust the AWS Budgets threshold to reflect the new baseline.
