.PHONY: install dev build start clean

# Use pnpm as the primary package manager
PM = pnpm
PORT = 8899

# Install dependencies
install:
	@echo "Installing dependencies using pnpm..."
	$(PM) install
	@echo "All dependencies installed successfully!"

# Run the Next.js frontend development server
dev:
	@echo "Starting pktgym on port $(PORT)..."
	PORT=$(PORT) $(PM) run dev

# Build the application for production
build:
	@echo "Building application..."
	$(PM) run build

# Start the production server
start:
	@echo "Starting production server on port $(PORT)..."
	PORT=$(PORT) $(PM) run start

# Clean node_modules and Next.js build cache
clean:
	@echo "Cleaning up node_modules and build artifacts..."
	rm -rf node_modules
	rm -rf .next
	@echo "Clean complete!"
