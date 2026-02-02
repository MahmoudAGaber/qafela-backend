# Clean Architecture - Qafela Backend

This document describes the clean architecture structure of the Qafela backend application.

## Architecture Overview

The application follows **Clean Architecture** principles with clear separation of concerns across four main layers:

```
src/
├── domain/              # Domain Layer (Business Logic)
│   ├── entities/        # Domain entities (pure business objects)
│   └── repositories/    # Repository interfaces (contracts)
│
├── application/         # Application Layer (Use Cases)
│   ├── use-cases/      # Business use cases
│   └── dtos/           # Data Transfer Objects
│
├── infrastructure/      # Infrastructure Layer (External Concerns)
│   ├── repositories/   # Repository implementations (MongoDB, etc.)
│   └── utils/          # Infrastructure utilities (JWT, etc.)
│
└── presentation/       # Presentation Layer (API)
    ├── controllers/    # Request handlers
    └── routes/         # Express routes
```

## Layer Responsibilities

### 1. Domain Layer (`domain/`)
**Purpose**: Contains business logic and entities. No dependencies on frameworks or external libraries.

- **Entities**: Pure business objects representing core domain concepts
- **Repository Interfaces**: Contracts defining data access operations (no implementation)

**Rules**:
- ✅ No dependencies on other layers
- ✅ Pure TypeScript/JavaScript
- ✅ Framework-agnostic

**Example**: `UserEntity`, `IUserRepository`

### 2. Application Layer (`application/`)
**Purpose**: Contains use cases and application-specific business logic.

- **Use Cases**: Single-purpose business operations (e.g., RegisterUserUseCase)
- **DTOs**: Data structures for transferring data between layers

**Rules**:
- ✅ Depends only on Domain layer
- ✅ No framework dependencies
- ✅ Orchestrates domain entities and repositories

**Example**: `RegisterUserUseCase`, `LoginUserDto`

### 3. Infrastructure Layer (`infrastructure/`)
**Purpose**: Implements external concerns (database, APIs, file system, etc.)

- **Repository Implementations**: Concrete implementations of repository interfaces
- **External Services**: Third-party integrations
- **Utilities**: Infrastructure-specific helpers

**Rules**:
- ✅ Implements Domain interfaces
- ✅ Can use frameworks (Mongoose, Express, etc.)
- ✅ Depends on Domain and Application layers

**Example**: `UserRepository` (Mongoose implementation), `JWT utilities`

### 4. Presentation Layer (`presentation/`)
**Purpose**: Handles HTTP requests/responses and routing.

- **Controllers**: Handle HTTP requests, call use cases
- **Routes**: Define API endpoints

**Rules**:
- ✅ Depends on Application layer (use cases)
- ✅ Framework-specific (Express)
- ✅ Handles request/response formatting

**Example**: `UserController`, `user.routes.ts`

## Dependency Flow

```
Presentation → Application → Domain
     ↓              ↓
Infrastructure → Domain
```

**Key Principle**: Dependencies point inward. Outer layers depend on inner layers, never the reverse.

## Migration Strategy

The codebase is being migrated from feature-based to clean architecture:

1. **Phase 1**: User module migrated ✅
2. **Phase 2**: Wallet module (in progress)
3. **Phase 3**: Other modules (Drop, Barter, etc.)

Legacy code remains in `modules/` until migration is complete.

## Example: User Registration Flow

```
1. Request → presentation/routes/user.routes.ts
2. Route → presentation/controllers/user.controller.ts
3. Controller → application/use-cases/user/register-user.use-case.ts
4. Use Case → domain/repositories/user.repository.interface.ts (interface)
5. Use Case → infrastructure/repositories/user.repository.ts (implementation)
6. Repository → domain/entities/user.entity.ts
7. Response flows back through layers
```

## Benefits

1. **Testability**: Easy to mock dependencies
2. **Maintainability**: Clear separation of concerns
3. **Flexibility**: Easy to swap implementations (e.g., change database)
4. **Independence**: Business logic independent of frameworks
5. **Scalability**: Easy to add new features

## Best Practices

1. **Use Dependency Injection**: Pass dependencies through constructors
2. **Keep Use Cases Small**: One use case = one business operation
3. **No Business Logic in Controllers**: Controllers only handle HTTP concerns
4. **Repository Pattern**: Abstract data access behind interfaces
5. **DTOs for Boundaries**: Use DTOs when crossing layer boundaries

## File Naming Conventions

- Entities: `*.entity.ts`
- Repositories: `*.repository.interface.ts` (domain), `*.repository.ts` (infrastructure)
- Use Cases: `*-use-case.ts`
- DTOs: `*.dto.ts`
- Controllers: `*.controller.ts`
- Routes: `*.routes.ts`



