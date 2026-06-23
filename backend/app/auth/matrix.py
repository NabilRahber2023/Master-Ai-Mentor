"""
Permission matrix — mirrors frontend/lib/rbac.ts. Keep the two in sync.

Planes:
  platform_role  → user.role   (super_admin | support | user | guest; legacy 'admin' == super_admin)
  org_role       → member.role  (owner | admin | analyst | mentor | viewer | guest; legacy 'member' == mentor)
A permission is granted if the platform role OR the org role grants it.
"""
from typing import Optional

PLATFORM_PERMS = {
    "super_admin": {"*"},
    "admin": {"*"},  # legacy platform admin == super_admin
    "support": {"platform:impersonate", "audit:read", "dashboard:view", "predict:single", "chatbot:use"},
    "user": set(),
    "guest": set(),
}

ORG_PERMS = {
    "owner": {"org:manageMembers", "org:settings", "org:billing",
              "dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view"},
    "admin": {"org:manageMembers", "org:settings",
              "dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view"},
    # analyst — run everything (single + batch) + upload, no member management.
    "analyst": {"dataset:upload", "predict:single", "predict:batch", "chatbot:use", "dashboard:view"},
    "mentor": {"predict:single", "chatbot:use", "dashboard:view"},
    "member": {"predict:single", "chatbot:use", "dashboard:view"},  # legacy alias of mentor
    # viewer — read-only stakeholder: dashboards only.
    "viewer": {"dashboard:view"},
    # guest — pending/unapproved: no powers.
    "guest": set(),
}


def is_super_admin(platform_role: Optional[str]) -> bool:
    return platform_role in ("super_admin", "admin")


def has_permission(platform_role: Optional[str], org_role: Optional[str], perm: str) -> bool:
    if is_super_admin(platform_role):
        return True
    p = PLATFORM_PERMS.get(platform_role or "", set())
    if "*" in p or perm in p:
        return True
    o = ORG_PERMS.get(org_role or "", set())
    return perm in o
