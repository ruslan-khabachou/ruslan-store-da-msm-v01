#!/usr/bin/env bash

# Compatible with the Bash 3.2 version included with macOS.
set -Eeo pipefail

SCRIPT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd -- "${SCRIPT_DIR}/.." && pwd)"

EDS_ORG=""
DA_ORG=""
CODE_OWNER=""
CODE_REPO="ruslan-store-da-msm-v01"
CODE_REF="main"
MANIFEST="${PROJECT_DIR}/config/da/msm.csv"
APPLY=false
CREATE_DA_SITES=false
CONTINUE_ON_ERROR=false

AEM_ADMIN_ORIGIN="${AEM_ADMIN_ORIGIN:-https://admin.hlx.page}"
DA_ADMIN_ORIGIN="${DA_ADMIN_ORIGIN:-https://admin.da.live}"

usage() {
  printf '%s\n' \
    'Roll out the DA MSM topology to a target DA organization while reusing one GitHub repository.' \
    '' \
    'Usage:' \
    '  scripts/rollout-msm-org.sh \' \
    '    --eds-org <config-service-org> \' \
    '    --da-org <target-da-org> \' \
    '    --code-owner <github-owner> \' \
    '    [--code-repo <github-repo>] \' \
    '    [--code-ref <branch>] \' \
    '    [--manifest <msm.csv>] \' \
    '    [--create-da-sites] [--continue-on-error] [--apply]' \
    '' \
    'Separation of concerns:' \
    '  --eds-org     Existing EDS Configuration Service org (normally the GitHub owner).' \
    '  --da-org      New DA Author Bus organization that stores the content.' \
    '  --code-owner  Existing GitHub owner; unchanged across DA organization rollouts.' \
    '' \
    'Apply-mode environment variables:' \
    '  AEM_ADMIN_TOKEN  Required EDS Admin API auth token.' \
    '  DA_IMS_TOKEN     Required only with --create-da-sites.' \
    '' \
    'Example:' \
    '  scripts/rollout-msm-org.sh \' \
    '    --eds-org ruslan-khabachou \' \
    '    --da-org new-da-org-id \' \
    '    --code-owner ruslan-khabachou \' \
    '    --code-repo ruslan-store-da-msm-v01'
}

die() {
  printf 'ERROR: %s\n' "$*" >&2
  exit 1
}

log() {
  printf '%s\n' "$*"
}

clean_csv_cell() {
  local value="${1//$'\r'/}"
  value="${value#\"}"
  value="${value%\"}"
  printf '%s' "${value}"
}

validate_slug() {
  local label="$1"
  local value="$2"
  if [[ ! "${value}" =~ ^[a-z0-9][a-z0-9-]*$ ]]; then
    die "${label} must contain lowercase letters, numbers, and hyphens: ${value}"
  fi
}

contains() {
  local needle="$1"
  shift
  local item
  for item in "$@"; do
    [[ "${item}" == "${needle}" ]] && return 0
  done
  return 1
}

