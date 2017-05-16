#!/usr/bin/env bash

sudo apt-get install -y python3 wget

wget https://bootstrap.pypa.io/get-pip.py

sudo python get-pip.py

sudo pip install awscli

#AWS AMI User creds
AMI_AWS_KEY="AKIAJ2GVCB2MQYXZRODA"
AMI_AWS_SECRET="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"
AWS_REGION="eu-central-1"
AWS_BUCKET="node-boilerplate"

AWS_DEPLOY_TASK_DEFINITION="console-node-boilerplate-static"
AWS_DEPLOY_SERVICE_NAME="node-boilerplate-app"
AWS_DEPLOY_CLUSTER="node-boilerplate-cluster"

PROJECT_NAME="node-boilerplate"
ACCOUNT_ID="091953829232"
AWS_BUCKET="node-boilerplate"
YOUR_USER="home/yurko"

DOCKERFILE_DIR=`pwd`"/../.."
REGISTER_TASK_FILE=`pwd`/task-definition.json
REGISTER_TASK_MOD_FILE=`pwd`/task-definition-mod.json

AWS_DIR="/$YOUR_USER/.aws"
AWS_CONF=/$YOUR_USER/.aws/config
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

DOCKER_LOGIN=`aws ecr get-login --region $AWS_REGION`

sudo $DOCKER_LOGIN

sudo docker build -t $PROJECT_NAME ../../.

sudo docker tag $PROJECT_NAME:latest $ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/$PROJECT_NAME:latest

sudo docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME:latest

NUMBER_OF_TASKS=`sudo aws ecs list-task-definitions --family-prefix $AWS_DEPLOY_TASK_DEFINITION | grep -o $AWS_DEPLOY_TASK_DEFINITION | wc -l`

# register new task definition, check if we updating the service
if [ $NUMBER_OF_TASKS > 0 ]; then
  sudo aws ecs register-task-definition --cli-input-json file://$REGISTER_TASK_MOD_FILE

  REVISION=$((NUMBER_OF_TASKS+1))
  sudo aws ecs update-service  --cluster $AWS_DEPLOY_CLUSTER --service $AWS_DEPLOY_SERVICE_NAME --task-definition $AWS_DEPLOY_TASK_DEFINITION:$REVISION
fi
