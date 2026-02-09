FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

USER root

# ---------- Install Java 17 ----------
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openjdk-17-jdk-headless \
        curl \
        gnupg \
        ca-certificates \
    && apt-get clean

# ---------- Install PostgreSQL 16 + build pgvector ----------
RUN . /etc/os-release && \
    echo "deb http://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        postgresql-16 \
        postgresql-server-dev-16 \
        build-essential \
        git \
    && apt-get clean

RUN cd /tmp && \
    git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git && \
    cd pgvector && make && make install && \
    cd / && rm -rf /tmp/pgvector

# ---------- Copy project ----------
WORKDIR /home/user/app
COPY . /home/user/app

RUN chmod +x /home/user/app/backend/mvnw

# ---------- Guarantee uid 1000 with ALL required passwd/shadow/group fields ----------
# Direct file manipulation — the only 100 % reliable method.
RUN cp /etc/passwd /etc/passwd.bak && \
    awk -F: '$3 != 1000 && $1 != "user"' /etc/passwd.bak > /etc/passwd && \
    echo 'user:x:1000:1000:user:/home/user:/bin/bash' >> /etc/passwd && \
    cp /etc/group /etc/group.bak && \
    awk -F: '$3 != 1000 && $1 != "user"' /etc/group.bak > /etc/group && \
    echo 'user:x:1000:' >> /etc/group && \
    (grep -v '^user:' /etc/shadow > /tmp/shadow && mv /tmp/shadow /etc/shadow || true) && \
    echo 'user:*:19000:0:99999:7:::' >> /etc/shadow && \
    rm -f /etc/passwd.bak /etc/group.bak

# ---------- Directories for PostgreSQL + app, all owned by uid 1000 ----------
RUN mkdir -p /home/user/pgdata /home/user/pglog /var/run/postgresql && \
    chown -R 1000:1000 /home/user /var/run/postgresql

# ---------- Pre-build Maven project (cache dependencies in image) ----------
RUN cd /home/user/app/backend && \
    ./mvnw package -DskipTests -B --no-transfer-progress && \
    chown -R 1000:1000 /home/user/app

USER 1000

EXPOSE 7860

ENTRYPOINT ["python", "-u", "app.py"]
