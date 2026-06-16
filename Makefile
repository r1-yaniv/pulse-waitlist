COMPOSE = docker compose
PSQL    = $(COMPOSE) exec -T db psql -U pulse -d waitlist

.DEFAULT_GOAL := help

help:   ## list targets
	@grep -E '^[a-z-]+:.*##' $(MAKEFILE_LIST) | sed 's/:.*## /\t/' | sort

up:     ## build + start full stack (web + db) detached
	$(COMPOSE) up -d --build

down:   ## stop and remove containers (keeps data volume)
	$(COMPOSE) down

clean:  ## stop and WIPE the db volume (destructive)
	$(COMPOSE) down -v

db-up:  ## start only Postgres (for host-mode `npm run dev`)
	$(COMPOSE) up -d db

seed:   ## load db/seed.sql into the running Postgres
	$(PSQL) < db/seed.sql

reset:  ## fresh db: wipe volume, rebuild, wait healthy, seed
	$(COMPOSE) down -v && $(COMPOSE) up -d --build && sleep 6 && $(MAKE) seed

logs:   ## tail all service logs
	$(COMPOSE) logs -f

psql:   ## interactive psql shell
	$(COMPOSE) exec db psql -U pulse -d waitlist

count:  ## quick API smoke check
	curl -s localhost:8080/api/count

dev:    ## host-mode reload (db in docker, static+api on host at :8080)
	$(MAKE) db-up && npm run dev

.PHONY: help up down clean db-up seed reset logs psql count dev
