.PHONY: install dev build start clean tauri-dev tauri-build

# Use pnpm as the primary package manager
PM = pnpm
PORT = 8899

# Install dependencies
install:
	@echo "Installing dependencies using pnpm..."
	$(PM) install
	@echo "All dependencies installed successfully!"

# Run the Next.js frontend development server (Online Mode)
dev:
	@echo "Starting pktgym web on port $(PORT)..."
	PORT=$(PORT) $(PM) run dev

# Build the application for production (Web)
build:
	@echo "Building web application..."
	$(PM) run build

# Start the production web server
start:
	@echo "Starting production web server on port $(PORT)..."
	PORT=$(PORT) $(PM) run start

# --- Tauri Offline App Commands ---

# Run the Tauri Desktop app in development mode
tauri-dev:
	@echo "Starting Tauri Desktop App in dev mode..."
	$(PM) tauri dev

# Build the Tauri Desktop app for production (Mac/Windows/Linux binaries)
tauri-build:
	@echo "Building Tauri Desktop App binaries..."
	$(PM) tauri build

# --- Cleanup ---

# Clean node_modules, build caches, and Tauri targets
clean:
	@echo "Cleaning up node_modules, Next build, and Tauri targets..."
	rm -rf node_modules
	rm -rf .next
	rm -rf out
	rm -rf src-tauri/target
	@echo "Clean complete!"