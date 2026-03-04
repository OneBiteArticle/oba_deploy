import sys
import re
import json

def analyze():
    log_path = sys.argv[1]
    job_name = sys.argv[2]
    build_num = sys.argv[3]
    build_url = sys.argv[4]

    with open(log_path, 'r', encoding='utf-8') as f:
        log_content = f.read()

    # 기술 스택 기반 팀 분류 규칙 수정
    rules = {
        'INFRA': [r'Docker', r'nginx', r'EC2', r'yml', r'Permission denied'],
        'AI': [r'RAG', r'embedding', r'OpenAI', r'vector', r'Python'],
        'DATA': [r'Airflow', r'Kafka', r'Spark', r'Flink', r'DAG'],
        'BACKEND': [r'Spring', r'Boot', r'MySQL', r'S3', r'MongoDB', r'Hibernate', r'NullPointerException', r'SQLException'],
        'FRONTEND': [r'React Native', r'expo', r'node', r'Zustand']
    }

    target_team = "공통/운영"
    for team, keywords in rules.items():
        if any(re.search(kw, log_content, re.IGNORECASE) for kw in keywords):
            target_team = team
            break

    # 마지막 15줄 추출
    summary = "\n".join(log_content.splitlines()[-15:])

    payload = {
        "username": "Jenkins-Analyzer",
        "icon_url": "https://jenkins.io/images/logos/jenkins/jenkins.png",
        "text": f"### 🚨 [{target_team}] 빌드 실패 알림\n**프로젝트:** {job_name}\n**빌드 번호:** #{build_num}\n**에러 요약:**\n```\n{summary}\n```\n\n[👉 상세 로그 확인하기]({build_url}console)"
    }

    with open('mattermost_payload.json', 'w', encoding='utf-8') as f:
        json.dump(payload, f, ensure_ascii=False)

if __name__ == "__main__":
    analyze()