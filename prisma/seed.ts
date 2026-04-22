import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/hash";
import { encryptField } from "../lib/encrypt";

const prisma = new PrismaClient();

function makeDate(
  year: number,
  month: number,
  day: number,
  hour: number,
  minute = 0
) {
  return new Date(year, month - 1, day, hour, minute, 0, 0);
}

function plus15(date: Date) {
  return new Date(date.getTime() + 15 * 60 * 1000);
}

function safeAhn(index: number) {
  return encryptField(`AHC${String(100000000 + index).slice(0, 9)}`);
}

async function main() {
  console.log("🌱 Seeding final demo data...");

  await prisma.payment.deleteMany();
  await prisma.appointment.deleteMany();
  await prisma.card.deleteMany();
  await prisma.patient.deleteMany();
  await prisma.user.deleteMany();

  console.log("🧹 Existing demo data cleared.");

  const hashedPassword = await hashPassword("password");

  // =========================
  // USERS / PRACTITIONERS
  // =========================
  const brad = await prisma.user.create({
    data: {
      name: "Brad Pritchard",
      email: "brad.pritchard@oakbay.com",
      phone: "403-555-1001",
      password: hashedPassword,
      role: "Chiropractor",
    },
  });

  const emily = await prisma.user.create({
    data: {
      name: "Emily Carter",
      email: "emily.carter@oakbay.com",
      phone: "403-555-1002",
      password: hashedPassword,
      role: "provider",
    },
  });

  const michael = await prisma.user.create({
    data: {
      name: "Michael Reeves",
      email: "michael.reeves@oakbay.com",
      phone: "403-555-1003",
      password: hashedPassword,
      role: "provider",
    },
  });

  const nina = await prisma.user.create({
    data: {
      name: "Nina Patel",
      email: "nina.patel@oakbay.com",
      phone: "403-555-1004",
      password: hashedPassword,
      role: "provider",
    },
  });

  const sarah = await prisma.user.create({
    data: {
      name: "Sarah Collins",
      email: "sarah.collins@oakbay.com",
      phone: "403-555-2001",
      password: hashedPassword,
      role: "Receptionist",
    },
  });

  const michelle = await prisma.user.create({
    data: {
      name: "Michelle Park",
      email: "michelle.park@oakbay.com",
      phone: "403-555-2002",
      password: hashedPassword,
      role: "Receptionist",
    },
  });

  const karen = await prisma.user.create({
    data: {
      name: "Karen Hollis",
      email: "karen.hollis@oakbay.com",
      phone: "403-555-2003",
      password: hashedPassword,
      role: "Receptionist",
    },
  });

  const providers = [brad, emily, michael, nina];
  const staff = [sarah, michelle, karen];

  // =========================
  // PATIENTS
  // =========================
  const patientSeed = [
    ["Prince", "Pande", "587-123-4567", "prince.pande@example.com", "1998-03-15", "History of lower back pain.", true],
    ["Estefano", "Campana", "587-234-5678", "estefano.campana@example.com", "1995-06-20", "Neck stiffness after desk work.", true],
    ["Ashton", "Pritchard", "403-345-6789", "ashton.pritchard@example.com", "1990-11-05", "Regular maintenance adjustments.", true],
    ["Riley", "Yonda", "403-456-7890", "riley.yonda@example.com", "2000-01-30", "Athletic recovery treatment.", true],
    ["Nat-Glenn", "Atanga", "587-567-8901", "nat-glenn.atanga@example.com", "1997-08-12", "Prefers morning appointments.", true],
    ["Vincent", "Manimtim", "780-678-9012", "vincent.manimtim@example.com", "1993-04-25", "Follow-up after sports strain.", true],
    ["James", "Thornton", "403-555-1234", "james.thornton@email.com", "1978-03-12", "Chronic lower back pain.", true],
    ["Maria", "Santos", "403-555-2345", "maria.santos@email.com", "1990-07-24", "Shoulder mobility recovery.", true],
    ["David", "Okafor", "403-555-3456", "david.okafor@email.com", "1965-11-05", "History of migraines.", true],
    ["Linda", "Kowalski", "403-555-8901", "linda.kowalski@email.com", "1972-04-22", "Prefers gentle pressure.", true],
    ["Priya", "Sharma", "780-555-6789", "priya.sharma@email.com", "1987-05-14", "Sciatica follow-up.", true],
    ["Chad", "Wick", "123-456-7890", "chmm@gmail.com", "2000-11-22", "Recurring chiropractic adjustments.", true],
    ["Olivia", "Bennett", "403-555-6780", "olivia.bennett@email.com", "1994-09-18", "Posture correction follow-up.", true],
    ["Noah", "Kim", "403-555-6781", "noah.kim@email.com", "1989-02-11", "Desk-related neck pain.", false],
    ["Sophia", "Ali", "403-555-6782", "sophia.ali@email.com", "1996-12-03", "Massage consult.", true],
    ["Emma", "Brooks", "403-555-6783", "emma.brooks@email.com", "1985-10-10", "Upper back tension.", true],
    ["Daniel", "Morris", "403-555-6784", "daniel.morris@email.com", "1979-07-07", "Post-accident recovery.", true],
    ["Ava", "Singh", "403-555-6785", "ava.singh@email.com", "1999-01-28", "Weekly posture check.", true],
    ["Lucas", "Reed", "403-555-6786", "lucas.reed@email.com", "1988-06-17", "Low back tightness.", true],
    ["Mia", "Wallace", "403-555-6787", "mia.wallace@email.com", "1992-02-22", "Neck and shoulder pain.", true],
    ["Ethan", "Cole", "403-555-6788", "ethan.cole@email.com", "1983-09-30", "Regular follow-up.", true],
    ["Grace", "Howard", "403-555-6789", "grace.howard@email.com", "1991-05-09", "Prenatal wellness visit.", true],
    ["Samuel", "Ndiaye", "403-555-6790", "samuel.ndiaye@email.com", "1976-12-12", "Lumbar pain flare-up.", true],
    ["Leah", "Turner", "403-555-6791", "leah.turner@email.com", "1995-08-16", "Massage therapy follow-up.", true],
  ] as const;

  const patients = [];
  for (let i = 0; i < patientSeed.length; i++) {
    const [firstName, lastName, phone, email, dob, notes, reminderOptIn] =
      patientSeed[i];

    const patient = await prisma.patient.create({
      data: {
        firstName,
        lastName,
        phone,
        email,
        dob,
        notes,
        reminderOptIn,
        ahcNumber: safeAhn(i + 1),
      },
    });

    patients.push(patient);
  }

  console.log(`👥 Created ${patients.length} patients.`);

  // =========================
  // APPOINTMENTS
  // =========================
  const appointments: Array<{
    id: number;
    status: string;
  }> = [];

  async function addAppointment({
    patientId,
    providerId,
    createdByUserId,
    status,
    type,
    startTime,
    requestMessage = "",
    adminNotes = "",
  }: {
    patientId: number;
    providerId: number;
    createdByUserId: number;
    status: string;
    type: string;
    startTime: Date;
    requestMessage?: string;
    adminNotes?: string;
  }) {
    const appointment = await prisma.appointment.create({
      data: {
        status,
        type,
        startTime,
        endTime: plus15(startTime),
        slot: 1,
        patientId,
        providerId,
        requestMessage,
        adminNotes,
        createdByUserId,
      },
    });

    appointments.push({ id: appointment.id, status });
    return appointment;
  }

  // 2024 appointments
  await addAppointment({
    patientId: patients[0].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Initial Consultation",
    startTime: makeDate(2024, 3, 12, 9, 0),
    requestMessage: "Initial visit for lower back pain.",
    adminNotes: "Assessment completed.",
  });

  await addAppointment({
    patientId: patients[7].id,
    providerId: emily.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(2024, 4, 6, 10, 0),
    requestMessage: "Shoulder stiffness.",
    adminNotes: "Good response to treatment.",
  });

  await addAppointment({
    patientId: patients[10].id,
    providerId: brad.id,
    createdByUserId: michelle.id,
    status: "CANCELLED",
    type: "Follow-up",
    startTime: makeDate(2024, 6, 18, 14, 0),
    requestMessage: "Need to reschedule.",
  });

  await addAppointment({
    patientId: patients[14].id,
    providerId: nina.id,
    createdByUserId: karen.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(2024, 9, 10, 11, 0),
    requestMessage: "Relaxation massage.",
    adminNotes: "No complications noted.",
  });

  await addAppointment({
    patientId: patients[20].id,
    providerId: michael.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2024, 11, 21, 15, 0),
    requestMessage: "Routine check.",
    adminNotes: "Routine maintenance completed.",
  });

  // 2025 appointments
  await addAppointment({
    patientId: patients[11].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2025, 1, 8, 9, 30),
    requestMessage: "Routine adjustment.",
    adminNotes: "Stable progress.",
  });

  await addAppointment({
    patientId: patients[11].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "CANCELLED",
    type: "Follow-up",
    startTime: makeDate(2025, 2, 2, 11, 0),
    requestMessage: "Could not attend.",
  });

  await addAppointment({
    patientId: patients[11].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2025, 3, 14, 10, 0),
    requestMessage: "Recurring adjustment.",
    adminNotes: "Pain reduced.",
  });

  await addAppointment({
    patientId: patients[1].id,
    providerId: emily.id,
    createdByUserId: karen.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(2025, 4, 18, 13, 0),
    requestMessage: "Neck stiffness.",
    adminNotes: "Recommended stretching.",
  });

  await addAppointment({
    patientId: patients[2].id,
    providerId: brad.id,
    createdByUserId: michelle.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2025, 5, 9, 9, 0),
    requestMessage: "Maintenance visit.",
    adminNotes: "Routine session.",
  });

  await addAppointment({
    patientId: patients[3].id,
    providerId: michael.id,
    createdByUserId: sarah.id,
    status: "CANCELLED",
    type: "Follow-up",
    startTime: makeDate(2025, 6, 11, 16, 0),
    requestMessage: "Travel conflict.",
  });

  await addAppointment({
    patientId: patients[4].id,
    providerId: emily.id,
    createdByUserId: michelle.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(2025, 7, 7, 12, 0),
    requestMessage: "Shoulder recovery.",
    adminNotes: "Mobility improved.",
  });

  await addAppointment({
    patientId: patients[5].id,
    providerId: michael.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Follow-up",
    startTime: makeDate(2025, 8, 21, 14, 0),
    requestMessage: "Sports recovery check.",
    adminNotes: "Cleared for continued training.",
  });

  await addAppointment({
    patientId: patients[8].id,
    providerId: brad.id,
    createdByUserId: karen.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2025, 9, 4, 10, 30),
    requestMessage: "Migraine-related tension.",
    adminNotes: "Gentle treatment provided.",
  });

  await addAppointment({
    patientId: patients[9].id,
    providerId: nina.id,
    createdByUserId: michelle.id,
    status: "CANCELLED",
    type: "Massage",
    startTime: makeDate(2025, 10, 15, 11, 30),
    requestMessage: "Family emergency.",
  });

  await addAppointment({
    patientId: patients[12].id,
    providerId: emily.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Follow-up",
    startTime: makeDate(2025, 11, 20, 15, 30),
    requestMessage: "Posture follow-up.",
    adminNotes: "Improved posture noted.",
  });

  await addAppointment({
    patientId: patients[13].id,
    providerId: michael.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Initial Consultation",
    startTime: makeDate(2025, 12, 12, 10, 0),
    requestMessage: "Neck pain from desk work.",
    adminNotes: "Initial plan created.",
  });

  // 2026 appointments (richer current-year demo data)
  await addAppointment({
    patientId: patients[0].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2026, 1, 7, 9, 0),
    requestMessage: "Back pain flare-up.",
    adminNotes: "L4-L5 adjusted.",
  });

  await addAppointment({
    patientId: patients[6].id,
    providerId: michael.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Initial Consultation",
    startTime: makeDate(2026, 1, 16, 11, 0),
    requestMessage: "First visit for chronic back pain.",
    adminNotes: "Assessment complete.",
  });

  await addAppointment({
    patientId: patients[7].id,
    providerId: emily.id,
    createdByUserId: michelle.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(2026, 2, 5, 13, 0),
    requestMessage: "Shoulder tension.",
    adminNotes: "Good release achieved.",
  });

  await addAppointment({
    patientId: patients[8].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2026, 2, 9, 15, 0),
    requestMessage: "Migraine tension management.",
    adminNotes: "Cervical work completed.",
  });

  await addAppointment({
    patientId: patients[10].id,
    providerId: brad.id,
    createdByUserId: karen.id,
    status: "CANCELLED",
    type: "Follow-up",
    startTime: makeDate(2026, 2, 20, 14, 0),
    requestMessage: "Need to postpone.",
  });

  await addAppointment({
    patientId: patients[11].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2026, 3, 3, 10, 0),
    requestMessage: "Routine adjustment.",
    adminNotes: "Progress maintained.",
  });

  await addAppointment({
    patientId: patients[11].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "CANCELLED",
    type: "Follow-up",
    startTime: makeDate(2026, 3, 12, 11, 0),
    requestMessage: "Unable to attend.",
  });

  await addAppointment({
    patientId: patients[11].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "CANCELLED",
    type: "Follow-up",
    startTime: makeDate(2026, 3, 18, 11, 0),
    requestMessage: "Scheduling conflict.",
  });

  await addAppointment({
    patientId: patients[5].id,
    providerId: emily.id,
    createdByUserId: michelle.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(2026, 3, 20, 14, 30),
    requestMessage: "Sports recovery massage.",
    adminNotes: "Good response.",
  });

  await addAppointment({
    patientId: patients[18].id,
    providerId: michael.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2026, 4, 2, 10, 30),
    requestMessage: "Low back stiffness.",
    adminNotes: "Improved mobility.",
  });

  await addAppointment({
    patientId: patients[19].id,
    providerId: nina.id,
    createdByUserId: karen.id,
    status: "CANCELLED",
    type: "Massage",
    startTime: makeDate(2026, 4, 4, 13, 15),
    requestMessage: "Patient unavailable.",
  });

  await addAppointment({
    patientId: patients[20].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Follow-up",
    startTime: makeDate(2026, 4, 8, 9, 45),
    requestMessage: "Routine follow-up.",
    adminNotes: "No major issues.",
  });

  await addAppointment({
    patientId: patients[21].id,
    providerId: nina.id,
    createdByUserId: michelle.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(2026, 4, 10, 12, 0),
    requestMessage: "Prenatal wellness massage.",
    adminNotes: "Gentle care provided.",
  });

  await addAppointment({
    patientId: patients[22].id,
    providerId: michael.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(2026, 4, 14, 15, 15),
    requestMessage: "Lumbar pain flare-up.",
    adminNotes: "Condition improved after session.",
  });

  await addAppointment({
    patientId: patients[23].id,
    providerId: emily.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(2026, 4, 16, 11, 30),
    requestMessage: "Massage therapy follow-up.",
    adminNotes: "Less tightness reported.",
  });

  // Today / upcoming for live demo
  const today = new Date();
  const y = today.getFullYear();
  const m = today.getMonth() + 1;
  const d = today.getDate();

  await addAppointment({
    patientId: patients[0].id,
    providerId: brad.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(y, m, d, 9, 0),
    requestMessage: "Back flare-up.",
    adminNotes: "Completed with stretching advice.",
  });

  await addAppointment({
    patientId: patients[7].id,
    providerId: emily.id,
    createdByUserId: sarah.id,
    status: "COMPLETED",
    type: "Massage",
    startTime: makeDate(y, m, d, 9, 15),
    requestMessage: "Shoulder tension after work.",
    adminNotes: "Improved range of motion.",
  });

  await addAppointment({
    patientId: patients[6].id,
    providerId: michael.id,
    createdByUserId: sarah.id,
    status: "CHECKED_IN",
    type: "Initial Consultation",
    startTime: makeDate(y, m, d, 10, 0),
    requestMessage: "First visit for chronic pain.",
    adminNotes: "Assessment in progress.",
  });

  await addAppointment({
    patientId: patients[10].id,
    providerId: brad.id,
    createdByUserId: michelle.id,
    status: "CONFIRMED",
    type: "Chiropractic Adjustment",
    startTime: makeDate(y, m, d, 11, 0),
    requestMessage: "Sciatica follow-up.",
    adminNotes: "",
  });

  await addAppointment({
    patientId: patients[9].id,
    providerId: emily.id,
    createdByUserId: sarah.id,
    status: "CONFIRMED",
    type: "Follow-up",
    startTime: makeDate(y, m, d, 14, 0),
    requestMessage: "Pain management review.",
    adminNotes: "",
  });

  await addAppointment({
    patientId: patients[14].id,
    providerId: nina.id,
    createdByUserId: karen.id,
    status: "CONFIRMED",
    type: "Massage",
    startTime: makeDate(y, m, d, 15, 0),
    requestMessage: "Massage follow-up.",
    adminNotes: "",
  });

  console.log(`📅 Created ${appointments.length} appointments.`);

  // =========================
  // PAYMENTS
  // =========================
  const completedAppointments = await prisma.appointment.findMany({
    where: { status: "COMPLETED" },
    orderBy: { id: "asc" },
  });

  const paymentAmounts = [
    55, 60, 65, 70, 75, 80, 85, 90, 95, 100,
    105, 110, 115, 120, 125, 130, 135, 140,
  ];

  for (let i = 0; i < completedAppointments.length; i++) {
    const appt = completedAppointments[i];
    if (i % 2 === 0 || i % 3 === 0) {
      await prisma.payment.create({
        data: {
          amount: paymentAmounts[i % paymentAmounts.length],
          paymentType: ["cash", "visa", "mastercard", "debit"][i % 4],
          receiptSent: i % 2 === 0,
          appointmentId: appt.id,
        },
      });
    }
  }

  console.log("💳 Payments created.");

  // =========================
  // CARDS
  // =========================
  const cardPatients = [patients[0], patients[7], patients[10], patients[11], patients[21]];
  const cardData = [
    ["Visa", "4242", 12, 2027],
    ["Mastercard", "8888", 6, 2026],
    ["Visa", "1234", 3, 2028],
    ["Visa", "7721", 8, 2029],
    ["Mastercard", "5566", 10, 2027],
  ] as const;

  for (let i = 0; i < cardPatients.length; i++) {
    const patient = cardPatients[i];
    const [brand, last4, expMonth, expYear] = cardData[i];

    await prisma.card.create({
      data: {
        brand,
        last4,
        expMonth,
        expYear,
        patientId: patient.id,
      },
    });
  }

  console.log("💾 Cards created.");
  console.log("✅ Final demo seed complete.");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });