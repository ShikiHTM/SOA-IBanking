import { db } from "./db";

const students = [
    {
        id: "520H0001",
        name: "Nguyen Van A",
        tuition: {
            id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
            amount: 15000000,
            status: "pending",
        },
    },
    {
        id: "521K0002",
        name: "Tran Thi B",
        tuition: {
            id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
            amount: 12000000,
            status: "overdue",
        },
    },
    {
        id: "522H0003",
        name: "Le Van C",
        tuition: {
            id: "cccccccc-cccc-4ccc-8ccc-cccccccccccc",
            amount: 18000000,
            status: "paid",
        },
    },
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
            id: tuition.id,
            student_id: id,
            amount: tuition.amount,
            status: tuition.status,
        });
        console.log(`Created student: ${id} (${name}) with ${tuition.status} tuition (${tuition.id})`);
    }

    console.log("Seeding completed successfully.");
    await db.close();
}

main().catch((err) => {
    console.error("Error seeding students:", err);
    process.exit(1);
});
