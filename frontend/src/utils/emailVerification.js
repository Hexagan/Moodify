import { sendEmailVerification } from "firebase/auth";

// Email/password accounts stay locked until the address is confirmed. Google and Facebook
// accounts skip this: those providers already vouch for the address.
export function needsEmailVerification(user) {
    return Boolean(user)
        && !user.emailVerified
        && user.providerData.length > 0
        && user.providerData.every((p) => p.providerId === "password");
}

// The link in the email brings the user back to the login page. That needs the site's domain in
// Firebase's authorized domains; if it isn't there yet, send the email without the return link.
export async function sendVerificationEmail(user) {
    try {
        await sendEmailVerification(user, { url: `${window.location.origin}/login` });
    } catch (err) {
        if (err.code !== "auth/unauthorized-continue-uri" && err.code !== "auth/invalid-continue-uri") throw err;
        await sendEmailVerification(user);
    }
}
