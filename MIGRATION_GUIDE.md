# Migration Guide: Feature-Based to Clean Architecture

This guide explains how to migrate existing modules from the feature-based structure to clean architecture.

## Current Structure (Feature-Based)

```
src/modules/user/
├── user.model.ts      # Mongoose model
├── user.routes.ts     # Routes with business logic
├── user.service.ts    # Service functions
└── user.controller.ts # Controllers
```

## Target Structure (Clean Architecture)

```
src/
├── domain/
│   ├── entities/user.entity.ts
│   └── repositories/user.repository.interface.ts
├── application/
│   ├── use-cases/user/
│   └── dtos/user.dto.ts
├── infrastructure/
│   └── repositories/user.repository.ts
└── presentation/
    ├── controllers/user.controller.ts
    └── routes/user.routes.ts
```

## Step-by-Step Migration

### Step 1: Create Domain Entity

Extract the core business object from the Mongoose model:

```typescript
// domain/entities/user.entity.ts
export class UserEntity {
  constructor(
    public id: string,
    public username: string,
    // ... other properties
  ) {}
  
  static fromDocument(doc: any): UserEntity {
    // Convert Mongoose document to entity
  }
}
```

### Step 2: Create Repository Interface

Define the data access contract:

```typescript
// domain/repositories/user.repository.interface.ts
export interface IUserRepository {
  create(user: Partial<UserEntity>): Promise<UserEntity>;
  findById(id: string): Promise<UserEntity | null>;
  // ... other methods
}
```

### Step 3: Create Use Cases

Extract business logic from services/routes into use cases:

```typescript
// application/use-cases/user/register-user.use-case.ts
export class RegisterUserUseCase {
  constructor(private userRepository: IUserRepository) {}
  
  async execute(input: RegisterUserDto): Promise<AuthResponseDto> {
    // Business logic here
  }
}
```

### Step 4: Create DTOs

Define data transfer objects:

```typescript
// application/dtos/user.dto.ts
export interface RegisterUserDto {
  username: string;
  email?: string;
  password: string;
}
```

### Step 5: Implement Repository

Create the infrastructure implementation:

```typescript
// infrastructure/repositories/user.repository.ts
export class UserRepository implements IUserRepository {
  async create(userData: Partial<UserEntity>): Promise<UserEntity> {
    const user = await User.create(userData);
    return UserEntity.fromDocument(user);
  }
  // ... implement other methods
}
```

### Step 6: Create Controller

Move HTTP handling to controller:

```typescript
// presentation/controllers/user.controller.ts
export class UserController {
  constructor(
    private registerUserUseCase: RegisterUserUseCase,
    // ... other use cases
  ) {}
  
  async register(req: Request, res: Response) {
    // Handle HTTP, call use case
  }
}
```

### Step 7: Create Routes

Wire up routes with dependency injection:

```typescript
// presentation/routes/user.routes.ts
const userRepository = new UserRepository();
const registerUserUseCase = new RegisterUserUseCase(userRepository);
const userController = new UserController(registerUserUseCase);

router.post('/register', (req, res) => userController.register(req, res));
```

## Migration Checklist

For each module:

- [ ] Extract domain entity from model
- [ ] Create repository interface
- [ ] Create use cases for each business operation
- [ ] Create DTOs for data transfer
- [ ] Implement repository with Mongoose
- [ ] Create controller
- [ ] Create routes with DI
- [ ] Update index.ts to use new routes
- [ ] Test all endpoints
- [ ] Remove old code (after verification)

## Example: Wallet Module Migration

The wallet module is more complex. Here's the approach:

1. **Domain**: `WalletEntity`, `WalletTxEntity`, `IWalletRepository`
2. **Application**: Use cases for topup, exchange, request creation
3. **Infrastructure**: MongoDB implementations
4. **Presentation**: Controllers and routes

## Benefits After Migration

- ✅ Testable: Easy to unit test use cases
- ✅ Maintainable: Clear separation of concerns
- ✅ Flexible: Easy to swap implementations
- ✅ Scalable: Easy to add new features

## Notes

- Keep legacy code until migration is verified
- Update imports gradually
- Test thoroughly after each module migration
- Use dependency injection for testability



