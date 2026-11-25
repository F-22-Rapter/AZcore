@echo off
rem Disabled to prevent 10+ GB duplicate host RAM staging buffers on Vulkan
rem set GGML_VK_DISABLE_HOST_VISIBLE_VIDMEM=1

"C:\Tools\llama-cpp\llama-server.exe" ^
  -m "C:\Users\a1234\.lmstudio\models\unsloth\Qwen3.8-27B-GGUF\Qwen3.8-27B-UD-IQ3_XXS.gguf" ^
  -ngl 99 ^
  -c 16384 ^
  -np 1 ^
  --flash-attn on ^
  -ctk q4_0 -ctv q4_0 ^
  -b 512 -ub 256 ^
  --reasoning-budget 0 ^
  --host 127.0.0.1 --port 9931
pause
