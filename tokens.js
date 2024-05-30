// tokens.js
import dotenv from 'dotenv';
dotenv.config();

export default function getToken() {
    return process.env.WEBFLOW_API_TOKEN;
}
