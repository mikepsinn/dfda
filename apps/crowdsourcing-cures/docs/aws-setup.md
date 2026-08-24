# AWS Credentials Setup Guide

## 1. Create an IAM User

1. Sign in to the [AWS IAM Console](https://console.aws.amazon.com/iam/)
2. Navigate to "Users" in the left sidebar
3. Click "Create user"
4. Enter a user name (e.g., "lightsail-deployer")
5. Click "Next"

## 2. Set Permissions

1. On the "Set permissions" page, select "Attach policies directly"
2. Create a new policy by clicking "Create Policy"
3. Switch to the JSON editor and paste this policy:

```json
{
    "Version": "2012-10-17",
    "Statement": [
        {
            "Effect": "Allow",
            "Action": [
                "lightsail:*"
            ],
            "Resource": "*"
        },
        {
            "Effect": "Allow",
            "Action": [
                "ecr:GetAuthorizationToken",
                "ecr:BatchCheckLayerAvailability",
                "ecr:GetDownloadUrlForLayer",
                "ecr:BatchGetImage",
                "ecr:PutImage",
                "ecr:InitiateLayerUpload",
                "ecr:UploadLayerPart",
                "ecr:CompleteLayerUpload"
            ],
            "Resource": "*"
        }
    ]
}
```

4. Click "Review policy"
5. Name it "LightsailContainerDeploymentPolicy"
6. Click "Create policy"
7. Go back to the user creation tab and refresh the policy list
8. Search for and select "LightsailContainerDeploymentPolicy"
9. Click "Next"
10. Click "Create user"

## 3. Create Access Keys

1. Click on the newly created user
2. Go to the "Security credentials" tab
3. Under "Access keys", click "Create access key"
4. Select "Command Line Interface (CLI)"
5. Acknowledge the recommendation and click "Next"
6. (Optional) Add a description tag
7. Click "Create access key"
8. **IMPORTANT**: This is the only time you'll see the secret key! Save both:
   - Access Key ID (e.g., `AKIAXXXXXXXXXXXXXXXX`)
   - Secret Access Key (e.g., `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`)

## 4. Configure AWS CLI

1. Open PowerShell
2. Run:
```powershell
aws configure
```
3. Enter the following:
   - AWS Access Key ID: (paste your Access Key ID)
   - AWS Secret Access Key: (paste your Secret Access Key)
   - Default region name: `us-east-1`
   - Default output format: `json`

## 5. Verify Setup

Test your configuration:
```powershell
aws lightsail get-container-services
```

You should see a JSON response (empty array if no services exist yet).

## Security Best Practices

1. Never commit these credentials to version control
2. Rotate access keys every 90 days
3. Use the principle of least privilege
4. Monitor AWS CloudTrail for API activity
5. Enable MFA for the IAM user

## Troubleshooting

If you get permission errors:
1. Verify the policy is attached to your user
2. Check if the access keys are correctly configured
3. Ensure you're using the correct region
4. Try running `aws sts get-caller-identity` to verify your identity

For additional help, visit the [AWS IAM Documentation](https://docs.aws.amazon.com/IAM/latest/UserGuide/introduction.html) 