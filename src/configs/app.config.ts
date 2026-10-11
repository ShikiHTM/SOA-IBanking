import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.join(process.cwd(), ".env") });

export default {
    env: process.env.NODE_ENV || "development",
    port: process.env.PORT || 3000,
    jwt_secret: process.env.JWT_SECRET,
};
