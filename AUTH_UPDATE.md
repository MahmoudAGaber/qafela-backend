# Authentication Update Summary

## Changes Made

### 1. Base Response Structure
Created standardized response format for all API endpoints:
- **File**: `src/application/common/base-response.ts`
- **Structure**: `{ message, data, status, code }`
- **Status Types**: `success`, `error`, `failure`
- **Response Codes**: Standard HTTP codes (200, 201, 400, 401, 403, 404, 409, 500)

### 2. Updated User Entity
- Added new required fields:
  - `fullName: string`
  - `countryCode: string`
  - `phoneNumber: string`
  - `avatarUrl?: string`
- Updated `toUserResponse()` method to return complete user data

### 3. Updated DTOs
- **RegisterUserDto**: Now includes all signup fields
- **LoginUserDto**: Simplified to `usernameOrEmail` and `password`
- **UserResponseDto**: Complete user data structure

### 4. Updated Schemas
- **registerSchema**: Validates all new fields
- **loginSchema**: Simplified to username/email + password

### 5. Updated Use Cases
- **RegisterUserUseCase**: 
  - Validates username, email, and phone number uniqueness
  - Handles avatar URL
- **AuthenticateUserUseCase**: 
  - Accepts username or email
  - Returns complete user data
- **GetUserUseCase**: Returns complete user data

### 6. Updated Repository
- Added `findByPhoneNumber()` method
- Updated `create()` to handle all new fields

### 7. Updated Controller
- Uses `ResponseBuilder` for standardized responses
- Proper error handling with appropriate codes
- Returns complete user data in responses

### 8. Updated Routes
- **POST /api/users/register**: 
  - Accepts multipart/form-data for avatar upload
  - Fields: `username`, `fullName`, `email`, `countryCode`, `phoneNumber`, `password`, `avatar` (file)
- **POST /api/users/login**: 
  - Accepts JSON: `{ usernameOrEmail, password }`
  - Returns standardized response with user data and tokens

## API Endpoints

### Sign Up
**POST** `/api/users/register`

**Content-Type**: `multipart/form-data`

**Fields**:
- `username` (string, required)
- `fullName` (string, required)
- `email` (string, required, valid email)
- `countryCode` (string, required, e.g., "+966")
- `phoneNumber` (string, required)
- `password` (string, required, min 6 chars)
- `avatar` (file, optional, image: png/jpeg/webp, max 5MB)

**Response**:
```json
{
  "message": "User registered successfully",
  "data": {
    "user": {
      "_id": "...",
      "username": "...",
      "fullName": "...",
      "email": "...",
      "countryCode": "...",
      "phoneNumber": "...",
      "avatarUrl": "/uploads/avatar_...",
      "points": 1000,
      "wallet": { "dinar": 1000, "usdMinor": 0, "txCount": 0 },
      "level": 1,
      "xp": 0,
      "xpToNext": 100,
      "profile": { ... },
      "stats": { ... }
    },
    "tokens": {
      "access": "...",
      "refresh": "..."
    }
  },
  "status": "success",
  "code": 201
}
```

### Login
**POST** `/api/users/login`

**Content-Type**: `application/json`

**Body**:
```json
{
  "usernameOrEmail": "user@example.com",
  "password": "password123"
}
```

**Response**:
```json
{
  "message": "Login successful",
  "data": {
    "user": { ... },
    "tokens": {
      "access": "...",
      "refresh": "..."
    }
  },
  "status": "success",
  "code": 200
}
```

## Error Responses

All errors follow the same structure:
```json
{
  "message": "Error message",
  "data": null,
  "status": "error",
  "code": 400
}
```

**Common Error Codes**:
- `400`: Bad Request (invalid input)
- `401`: Unauthorized
- `403`: Forbidden
- `404`: Not Found
- `409`: Conflict (username/email/phone already taken)
- `500`: Internal Server Error

## File Upload

Avatar images are:
- Stored in `/uploads` directory
- Named: `avatar_{timestamp}_{sanitized_name}.{ext}`
- Max size: 5MB
- Allowed types: PNG, JPEG, JPG, WebP
- URL format: `/uploads/avatar_...`

## Database Schema Updates

User model now includes:
- `fullName` (required)
- `email` (required, unique)
- `countryCode` (required)
- `phoneNumber` (required, unique)
- `avatarUrl` (optional)

Indexes added:
- `email` (unique, sparse)
- `phoneNumber` (unique, sparse)



