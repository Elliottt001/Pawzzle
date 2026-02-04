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

# Ensure uid 1000 exists for ModelScope runtime and owns the app dir
RUN if ! getent passwd 1000 >/dev/null 2>&1; then useradd -m -u 1000 -s /bin/bash user; fi \
    && chown -R 1000:1000 /home/user/app

# Switch to uid 1000 (standard for ModelScope)
USER 1000

ENTRYPOINT ["python", "-u", "app.py"]
