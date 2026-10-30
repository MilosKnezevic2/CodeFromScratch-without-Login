// Prints the current 6-digit code for a base32 secret, as an authenticator app would. Local testing only.
import { generateSync } from "otplib";

console.log(generateSync({ secret: process.argv[2] }));
