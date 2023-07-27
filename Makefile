build:
	npm run build

clean:
	rm -rf dist/*

install:
	npm install

lint:
	npm run lint

format:
	npm run format

test:
	npm run test

smoke:
	@echo ""
	@echo "+++ Running example app in docker"
	@echo ""
	cd examples/factorial && docker-compose up --build --exit-code-from factorial-example

unsmoke:
	@echo ""
	@echo "+++ Spinning down example app in docker"
	@echo ""
	cd examples/factorial && docker-compose down

.PHONY: build clean install lint format test smoke unsmoke
