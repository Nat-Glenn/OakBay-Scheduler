import PublicBookingTheme from "@/components/PublicBookingTheme";

export const metadata = {
  title: "Request an Appointment | Oak Bay Family Chiropractic",
  description:
    "Submit an appointment request online. Our Calgary SW team will confirm your visit.",
};

export default function BookLayout({ children }) {
  return <PublicBookingTheme>{children}</PublicBookingTheme>;
}
