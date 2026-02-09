FROM modelscope-registry.cn-beijing.cr.aliyuncs.com/modelscope-repo/python:3.10

USER root

# ---------- 1. Java 17 ----------
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        openjdk-17-jdk-headless \
        curl gnupg ca-certificates \
    && apt-get clean

# ---------- 2. PostgreSQL 16 + pgvector ----------
RUN . /etc/os-release && \
    echo "deb http://apt.postgresql.org/pub/repos/apt ${VERSION_CODENAME}-pgdg main" \
        > /etc/apt/sources.list.d/pgdg.list && \
    curl -fsSL https://www.postgresql.org/media/keys/ACCC4CF8.asc \
        | gpg --dearmor -o /etc/apt/trusted.gpg.d/postgresql.gpg && \
    apt-get update && \
    apt-get install -y --no-install-recommends \
        postgresql-16 \
        postgresql-server-dev-16 \
        build-essential git \
    && apt-get clean && rm -rf /var/lib/apt/lists/*

RUN cd /tmp && \
    git clone --branch v0.8.0 https://github.com/pgvector/pgvector.git && \
    cd pgvector && make && make install && \
    cd / && rm -rf /tmp/pgvector

# ---------- 3. Create user 1000 (required by ModelScope runtime) ----------
RUN useradd -m -u 1000 user

# ---------- 4. PostgreSQL dirs writable by user 1000 ----------
RUN mkdir -p /home/user/pgdata /home/user/pglog /var/run/postgresql && \
    chown -R 1000:1000 /home/user /var/run/postgresql

# ---------- 5. Switch to user ----------
USER user
ENV HOME=/home/user \
    PATH=/home/user/.local/bin:$PATH
WORKDIR $HOME/app

# ---------- 6. Copy project (owned by user) ----------
COPY --chown=user . .

# ---------- 7. Pre-build Maven project ----------
RUN chmod +x backend/mvnw && \
    cd backend && ./mvnw package -DskipTests -B --no-transfer-progress

EXPOSE 7860

ENTRYPOINT ["python", "-u", "app.py"]
