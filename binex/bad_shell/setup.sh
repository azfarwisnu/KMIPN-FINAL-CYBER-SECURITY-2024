#!/bin/bash

declare IMAGE_AND_CONTAINER_NAME="technofairctf_final_pwn__ghost_in_the_shell"
#  Port from docker
declare -i EXPOSED_PORT=9999
# Port for connect
declare -i PUBLIC_PORT=45940

docker stop $IMAGE_AND_CONTAINER_NAME
docker rm $IMAGE_AND_CONTAINER_NAME
docker image rm $IMAGE_AND_CONTAINER_NAME
docker build -t $IMAGE_AND_CONTAINER_NAME .
docker run -d -p $PUBLIC_PORT:$EXPOSED_PORT --rm --name $IMAGE_AND_CONTAINER_NAME $IMAGE_AND_CONTAINER_NAME
# docker run -d -p $PUBLIC_PORT:$EXPOSED_PORT --rm --name $CONTAINER_NAME $(docker_id=$(docker build . | tail -n 1); echo ${docker_id:18};)