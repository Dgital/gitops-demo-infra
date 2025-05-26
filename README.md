# GitOps Demo: infrastructure repository

This repository contains the CDK application that creates the cluster in AWS and the cluster specific manifests for FluxCD.

## CDK

CDK is an IaC solution to create AWS resources, in this project it is responsible for creating the cluster and the realted resources.

### Requirements

- Node.JS 22
- PNPM 8

### Running locally

1. Navigate to the `cdk` directory and run the `pnpm install` command.
2. Create a `.env` file based on `.env.template`.
3. If you have multiple AWS account, we reccomend using the [Granted](https://docs.commonfate.io/granted/introduction) CLI tool.
4. After you installed the dependencies, and authenticated to the correct AWS account you can deploy the cluster with `pnpm deploy:eks:shared` (or remove it with `pnpm destroy:eks:shared`

### Post setup

- Configure access policies on the EKS console for the users to use kubectl and Kubernetes API: your AWS user, and the Github user.
  - If you are an administrator you might want to use the AmazonEKSClusterAdminPolicy.
  - For the GitHub user you might a more fine grained access control to only allow read access to the releavnt Flux resources and Kubernetes deployments.

- Configure kubectl locally
  - Make sure that you use the correct AWS account
  - Run `aws eks update-kubeconfig --region <your-region> --name gitops-demo-shared`
  - If you need to manage multile clusters the (kubectx)[https://github.com/ahmetb/kubectx] tool could be useful.

## FluxCD manifests

The manifests are stored in the `clusters` directory for each cluster. The current implementation only has one, but other clusters could be managed in this repository.

The manifests contain references to the external Helm repositories and to the environments in the `gitops-demo-manifests` git repository.

The contents of the `clusters/<cluster-name>/flux-system` repository should not be edited manually. It is only modifiable by the [Flux CLI](https://fluxcd.io/flux/cmd/).
