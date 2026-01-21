# User API Documentation

Base URL: `/api/user`

All endpoints for user profile management.

---

## 📋 Endpoints

### 1. Get User Profile

**GET** `/api/user/me/:id`

🔒 **Requires Authentication**

Retrieve user profile by ID.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**URL Parameters:**

- `id` - User ID

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Doe",
        "email": "john@example.com",
        "avatarUrl": "https://cloudinary.com/image.jpg",
        "isUpdated": 1,
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:30:00.000Z"
    }
}
```

**Errors:**

- `401` - Unauthorized (invalid/missing token)
- `404` - User not found

**Notes:**

- Password field is excluded from response
- `__v` version field is excluded

---

### 2. Update User Profile

**POST** `/api/user/update/me/:id`

🔒 **Requires Authentication**

Update user profile information.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**URL Parameters:**

- `id` - User ID

**Request Body:**

```json
{
    "name": "John Updated",
    "avatarUrl": "https://cloudinary.com/new-avatar.jpg",
    "isUpdated": 1
}
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "User profile updated successfully",
    "data": {
        "_id": "507f1f77bcf86cd799439011",
        "name": "John Updated",
        "email": "john@example.com",
        "avatarUrl": "https://cloudinary.com/new-avatar.jpg",
        "isUpdated": 1,
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T11:00:00.000Z"
    }
}
```

**Validation:**

- `name`: 3-40 characters
- All fields are optional

**Errors:**

- `401` - Unauthorized
- `404` - User not found
- `400` - Validation errors

---

### 3. Update User Avatar

**POST** `/api/user/update/avatar`

🔒 **Requires Authentication**

Upload and update user avatar image.

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**Request Body (Form Data):**

- `image` - Image file (jpg, jpeg, png, webp, svg)

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Profile image uploaded successfully",
    "data": {
        "imageUrl": "https://res.cloudinary.com/dlhu9favc/image/upload/v1674210000/pictures/tyczf8nfsjptfijtcvue.jpg"
    }
}
```

**Image Processing:**

- Uploaded to Cloudinary
- Auto-resized to 600x600px (crop fill)
- Stored in `pictures` folder
- Allowed formats: jpg, jpeg, png, webp, svg

**Automatic Updates:**

- Sets `isUpdated` flag to 1
- Updates `avatarUrl` field in user profile

**Errors:**

- `401` - Unauthorized
- `400` - No file uploaded
- `404` - User not found

---

## 📝 User Schema

```javascript
{
  "_id": ObjectId,
  "name": String (3-40 chars, required),
  "email": String (6-60 chars, unique, lowercase, required),
  "password": String (hashed, 6-60 chars, required),
  "avatarUrl": String (nullable),
  "isUpdated": Number (0 or 1, default: 0),
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## 🔍 Field Descriptions

| Field       | Type     | Description                                            |
| ----------- | -------- | ------------------------------------------------------ |
| `_id`       | ObjectId | Unique user identifier                                 |
| `name`      | String   | User's display name                                    |
| `email`     | String   | User's email (unique, used for login)                  |
| `password`  | String   | Hashed password (never returned in responses)          |
| `avatarUrl` | String   | URL to user's profile picture                          |
| `isUpdated` | Number   | Profile completion flag (0 = incomplete, 1 = complete) |
| `createdAt` | Date     | Account creation timestamp                             |
| `updatedAt` | Date     | Last update timestamp                                  |

---

## 🖼️ Avatar Upload Example

```bash
curl -X POST http://localhost:3000/api/user/update/avatar \
  -H "Authorization: Bearer <token>" \
  -F "image=@/path/to/photo.jpg"
```

---

## 🛡️ Security

- ✅ All endpoints require authentication
- ✅ Password never exposed in responses
- ✅ Uses authenticated user's ID from JWT token
- ✅ Image uploads validated and processed
- ✅ Cloudinary secure storage

---

## 📌 Notes

- The `:id` parameter should match the authenticated user's ID
- Avatar uploads automatically set `isUpdated` to 1
- Email cannot be updated (unique identifier)
- Password updates should use a separate password change endpoint (to be implemented)
