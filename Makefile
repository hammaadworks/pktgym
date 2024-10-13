.PHONY: install dev start-frontend start-bridge clean

# Install dependencies for both frontend and bridge-server
install:
	@echo "Installing frontend dependencies..."
	cd frontend && npm install
	@echo "Installing bridge-server dependencies..."
	cd bridge-server && npm install
	@echo "All dependencies installed successfully!"

# Run both the frontend and bridge-server concurrently
dev:
	@echo "Starting SweatSnap MVP (Frontend & Bridge Server)..."
	@make -j 2 start-frontend start-bridge

# Run with a tunnel (ngrok). Usage: make tunnel SOCKET_URL=https://your-url.ngrok.io
tunnel:
	@echo "Starting SweatSnap with Tunnel URL: $(SOCKET_URL)"
	@NEXT_PUBLIC_SOCKET_URL=$(SOCKET_URL) make dev

# Start the Next.js frontend (runs on port 3000)
start-frontend:
	@echo "Starting Frontend..."
	cd frontend && npm run dev

# Start the Socket.io bridge server (runs on port 3001)
start-bridge:
	@echo "Starting Bridge Server..."
	cd bridge-server && npm start

# Clean node_modules and Next.js build cache
clean:
	@echo "Cleaning up node_modules and build artifacts..."
	rm -rf frontend/node_modules
	rm -rf frontend/.next
	rm -rf bridge-server/node_modules
	@echo "Clean complete!"
