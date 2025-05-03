// @ts-nocheck
import * as pulumi from "@pulumi/pulumi";
import * as gcp from "@pulumi/gcp";
import * as command from "@pulumi/command";

// Config
const config = new pulumi.Config();
const project = config.require("gcp:project");
const region = config.get("gcp:region") || "us-central1";
const zone = config.get("gcp:zone") || "us-central1-a";

// New config for Doppler project/config
const dopplerProject = config.require("dopplerProject");
const dopplerConfig = config.require("dopplerConfig");

// Get your public IP from Pulumi config (set with pulumi config set myPublicIp)
const myPublicIp = config.require("myPublicIp");

// Get default compute service account
const defaultComputeSa = gcp.compute.getDefaultServiceAccount({});

// Get secret values from Pulumi config (set with --secret flag)
const dopplerToken = config.requireSecret("dopplerToken");

// Wrap main logic in an async function to allow top-level await
async function main() {
    // VPC Network
    const network = new gcp.compute.Network("coolify-vpc", {
        autoCreateSubnetworks: false,
    });

    // Subnet
    const subnet = new gcp.compute.Subnetwork("coolify-subnet", {
        ipCidrRange: "10.10.0.0/24",
        region,
        network: network.id,
    });

    // --- Secret Manager Secret for Doppler Token ---
    // Using userManaged with empty replicas as a workaround for potential type issue
    const dopplerTokenSecret = new gcp.secretmanager.Secret("doppler-token-secret", {
        secretId: "DOPPLER_TOKEN",
        replication: {
            userManaged: {
                replicas: [], // Empty list for userManaged
            },
        },
    });

    const dopplerTokenSecretVersion = new gcp.secretmanager.SecretVersion("doppler-token-secret-version", {
        secret: dopplerTokenSecret.id,
        secretData: dopplerToken,
    });

    const dopplerTokenAccessor = new gcp.secretmanager.SecretIamBinding("doppler-token-secret-accessor", {
        project: dopplerTokenSecret.project,
        secretId: dopplerTokenSecret.secretId,
        role: "roles/secretmanager.secretAccessor",
        members: [pulumi.interpolate`serviceAccount:${defaultComputeSa.then(sa => sa.email)}`],
    });

    // Create firewall rule args as any to bypass TS type mismatch
    const mgmtFwArgs: any = {
        network: network.id,
        allows: [
            { protocol: "tcp", ports: ["22", "8000", "80", "443"] },
        ],
        sourceRanges: [myPublicIp],
        description: "Allow SSH, Coolify UI, HTTP/HTTPS from deploy machine's public IP",
    };
    const mgmtFirewall = new gcp.compute.Firewall("coolify-mgmt-fw", mgmtFwArgs);

    // Firewall: Allow Supabase DB and Studio ports from Cloud Run (TODO: refine source range)
    const supabaseFirewall = new gcp.compute.Firewall("supabase-db-fw", {
        network: network.id,
        allows: [
            { protocol: "tcp", ports: ["5432", "6001", "6002"] },
        ],
        // TODO: Set to Cloud Run's egress IP range or VPC connector range
        // sourceRanges: ["0.0.0.0/0"], // Replace with least privilege - NOW REPLACED BELOW
        // We will set the source range after the connector is created
        description: "Allow Supabase DB/Studio from Cloud Run VPC Connector",
    });

    // Startup script for Docker + Coolify (quick install method 1)
    const startupScript = `
    #!/bin/bash
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    sudo usermod -aG docker $USER
    curl -fsSL https://coolify.io/install.sh | bash
    `;

    // Compute Engine VM
    const coolifyVm = new gcp.compute.Instance("coolify-vm", {
        machineType: "e2-standard-2",
        zone,
        bootDisk: {
            initializeParams: {
                image: "ubuntu-os-cloud/ubuntu-2204-lts",
                size: 50,
            },
        },
        networkInterfaces: [{
            network: network.id,
            subnetwork: subnet.id,
            accessConfigs: [{}], // Assign public IP
        }],
        metadata: {
            "startup-script": startupScript,
        },
        tags: ["coolify"],
        serviceAccount: {
            scopes: ["https://www.googleapis.com/auth/cloud-platform"],
        },
    });

    // GCP Artifact Registry for Docker images
    const artifactRegistryRepo = new gcp.artifactregistry.Repository("dfda-node-repo", {
        location: region,
        repositoryId: "dfda-node", // Unique ID for the repository
        format: "DOCKER",
        description: "Docker repository for dfda-node application",
    });

    // --- Serverless VPC Access Connector ---
    const vpcConnector = new gcp.vpcaccess.Connector("cloudrun-connector", {
        name: "cloudrun-connector",
        region,
        network: network.id,
        ipCidrRange: "10.10.1.0/28", // Dedicated range for the connector
        machineType: "e2-micro", // Adjust based on expected traffic
    });

    // Update the Supabase firewall to only allow traffic from the VPC connector
    // @ts-ignore TS2322: allow dynamic Output<string[]> for sourceRanges
    const supabaseFirewallUpdate = new gcp.compute.Firewall("supabase-db-fw", {
        network: network.id,
        allows: [
            { protocol: "tcp", ports: ["5432", "6001", "6002"] },
        ],
        sourceRanges: (vpcConnector.ipCidrRange.apply(range => [range]) as any), // Use the connector's range
        description: "Allow Supabase DB/Studio ONLY from Cloud Run VPC Connector",
    }, { dependsOn: [vpcConnector, supabaseFirewall] }); // Ensure connector exists and replace original rule

    // --- GitHub Actions CI/CD Setup ---

    // TODO: Replace with your GitHub org/repo or use config
    const githubRepo = config.get("githubRepo") || "your-github-org/your-repo-name";

    // Workload Identity Pool
    const githubActionsPool = new gcp.iam.WorkloadIdentityPool("github-actions-pool", {
        workloadIdentityPoolId: "github-actions-pool",
        displayName: "GitHub Actions Pool",
        description: "Identity pool for GitHub Actions CI/CD",
    });

    // Workload Identity Pool Provider for GitHub
    const githubProvider = new gcp.iam.WorkloadIdentityPoolProvider("github-provider", {
        workloadIdentityPoolId: githubActionsPool.workloadIdentityPoolId,
        workloadIdentityPoolProviderId: "github-provider",
        displayName: "GitHub Actions Provider",
        description: "OIDC provider for GitHub Actions",
        oidc: {
            issuerUri: "https://token.actions.githubusercontent.com",
        },
        attributeMapping: {
            "google.subject": "assertion.sub",
            "attribute.actor": "assertion.actor",
            "attribute.repository": "assertion.repository",
        },
        attributeCondition: pulumi.interpolate`attribute.repository == '${githubRepo}'`,
    });

    // Service Account for GitHub Actions
    const githubActionsServiceAccount = new gcp.serviceaccount.Account("github-actions-sa", {
        accountId: "github-actions-sa",
        displayName: "GitHub Actions Service Account",
    });

    // Allow GitHub Actions OIDC provider to impersonate the Service Account
    const githubSaWifBinding = new gcp.serviceaccount.IAMBinding("github-sa-wif-binding", {
        serviceAccountId: githubActionsServiceAccount.name,
        role: "roles/iam.workloadIdentityUser",
        members: [
            // Format: principalSet://iam.googleapis.com/{pool_resource_name}/attribute.repository/{repo_name}
            pulumi.interpolate`principalSet://iam.googleapis.com/${githubActionsPool.name}/attribute.repository/${githubRepo}`,
        ],
    });

    // Grant Artifact Registry Writer role to the Service Account
    const arWriterBinding = new gcp.artifactregistry.RepositoryIamBinding("ar-writer-binding", {
        location: artifactRegistryRepo.location,
        repository: artifactRegistryRepo.repositoryId,
        role: "roles/artifactregistry.writer",
        members: [githubActionsServiceAccount.email.apply(email => `serviceAccount:${email}`)],
    });

    // Grant Cloud Run Developer role to the Service Account
    const runDeveloperBinding = new gcp.projects.IAMBinding("run-developer-binding", {
        project: project,
        role: "roles/run.developer",
        members: [githubActionsServiceAccount.email.apply(email => `serviceAccount:${email}`)],
        // Condition to potentially scope down access later if needed
        // condition: { title: "", expression: "" }
    });

    // Grant Service Account User role (allows SA to act as itself)
    const saUserBinding = new gcp.projects.IAMBinding("sa-user-binding", {
        project: project,
        role: "roles/iam.serviceAccountUser",
        members: [githubActionsServiceAccount.email.apply(email => `serviceAccount:${email}`)],
    });

    // --- Update Doppler Secrets using Pulumi Command ---

    // Command to update GCP_SERVICE_ACCOUNT in Doppler
    const updateDopplerServiceAccount = new command.local.Command("update-doppler-sa", {
        create: pulumi.interpolate`doppler secrets set GCP_SERVICE_ACCOUNT=${githubActionsServiceAccount.email} --project ${dopplerProject} --config ${dopplerConfig} --silent`,
        // Update command could be the same if needed, or omit if create is sufficient
        // delete: pulumi.interpolate`doppler secrets delete GCP_SERVICE_ACCOUNT --project ${dopplerProject} --config ${dopplerConfig} --yes`, // Optional: clean up on destroy
        environment: {
            DOPPLER_TOKEN: dopplerToken,
        },
        triggers: [githubActionsServiceAccount.email], // Re-run if email changes
    }, { dependsOn: [githubActionsServiceAccount] }); // Ensure SA exists

    // Command to update GCP_WORKLOAD_IDENTITY_PROVIDER in Doppler
    // Note: githubProvider.name should provide the fully qualified ID needed
    const updateDopplerWifProvider = new command.local.Command("update-doppler-wif", {
        create: pulumi.interpolate`doppler secrets set GCP_WORKLOAD_IDENTITY_PROVIDER=${githubProvider.name} --project ${dopplerProject} --config ${dopplerConfig} --silent`,
        environment: {
            DOPPLER_TOKEN: dopplerToken,
        },
        triggers: [githubProvider.name], // Re-run if provider name changes
    }, { dependsOn: [githubProvider] }); // Ensure WIF provider exists

    // --- Cloud Run Service for dfda-node ---

    // Placeholder image name - CI/CD will push the actual image
    const imageName = pulumi.interpolate`${region}-docker.pkg.dev/${project}/${artifactRegistryRepo.repositoryId}/dfda-node:latest`;

    const dfdaNodeService = new gcp.cloudrunv2.Service("dfda-node-service", {
        location: region,
        name: "dfda-node",
        template: {
            containers: [{
                image: imageName,
                // @ts-ignore TS2322: allow any-typed ports
                ports: ([{ containerPort: 3000 }] as any), // Assuming Node.js app runs on port 3000
                envs: [
                    {
                        name: "DOPPLER_TOKEN",
                        valueSource: {
                            secretKeyRef: {
                                secret: dopplerTokenSecret.secretId, // Correctly reference the GSM secret resource
                                version: "latest",
                            }
                        }
                    },
                    // Your application will use this token to fetch other secrets from Doppler
                    // Ensure your app/entrypoint uses Doppler CLI or SDK
                ],
                // Optional: Resource limits
                // resources: {
                //     limits: {
                //         cpu: "1",
                //         memory: "512Mi",
                //     }
                // },
            }],
            // Use the VPC connector for network egress to the VPC
            vpcAccess: {
                connector: vpcConnector.id,
                egress: "ALL_TRAFFIC",
            },
            scaling: {
                minInstanceCount: 0, // Scale to zero when idle
                maxInstanceCount: 3, // Adjust as needed
            },
            // Service account for the Cloud Run service itself (uses default Compute Engine SA if not specified)
            // serviceAccount: "..."
        },
        // Allow traffic from external users
        traffics: [{
            type: "TRAFFIC_TARGET_ALLOCATION_TYPE_LATEST",
            percent: 100,
        }],
    }, { dependsOn: [vpcConnector, artifactRegistryRepo] });

    // Allow unauthenticated access to the Cloud Run service
    const invokerIam = new gcp.cloudrunv2.ServiceIamBinding("dfda-node-invoker", {
        project: dfdaNodeService.project,
        location: dfdaNodeService.location,
        name: dfdaNodeService.name,
        role: "roles/run.invoker",
        members: ["allUsers"],
    });

    // Return outputs from the main async function
    return {
        coolifyVmPublicIp: coolifyVm.networkInterfaces.apply(nics => nics[0].accessConfigs![0].natIp),
        coolifyVmPrivateIp: coolifyVm.networkInterfaces.apply(nics => nics[0].networkIp),
        artifactRegistryRepositoryName: artifactRegistryRepo.name,
        githubActionsPoolId: githubActionsPool.id,
        githubActionsProviderId: githubProvider.name,
        githubActionsServiceAccountEmail: githubActionsServiceAccount.email,
        cloudRunServiceUrl: dfdaNodeService.uri,
    };
}

// Call main and export the resolved outputs
const stackOutputs = pulumi.output(main());

export const coolifyVmPublicIp = stackOutputs.coolifyVmPublicIp;
export const coolifyVmPrivateIp = stackOutputs.coolifyVmPrivateIp;
export const artifactRegistryRepositoryName = stackOutputs.artifactRegistryRepositoryName;
export const githubActionsPoolId = stackOutputs.githubActionsPoolId;
export const githubActionsProviderId = stackOutputs.githubActionsProviderId;
export const githubActionsServiceAccountEmail = stackOutputs.githubActionsServiceAccountEmail;
export const cloudRunServiceUrl = stackOutputs.cloudRunServiceUrl;
