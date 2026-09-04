#!/usr/bin/env bash
# Regenerates the architecture diagrams (architecture/diagrams/*.png) from
# architecture/workspace.dsl (the Structurizr DSL — the single source of truth
# for this system's architecture).
#
# Usage:
#   ./architecture/generate.sh
#
# Requires: java 17+, network access on first run (to fetch the Structurizr
# CLI and PlantUML jars, cached under architecture/.tools/ which is
# gitignored). No network is needed on subsequent runs.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
TOOLS_DIR="$SCRIPT_DIR/.tools"
DIAGRAMS_DIR="$SCRIPT_DIR/diagrams"
DSL_FILE="$SCRIPT_DIR/workspace.dsl"

STRUCTURIZR_CLI_VERSION="v2025.11.09"
PLANTUML_VERSION="1.2024.7"

mkdir -p "$TOOLS_DIR" "$DIAGRAMS_DIR"

if ! command -v java >/dev/null 2>&1; then
  echo "error: java is required (java 17+) to render diagrams" >&2
  exit 1
fi

# --- Structurizr CLI ---------------------------------------------------
STRUCTURIZR_DIR="$TOOLS_DIR/structurizr-cli"
if [ ! -f "$STRUCTURIZR_DIR/structurizr.sh" ]; then
  echo "Fetching Structurizr CLI $STRUCTURIZR_CLI_VERSION..."
  curl -sL -o "$TOOLS_DIR/structurizr-cli.zip" \
    "https://github.com/structurizr/cli/releases/download/${STRUCTURIZR_CLI_VERSION}/structurizr-cli.zip"
  unzip -q -o "$TOOLS_DIR/structurizr-cli.zip" -d "$STRUCTURIZR_DIR"
  chmod +x "$STRUCTURIZR_DIR/structurizr.sh"
  rm -f "$TOOLS_DIR/structurizr-cli.zip"
fi

# --- PlantUML jar (renders the exported .puml files to PNG) ------------
PLANTUML_JAR="$TOOLS_DIR/plantuml-${PLANTUML_VERSION}.jar"
if [ ! -f "$PLANTUML_JAR" ]; then
  echo "Fetching PlantUML $PLANTUML_VERSION..."
  curl -sL -o "$PLANTUML_JAR" \
    "https://github.com/plantuml/plantuml/releases/download/v${PLANTUML_VERSION}/plantuml-${PLANTUML_VERSION}.jar"
fi

# --- Validate the DSL ----------------------------------------------------
echo "Validating $DSL_FILE ..."
"$STRUCTURIZR_DIR/structurizr.sh" validate -workspace "$DSL_FILE"

# --- Export to PlantUML ---------------------------------------------------
EXPORT_DIR="$TOOLS_DIR/export"
rm -rf "$EXPORT_DIR"
mkdir -p "$EXPORT_DIR"
echo "Exporting views to PlantUML..."
"$STRUCTURIZR_DIR/structurizr.sh" export -workspace "$DSL_FILE" -format plantuml -output "$EXPORT_DIR"

# --- Render PNGs -----------------------------------------------------------
# PLANTUML_LIMIT_SIZE is raised because the default 4096px cap clips wide
# container diagrams like this one.
echo "Rendering PNGs..."
java -DPLANTUML_LIMIT_SIZE=8192 -jar "$PLANTUML_JAR" -tpng \
  "$EXPORT_DIR/structurizr-SystemContext.puml" \
  "$EXPORT_DIR/structurizr-Containers.puml"

cp "$EXPORT_DIR/structurizr-SystemContext.png" "$DIAGRAMS_DIR/context.png"
cp "$EXPORT_DIR/structurizr-Containers.png" "$DIAGRAMS_DIR/containers.png"

echo "Done. Diagrams written to $DIAGRAMS_DIR/{context,containers}.png"
