import 'dotenv/config';

export interface StackConfig {
    vpcId: string;
    awsAccount: { account: string; region: string };
}

export const config: StackConfig = {
    vpcId: process.env.AWS_VPC_ID,
    awsAccount: {
        account: process.env.AWS_ACCOUNT,
        region: process.env.AWS_REGION,
    },
};

