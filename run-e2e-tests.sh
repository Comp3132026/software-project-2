#!/bin/bash

# E2E Test Helper Script
# This script starts the backend and frontend servers, then runs Selenium tests

set -e

echo "╔════════════════════════════════════════════════════════════════╗"
echo "║       LifeSync E2E Testing with Selenium WebDriver            ║"
echo "╚════════════════════════════════════════════════════════════════╝"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check if required commands are available
check_requirements() {
  echo -e "\n${BLUE}📋 Checking requirements...${NC}"
  
  if ! command -v node &> /dev/null; then
    echo -e "${RED}✗ Node.js not found${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ Node.js found${NC}"

  if ! command -v npm &> /dev/null; then
    echo -e "${RED}✗ npm not found${NC}"
    exit 1
  fi
  echo -e "${GREEN}✓ npm found${NC}"

  if ! command -v google-chrome &> /dev/null && ! command -v chromium &> /dev/null && ! command -v chromium-browser &> /dev/null; then
    echo -e "${YELLOW}⚠ Chrome/Chromium not found in PATH${NC}"
    echo -e "${YELLOW}  Make sure Google Chrome or Chromium is installed${NC}"
  else
    echo -e "${GREEN}✓ Chrome/Chromium found${NC}"
  fi
}

# Install dependencies
install_deps() {
  echo -e "\n${BLUE}📦 Installing dependencies...${NC}"
  
  echo -e "${YELLOW}  Installing backend dependencies...${NC}"
  cd backend
  npm install --legacy-peer-deps
  cd ..
  echo -e "${GREEN}✓ Backend dependencies installed${NC}"

  echo -e "${YELLOW}  Installing frontend dependencies...${NC}"
  cd frontend
  npm install --legacy-peer-deps
  cd ..
  echo -e "${GREEN}✓ Frontend dependencies installed${NC}"
}

# Start servers
start_servers() {
  echo -e "\n${BLUE}🚀 Starting servers...${NC}"
  
  # Start backend
  echo -e "${YELLOW}  Starting backend on port 5000...${NC}"
  cd backend
  npm start > /tmp/backend.log 2>&1 &
  BACKEND_PID=$!
  cd ..
  
  # Wait for backend to start
  sleep 3
  
  # Start frontend
  echo -e "${YELLOW}  Starting frontend on port 3000...${NC}"
  cd frontend
  npm run dev > /tmp/frontend.log 2>&1 &
  FRONTEND_PID=$!
  cd ..
  
  # Wait for frontend to start
  sleep 5
  
  echo -e "${GREEN}✓ Servers started (Backend PID: $BACKEND_PID, Frontend PID: $FRONTEND_PID)${NC}"
}

# Check if servers are running
check_servers() {
  echo -e "\n${BLUE}🔍 Checking if servers are ready...${NC}"
  
  max_attempts=10
  attempt=0
  
  while [ $attempt -lt $max_attempts ]; do
    if curl -s http://localhost:5000/api/health > /dev/null 2>&1; then
      echo -e "${GREEN}✓ Backend is ready${NC}"
      break
    fi
    attempt=$((attempt + 1))
    echo -e "${YELLOW}  Waiting for backend... ($attempt/$max_attempts)${NC}"
    sleep 2
  done
  
  if [ $attempt -eq $max_attempts ]; then
    echo -e "${RED}✗ Backend failed to start${NC}"
    echo -e "${YELLOW}  Backend log: ${NC}"
    cat /tmp/backend.log
    kill $BACKEND_PID 2>/dev/null || true
    kill $FRONTEND_PID 2>/dev/null || true
    exit 1
  fi
  
  echo -e "${GREEN}✓ Frontend is running on port 3000${NC}"
}

# Run Selenium tests
run_tests() {
  echo -e "\n${BLUE}🧪 Running Selenium E2E tests...${NC}"
  
  cd backend
  npm run test:e2e
  TEST_RESULT=$?
  cd ..
  
  return $TEST_RESULT
}

# Cleanup
cleanup() {
  echo -e "\n${BLUE}🧹 Cleaning up...${NC}"
  
  if [ ! -z "$BACKEND_PID" ]; then
    echo -e "${YELLOW}  Stopping backend (PID: $BACKEND_PID)...${NC}"
    kill $BACKEND_PID 2>/dev/null || true
  fi
  
  if [ ! -z "$FRONTEND_PID" ]; then
    echo -e "${YELLOW}  Stopping frontend (PID: $FRONTEND_PID)...${NC}"
    kill $FRONTEND_PID 2>/dev/null || true
  fi
  
  # Give processes time to gracefully shutdown
  sleep 1
  
  echo -e "${GREEN}✓ Cleanup complete${NC}"
}

# Trap to ensure cleanup happens
trap cleanup EXIT

# Main execution
main() {
  check_requirements
  
  read -p "Do you want to install/update dependencies? (y/n) " -n 1 -r
  echo
  if [[ $REPLY =~ ^[Yy]$ ]]; then
    install_deps
  fi
  
  start_servers
  check_servers
  run_tests
  
  if [ $? -eq 0 ]; then
    echo -e "\n${GREEN}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${GREEN}║            ✓ All tests passed!                                  ║${NC}"
    echo -e "${GREEN}╚════════════════════════════════════════════════════════════════╝${NC}"
  else
    echo -e "\n${RED}╔════════════════════════════════════════════════════════════════╗${NC}"
    echo -e "${RED}║            ✗ Some tests failed                                   ║${NC}"
    echo -e "${RED}╚════════════════════════════════════════════════════════════════╝${NC}"
    exit 1
  fi
}

# Run main
main
