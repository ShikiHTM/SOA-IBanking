type userJwtPayload = {
    user_id: string;
    exp: number;
};

export type Variables = {
    jwtPayload: userJwtPayload;
};

type TransactionStatus = "PENDING" | "REJECTED" | "CANCELLED" | "FAILED" | "COMPLETED";

type Transaction = {
    id: string
    tuition_id: string;
    amount: number;
    status: TransactionStatus;
    created_at: Date;
    updated_at: Date;
}

export type PaymentLedgerResponse = {
    balance: number;
    transaction_history: Transaction[];
}