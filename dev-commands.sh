#!/usr/bin/env bash
# Local dev helper commands. Not tracked in git.

COMPOSE="docker compose -f docker-compose.dev.yml"

# Start all services (detached)
$COMPOSE up -d

# Start only mongodb
$COMPOSE up -d mongodb

# Seed product data
$COMPOSE run --rm seed npm run db:seed

# Seed admin user (needs ADMIN_EMAIL, ADMIN_PASSWORD >=8 chars, ADMIN_NAME in backend/.env)
$COMPOSE run --rm seed npm run db:seed-admin

# Stop all services
$COMPOSE down
