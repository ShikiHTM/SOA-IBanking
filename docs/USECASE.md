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
    look: classic:
    layout: dagre
---
usecase-beta
directory LR

actor U("User")

systemBoundary "IBanking"
    login("Sign In")
    profile("View Profile")
    lookup("Lookup Student & Tuitions")
    pay("Pay Tuition")
    verify("Verify Payment")
    logout("Sign out")
end

U --> login
U --> profile
U --> lookup
U --> pay
pay ..> : include verify
U --> logout
```
