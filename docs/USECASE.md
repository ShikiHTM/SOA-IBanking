# Use Case Diagram

This document is about the **Use Case Diagram** of the project.

## Use case list

| ID | Name | Primary Actor | Description |
| :-- | :-- | :-- | :-- |
| UC-01 | Sign In | User | Authenticates user and supply JWT Token. |
| UC-02 | View Profile | User | Views user information, ledger balance and transaction history. |
| UC-03 | Lookup Student & Tuitions | User | Views student information via Student ID and unpaid tutions history. |
| UC-04 | Initiate Tuition Payment | User | Select a tuition to begin a transaction. System will check the balance and send OTP via email. |
| UC-05 | Verify Payment | User | Input 6 digits OTP from email to verify the transaction. |
| UC-06 | Sign out | User | Logout from current session |

## Use case Diagram

```mermaid
---
config:
    theme: default
    look: classic
---
usecase-beta

actor U("User")

systemBoundary "IBanking"
    usecase login("Sign In")
    usecase profile("View Profile")
    usecase lookup("Lookup Student & Tuitions")
    usecase pay("Pay Tuition")
    usecase verify("Verify Payment")
    usecase logout("Sign out")
end

U --> login
U --> profile
U --> lookup
U --> pay
pay ..> verify : "<<include>>"
U --> logout
```
