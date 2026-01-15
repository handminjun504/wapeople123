#!/bin/bash

# 외장하드로 이동 후 대화 내역 복원 스크립트
# 사용법: 외장하드에서 Cursor로 프로젝트를 연 후 이 스크립트 실행

# 현재 프로젝트 경로 감지
PROJECT_PATH=$(pwd)
PROJECT_NAME=$(echo $PROJECT_PATH | sed 's|/|-|g' | sed 's|^-||')

# Cursor 대화 내역 폴더 생성
CURSOR_PROJECT_DIR="$HOME/.cursor/projects/$PROJECT_NAME"
mkdir -p "$CURSOR_PROJECT_DIR/agent-transcripts"

# 백업한 대화 내역 복원
if [ -f "$PROJECT_PATH/cursor-backup/conversation.txt" ]; then
    cp "$PROJECT_PATH/cursor-backup/conversation.txt" \
       "$CURSOR_PROJECT_DIR/agent-transcripts/7d40ad92-7be3-401e-9dd5-32565f4ed4d7.txt"
    echo "✅ 대화 내역 복원 완료!"
    echo "📁 복원 위치: $CURSOR_PROJECT_DIR/agent-transcripts/"
else
    echo "❌ 백업 파일을 찾을 수 없습니다: cursor-backup/conversation.txt"
fi
