import { permanentRedirect } from "next/navigation";

/** The account page lives in the dashboard now; old links and emails keep working. */
export default function AccountRedirect() {
  permanentRedirect("/dashboard/account");
}
