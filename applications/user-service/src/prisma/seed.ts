import { createHash } from "node:crypto";
import { db } from "./db";

function hashPassword(password: string): string {
    return createHash("sha256").update(password).digest("base64");
}

const users = [
    {
        username: "john_doe",
        name: "John Doe",
        phone_number: "0901234567",
        email: "john.doe@example.com",
        password: hashPassword("password123"),
    },
    {
        username: "jane_smith",
        name: "Jane Smith",
        phone_number: "0902345678",
        email: "jane.smith@example.com",
        password: hashPassword("password123"),
    },
    {
        username: "alice_wonder",
        name: "Alice Wonder",
        phone_number: "0903456789",
        email: "alice.wonder@example.com",
        password: hashPassword("password123"),
    },
];

async function main() {
    console.log("Seeding users...");

    for (const user of users) {
        const existing = await db.orm.public.User.where({ username: user.username }).first();
        if (existing) {
            console.log(`User ${user.username} already exists, skipping.`);
            continue;
        }

        await db.orm.public.User.create(user);
        console.log(`Created user: ${user.username} (${user.email})`);
    }

    console.log("Seeding completed successfully.");
}

main()
    .catch((err) => {
        console.error("Error seeding users:", err);
        process.exit(1);
    });