while (($#)); do
  case "$1" in
    --eds-org)
      (($# >= 2)) || die '--eds-org requires a value'
      EDS_ORG="$2"
      shift 2
      ;;
    --da-org|--target-org)
      (($# >= 2)) || die "$1 requires a value"
      DA_ORG="$2"
      shift 2
      ;;
    --org)
      (($# >= 2)) || die '--org requires a value'
      EDS_ORG="$2"
      DA_ORG="$2"
      shift 2
      ;;
    --code-owner)
      (($# >= 2)) || die '--code-owner requires a value'
      CODE_OWNER="$2"
      shift 2
      ;;
    --code-repo)
      (($# >= 2)) || die '--code-repo requires a value'
      CODE_REPO="$2"
      shift 2
      ;;
    --code-ref)
      (($# >= 2)) || die '--code-ref requires a value'
      CODE_REF="$2"
      shift 2
      ;;
    --manifest)
      (($# >= 2)) || die '--manifest requires a value'
      MANIFEST="$2"
      shift 2
      ;;
    --create-da-sites)
      CREATE_DA_SITES=true
      shift
      ;;
    --continue-on-error)
      CONTINUE_ON_ERROR=true
      shift
      ;;
    --apply)
      APPLY=true
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      die "Unknown option: $1"
      ;;
  esac
done

[[ -n "${EDS_ORG}" ]] || die '--eds-org is required'
[[ -n "${DA_ORG}" ]] || die '--da-org is required'
[[ -n "${CODE_OWNER}" ]] || CODE_OWNER="${EDS_ORG}"
[[ -f "${MANIFEST}" ]] || die "Manifest not found: ${MANIFEST}"
[[ "${AEM_ADMIN_ORIGIN}" == https://* ]] || die 'AEM_ADMIN_ORIGIN must use HTTPS'
[[ "${DA_ADMIN_ORIGIN}" == https://* ]] || die 'DA_ADMIN_ORIGIN must use HTTPS'

validate_slug 'EDS organization' "${EDS_ORG}"
validate_slug 'DA organization' "${DA_ORG}"
validate_slug 'Code owner' "${CODE_OWNER}"
validate_slug 'Code repository' "${CODE_REPO}"

if [[ "${APPLY}" == true ]]; then
  [[ -n "${AEM_ADMIN_TOKEN:-}" ]] || die 'AEM_ADMIN_TOKEN is required with --apply'
  if [[ "${CREATE_DA_SITES}" == true ]]; then
    [[ -n "${DA_IMS_TOKEN:-}" ]] || die 'DA_IMS_TOKEN is required with --create-da-sites --apply'
  fi
fi

BASE_SITES=()
SATELLITE_SITES=()
SATELLITE_BASES=()

while IFS=',' read -r raw_base raw_satellite _title _extra; do
  base="$(clean_csv_cell "${raw_base:-}")"
  satellite="$(clean_csv_cell "${raw_satellite:-}")"

  [[ -n "${base}" ]] || continue
  [[ "${base}" == 'base' && "${satellite}" == 'satellite' ]] && continue

  validate_slug 'Base site' "${base}"
  if [[ -z "${satellite}" ]]; then
    if ((${#BASE_SITES[@]} == 0)) || ! contains "${base}" "${BASE_SITES[@]}"; then
      BASE_SITES+=("${base}")
    fi
    continue
  fi

  validate_slug 'Satellite site' "${satellite}"
  if ((${#SATELLITE_SITES[@]} == 0)) || ! contains "${satellite}" "${SATELLITE_SITES[@]}"; then
    SATELLITE_SITES+=("${satellite}")
    SATELLITE_BASES+=("${base}")
  fi
done < "${MANIFEST}"

((${#BASE_SITES[@]} > 0)) || die 'Manifest contains no base sites'
if ((${#SATELLITE_SITES[@]} > 0)); then
  for satellite_index in "${!SATELLITE_SITES[@]}"; do
    parent="${SATELLITE_BASES[${satellite_index}]}"
    contains "${parent}" "${BASE_SITES[@]}" \
      || die "Satellite ${SATELLITE_SITES[${satellite_index}]} references missing base ${parent}"
  done
fi

site_payload() {
  local site="$1"
  printf '{"version":1,"code":{"owner":"%s","repo":"%s","ref":"%s","source":{"type":"github","url":"https://github.com/%s/%s"}},"content":{"source":{"url":"https://da-msm.adobeaem.workers.dev/%s/%s/","type":"markup"}}}' \
    "${CODE_OWNER}" "${CODE_REPO}" "${CODE_REF}" "${CODE_OWNER}" "${CODE_REPO}" "${DA_ORG}" "${site}"
}

code_payload() {
  printf '{"owner":"%s","repo":"%s","ref":"%s","source":{"type":"github","url":"https://github.com/%s/%s"}}' \
    "${CODE_OWNER}" "${CODE_REPO}" "${CODE_REF}" "${CODE_OWNER}" "${CODE_REPO}"
}

content_payload() {
  local site="$1"
  printf '{"source":{"url":"https://da-msm.adobeaem.workers.dev/%s/%s/","type":"markup"}}' \
    "${DA_ORG}" "${site}"
}

http_status() {
  curl --silent --show-error --output /dev/null --write-out '%{http_code}' "$@"
}

post_json() {
  local url="$1"
  local payload="$2"
  curl --silent --show-error --fail \
    --request POST \
    --header "x-auth-token: ${AEM_ADMIN_TOKEN}" \
    --header 'content-type: application/json' \
    --data "${payload}" \
    --output /dev/null \
    "${url}"
}

preflight_eds_admin() {
  [[ "${APPLY}" == true ]] || return 0
  local status
  status="$(http_status \
    --header "x-auth-token: ${AEM_ADMIN_TOKEN}" \
    "${AEM_ADMIN_ORIGIN}/config/${EDS_ORG}/users.json")"
  case "${status}" in
    200)
      log "READY   ACCESS   Organization administrator confirmed for ${EDS_ORG}"
      ;;
    401)
      die 'AEM_ADMIN_TOKEN is invalid or expired (HTTP 401)'
      ;;
    403)
      die "The authenticated identity is not an administrator of EDS org ${EDS_ORG} (HTTP 403)"
      ;;
    *)
      die "Unable to verify EDS org administration for ${EDS_ORG} (HTTP ${status})"
      ;;
  esac
}

ensure_da_site() {
  local site="$1"
  local url="${DA_ADMIN_ORIGIN}/source/${DA_ORG}/${site}"

  [[ "${CREATE_DA_SITES}" == true ]] || return 0
  if [[ "${APPLY}" != true ]]; then
    log "DRY-RUN DA       POST ${url}"
    return 0
  fi

  local status
  status="$(http_status --header "Authorization: Bearer ${DA_IMS_TOKEN}" "${url}/")"
  case "${status}" in
    200)
      log "EXISTS  DA       ${DA_ORG}/${site}"
      return 0
      ;;
    404)
      ;;
    401|403)
      log "FAILED  DA       ${DA_ORG}/${site}: authorization returned HTTP ${status}" >&2
      return 1
      ;;
    *)
      log "FAILED  DA       ${DA_ORG}/${site}: lookup returned HTTP ${status}" >&2
      return 1
      ;;
  esac

  status="$(http_status \
    --request POST \
    --header "Authorization: Bearer ${DA_IMS_TOKEN}" \
    "${url}")"
  case "${status}" in
    200|201|204|409)
      log "CREATED DA       ${DA_ORG}/${site}"
      ;;
    *)
      log "FAILED  DA       ${DA_ORG}/${site}: create returned HTTP ${status}" >&2
      return 1
      ;;
  esac
}

ensure_eds_site() {
  local site="$1"
  local role="$2"
  local parent="$3"
  local url="${AEM_ADMIN_ORIGIN}/config/${EDS_ORG}/sites/${site}.json"

  if [[ "${APPLY}" != true ]]; then
    log "DRY-RUN EDS      PUT ${url}"
    log "                  role=${role} base=${parent:-none} da=${DA_ORG}/${site}"
    log "                  $(site_payload "${site}")"
    return 0
  fi

  local status
  status="$(http_status --header "x-auth-token: ${AEM_ADMIN_TOKEN}" "${url}")"
  case "${status}" in
    200)
      post_json "${AEM_ADMIN_ORIGIN}/config/${EDS_ORG}/sites/${site}/code.json" "$(code_payload)" \
        || return 1
      post_json "${AEM_ADMIN_ORIGIN}/config/${EDS_ORG}/sites/${site}/content.json" "$(content_payload "${site}")" \
        || return 1
      ;;
    404)
      curl --silent --show-error --fail \
        --request PUT \
        --header "x-auth-token: ${AEM_ADMIN_TOKEN}" \
        --header 'content-type: application/json' \
        --data "$(site_payload "${site}")" \
        --output /dev/null \
        "${url}" || return 1
      ;;
    401|403)
      log "FAILED  EDS      ${EDS_ORG}/${site}: authorization returned HTTP ${status}" >&2
      return 1
      ;;
    *)
      log "FAILED  EDS      ${EDS_ORG}/${site}: lookup returned HTTP ${status}" >&2
      return 1
      ;;
  esac

  status="$(http_status --header "x-auth-token: ${AEM_ADMIN_TOKEN}" "${url}")"
  if [[ "${status}" != '200' ]]; then
    log "FAILED  EDS      ${EDS_ORG}/${site}: verification returned HTTP ${status}" >&2
    return 1
  fi

  log "READY   EDS      ${EDS_ORG}/${site} (${role})"
  log "                  https://main--${site}--${EDS_ORG}.aem.page/"
}

FAILED_SITES=()

provision_site() {
  local site="$1"
  local role="$2"
  local parent="$3"
  if ! ensure_da_site "${site}" || ! ensure_eds_site "${site}" "${role}" "${parent}"; then
    FAILED_SITES+=("${site}")
    [[ "${CONTINUE_ON_ERROR}" == true ]] || return 1
  fi
}

log "Mode: $([[ "${APPLY}" == true ]] && printf 'APPLY' || printf 'DRY-RUN')"
log "EDS organization: ${EDS_ORG}"
log "Target DA organization: ${DA_ORG}"
log "Shared GitHub code: ${CODE_OWNER}/${CODE_REPO}@${CODE_REF}"
log "Manifest: ${MANIFEST}"
log ''

preflight_eds_admin

log "Provisioning ${#BASE_SITES[@]} base site(s)..."
for site in "${BASE_SITES[@]}"; do
  provision_site "${site}" 'base' '' || exit 1
done

log ''
log "Provisioning ${#SATELLITE_SITES[@]} satellite site(s)..."
if ((${#SATELLITE_SITES[@]} > 0)); then
  for satellite_index in "${!SATELLITE_SITES[@]}"; do
    provision_site \
      "${SATELLITE_SITES[${satellite_index}]}" \
      'satellite' \
      "${SATELLITE_BASES[${satellite_index}]}" || exit 1
  done
fi

if ((${#FAILED_SITES[@]} > 0)); then
  printf 'Completed with failures: %s\n' "${FAILED_SITES[*]}" >&2
  exit 1
fi

log ''
if [[ "${APPLY}" == true ]]; then
  log 'Rollout completed. Copy the generated data, permissions, msm, and prepare tabs into the target DA org config.'
else
  log 'Dry-run completed. Review the split EDS/DA org values, then export tokens and add --apply.'
fi
