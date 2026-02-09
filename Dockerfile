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

# Ensure mvnw is executable
RUN chmod +x /home/user/app/backend/mvnw

# ---------- Ensure uid 1000 exists with all required passwd fields ----------
RUN (id -u 1000 2>/dev/null && userdel -f "$(id -un 1000)") || true && \
    (getent group 1000 && groupdel "$(getent group 1000 | cut -d: -f1)") || true && \
    groupadd -g 1000 user && \
    useradd -u 1000 -g 1000 -m -d /home/user -s /bin/bash user

# ---------- PostgreSQL data directory for user 1000 ----------
RUN mkdir -p /home/user/pgdata /home/user/pglog /var/run/postgresql && \
    chown -R 1000:1000 /home/user /var/run/postgresql

# ---------- Pre-build Maven project (cache dependencies in image) ----------
RUN cd /home/user/app/backend && \
    ./mvnw package -DskipTests -B --no-transfer-progress && \
    chown -R 1000:1000 /home/user/app

USER 1000

# ---------- Init PostgreSQL cluster (owned by user 1000) ----------
RUN /usr/lib/postgresql/16/bin/initdb -D /home/user/pgdata --auth=trust

EXPOSE 7860

ENTRYPOINT ["python", "-u", "app.py"]
