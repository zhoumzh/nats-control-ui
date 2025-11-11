#!/bin/bash

git status

# 检查是否有变更
if git diff --quiet && git diff --cached --quiet; then
    echo "没有变更需要提交"
    exit 0
fi

# 提示用户确认
read -p "是否继续提交? (y/N): " confirm
if [[ $confirm =~ ^[Yy]$ ]]; then
    # 提示用户输入提交信息
    read -p "请输入提交信息 (直接回车使用默认信息): " commit_message

    # 如果用户没有输入信息，使用默认值
    if [[ -z "$commit_message" ]]; then
        commit_message="开发中ai编辑前保护性提交"
    fi

    # 自动提交脚本
    git add .
    git commit -m "$commit_message"
    git push
else
    echo "取消提交"
fi