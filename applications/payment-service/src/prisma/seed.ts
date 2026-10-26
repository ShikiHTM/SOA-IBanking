import { db } from "./db";

const defaultUserIds = [
    "11111111-1111-4111-8111-111111111111",
    "22222222-2222-4222-8222-222222222222",
    "33333333-3333-4333-8333-333333333333",
];

const envUserIds = (process.env["SEED_USER_IDS"] ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean);

const userIds = envUserIds.length > 0 ? envUserIds : defaultUserIds;

async function main() {
    console.log("Seeding ledgers...");

    for (const user_id of userIds) {
        const existing = await db.orm.public.Ledger.where({ user_id }).first();
        if (existing) {
            console.log(`Ledger for user ${user_id} already exists, skipping.`);
            continue;
        }

        await db.orm.public.Ledger.create({
            user_id,
            balance: 50000000,
        });
        console.log(`Created ledger for user ${user_id} with balance 50,000,000`);
    }

    console.log("Seeding completed successfully.");
    await db.close();
}

main().catch((err) => {
    console.error("Error seeding ledgers:", err);
    process.exit(1);
});
