FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

# Switch to root to install Java
USER root
RUN apt-get update && apt-get install -y openjdk-17-jdk && apt-get clean

WORKDIR /home/user/app
COPY . /home/user/app

# Install Python dependencies
RUN pip install -r requirements.txt

# Ensure mvnw is executable
RUN chmod +x /home/user/app/backend/mvnw

# Switch back to the default user (Standard for ModelScope)
USER 1000

ENTRYPOINT ["python", "-u", "app.py"]
