# Settlement API Documentation

Base URL: `/api/settlement`

All endpoints for managing settlements (payments between users) and viewing balances.

---

## 📋 Endpoints

### 1. Get User Balances

**GET** `/api/settlement/balances`

🔒 **Requires Authentication**

Get aggregated balances across ALL groups for the current user.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": {
        "totalBalance": 145.0,
        "youAreOwed": 145.0,
        "youOwe": 0,
        "debts": [
            {
                "user": {
                    "_id": "userId1",
                    "name": "Sarah Jones",
                    "email": "sarah@example.com",
                    "avatarUrl": "https://..."
                },
                "type": "owes_you",
                "amount": 15.0,
                "isSettled": false
            },
            {
                "user": {
                    "_id": "userId2",
                    "name": "Mike Ross",
                    "email": "mike@example.com",
                    "avatarUrl": "https://..."
                },
                "type": "you_owe",
                "amount": 33.5,
                "isSettled": false
            }
        ]
    }
}
```

**Field Descriptions:**

- `totalBalance` - Net balance (+owed, -owes)
- `youAreOwed` - Total amount others owe you
- `youOwe` - Total amount you owe others
- `debts` - Individual debts with each person
    - `type`: `"owes_you"` or `"you_owe"`
    - `amount`: Absolute debt amount
    - `isSettled`: Always false (unsettled debts only)

**Debt Sorting:**

1. `owes_you` debts first (people who owe you)
2. Then `you_owe` debts (people you owe)
3. Within each type: sorted by amount (descending)

**Cross-Group Aggregation:**

- Combines balances from all groups
- Calculates net debt between you and each person
- Accounts for multiple groups with same people

---

### 2. Create Settlement

**POST** `/api/settlement/create`

🔒 **Requires Authentication**

Record a payment between two users and update balances.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Request Body:**

```json
{
    "toUserId": "userId2",
    "amount": 33.5,
    "groupId": "65abc123...",
    "description": "Payment for dinner"
}
```

**Response (201 Created):**

```json
{
    "success": true,
    "message": "Settlement recorded successfully",
    "data": {
        "_id": "settlement123...",
        "groupId": {
            "_id": "65abc123...",
            "name": "Trip to Cabo"
        },
        "fromUser": {
            "_id": "currentUserId",
            "name": "John Doe",
            "email": "john@example.com",
            "avatarUrl": "https://..."
        },
        "toUser": {
            "_id": "userId2",
            "name": "Mike Ross",
            "email": "mike@example.com",
            "avatarUrl": "https://..."
        },
        "amount": 33.5,
        "description": "Payment for dinner",
        "createdAt": "2024-01-20T10:00:00.000Z",
        "updatedAt": "2024-01-20T10:00:00.000Z"
    }
}
```

**What Happens:**

1. ✅ Creates settlement record (audit trail)
2. ✅ Updates group balances:
    - Payer (fromUser): balance + amount
    - Receiver (toUser): balance - amount
3. ✅ All in one transaction (atomic)

**Validation Checks:**

1. **Both users must be group members**
2. **Debt must exist between users**
3. **Amount cannot exceed actual debt**
4. **Cannot settle with yourself**
5. **Cannot pay someone who owes YOU**

**Balance Update Example:**

```javascript
Before:
  You: -$33.50 (you owe)
  Mike: +$33.50 (he's owed)

After settlement of $33.50:
  You: -33.50 + 33.50 = $0 ✓
  Mike: +33.50 - 33.50 = $0 ✓
```

**Errors:**

- `400` - toUserId, amount, and groupId are required
- `400` - Cannot settle with yourself
- `404` - Group not found
- `403` - Both users must be members of the group
- `400` - No outstanding balance in this group. Add expenses first.
- `400` - No outstanding debt between you and this user in this group.
- `400` - The other user owe you, not the other way around.
- `400` - Settlement amount ($X) exceeds actual debt ($Y)

---

### 3. Get Settlement History

**GET** `/api/settlement/history`

🔒 **Requires Authentication**

Get all settlements where user was payer or receiver.

**Headers:**

```
Authorization: Bearer <accessToken>
```

**Response (200 OK):**

```json
{
    "success": true,
    "data": [
        {
            "_id": "settlement123...",
            "groupId": {
                "_id": "65abc123...",
                "name": "Trip to Cabo"
            },
            "fromUser": {
                "_id": "userId1",
                "name": "John Doe",
                "email": "john@example.com",
                "avatarUrl": "https://..."
            },
            "toUser": {
                "_id": "userId2",
                "name": "Mike Ross",
                "email": "mike@example.com",
                "avatarUrl": "https://..."
            },
            "amount": 33.5,
            "description": "Payment for dinner",
            "createdAt": "2024-01-20T10:00:00.000Z",
            "updatedAt": "2024-01-20T10:00:00.000Z"
        }
    ]
}
```

**Features:**

- Sorted by `createdAt` descending (newest first)
- Includes settlements where you paid OR received
- Fully populated user and group details
- No pagination

---

### 4. Get Group Settlements

**GET** `/api/settlement/group/:groupId`

🔒 **Requires Authentication**

Get all settlements for a specific group.

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
            "_id": "settlement123...",
            "groupId": "65abc123...",
            "fromUser": {
                "_id": "userId1",
                "name": "John Doe",
                "email": "john@example.com",
                "avatarUrl": "https://..."
            },
            "toUser": {
                "_id": "userId2",
                "name": "Mike Ross",
                "email": "mike@example.com",
                "avatarUrl": "https://..."
            },
            "amount": 33.5,
            "description": "Paid back for groceries",
            "createdAt": "2024-01-20T10:00:00.000Z",
            "updatedAt": "2024-01-20T10:00:00.000Z"
        }
    ]
}
```

**Access Control:**

- Only group members can view settlements

**Errors:**

- `404` - Group not found
- `403` - You are not a member of this group

---

## 📊 Settlement Schema

```javascript
{
  "_id": ObjectId,
  "groupId": ObjectId (Group ref, required),
  "fromUser": ObjectId (User ref, required - payer),
  "toUser": ObjectId (User ref, required - receiver),
  "amount": Number (min: 0, required),
  "description": String (max 200 chars, optional),
  "createdAt": Date,
  "updatedAt": Date
}
```

---

## 💰 How Balances Work

### Understanding the Balance System:

```javascript
{
  "totalBalance": 145.00    // You're owed $145 total
}
```

- **Positive (+)**: You are owed money
- **Negative (-)**: You owe money
- **Zero (0)**: All settled up

### Debt Types:

```javascript
{
  "type": "owes_you",    // They owe you money (green in UI)
  "type": "you_owe"      // You owe them money (red in UI)
}
```

### Example Scenario:

**3 Groups with different people:**

- Group A: You +$50, Mike -$50
- Group B: You +$30, Sarah -$30
- Group C: You -$20, Mike +$20

**Aggregated Result:**

```javascript
{
  "totalBalance": 60.00,  // Net: +50 +30 -20
  "youAreOwed": 80.00,    // Total owed to you
  "youOwe": 20.00,        // Total you owe
  "debts": [
    {
      "user": "Mike",
      "type": "owes_you",
      "amount": 30.00     // 50 - 20 = net 30
    },
    {
      "user": "Sarah",
      "type": "owes_you",
      "amount": 30.00
    }
  ]
}
```

---

## 🔒 Settlement Validations

### 1. Debt Existence Check:

```javascript
// ERROR: No expenses, no balances
if (fromBalance === 0 && toBalance === 0) {
    return "No outstanding balance in this group. Add expenses first.";
}
```

### 2. Debt Direction Check:

```javascript
// ERROR: Trying to pay someone who owes YOU
if (youBalance > 0 && theyBalance < 0) {
    // You're owed, they owe - correct!
} else if (youBalance < 0 && theyBalance > 0) {
    return "They owe you, not the other way around.";
}
```

### 3. Amount Validation:

```javascript
// ERROR: Trying to pay more than you owe
actualDebt = Math.min(Math.abs(youBalance), Math.abs(theyBalance));
if (amount > actualDebt) {
    return "Settlement amount exceeds actual debt";
}
```

---

## 🔄 Transaction Flow

```javascript
// Atomic settlement creation
session.startTransaction()

try {
  1. Create settlement record
  2. Update fromUser balance (+amount)
  3. Update toUser balance (-amount)
  4. Save group with new balances

  session.commitTransaction() ✓
} catch {
  session.abortTransaction() ✗
}
```

---

## 📝 Use Cases

### UC1: Settle Partial Amount

```javascript
POST /api/settlement/create
{
  "toUserId": "mikeId",
  "amount": 20.00,      // Partial payment
  "groupId": "groupId"
}

// Before: You owe $50
// After: You owe $30
```

### UC2: Settle Full Amount

```javascript
{
  "amount": 50.00  // Full debt
}

// Before: You owe $50
// After: You owe $0 (settled!)
```

### UC3: Cross-Group Balance View

```
GET /api/settlement/balances

Returns aggregated view across:
- Trip to Cabo: You owe Mike $30
- Weekend BBQ: You owe Mike $20
- Total shown: You owe Mike $50
```

---

## 🛡️ Security & Data Integrity

- ✅ MongoDB transactions (ACID compliance)
- ✅ Prevents overpayment
- ✅ Validates debt existence
- ✅ Checks debt direction
- ✅ Ensures both users are group members
- ✅ Atomic balance updates
- ✅ Audit trail (permanent settlement records)

---

## 📌 Important Notes

1. **Settlements are permanent** - Cannot be edited or deleted
2. **Balances update immediately** - Reflected in next API call
3. **Cross-group balances** - Aggregated in `/balances` endpoint
4. **Partial settlements allowed** - Can pay in installments
5. **No negative settlements** - Amount must be > 0
6. **Indexed for performance** - Fast queries on groupId and users

---

## 🎯 Best Practices

1. **Always check balances first** using `/balances` endpoint
2. **Use exact debt amount** from the debts array
3. **Include groupId** for specific group settlements
4. **Check settlement history** to avoid duplicate payments
5. **Validate before UI submission** to prevent errors
