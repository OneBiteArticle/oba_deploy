FROM jenkins/jenkins:lts

USER root

# 1. 필수 도구 설치 및 도커 레포지토리 직접 등록
RUN apt-get update && apt-get install -y \
    curl \
    python3 \
    python3-pip \
    ca-certificates \
    gnupg \
    lsb-release && \
    # 도커 공식 GPG 키 추가
    mkdir -p /etc/apt/keyrings && \
    curl -fsSL https://download.docker.com/linux/debian/gpg | gpg --dearmor -o /etc/apt/keyrings/docker.gpg && \
    # 레포지토리 등록 (아키텍처 자동 감지: amd64 또는 arm64)
    echo \
      "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/debian \
      $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null && \
    apt-get update && \
    apt-get install -y docker-ce-cli

# 2. Docker Compose 설치 (V2 바이너리 방식 - 아키텍처 대응)
RUN ARCH=$(dpkg --print-architecture) && \
    if [ "$ARCH" = "arm64" ]; then COMPOSE_ARCH="aarch64"; else COMPOSE_ARCH="x86_64"; fi && \
    curl -SL "https://github.com/docker/compose/releases/download/v2.24.5/docker-compose-linux-$COMPOSE_ARCH" -o /usr/local/bin/docker-compose && \
    chmod +x /usr/local/bin/docker-compose

# # 3. 미러 사이트 설정 (기존과 동일)
# RUN mkdir -p /var/jenkins_home/update-center-rootCAs && \
#     curl -L https://cdn.jsdelivr.net/gh/lework/jenkins-update-center/rootCA/update-center.crt -o /var/jenkins_home/update-center-rootCAs/update-center.crt && \
#     chown -R jenkins:jenkins /var/jenkins_home/update-center-rootCAs

# RUN echo '<?xml version="1.0" encoding="UTF-8"?><sites><site><id>default</id><url>https://raw.githubusercontent.com/lework/jenkins-update-center/master/updates/tencent/update-center.json</url></site></sites>' > /usr/share/jenkins/ref/hudson.model.UpdateCenter.xml

USER jenkins