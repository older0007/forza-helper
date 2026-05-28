@echo off
echo Building Forza Horizon Companion standalone Windows executable...
npm run build:exe
echo.
echo Build complete! Executable is located in the dist/ folder:
echo dist/forza-companion.exe
echo.
pause
