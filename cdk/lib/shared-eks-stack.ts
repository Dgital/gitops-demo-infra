import * as cdk from "aws-cdk-lib";
import { KubectlV31Layer } from "@aws-cdk/lambda-layer-kubectl-v31";
import { Construct } from "constructs";

import { importVpc } from "./common/vpc";
import { StackConfig } from "../config";

export class SharedEksStack extends cdk.Stack {
    constructor(scope: Construct, id: string, clusterName: string, config: StackConfig, props?: cdk.StackProps) {
        super(scope, id, props);

        const vpc = importVpc(this, config.vpcId);
        // Add both public and private subnets
        const publicSubnets = vpc.selectSubnets({ subnetType: cdk.aws_ec2.SubnetType.PUBLIC }).subnets;
        const privateSubnets = vpc.selectSubnets({ subnetType: cdk.aws_ec2.SubnetType.PRIVATE_WITH_EGRESS }).subnets;

        const clusterRole = new cdk.aws_iam.Role(this, "EksClusterRole", {
            assumedBy: new cdk.aws_iam.ServicePrincipal("eks.amazonaws.com"),
            managedPolicies: [cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSClusterPolicy")],
        });

        // Create an EKS cluster with no EC2 nodes (for Fargate)
        const cluster = new cdk.aws_eks.Cluster(this, clusterName, {
            clusterName,
            vpc,
            vpcSubnets: [{ subnets: [...publicSubnets, ...privateSubnets] }],
            defaultCapacity: 0, // No EC2 worker nodes
            version: cdk.aws_eks.KubernetesVersion.V1_32,
            kubectlLayer: new KubectlV31Layer(this, "kubectl"),
            role: clusterRole,
            endpointAccess: cdk.aws_eks.EndpointAccess.PUBLIC_AND_PRIVATE,
            authenticationMode: cdk.aws_eks.AuthenticationMode.API_AND_CONFIG_MAP,
        });

        const fargateProfileName = `main-fargate`;
        cluster.addFargateProfile(fargateProfileName, {
            fargateProfileName,
            subnetSelection: { subnets: [...publicSubnets, ...privateSubnets] },
            selectors: [
                {
                    labels: { profile: "main-fargate" },
                    namespace: "default", // Any pods in the 'default' namespace will use Fargate
                },
            ],
        });

        // These can be useful if you want to access the cluster from outside the stack
        // const kubectlProvider = cluster.stack.node.tryFindChild(
        //     "@aws-cdk--aws-eks.KubectlProvider"
        // ) as cdk.aws_eks.KubectlProvider;

        // new cdk.CfnOutput(this, `ClusterName}`, {
        //     value: cluster.clusterName,
        //     exportName: "ClusterName",
        // });
        // new cdk.CfnOutput(this, "ClusterSecurityGroupId", {
        //     value: cluster.clusterSecurityGroupId,
        //     exportName: "ClusterSecurityGroupId",
        // });
        // new cdk.CfnOutput(this, "KubectlRoleArn", {
        //     value: cluster.kubectlRole.roleArn,
        //     exportName: "ClusterKubectlArn",
        // });
        // new cdk.CfnOutput(this, "ClusterEndpoint", {
        //     value: cluster.clusterEndpoint,
        //     exportName: "ClusterEndpoint",
        // });
        // new cdk.CfnOutput(this, "KubectlProviderHandlerRoleArn", {
        //     value: kubectlProvider.handlerRole.roleArn,
        //     exportName: "KubectlProviderHandlerRoleArn",
        // });

        cluster.addNodegroupCapacity("main", {
            nodegroupName: "main",
            instanceTypes: [new cdk.aws_ec2.InstanceType("t3.large")],
            amiType: cdk.aws_eks.NodegroupAmiType.AL2_X86_64,
            subnets: { subnets: [...publicSubnets, ...privateSubnets] },
            labels: { profile: "main" },
            diskSize: 20,
            maxUnavailable: 1,
            minSize: 2,
            maxSize: 3,
            desiredSize: 2,
            nodeRole: new cdk.aws_iam.Role(this, `${clusterName}-nodegroup-role`, {
                roleName: `${clusterName}-nodegroup-role`,
                assumedBy: new cdk.aws_iam.ServicePrincipal("ec2.amazonaws.com"),
                managedPolicies: [
                    cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKSWorkerNodePolicy"),
                    cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEC2ContainerRegistryReadOnly"),
                    cdk.aws_iam.ManagedPolicy.fromAwsManagedPolicyName("AmazonEKS_CNI_Policy"),
                ],
            }),
        });
    }
}
