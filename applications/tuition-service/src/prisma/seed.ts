import { db } from "./db";

// Student id format: /^[0-9A-H]\d{2}[0HK]\d{4}$/
const students = [
    { id: "520H0001", name: "Nguyen Van A", tuition: { amount: 15000000, status: "pending" } },
    { id: "521K0002", name: "Tran Thi B", tuition: { amount: 12000000, status: "overdue" } },
    { id: "522H0003", name: "Le Van C", tuition: { amount: 18000000, status: "paid" } },
] as const;

async function main() {
    console.log("Seeding students and tuition invoices...");

    for (const { id, name, tuition } of students) {
        const existing = await db.orm.public.Student.where({ id }).first();
        if (existing) {
            console.log(`Student ${id} already exists, skipping.`);
            continue;
        }

        await db.orm.public.Student.create({ id, name });
        await db.orm.public.TuitionInvoice.create({
            student_id: id,
            amount: tuition.amount,
            status: tuition.status,
        });
        console.log(`Created student: ${id} (${name}) with ${tuition.status} tuition of ${tuition.amount}`);
    }

    console.log("Seeding completed successfully.");
}

main().catch((err) => {
    console.error("Error seeding students:", err);
    process.exit(1);
});