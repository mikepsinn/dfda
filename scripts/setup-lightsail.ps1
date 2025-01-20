param(
    [Parameter(Mandatory=$true)]
    [string]$ServiceName,
    
    [Parameter(Mandatory=$true)]
    [string]$Region = "us-east-1",
    
    [Parameter(Mandatory=$false)]
    [string]$ContainerName = "web",
    
    [Parameter(Mandatory=$false)]
    [int]$PublicPort = 3000,
    
    [Parameter(Mandatory=$false)]
    [string]$Scale = "nano"
)

# Check if AWS CLI is installed
if (!(Get-Command aws -ErrorAction SilentlyContinue)) {
    Write-Error "AWS CLI is not installed. Please install it first: https://aws.amazon.com/cli/"
    exit 1
}

# Check if user is logged in to AWS
try {
    aws sts get-caller-identity | Out-Null
} catch {
    Write-Error "Please configure AWS CLI with your credentials first: aws configure"
    exit 1
}

Write-Host "Creating Lightsail container service..."

# Create container service
aws lightsail create-container-service `
    --service-name $ServiceName `
    --power $Scale `
    --scale 1 `
    --region $Region

Write-Host "Waiting for container service to be ready..."
do {
    $status = (aws lightsail get-container-services --service-name $ServiceName | ConvertFrom-Json).containerServices[0].state
    Write-Host "Current status: $status"
    Start-Sleep -Seconds 10
} while ($status -ne "ACTIVE")

# Create deployment configuration
$deployment = @{
    containers = @{
        $ContainerName = @{
            image = ""  # Will be set during deployment
            ports = @{
                $PublicPort = "HTTP"
            }
            environment = @{
                NODE_ENV = "production"
            }
        }
    }
    publicEndpoint = @{
        containerName = $ContainerName
        containerPort = $PublicPort
        healthCheck = @{
            healthyThreshold = 2
            unhealthyThreshold = 2
            timeoutSeconds = 2
            intervalSeconds = 5
            path = "/"
            successCodes = "200-499"
        }
    }
} | ConvertTo-Json -Depth 10

# Save deployment configuration
$deployment | Out-File -FilePath "lightsail-deployment.json"

Write-Host @"
Container service setup complete!

Service Name: $ServiceName
Region: $Region
Public Port: $PublicPort
Scale: $Scale

Next steps:
1. Update your GitHub Actions workflow with the following secrets:
   - AWS_ACCESS_KEY_ID
   - AWS_SECRET_ACCESS_KEY
   - AWS_REGION
   - LIGHTSAIL_SERVICE_NAME

2. Push to main branch to trigger deployment

Container service URL will be available after first deployment.
"@ 