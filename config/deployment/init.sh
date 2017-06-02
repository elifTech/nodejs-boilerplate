#!/usr/bin/env bash

sudo apt-get install -y python3 wget

wget https://bootstrap.pypa.io/get-pip.py

sudo python get-pip.py

sudo pip install awscli

sudo curl -o /usr/local/bin/ecs-cli https://s3.amazonaws.com/amazon-ecs-cli/ecs-cli-linux-amd64-latest

sudo chmod +x /usr/local/bin/ecs-cli

PROJECT_NAME="node-boilerplate"

#AWS AMI User creds
AMI_AWS_KEY="AKIAJD6CJ3COKRV5AXTQ"
AMI_AWS_SECRET="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"
AWS_REGION="eu-central-1"
AWS_BUCKET="node-boilerplate"

AWS_DEPLOY_TASK_DEFINITION="console-$PROJECT_NAME-static"
AWS_DEPLOY_SERVICE_NAME="$PROJECT_NAME-app"
AWS_DEPLOY_CLUSTER="$PROJECT_NAME-cluster"

# CLI Configure
sudo ecs-cli configure --region $AWS_REGION --access-key $AMI_AWS_KEY --secret-key $AMI_AWS_SECRET --cluster $AWS_DEPLOY_CLUSTER

ACCOUNT_ID="091953829232"
YOUR_USER=$HOME

DOCKERFILE_DIR=`pwd`
REGISTER_TASK_FILE=`pwd`/config/deployment/task-definition.json
REGISTER_TASK_MOD_FILE=`pwd`/config/deployment/task-definition-mod.json

AWS_DIR="$YOUR_USER/.aws"
AWS_CONF=$YOUR_USER/.aws/config
if [ ! -d "$AWS_DIR" ]; then
  mkdir $AWS_DIR
fi

echo "[default]
aws_access_key_id=$AMI_AWS_KEY
aws_secret_access_key=$AMI_AWS_SECRET
region=$AWS_REGION
output=json" > $AWS_CONF

sed -e "s/PROJECT_NAME/$PROJECT_NAME/
s/ACCOUNT_ID/$ACCOUNT_ID/
s/AWS_REGION/$AWS_REGION/
s/AWS_DEPLOY_TASK_DEFINITION/$AWS_DEPLOY_TASK_DEFINITION/" $REGISTER_TASK_FILE > $REGISTER_TASK_MOD_FILE
