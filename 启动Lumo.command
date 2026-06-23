#!/bin/bash
cd "$(dirname "$0")"
echo "正在启动 Lumo..."
pnpm dev &
sleep 2
open http://localhost:5173
echo "已打开浏览器，访问 http://localhost:5173"
