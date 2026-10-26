export type TuitionInvoice = {
    id: string;
    student_id: string;
    amount: number;
    status: "pending" | "overdue" | "paid";
};

export type TuitionInvoiceResponse = {
    tuition: TuitionInvoice;
};

export type UserInfoResponse = {
    user: {
        id: string;
        name: string;
        phone_number: string;
        email: string;
        username: string;
    };
};

export type GenerateOtpResponse = {
    transaction_id: string;
    expires_in: number;
};
