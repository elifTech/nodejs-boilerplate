#!/usr/bin/env bash

PROJECT_NAME="node-boilerplate"

#AWS AMI User creds
AWS_REGION="eu-central-1"
ACCOUNT_ID="091953829232"

AWS_DEPLOY_TASK_DEFINITION="console-$PROJECT_NAME-static"
AWS_DEPLOY_SERVICE_NAME="$PROJECT_NAME-app"
AWS_DEPLOY_CLUSTER="$PROJECT_NAME-cluster"

REGISTER_TASK_MOD_FILE=`pwd`/config/deployment/task-definition-mod.json

DOCKER_LOGIN=`aws ecr get-login --region $AWS_REGION`

sudo $DOCKER_LOGIN

NUMBER_OF_TASKS=`sudo aws ecs list-task-definitions --family-prefix $AWS_DEPLOY_TASK_DEFINITION | grep -o $AWS_DEPLOY_TASK_DEFINITION | wc -l`

# register new task definition, check if we updating the service
#if [ $NUMBER_OF_TASKS > 0 ]; then

TASK_ID=`sudo aws ecs list-tasks --cluster $AWS_DEPLOY_CLUSTER --family $AWS_DEPLOY_TASK_DEFINITION | grep "task/" | sed "s/\"//g" | sed "s/.*\///g"`

#sudo aws ecs deregister-task-definition --task-definition $AWS_DEPLOY_TASK_DEFINITION:$NUMBER_OF_TASKS
#
sudo aws ecs register-task-definition --cli-input-json file://$REGISTER_TASK_MOD_FILE

sudo aws ecs stop-task --cluster $AWS_DEPLOY_CLUSTER --task $TASK_ID

sudo aws ecs run-task --cluster $AWS_DEPLOY_CLUSTER --task-definition $AWS_DEPLOY_TASK_DEFINITION

#  sudo aws ecs update-service  --cluster $AWS_DEPLOY_CLUSTER --service $AWS_DEPLOY_SERVICE_NAME --task-definition $AWS_DEPLOY_TASK_DEFINITION
#fi
