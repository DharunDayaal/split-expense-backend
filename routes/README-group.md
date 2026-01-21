# Group API Documentation

Base URL: `/api/group`

All endpoints for group management, members, and group details.

---

## 📋 Endpoints

### 1. Create Group

**POST** `/api/group/create`

🔒 **Requires Authentication**

Create a new expense group.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
    "name": "Trip to Cabo",
    "description": "Summer vacation expenses",
    "members": ["userId1", "userId2"],
    "groupAvatarUrl": "https://cloudinary.com/group.jpg"
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "message": "Group created successfully",
    "data": {
        "_id": "65abc123...",
        "name": "Trip to Cabo",
        "description": "Summer vacation expenses",
        "createdBy": "507f1f77...",
        "members": ["507f1f77...", "userId1", "userId2"],
        "balances": {},
        "groupAvatarUrl": "https://cloudinary.com/group.jpg",
        "tag": null,
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z"
    }
}
```

**Validation:**

- `name`: 3-50 characters (required)
- `description`: max 200 characters (optional)
- `tag`: max 20 characters (optional)
- Creator is automatically added to members

**Errors:**

- `400` - Group name must be between 3 and 50 characters long
- `401` - Unauthorized

---

### 2. List All Groups

**GET** `/api/group/list`

🔒 **Requires Authentication**

Get all groups where user is a member or creator.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Groups retrieved successfully",
    "data": [
        {
            "_id": "65abc123...",
            "name": "Summer Trip 2024",
            "groupAvatarUrl": "https://...",
            "membersCount": 5,
            "createdBy": {
                "_id": "507f1f77...",
                "name": "John Doe",
                "email": "john@example.com",
                "avatarUrl": "https://..."
            },
            "createdAt": "2023-10-12T00:00:00.000Z",
            "updatedAt": "2024-01-20T10:00:00.000Z",
            "tag": "Travel"
        }
    ]
}
```

**Features:**

- Sorted by `updatedAt` descending (most recent first)
- Members populated with basic info
- Balances and description excluded
- Shows member count

---

### 3. Get Group Details

**GET** `/api/group/:id/details`

🔒 **Requires Authentication**

Get detailed group information with balances and debts.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**URL Parameters:**

- `id` - Group ID

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Group details retrieved successfully",
    "data": {
        "_id": "65abc123...",
        "name": "Trip to Cabo",
        "description": "Summer vacation",
        "createdBy": {
            "_id": "507f1f77...",
            "name": "John Doe",
            "email": "john@example.com",
            "avatarUrl": "https://..."
        },
        "members": [
            {
                "_id": "507f1f77...",
                "name": "John Doe",
                "email": "john@example.com",
                "avatarUrl": "https://..."
            }
        ],
        "membersCount": 4,
        "totalSpend": 1240.5,
        "userBalance": 300.0,
        "balances": {
            "507f1f77...": 300.0,
            "userId2": -150.0
        },
        "debts": [
            {
                "user": {
                    "_id": "userId2",
                    "name": "Sarah Jones",
                    "email": "sarah@example.com",
                    "avatarUrl": "https://..."
                },
                "owesYou": true,
                "amount": 50.0
            }
        ],
        "createdAt": "2023-10-12T00:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z"
    }
}
```

**Calculated Fields:**

- `totalSpend` - Sum of all positive balances (total group spending)
- `userBalance` - Current user's net balance (+ owed, - owes)
- `debts` - Individual debts between user and other members
- `membersCount` - Total number of members

**Access Control:**

- Only group members can view details

**Errors:**

- `404` - Group not found
- `403` - You are not a member of this group

---

### 4. Add Members to Group

**POST** `/api/group/add-members`

🔒 **Requires Authentication**

Add new members to an existing group.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
    "groupId": "65abc123...",
    "memberIds": ["newUserId1", "newUserId2"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Members added successfully",
  "data": {
    "_id": "65abc123...",
    "name": "Trip to Cabo",
    "members": [...],
    "createdBy": {...}
  }
}
```

**Authorization:**

- Only group creator can add members
- Uses `$addToSet` to avoid duplicates

**Errors:**

- `404` - Group not found
- `403` - Only group creator can add members

---

### 5. Remove Member from Group

**POST** `/api/group/remove/member`

🔒 **Requires Authentication**

Remove a member from a group.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
    "groupId": "65abc123...",
    "memberId": "userIdToRemove"
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Member removed successfully",
  "data": {
    "_id": "65abc123...",
    "name": "Trip to Cabo",
    "members": [...]
  }
}
```

**Authorization:**

- Group creator can remove any member
- Members can remove themselves

**Validation:**

- Member balance must be $0 (settled) before removal

**Errors:**

- `404` - Group not found
- `403` - Only group creator or the member can remove themselves
- `400` - Cannot remove member with unsettled balance. Please settle up first.

---

### 6. Upload Group Avatar

**POST** `/api/group/upload/avatar/:id`

🔒 **Requires Authentication**

Upload and update group avatar image.

**Headers:**

```
Authorization: Bearer <accessToken>
Content-Type: multipart/form-data
```

**URL Parameters:**

- `id` - Group ID

**Request Body (Form Data):**

- `image` - Image file (jpg, jpeg, png, webp, svg)

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Group image uploaded successfully",
    "data": {
        "imageUrl": "https://res.cloudinary.com/dlhu9favc/image/upload/v1674210000/pictures/group123.jpg"
    }
}
```

**Image Processing:**

- Uploaded to Cloudinary
- Auto-resized to 600x600px
- Stored in `pictures` folder

**Errors:**

- `400` - No file uploaded
- `404` - Group not found

---

## 📊 Group Schema

```javascript
{
  "_id": ObjectId,
  "name": String (3-50 chars, required),
  "createdBy": ObjectId (User ref, required),
  "description": String (max 200 chars, optional),
  "members": [ObjectId] (User refs, required),
  "balances": Map<String, Number> (userId -> balance),
  "groupAvatarUrl": String (optional),
  "tag": String (max 20 chars, optional),
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## 💰 Balance System

### How Balances Work:

- **Positive balance (+)**: User is owed money
- **Negative balance (-)**: User owes money
- **Zero balance (0)**: All settled up

### Example:

```javascript
{
  "balances": {
    "user1": 300.00,   // User1 is owed $300
    "user2": -150.00,  // User2 owes $150
    "user3": -150.00   // User3 owes $150
  }
}
```

**Total always sums to ~0** (accounting balance)

---

## 🔍 Debt Calculation

The `debts` array shows simplified debts between current user and others:

```javascript
{
  "debts": [
    {
      "user": {...},
      "owesYou": true,   // They owe you
      "amount": 50.00
    },
    {
      "user": {...},
      "owesYou": false,  // You owe them
      "amount": 25.00
    }
  ]
}
```

---

## 📝 Notes

- Group creator is auto-added to members on creation
- Balances are updated automatically when expenses are created/updated/deleted
- Members with non-zero balances cannot be removed (must settle first)
- Groups are sorted by last activity (`updatedAt`)
- Uses MongoDB indexes for efficient queries

---

## 🛡️ Security & Access Control

- ✅ All endpoints require authentication
- ✅ Only members can view group details
- ✅ Only creator can add/remove members
- ✅ Members can remove themselves
- ✅ Balance validation before member removal
- ✅ Duplicate member prevention
