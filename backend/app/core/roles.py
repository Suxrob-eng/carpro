from enum import Enum
from typing import Set, List, Dict


class UserRole(str, Enum):
    """Foydalanuvchi rollari"""
    ADMIN = "admin"
    MANAGER = "manager"
    USER = "user"
    GUEST = "guest"
    SUPER_ADMIN = "super_admin"  # Qo'shimcha rol


class RolePermissions:
    """Har bir rol uchun ruxsatlar"""
    
    PERMISSIONS: Dict[UserRole, Set[str]] = {
        UserRole.SUPER_ADMIN: {
            "users:read", "users:write", "users:delete", "users:block", "users:unblock",
            "cars:read", "cars:write", "cars:delete", "cars:create",
            "categories:read", "categories:write", "categories:delete", "categories:create",
            "stats:read", "logs:read", "logs:delete",
            "settings:read", "settings:write",
            "roles:read", "roles:write"
        },
        UserRole.ADMIN: {
            "users:read", "users:write", "users:delete", "users:block",
            "cars:read", "cars:write", "cars:delete", "cars:create",
            "categories:read", "categories:write", "categories:delete", "categories:create",
            "stats:read", "logs:read",
            "settings:read"
        },
        UserRole.MANAGER: {
            "cars:read", "cars:write", "cars:delete", "cars:create",
            "categories:read", "categories:write", "categories:create",
            "users:read",
            "stats:read"
        },
        UserRole.USER: {
            "cars:read",
            "profile:read", "profile:write",
            "cars:create", "cars:update_own", "cars:delete_own"
        },
        UserRole.GUEST: {
            "cars:read",
            "categories:read"
        }
    }
    
    @classmethod
    def get_permissions(cls, role: UserRole) -> Set[str]:
        """Rol uchun ruxsatlarni olish"""
        return cls.PERMISSIONS.get(role, set())
    
    @classmethod
    def has_permission(cls, role: UserRole, permission: str) -> bool:
        """Rol ma'lum ruxsatga egami?"""
        return permission in cls.get_permissions(role)
    
    @classmethod
    def get_role_hierarchy(cls) -> Dict[UserRole, List[UserRole]]:
        """Role ierarxiyasi"""
        return {
            UserRole.SUPER_ADMIN: [UserRole.ADMIN, UserRole.MANAGER, UserRole.USER, UserRole.GUEST],
            UserRole.ADMIN: [UserRole.MANAGER, UserRole.USER, UserRole.GUEST],
            UserRole.MANAGER: [UserRole.USER, UserRole.GUEST],
            UserRole.USER: [UserRole.GUEST],
            UserRole.GUEST: []
        }
    
    @classmethod
    def has_role_hierarchy(cls, role: UserRole, target_role: UserRole) -> bool:
        """Rol ierarxiyada yuqori yoki tengmi?"""
        if role == target_role:
            return True
        hierarchy = cls.get_role_hierarchy()
        for higher_role, lower_roles in hierarchy.items():
            if higher_role == role and target_role in lower_roles:
                return True
        return False
    
    @classmethod
    def get_all_permissions(cls) -> Set[str]:
        """Barcha mavjud ruxsatlar"""
        all_perms = set()
        for perms in cls.PERMISSIONS.values():
            all_perms.update(perms)
        return all_perms
    
    @classmethod
    def get_roles_with_permission(cls, permission: str) -> List[UserRole]:
        """Ma'lum ruxsatga ega rollar"""
        roles = []
        for role, perms in cls.PERMISSIONS.items():
            if permission in perms:
                roles.append(role)
        return roles
    
    @classmethod
    def is_valid_permission(cls, permission: str) -> bool:
        """Ruxsat mavjudmi?"""
        return permission in cls.get_all_permissions()
    
    @classmethod
    def get_permission_description(cls, permission: str) -> str:
        """Ruxsat tavsifi"""
        descriptions = {
            "users:read": "Foydalanuvchilarni ko'rish",
            "users:write": "Foydalanuvchilarni yaratish va tahrirlash",
            "users:delete": "Foydalanuvchilarni o'chirish",
            "users:block": "Foydalanuvchilarni bloklash",
            "users:unblock": "Foydalanuvchilarni blokdan chiqarish",
            "cars:read": "Mashinalarni ko'rish",
            "cars:write": "Mashinalarni yaratish va tahrirlash",
            "cars:delete": "Mashinalarni o'chirish",
            "cars:create": "Yangi mashina yaratish",
            "categories:read": "Kategoriyalarni ko'rish",
            "categories:write": "Kategoriyalarni yaratish va tahrirlash",
            "categories:delete": "Kategoriyalarni o'chirish",
            "categories:create": "Yangi kategoriya yaratish",
            "stats:read": "Statistikani ko'rish",
            "logs:read": "Loglarni ko'rish",
            "logs:delete": "Loglarni o'chirish",
            "settings:read": "Sozlamalarni ko'rish",
            "settings:write": "Sozlamalarni tahrirlash",
            "roles:read": "Rollarni ko'rish",
            "roles:write": "Rollarni tahrirlash",
            "profile:read": "Profilni ko'rish",
            "profile:write": "Profilni tahrirlash"
        }
        return descriptions.get(permission, "Noma'lum ruxsat")