#!/usr/bin/env bash
#
# 開發伺服器啟動器：單一實例 + 持久日誌。
#
# 解決兩個實際踩過的坑：
#
# 1. 重複行程。`npm run dev` 直接跑，忘了關舊的就會疊一層。舊行程搶不到 3000 埠
#    但不會結束，於是畫面由最早那個行程服務——你改了程式碼卻看不到變化，
#    而且怎麼重整都沒用。這支腳本啟動前一定先清乾淨。
#
# 2. 日誌留不下來。tsx watch 的輸出只存在於當下終端，終端一關或被洗掉，
#    錯誤就查不回來了。這裡一律落地到檔案。
#
# 只清掉「本專案」的行程：用 cwd 比對，不靠指令字串猜。機器上可能同時開著
# 其他專案的 dev server，誤殺會很難查。
set -uo pipefail

PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
LOG_DIR="$PROJECT_DIR/tmp/logs"
LOG_FILE="$LOG_DIR/dev-server.log"
PID_FILE="$PROJECT_DIR/tmp/dev-server.pid"
PORT="${PORT:-3000}"

mkdir -p "$LOG_DIR"

# 找出 cwd 落在本專案的 node 行程。lsof 比 pgrep 可靠：
# pgrep 比對的是指令字串，抓不到「同名不同專案」的差異。
find_project_pids() {
  local pids=""
  for pid in $(pgrep -f "tsx watch server.ts|tsx/dist/loader.mjs server.ts" 2>/dev/null); do
    local cwd
    cwd="$(lsof -a -p "$pid" -d cwd -Fn 2>/dev/null | grep '^n' | head -1 | cut -c2-)"
    [ "$cwd" = "$PROJECT_DIR" ] && pids="$pids $pid"
  done
  echo "$pids" | tr -s ' ' | sed 's/^ //'
}

stop_existing() {
  local pids
  pids="$(find_project_pids)"

  # 佔用目標埠的行程也要一起處理：可能是上一輪留下的孤兒，
  # 父行程已死但它還抓著 socket，不清掉新的就起不來。
  local port_pid
  port_pid="$(lsof -nP -iTCP:"$PORT" -sTCP:LISTEN -t 2>/dev/null | head -1)"
  if [ -n "$port_pid" ]; then
    local port_cwd
    port_cwd="$(lsof -a -p "$port_pid" -d cwd -Fn 2>/dev/null | grep '^n' | head -1 | cut -c2-)"
    if [ "$port_cwd" = "$PROJECT_DIR" ]; then
      pids="$pids $port_pid"
    else
      echo "⚠️  埠 ${PORT} 被其他專案佔用（pid ${port_pid}, ${port_cwd}）"
      echo "    請改用 PORT=3001 npm run dev:log，或先自行關閉該行程。"
      exit 1
    fi
  fi

  pids="$(echo "$pids" | tr ' ' '\n' | grep -v '^$' | sort -u | tr '\n' ' ')"
  [ -z "${pids// /}" ] && { echo "✓ 沒有殘留的開發行程"; return; }

  echo "→ 停止既有開發行程：$pids"
  # shellcheck disable=SC2086
  kill $pids 2>/dev/null
  for _ in $(seq 1 10); do
    sleep 0.5
    # shellcheck disable=SC2086
    kill -0 $pids 2>/dev/null || { echo "✓ 已停止"; return; }
  done
  # 還活著就強制結束，否則接下來的啟動會因埠被占而失敗。
  echo "→ 行程未在 5 秒內結束，強制終止"
  # shellcheck disable=SC2086
  kill -9 $pids 2>/dev/null
  sleep 1
}

case "${1:-start}" in
  stop)
    stop_existing
    rm -f "$PID_FILE"
    exit 0
    ;;
  logs)
    [ -f "$LOG_FILE" ] || { echo "尚無日誌：$LOG_FILE"; exit 1; }
    exec tail -f "$LOG_FILE"
    ;;
  status)
    pids="$(find_project_pids)"
    if [ -n "${pids// /}" ]; then
      echo "執行中：$pids"
      lsof -nP -iTCP:"$PORT" -sTCP:LISTEN 2>/dev/null | tail -n +2 || echo "（未監聽 ${PORT}）"
    else
      echo "未執行"
    fi
    echo "日誌：$LOG_FILE"
    exit 0
    ;;
esac

stop_existing

# 保留上一輪日誌再開新的，這樣「重啟前發生什麼事」還查得到。
# 只留最近 5 份，避免無限長大。
if [ -f "$LOG_FILE" ]; then
  mv "$LOG_FILE" "$LOG_DIR/dev-server-$(date +%Y%m%d-%H%M%S).log"
  ls -1t "$LOG_DIR"/dev-server-*.log 2>/dev/null | tail -n +6 | xargs rm -f 2>/dev/null
fi

cd "$PROJECT_DIR"
{
  echo "==============================================="
  echo "啟動時間：$(date '+%Y-%m-%d %H:%M:%S')"
  echo "埠號：$PORT"
  echo "Node：$(node -v)"
  echo "==============================================="
} > "$LOG_FILE"

# setsid 讓伺服器脫離目前終端，關掉視窗不會連帶被殺。
# macOS 沒有 setsid，用 nohup 達到同樣效果。
PORT="$PORT" nohup npm run dev >> "$LOG_FILE" 2>&1 &
SERVER_PID=$!
echo "$SERVER_PID" > "$PID_FILE"

# 變數一律用 ${} 包起來。全形括號「）」的位元組會被 bash 當成變數名的一部分，
# 寫成 "$SERVER_PID）" 會被解讀為未定義變數，在 set -u 下直接中斷。
echo "→ 已啟動（pid ${SERVER_PID}），等待伺服器就緒…"

for i in $(seq 1 60); do
  if curl -fsS -o /dev/null --max-time 2 "http://localhost:$PORT/api/health" 2>/dev/null; then
    echo "✓ 伺服器就緒：http://localhost:${PORT}（耗時 ${i}s）"
    echo "  日誌：$LOG_FILE"
    echo "  追蹤：npm run dev:logs"
    exit 0
  fi
  # 行程若已死就不必再等，直接把日誌尾端秀出來，省得使用者自己去翻。
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    echo "✗ 伺服器啟動失敗，日誌尾端："
    tail -30 "$LOG_FILE"
    exit 1
  fi
  sleep 1
done

echo "✗ 60 秒內未就緒，日誌尾端："
tail -30 "$LOG_FILE"
exit 1
