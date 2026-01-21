# Expense API Documentation

Base URL: `/api/expense`

All endpoints for expense management within groups.

---

## 📋 Endpoints

### 1. Create Expense

**POST** `/api/expense/group/create`

🔒 **Requires Authentication**

Create a new expense in a group and automatically update balances.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
    "groupId": "65abc123...",
    "amount": 150.0,
    "description": "Dinner at Burger King",
    "participants": ["userId1", "userId2", "userId3"]
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "message": "Expense created successfully",
    "data": {
        "_id": "696fb297...",
        "groupId": "696e42c0...",
        "paidBy": {
            "_id": "6969ffd0...",
            "name": "Dharun",
            "email": "dharundayaa1@gmail.com",
            "avatarUrl": "https://..."
        },
        "amount": 10000,
        "description": "Added Expense for Tea",
        "participants": [
            {
                "_id": "6969ffd0...",
                "name": "Dharun",
                "email": "dharundayaa1@gmail.com",
                "avatarUrl": "https://..."
            }
        ],
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z"
    }
}
```

**Default Behavior:**

- If `participants` is empty/not provided, **defaults to all group members**
- Split is **equal** among all participants
- Balance updates are **atomic** (transaction-safe)

**Balance Calculation Example:**

```
Amount: $150
Participants: 3 people
Share per person: $50

Payer balance: +$150 (they paid full amount)
Each participant: -$50 (their share)
```

**Validation:**

- User must be a group member
- All participants must be group members
- Amount must be positive

**Errors:**

- `404` - Group not found
- `403` - Payer is not a member of the group
- `400` - Some participants are not members of the group

---

### 2. Get Group Expenses

**GET** `/api/expense/group/:groupId`

🔒 **Requires Authentication**

Get all expenses for a specific group.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**URL Parameters:**

- `groupId` - Group ID

**Response (200 OK):**

```json
{
  "success": true,
  "data": [
    {
      "_id": "696fb297...",
      "groupId": "696e42c0...",
      "paidBy": {
        "_id": "6969ffd0...",
        "name": "Dharun",
        "email": "dharundayaa1@gmail.com",
        "avatarUrl": "https://..."
      },
      "amount": 1250,
      "description": "Dinner at Burger King",
      "participants": [...],
      "createdAt": "2023-10-21T00:00:00.000Z",
      "updatedAt": "2023-10-21T00:00:00.000Z"
    },
    {
      "_id": "696fb298...",
      "groupId": "696e42c0...",
      "paidBy": {...},
      "amount": 3000,
      "description": "Petrol",
      "participants": [...],
      "createdAt": "2023-10-21T00:00:00.000Z",
      "updatedAt": "2023-10-21T00:00:00.000Z"
    }
  ]
}
```

**Features:**

- Sorted by `createdAt` descending (newest first)
- Includes populated payer and participants
- No pagination (returns all expenses)

**Access Control:**

- Only group members can view expenses

**Errors:**

- `404` - Group not found
- `403` - You are not a member of this group

---

### 3. Get Single Expense

**GET** `/api/expense/:expenseId`

🔒 **Requires Authentication**

Get details of a specific expense.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**URL Parameters:**

- `expenseId` - Expense ID

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "_id": "696fb297...",
        "groupId": {
            "_id": "696e42c0...",
            "name": "Trip to Cabo",
            "groupAvatarUrl": "https://..."
        },
        "paidBy": {
            "_id": "6969ffd0...",
            "name": "Dharun",
            "email": "dharundayaa1@gmail.com",
            "avatarUrl": "https://..."
        },
        "amount": 1250,
        "description": "Dinner at Burger King",
        "participants": [
            {
                "_id": "6969ffd0...",
                "name": "Dharun",
                "email": "dharundayaa1@gmail.com",
                "avatarUrl": "https://..."
            }
        ],
        "createdAt": "2023-10-21T00:00:00.000Z",
        "updatedAt": "2023-10-21T00:00:00.000Z"
    }
}
```

**Access Control:**

- Only group members can view expense

**Errors:**

- `404` - Expense not found
- `403` - You are not authorized to view this expense

---

### 4. Update Expense

**POST** `/api/expense/update/:expenseId`

🔒 **Requires Authentication**

Update an existing expense and recalculate balances.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**URL Parameters:**

