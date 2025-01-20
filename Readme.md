# Docker Commands for Language Images and RabbitMQ

## Pull Language-Specific Docker Images

```bash
docker pull python:3.9-slim   # Python image
docker pull node:16           # Node.js image
docker pull openjdk:17-slim   # OpenJDK image
docker pull gcc:latest        # GCC image (used for C and C++)

# Pull the RabbitMQ image
docker pull rabbitmq:latest

# Run the RabbitMQ container
docker run -d --name rabbitmq-container -p 5672:5672 -p 15672:15672 rabbitmq:latest
