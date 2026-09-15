.PHONY: dev dev-worker build preview deploy clean stop

dev:
	@npx --yes concurrently -n app,worker -c blue,green "npm run dev" "npm run dev:worker"

dev-worker:
	npm run dev:worker

build:
	npm run build

preview:
	npm run preview

deploy:
	npm run deploy

stop:
	@pkill -9 -f "concurrently" 2>/dev/null; \
	 pkill -9 -f "wrangler" 2>/dev/null; \
	 pkill -9 -f "workerd" 2>/dev/null; \
	 pkill -9 -f "vite" 2>/dev/null; \
	 sleep 1; echo "stopped"

clean:
	rm -rf dist node_modules/.vite
