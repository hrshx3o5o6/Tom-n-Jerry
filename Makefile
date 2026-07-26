.PHONY: help install-global remove-global doctor init bench

help:
	@echo "Usage:"
	@echo "  make install-global  — Inject TNJ loop protocol into ~/.config/opencode/AGENTS.md"
	@echo "  make remove-global   — Remove TNJ loop protocol from ~/.config/opencode/AGENTS.md"
	@echo "  make doctor          — Run diagnostic checks"
	@echo "  make init            — Initialize .tnj/ in project (skills + index)"
	@echo "  make bench           — Run agentic benchmark"

install-global:
	@node bin/tomnjerry.js install-global

remove-global:
	@node bin/tomnjerry.js remove-global

doctor:
	@node bin/tomnjerry.js doctor

init:
	@node bin/tomnjerry.js init

bench:
	@bash benchmarks/agentic/run.sh
