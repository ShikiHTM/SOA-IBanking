# API Endpoints

## 1. Endpoints table

| Method | Endpoint | Description |
| :-- | :-- | :-- |
| POST | /auth/login | Login
| GET | /users/me | Get session' user information
| GET | /users/:id/ledger | Get user's ledger information
| GET | /tuitions?student_id={id} | Get student current tuitions via student id
| POST | /payment | Create a tuition transaction
| POST | /payment/:id/verify | Verify a transaction using OTP

## 2. Endpoints detail

### 2.1 Login

- **Method**: `POST`
- **Endpoint**: `/auth/login`
- **Description**: Authenticates user's credentials and return JWT Token

**Request Body**:

```json
{
    "email": "example@gmail.com",
    "password": "test123"
}
```

**Response Success (200 OK)**:
```json
{
    "access_token": "eyJhbGciOiJIUzI1...",
    "token_type": "Bearer",
    "message": "Login successfully."
}
```

**Response Error (401 Unauthorized)**:
```json
{
    "message": "Incorrect email or password."
}
```

### 2.2 Users

- **Method**: `GET`
- **Endpoint**: `/users/me`
- **Description**: Get session' user information

**Response Success (200 OK)**:
```json
{
    "id": "4598ef...",
    "name": "John Doe",
    "phone_number": "0123456789",
    "email": "example@gmail.com"
}
```

**Response Error (401 Unauthorized)**:
```json
{
    "message": "You are not allow to perform this action."
}
```

### 2.3 Tuition

- **Method**: `GET`
- **Endpoint**: `/tuitions?student_id={id}`
- **Description**: Get student tuitions list by student id

**Query Parameter**:

| Parameter | Type | Required | Description |
| :--- | :--- | :--- | :--- |
| student_id | String | Yes | Student Id needs to pay the tuition

**Response Success (200 OK)**:
```json
[
    {
        "id": "4598ef...",
        "amount": 1000000,
        "status": "PENDING",
        "student_id": "4598ef...",
        "student_name": "John Doe"
    },
    ...
]
```

**Response Error (400 Bad Request)**:
```json
{
    "message": "Missing student_id."
}
```

**Response Error (404 Not Found)**:
```json
{
    "message": "Student not found."
}
```

**Response Error (401 Unauthorized)**:
```json
{
    "message": "Unauthorized, invalid or missing token."
}
```

---

- **Method**: `GET`
- **Endpoint**: `users/:id/ledger`
- **Description**: Get user's ledger information

**Path Parameter**:

| parameter | description |
| :--- | :--- |
| id | User id

**Response Success (200 OK)**:
```json
{
    "amount": 1000000,
    "payment_history": [
        ...
    ]
}
```

**Response Error (401 Unauthorized)**:
```json
{
    "message": "Unauthorized, invalid or missing token."
}
```

**Response Error (403 Forbidden)**:
```json
{
    "message": "You do not have permission to access this ledger."
}
```

### 2.3 Payment

- **Method**: `POST`
- **Endpoint**: `/payment`
- **Description**: Create a tuition transaction. If the validate passed, create a new transaction record at `PENDING` state and send the OTP

**Request Body**:
```json
{
    "tuition_id": "4598ef...",
    "amount": 100000
}
```

**Response Success (201 Created)**:
```json
{
    "transaction_id": "Tx12345",
    "status": "PENDING",
    "message": "Transaction created successfully."
}
```

**Response Error (400 Bad Request)**:
```json
{
    "message": "Insufficent balance."
}
```

**Response Error (401 Unauthorized)**:
```json
{
    "message": "Unauthorized, invalid or missing token."
}
```

**Response Error (404 Not Found)**:
```json
{
    "message": "Tuition invoice not found."
}
```

---

- **Method**: `POST`
- **Endpoint**: `/payment/:id/verify`
- **Description**: Verify the transaction using OTP. If OTP is valid, system will debit from user account and update status to `COMPLETED`.

**Path Parameter**:

| parameter | description |
| :--- | :--- |
| id | Transaction id

**Request Body**:
```json
{
    "otp": "123456"
}
```

**Response Success (200 OK)**:
```json
{
    "transaction_id": "Tx12345",
    "status": "COMPLETED",
    "message": "Payment verified and completed."
}
```

**Response Error (400 Bad Request)**:
```json
{
    "message": "Invalid or expired OTP."
}
```

**Response Error (401 Unauthorized)**:
```json
{
    "message": "Unauthorized, invalid or missing token."
}
```

**Response Error (403 Forbidden)**:
```json
{
    "message": "You do not have permission to verify this transaction."
}
```

**Response Error (404 Not found)**:
```json
{
    "message": "Transaction not found."
}
```