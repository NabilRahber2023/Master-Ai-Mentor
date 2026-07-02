"""
Guardrail: the backend permission matrix (app/auth/matrix.py) must stay in sync
with the frontend one (frontend/lib/rbac.ts). These are hand-maintained in two
languages; this test fails loudly on drift instead of letting an authorization
bug ship silently.

The frontend enumerates every permission for the wildcard roles
(super_admin/admin) where the backend uses the sentinel {"*"}. We treat {"*"} as
"the full permission set" (ALL_PERMISSIONS parsed from rbac.ts) when comparing.
"""
import re
from pathlib import Path

from app.auth.matrix import ORG_PERMS as PY_ORG_PERMS
from app.auth.matrix import PLATFORM_PERMS as PY_PLATFORM_PERMS

RBAC_TS = Path(__file__).resolve().parents[2] / "frontend" / "lib" / "rbac.ts"


def _block(source: str, decl: str) -> str:
    """Return the object-literal body for a `const <decl> ... = { ... };`."""
    start = source.index(decl)
    brace = source.index("{", start)
    depth = 0
    for i in range(brace, len(source)):
        if source[i] == "{":
            depth += 1
        elif source[i] == "}":
            depth -= 1
            if depth == 0:
                return source[brace + 1 : i]
    raise AssertionError(f"Unterminated block for {decl}")


def _parse_perm_map(block: str) -> dict[str, set[str]]:
    """Parse `role: [ "perm", ... ]` entries into {role: {perms}}."""
    result: dict[str, set[str]] = {}
    for role, body in re.findall(r"(\w+)\s*:\s*\[([^\]]*)\]", block):
        result[role] = set(re.findall(r'"([^"]+)"', body))
    return result


def _parse_string_array(source: str, decl: str) -> set[str]:
    block = _block_array(source, decl)
    return set(re.findall(r'"([^"]+)"', block))


def _block_array(source: str, decl: str) -> str:
    start = source.index(decl)
    # Anchor on the assignment so a `Permission[]` type annotation isn't mistaken
    # for the array literal.
    eq = source.index("=", start)
    lb = source.index("[", eq)
    depth = 0
    for i in range(lb, len(source)):
        if source[i] == "[":
            depth += 1
        elif source[i] == "]":
            depth -= 1
            if depth == 0:
                return source[lb + 1 : i]
    raise AssertionError(f"Unterminated array for {decl}")


def _load_ts():
    source = RBAC_TS.read_text(encoding="utf-8")
    platform = _parse_perm_map(_block(source, "const PLATFORM_PERMS"))
    org = _parse_perm_map(_block(source, "const ORG_PERMS"))
    all_perms = _parse_string_array(source, "const ALL_PERMISSIONS")
    return platform, org, all_perms


def _normalize(py_map: dict[str, set[str]], all_perms: set[str]) -> dict[str, set[str]]:
    """Expand the backend's {"*"} wildcard to the full permission set."""
    return {
        role: (set(all_perms) if perms == {"*"} else set(perms))
        for role, perms in py_map.items()
    }


def test_rbac_files_exist():
    assert RBAC_TS.exists(), f"frontend RBAC file not found at {RBAC_TS}"


def test_platform_perms_in_sync():
    ts_platform, _, all_perms = _load_ts()
    py_platform = _normalize(PY_PLATFORM_PERMS, all_perms)
    assert all_perms, "Failed to parse ALL_PERMISSIONS from rbac.ts"
    assert set(py_platform) == set(ts_platform), (
        "Platform roles differ between matrix.py and rbac.ts: "
        f"py={sorted(py_platform)} ts={sorted(ts_platform)}"
    )
    for role in py_platform:
        assert py_platform[role] == ts_platform[role], (
            f"Platform role '{role}' permissions drifted.\n"
            f"  matrix.py: {sorted(py_platform[role])}\n"
            f"  rbac.ts  : {sorted(ts_platform[role])}"
        )


def test_org_perms_in_sync():
    _, ts_org, all_perms = _load_ts()
    py_org = _normalize(PY_ORG_PERMS, all_perms)
    assert set(py_org) == set(ts_org), (
        "Org roles differ between matrix.py and rbac.ts: "
        f"py={sorted(py_org)} ts={sorted(ts_org)}"
    )
    for role in py_org:
        assert py_org[role] == ts_org[role], (
            f"Org role '{role}' permissions drifted.\n"
            f"  matrix.py: {sorted(py_org[role])}\n"
            f"  rbac.ts  : {sorted(ts_org[role])}"
        )
