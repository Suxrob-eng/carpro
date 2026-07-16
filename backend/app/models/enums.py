from enum import Enum


class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"


class CarFuel(str, Enum):
    BENZIN = "Benzin"
    DIZEL = "Dizel"
    GAZ = "Gaz"
    ELEKTR = "Elektr"
    GIBRID = "Gibrid"


class CarTransmission(str, Enum):
    AVTOMAT = "Avtomat"
    MEXANIK = "Mexanik"
    VARIATOR = "Variator"
    ROBOT = "Robot"


class CarStatus(str, Enum):
    ACTIVE = "active"
    SOLD = "sold"
    PENDING = "pending"
    ARCHIVED = "archived"


class ChatStatus(str, Enum):
    ACTIVE = "active"
    CLOSED = "closed"
    BLOCKED = "blocked"
