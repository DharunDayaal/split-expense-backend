# Authentication API Documentation

Base URL: `/api/auth`

All authentication endpoints for user registration, login, logout, and token management.

---

## 📋 Endpoints

### 1. Register User

**POST** `/api/auth/register`

Create a new user account.

**Request Body:**

```json
{
    "name": "John Doe",
    "email": "john@example.com",
    "password": "password123"
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "User registered successfully",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "John Doe",
            "email": "john@example.com",
            "avatarUrl": null,
            "isUpdated": 0,
            "createdAt": "2024-01-20T10:00:00.000Z",
            "updatedAt": "2024-01-20T10:00:00.000Z"
        }
    }
}
```

**Cookies Set:**

- `refreshToken` - HttpOnly, 7 days expiry

**Errors:**

- `400` - User already exists
- `400` - Validation errors (name, email, password requirements)

---

### 2. Login User

**POST** `/api/auth/login`

Authenticate existing user.

**Request Body:**

```json
{
    "email": "john@example.com",
    "password": "password123"
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "User logged in successfully",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
        "user": {
            "_id": "507f1f77bcf86cd799439011",
            "name": "John Doe",
            "email": "john@example.com",
            "avatarUrl": "https://example.com/avatar.jpg",
            "isUpdated": 1
        }
    }
}
```

**Cookies Set:**

- `refreshToken` - HttpOnly, 7 days expiry

**Errors:**

- `404` - User not found
- `401` - Invalid credentials

---

### 3. Refresh Access Token

**POST** `/api/auth/refresh`

Get a new access token using refresh token.

**Headers:**

- Cookie must contain `refreshToken`

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Access token refreshed successfully",
    "data": {
        "accessToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
    }
}
```

**Errors:**

- `400` - Refresh token is required
- `401` - Invalid refresh token
- `401` - Refresh token has expired, please login again

---

### 4. Logout User

**POST** `/api/auth/logout`

🔒 **Requires Authentication**

Invalidate user session.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Logged out successfully"
}
```

**Cookies Cleared:**

- `refreshToken`

**Errors:**

- `401` - Access token not provided
- `404` - Session not found

---

## 🔐 Authentication Flow

1. **Register/Login** → Receive `accessToken` + `refreshToken` cookie
2. **Use** `accessToken` in `Authorization: Bearer <token>` header for protected routes
3. When `accessToken` expires → Call `/refresh` to get new `accessToken`
4. **Logout** → Clears session and refreshToken cookie

---

## 📝 Notes

- **Access Token**: Short-lived (1 hour), sent in response body
- **Refresh Token**: Long-lived (7 days), stored in HttpOnly cookie
- **Session**: Automatically created on login/register, deleted on logout
- **Password**: Hashed using bcrypt with salt rounds = 10
- **Transactions**: Register uses MongoDB transactions for data consistency

---

## 🔑 Token Payload

```javascript
{
  "userId": "507f1f77bcf86cd799439011",
  "email": "john@example.com",
  "iat": 1674210000,
  "exp": 1674213600
}
```

---

## 🛡️ Security Features

- ✅ Password hashing with bcrypt
- ✅ JWT-based authentication
- ✅ HttpOnly cookies for refresh tokens
- ✅ CORS protection
- ✅ Session tracking with device info
- ✅ Auto-expiring sessions (TTL indexes)
