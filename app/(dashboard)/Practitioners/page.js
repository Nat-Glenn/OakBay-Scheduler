/**
 * Legacy route — team management moved to /Team.
 */

import { redirect } from "next/navigation";

export default function PractitionersRedirectPage() {
  redirect("/Team");
}
