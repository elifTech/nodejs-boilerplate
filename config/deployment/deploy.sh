#!/usr/bin/env bash

sudo apt-get install -y python3 wget

wget https://bootstrap.pypa.io/get-pip.py

sudo python get-pip.py

sudo pip install awscli

#AWS AMI User creds
AMI_AWS_KEY="YOUR_KEY"
AMI_AWS_SECRET="YOUR_SECRET"
AWS_REGION="eu-central-1"
AWS_BUCKET="node-boilerplate"
YOUR_USER="home/yurko"
DOCKERFILE_DIR=`pwd`"/../.."
PROJECT_NAME="node-boilerplate"
ACCOUNT_ID="YOUR_ACC_ID"

AWS_CONF=/$YOUR_USER/.aws/config
#mkdir /$YOUR_USER/.aws

echo "[default]
aws_access_key_id=$AMI_AWS_KEY
aws_secret_access_key=$AMI_AWS_SECRET
region=$AWS_REGION
output=json" > $AWS_CONF

DOCKER_LOGIN=`aws ecr get-login --region $AWS_REGION`

sudo $DOCKER_LOGIN

#sudo aws ecr create-repository --repository-name $PROJECT_NAME

sudo docker build -t $PROJECT_NAME ../../.

sudo docker tag $PROJECT_NAME:latest $ACCOUNT_ID.dkr.ecr.eu-central-1.amazonaws.com/$PROJECT_NAME:latest

sudo docker push $ACCOUNT_ID.dkr.ecr.$AWS_REGION.amazonaws.com/$PROJECT_NAME:latest