- `expenseId` - Expense ID

**Request Body:**

```json
{
    "amount": 200.0,
    "description": "Updated description",
    "participants": ["userId1", "userId2"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Expense updated successfully",
  "data": {
    "_id": "696fb297...",
    "groupId": "696e42c0...",
    "paidBy": {...},
    "amount": 200.00,
    "description": "Updated description",
    "participants": [...],
    "updatedAt": "2024-01-20T11:00:00.000Z"
  }
}
```

**Authorization:**

- Only **expense creator** (paidBy) OR **group creator** can update

**Balance Recalculation:**

1. **Revert** old balance changes
2. **Apply** new balance changes
3. All in one **transaction** (atomic)

**Validation:**

- All participants must be group members
- All fields are optional (update only what's provided)

**Errors:**

- `404` - Expense not found
- `403` - You are not authorized to update this expense
- `400` - Some participants are not members of the group

---

### 5. Delete Expense

**POST** `/api/expense/delete/:expenseId`

🔒 **Requires Authentication**

Delete an expense and revert its balance changes.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**URL Parameters:**

- `expenseId` - Expense ID

**Response (200 OK):**

```json
{
    "success": true,
    "message": "Expense deleted successfully"
}
```

**Authorization:**

- Only **expense creator** (paidBy) OR **group creator** can delete

**Balance Reversion:**

- Automatically reverts all balance changes
- Uses **transaction** for data consistency

**Errors:**

- `404` - Expense not found
- `403` - You are not authorized to delete this expense

---

## 📊 Expense Schema

```javascript
{
  "_id": ObjectId,
  "groupId": ObjectId (Group ref, required),
  "paidBy": ObjectId (User ref, required),
  "amount": Number (min: 0, required),
  "description": String (max 200 chars, optional),
  "participants": [ObjectId] (User refs),
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## 💰 Balance Update Logic

### When Creating Expense:

```javascript
// Example: $150 expense with 3 participants
sharePerPerson = 150 / 3 = $50

// Step 1: Deduct share from all participants (including payer)
participant1: balance - 50
participant2: balance - 50
participant3: balance - 50

// Step 2: Add full amount to payer
payer: balance + 150

// Net result for payer: -50 + 150 = +100 (they're owed $100)
```

### When Updating Expense:

1. **Revert old balances** (reverse the original calculation)
2. **Apply new balances** (with updated amount/participants)
3. **Save in transaction** (all or nothing)

### When Deleting Expense:

1. **Revert all balances** to state before expense
2. **Delete expense record**
3. **Save in transaction**

---

## 🔄 Transaction Safety

All expense operations use **MongoDB transactions**:

```javascript
const session = await mongoose.startSession();
session.startTransaction();

try {
    // Create/Update/Delete expense
    // Update group balances
    await session.commitTransaction();
} catch (error) {
    await session.abortTransaction();
}
```

**Benefits:**

- ✅ Atomic operations (all or nothing)
- ✅ No partial updates
- ✅ Rollback on errors
- ✅ Data consistency guaranteed

---

## 📝 Notes

- **Equal Split**: All expenses are split equally among participants
- **Default Participants**: If not specified, includes all group members
- **Payer Included**: Payer is automatically included in participants
- **Balance Auto-Update**: Group balances update automatically
- **Soft Delete**: Not implemented (hard delete only)
- **Expense History**: Sorted by creation date (newest first)

---

## 🛡️ Security & Access Control

- ✅ All endpoints require authentication
- ✅ Only group members can create/view expenses
- ✅ Only creator or group admin can update/delete
- ✅ Participant validation (must be group members)
- ✅ Transaction-based updates
- ✅ Indexed queries for performance

---

## 🔍 Example Scenarios

### Scenario 1: Create Expense

```
User pays $150 for dinner
3 participants (including payer)
Each owes $50

Payer balance: -50 + 150 = +$100 (owed)
Other 2 participants: -$50 each (owe)
```

### Scenario 2: Update Expense

```
Original: $150 with 3 people
Updated: $200 with 4 people

Old balances reverted
New share: $200 / 4 = $50 per person
New balances applied
```

### Scenario 3: Delete Expense

```
Original expense created $150 split among 3
Balances: Payer +$100, Others -$50 each

After delete:
All balances reverted to pre-expense state
Expense record removed
```
