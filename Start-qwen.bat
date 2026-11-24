@echo off
"C:\Tools\llama-cpp\llama-server.exe"^
  -m "C:\Users\a1234\.lmstudio\models\unsloth\Qwen3.8-27B-GGUF\Qwen3.8-27B-UD-Q3_K_XL.gguf" ^
  -ngl 99 ^
  --no-mmap ^
  -c 16384 ^
  -np 1 ^
  --flash-attn on ^
  -ctk q4_0 -ctv q4_0 ^
  -b 2048 -ub 512 ^
  --spec-type draft-mtp ^
  --spec-draft-n-max 3 ^
  --reasoning-budget 0 ^
  --cache-reuse 256 ^
  --host 127.0.0.1 --port 9931
pause