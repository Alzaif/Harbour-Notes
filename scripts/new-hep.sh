#!/usr/bin/env bash
# Create a new Harbour Enhancement Proposal from the template.
# Usage: ./scripts/new-hep.sh <short-title>
# Example: ./scripts/new-hep.sh service-registry-api

set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
HEPS_DIR="${ROOT}/docs/heps"
TEMPLATE="${HEPS_DIR}/hep-template.md"
INDEX="${HEPS_DIR}/README.md"

usage() {
  echo "Usage: new-hep.sh <short-title>" >&2
  echo "  Creates docs/heps/hep-NNNN-<short-title>.md and prints index reminder." >&2
}

slugify() {
  echo "$1" | tr '[:upper:]' '[:lower:]' | sed -E 's/[^a-z0-9]+/-/g; s/^-+|-+$//g; s/-+/-/g'
}

next_hep_number() {
  local max=0 n
  for f in "${HEPS_DIR}"/hep-[0-9]*-*.md; do
    [[ -e "$f" ]] || continue
    n="$(basename "$f" | sed -E 's/^hep-0*([0-9]+).*/\1/')"
    [[ "$n" =~ ^[0-9]+$ ]] || continue
    (( n > max )) && max="$n"
  done
  printf '%04d' $((max + 1))
}

main() {
  [[ $# -ge 1 ]] || { usage; exit 1; }
  [[ -f "$TEMPLATE" ]] || { echo "error: missing ${TEMPLATE}" >&2; exit 1; }

  local slug
  slug="$(slugify "$*")"
  local num
  num="$(next_hep_number)"
  local outfile="${HEPS_DIR}/hep-${num}-${slug}.md"

  if [[ -e "$outfile" ]]; then
    echo "error: already exists: ${outfile}" >&2
    exit 1
  fi

  sed -e "s/^HEP: NNNN/HEP: ${num}/" \
      -e "s/<Short descriptive title>/$(echo "$*" | sed 's/-/ /g')/" \
      -e "s/YYYY-MM-DD/$(date +%Y-%m-%d)/" \
      "$TEMPLATE" > "$outfile"

  echo "Created ${outfile}"
  echo ""
  echo "Next steps:"
  echo "  1. Complete all sections in the new HEP"
  echo "  2. Add a row to the index table in ${INDEX}"
  echo "  3. Set Status to Proposed when ready for review"
}

main "$@"
