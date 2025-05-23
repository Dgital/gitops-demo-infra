import { Construct } from "constructs";
import { aws_ec2 as ec2 } from "aws-cdk-lib";

export function importVpc(stack: Construct, vpcId: string) {
    return ec2.Vpc.fromLookup(stack, `imported-vpc-${vpcId}`, {
        isDefault: false,
        vpcId,
    });
}
