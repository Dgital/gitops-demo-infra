#!/usr/bin/env node
import "source-map-support/register";
import * as cdk from "aws-cdk-lib";
import { SharedEksStack as SharedEksStack } from "../lib/shared-eks-stack";
import { config } from "../config";

const app = new cdk.App();

const eksStackName = "gitops-demo-shared-eks";
new SharedEksStack(app, eksStackName, "gitops-demo-shared", config, { env: config.awsAccount, stackName: eksStackName });
