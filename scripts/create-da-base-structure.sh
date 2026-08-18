#!/usr/bin/env bash

# Compatible with the Bash 3.2 version included with macOS.
set -Eeo pipefail

DA_ORG="${DA_ORG:-ruslan-khabachou}"
BASE_SITE="${BASE_SITE:-base-site}"
LOCALES="${LOCALES:-en,fr}"
DA_ADMIN_ORIGIN="${DA_ADMIN_ORIGIN:-https://admin.da.live}"
APPLY=false

if [[ "${1:-}" == "--apply" ]]; then
  APPLY=true
elif [[ -n "${1:-}" ]]; then
  echo "Usage: $0 [--apply]" >&2
  exit 1
fi

if [[ ! "${DA_ORG}" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Invalid DA_ORG: ${DA_ORG}" >&2
  exit 1
fi

if [[ ! "${BASE_SITE}" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
  echo "Invalid BASE_SITE: ${BASE_SITE}" >&2
  exit 1
fi

if [[ "${APPLY}" == true && -z "${DA_IMS_TOKEN:-}" ]]; then
  echo "DA_IMS_TOKEN is required with --apply" >&2
  exit 1
fi

ensure_folder() {
  local relative_path="$1"
  local url="${DA_ADMIN_ORIGIN}/source/${DA_ORG}/${relative_path}"

  if [[ "${APPLY}" != true ]]; then
    echo "DRY-RUN POST ${url}"
    return
  fi

  local status
  status="$(
    curl --silent \
      --show-error \
      --output /dev/null \
      --write-out '%{http_code}' \
      --header "Authorization: Bearer ${DA_IMS_TOKEN}" \
      "${url}/"
  )"

  case "${status}" in
    200)
      echo "EXISTS  ${DA_ORG}/${relative_path}"
      return
      ;;
    404)
      ;;
    401)
      echo "FAILED  ${relative_path}: DA IMS token is invalid or expired" >&2
      exit 1
      ;;
    403)
      echo "FAILED  ${relative_path}: authenticated user has no DA write permission" >&2
      exit 1
      ;;
    *)
      echo "FAILED  ${relative_path}: lookup returned HTTP ${status}" >&2
      exit 1
      ;;
  esac

  status="$(
    curl --silent \
      --show-error \
      --output /dev/null \
      --write-out '%{http_code}' \
      --request POST \
      --header "Authorization: Bearer ${DA_IMS_TOKEN}" \
      "${url}"
  )"

  case "${status}" in
    200|201|204|409)
      echo "READY   ${DA_ORG}/${relative_path}"
      ;;
    *)
      echo "FAILED  ${relative_path}: create returned HTTP ${status}" >&2
      exit 1
      ;;
  esac
}

echo "Mode: $([[ "${APPLY}" == true ]] && echo APPLY || echo DRY-RUN)"
echo "DA organization: ${DA_ORG}"
echo "Base site: ${BASE_SITE}"
echo "Locales: ${LOCALES}"
echo

ensure_folder "${BASE_SITE}"

echo "${LOCALES}" |
  tr ',' '\n' |
  while IFS= read -r locale; do
    locale="$(echo "${locale}" | tr -d '[:space:]')"

    [[ -n "${locale}" ]] || continue

    if [[ ! "${locale}" =~ ^[a-z][a-z0-9-]*$ ]]; then
      echo "Invalid locale: ${locale}" >&2
      exit 1
    fi

    ensure_folder "${BASE_SITE}/${locale}"
  done

echo
echo "DA structure is ready:"
echo "https://da.live/#/${DA_ORG}/${BASE_SITE}"