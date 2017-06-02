#!/usr/bin/env bash

PROJECT_NAME="node-boilerplate"

#AWS AMI User creds
AWS_REGION="eu-central-1"

AWS_DEPLOY_TASK_DEFINITION="console-$PROJECT_NAME-static"
AWS_DEPLOY_SERVICE_NAME="$PROJECT_NAME-app"
AWS_DEPLOY_CLUSTER="$PROJECT_NAME-cluster"

DOCKER_LOGIN=`aws ecr get-login --region $AWS_REGION`

sudo $DOCKER_LOGIN

NUMBER_OF_TASKS=`sudo aws ecs list-task-definitions --family-prefix $AWS_DEPLOY_TASK_DEFINITION | grep -o $AWS_DEPLOY_TASK_DEFINITION | wc -l`

# register new task definition, check if we updating the service
if [ $NUMBER_OF_TASKS > 0 ]; then
  sudo aws ecs register-task-definition --cli-input-json file://$REGISTER_TASK_MOD_FILE

  REVISION=$((NUMBER_OF_TASKS+1))
  sudo aws ecs update-service  --cluster $AWS_DEPLOY_CLUSTER --service $AWS_DEPLOY_SERVICE_NAME --task-definition $AWS_DEPLOY_TASK_DEFINITION:$REVISION
fi
