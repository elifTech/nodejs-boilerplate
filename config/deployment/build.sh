#!/usr/bin/env bash

PROJECT_NAME="node-boilerplate"

MONGO_NAME=$PROJECT_NAME"-mongo"
AWS_DEPLOY_CLUSTER="$PROJECT_NAME-cluster"
AWS_DEPLOY_TASK_DEFINITION="console-$PROJECT_NAME-static"

REGISTER_TASK_MOD_FILE=`pwd`/config/deployment/task-definition-mod.json
REGISTER_TASK_MOD_FILE_MONGO=`pwd`/config/deployment/mongo/task-definition-mod.json

REGISTER_CLUSTER_FILE=`pwd`/config/deployment/cluster-definition.json


#AWS AMI User creds
AWS_REGION="eu-central-1"

ACCOUNT_ID="091953829232"

KEYPAIR_NAME="rapidnotes"

DOCKER_LOGIN=`aws ecr get-login --region $AWS_REGION`

sudo $DOCKER_LOGIN

## main APP
sudo aws ecr create-repository --repository-name $PROJECT_NAME

sudo docker build -t $PROJECT_NAME ../../.

sudo docker tag $PROJECT_NAME:latest $ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/$PROJECT_NAME:latest

sudo docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME:latest

# create cluster
sudo ecs-cli up --keypair $KEYPAIR_NAME --capability-iam --size 1 --instance-type t2.micro --force

sudo ecs-cli compose --file `pwd`/config/deployment/compose.yml up


#sudo aws ecs register-task-definition --cli-input-json file://$REGISTER_TASK_MOD_FILE

#sudo aws ecs run-task --cluster $AWS_DEPLOY_CLUSTER --task-definition $AWS_DEPLOY_TASK_DEFINITION

#
## MONGO & Rabbit
#sudo aws ecr create-repository --repository-name $MONGO_NAME
#
#sudo docker build -t $MONGO_NAME config/deployment/mongo/.
#
#sudo docker tag $MONGO_NAME:latest $ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/$MONGO_NAME:latest
#
#sudo docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$MONGO_NAME:latest
#
#sudo aws ecs register-task-definition --cli-input-json file://$REGISTER_TASK_MOD_FILE_MONGO
#
## RUN tasks
#
#sleep 120
#
#sudo aws ecs run-task --cluster $AWS_DEPLOY_CLUSTER --task-definition $AWS_DEPLOY_TASK_DEFINITION
#
#sudo aws ecs run-task --cluster $AWS_DEPLOY_CLUSTER --task-definition $AWS_DEPLOY_TASK_DEFINITION-mongo
