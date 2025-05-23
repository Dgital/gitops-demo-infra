#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SharedEksStack as SharedEksStack } from "../lib/shared-eks-stack";
import { config } from "../config";

const app = new cdk.App();

const eksStackName =  "gitops-demo-eks-main-shared";
new SharedEksStack(app, eksStackName, "gitops-demo", config, { env: config.awsAccount, stackName: eksStackName });
