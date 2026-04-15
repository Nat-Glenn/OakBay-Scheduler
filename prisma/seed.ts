import { PrismaClient } from "@prisma/client";
import { hashPassword } from "../lib/hash";
import { encryptField } from "../lib/encrypt";

const prisma = new PrismaClient();

async function main() {
    console.log("Loading...");

    await prisma.payment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.card.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();
    console.log("Done.");

    const hashedPassword = await hashPassword("password");

    /////////STAFF/////////
    const doctor = await prisma.user.create({
        data: {
            name: "Brad Pritchard",
            email: "brad.pritchard@oakbay.com",
            password: hashedPassword,
            role: "Chiropractor",
        },
    });

    const receptionist = await prisma.user.create({
        data: {
            name: "Sarah Collins",
            email: "sarah.collins@oakbay.com",
            password: hashedPassword,
            role: "Receptionist",
        },
    });

    await prisma.user.create({
        data: {
            name: "Michelle Park",
            email: "michelle.park@oakbay.com",
            password: hashedPassword,
            role: "Receptionist",
        },
    });

    await prisma.user.create({
        data: {
            name: "Karen Hollis",
            email: "karen.hollis@oakbay.com",
            password: hashedPassword,
            role: "Receptionist",
        },
    });
    /////////STAFF/////////

    /////////PATIENTS/////////
    // Added DOBs and better details
    const patient0 = await prisma.patient.create({
        data: {
            firstName: "Prince",
            lastName: "Pande",
            phone: "587-123-4567",
            email: "prince.pande@example.com",
            dob: "1998-03-15",
            notes: "Patient has a history of back pain.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC0123456789"),
        }
    });

    const patient1 = await prisma.patient.create({
        data: {
            firstName: "Estefano",
            lastName: "Campana",
            phone: "587-234-5678",
            email: "estefano.campana@example.com",
            dob: "1995-06-20",
            notes: "Patient has a history of neck pain.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC1123456789"),
        }
    });

    const patient2 = await prisma.patient.create({
        data: {
            firstName: "Ashton",
            lastName: "Pritchard",
            phone: "403-345-6789",
            email: "ashton.pritchard@example.com",
            dob: "1990-11-05",
            notes: "Patient has a history of neck pain.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC2123456789"),
        }
    });

    const patient3 = await prisma.patient.create({
        data: {
            firstName: "Riley",
            lastName: "Yonda",
            phone: "403-456-7890",
            email: "riley.yonda@example.com",
            dob: "2000-01-30",
            notes: "Patient has a history of back pain.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC3123456789"),
        }
    });

    const patient4 = await prisma.patient.create({
        data: {
            firstName: "Nat-Glenn",
            lastName: "Atanga",
            phone: "587-567-8901",
            email: "nat-glenn.atanga@example.com",
            dob: "1997-08-12",
            notes: "Prefers morning appointments.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC4123456789"),
        }
    });

    const patient5 = await prisma.patient.create({
        data: {
            firstName: "Vincent",
            lastName: "Manimtim",
            phone: "780-678-9012",
            email: "vincent.manimtim@example.com",
            dob: "1993-04-25",
            notes: "Allergic to ibuprofen.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC5123456789"),
        }
    });

    // Additional patients
    const patient6 = await prisma.patient.create({
        data: {
            firstName: "James",
            lastName: "Thornton",
            phone: "403-555-1234",
            email: "james.thornton@email.com",
            dob: "1978-03-12",
            notes: "Chronic lower back pain. Prefers morning appointments.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC6123456789"),
        }
    });

    const patient7 = await prisma.patient.create({
        data: {
            firstName: "Maria",
            lastName: "Santos",
            phone: "403-555-2345",
            email: "maria.santos@email.com",
            dob: "1990-07-24",
            notes: "Sports injury — right shoulder. Recovering well.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC7123456789"),
        }
    });

    const patient8 = await prisma.patient.create({
        data: {
            firstName: "David",
            lastName: "Okafor",
            phone: "403-555-3456",
            email: "david.okafor@email.com",
            dob: "1965-11-05",
            notes: "Cervical adjustments only. History of migraines.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC8123456789"),
        }
    });

    const patient9 = await prisma.patient.create({
        data: {
            firstName: "Linda",
            lastName: "Kowalski",
            phone: "403-555-8901",
            email: "linda.kowalski@email.com",
            dob: "1972-04-22",
            notes: "Fibromyalgia. Gentle pressure preferred.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC9123456789"),
        }
    });

    const patient10 = await prisma.patient.create({
        data: {
            firstName: "Priya",
            lastName: "Sharma",
            phone: "780-555-6789",
            email: "priya.sharma@email.com",
            dob: "1987-05-14",
            notes: "Sciatica. Responds well to treatment.",
            reminderOptIn: true,
            ahcNumber: encryptField("AHC10123456789"),
        }
    });
    console.log("Patient Created.");
    /////////PATIENTS/////////

    /////////APPOINTMENTS — UTC dates, times set as local business hours/////////
    const now = new Date();
    // Use UTC date so the seed works correctly on both local and deployed servers
    const yyyy = now.getUTCFullYear();
    const mm = String(now.getUTCMonth() + 1).padStart(2, "0");
    const dd = String(now.getUTCDate()).padStart(2, "0");
    const todayStr = `${yyyy}-${mm}-${dd}`;

    // Today's appointments
    const appt1 = await prisma.appointment.create({
        data: {
            status: "COMPLETED",
            type: "Chiropractic Adjustment",
            startTime: new Date(`${todayStr}T15:00:00Z`),
            endTime: new Date(`${todayStr}T15:15:00Z`),
            slot: 1,
            patientId: patient0.id,
            providerId: doctor.id,
            requestMessage: "Lower back has been flaring up this week.",
            adminNotes: "Adjusted L4-L5. Recommend daily stretching.",
            createdByUserId: receptionist.id,
        }
    });

    const appt2 = await prisma.appointment.create({
        data: {
            status: "COMPLETED",
            type: "Massage",
            startTime: new Date(`${todayStr}T15:15:00Z`),
            endTime: new Date(`${todayStr}T15:30:00Z`),
            slot: 1,
            patientId: patient7.id,
            providerId: doctor.id,
            requestMessage: "Shoulder still sore from last session.",
            adminNotes: "Deep tissue on right shoulder. Improved range of motion.",
            createdByUserId: receptionist.id,
        }
    });

    const appt3 = await prisma.appointment.create({
        data: {
            status: "CHECKED_IN",
            type: "Initial Consultation",
            startTime: new Date(`${todayStr}T16:00:00Z`),
            endTime: new Date(`${todayStr}T16:15:00Z`),
            slot: 1,
            patientId: patient6.id,
            providerId: doctor.id,
            requestMessage: "First visit. Lower back pain.",
            adminNotes: "Assessment only.",
            createdByUserId: receptionist.id,
        }
    });

    const appt4 = await prisma.appointment.create({
        data: {
            status: "CONFIRMED",
            type: "Chiropractic Adjustment",
            startTime: new Date(`${todayStr}T17:00:00Z`),
            endTime: new Date(`${todayStr}T17:15:00Z`),
            slot: 1,
            patientId: patient10.id,
            providerId: doctor.id,
            requestMessage: "Sciatica acting up again.",
            adminNotes: "",
            createdByUserId: receptionist.id,
        }
    });

    const appt5 = await prisma.appointment.create({
        data: {
            status: "REQUESTED",
            type: "Follow-up",
            startTime: new Date(`${todayStr}T20:00:00Z`),
            endTime: new Date(`${todayStr}T20:15:00Z`),
            slot: 1,
            patientId: patient9.id,
            providerId: doctor.id,
            requestMessage: "Follow-up on fibromyalgia treatment.",
            adminNotes: "",
            createdByUserId: receptionist.id,
        }
    });

    // Past appointments
    const apptPast1 = await prisma.appointment.create({
        data: {
            status: "COMPLETED",
            type: "Initial Consultation",
            startTime: new Date("2024-07-01T15:00:00Z"),
            endTime: new Date("2024-07-01T15:15:00Z"),
            slot: 1,
            patientId: patient0.id,
            providerId: doctor.id,
            requestMessage: "First visit.",
            adminNotes: "Full assessment completed.",
            createdByUserId: receptionist.id,
        }
    });

    const apptPast2 = await prisma.appointment.create({
        data: {
            status: "COMPLETED",
            type: "Follow-up",
            startTime: new Date("2024-07-02T17:00:00Z"),
            endTime: new Date("2024-07-02T17:15:00Z"),
            slot: 1,
            patientId: patient1.id,
            providerId: doctor.id,
            requestMessage: "Neck pain follow-up.",
            adminNotes: "Good progress on neck mobility.",
            createdByUserId: receptionist.id,
        }
    });

    const apptPast3 = await prisma.appointment.create({
        data: {
            status: "COMPLETED",
            type: "Chiropractic Adjustment",
            startTime: new Date("2024-07-03T15:00:00Z"),
            endTime: new Date("2024-07-03T15:15:00Z"),
            slot: 1,
            patientId: patient2.id,
            providerId: doctor.id,
            requestMessage: "Regular adjustment.",
            adminNotes: "Cervical adjustment C3-C5.",
            createdByUserId: receptionist.id,
        }
    });

    const apptPast4 = await prisma.appointment.create({
        data: {
            status: "COMPLETED",
            type: "Massage",
            startTime: new Date("2024-08-10T20:00:00Z"),
            endTime: new Date("2024-08-10T20:15:00Z"),
            slot: 1,
            patientId: patient8.id,
            providerId: doctor.id,
            requestMessage: "Migraine tension relief.",
            adminNotes: "Light cervical massage. Patient comfortable.",
            createdByUserId: receptionist.id,
        }
    });

    const apptPast5 = await prisma.appointment.create({
        data: {
            status: "CANCELLED",
            type: "Follow-up",
            startTime: new Date("2024-07-04T20:00:00Z"),
            endTime: new Date("2024-07-04T20:15:00Z"),
            slot: 1,
            patientId: patient4.id,
            providerId: doctor.id,
            requestMessage: "None",
            adminNotes: "",
            createdByUserId: receptionist.id,
        }
    });
    /////////APPOINTMENTS/////////

    /////////PAYMENTS/////////
    await prisma.payment.create({
        data: {
            amount: 85.00,
            paymentType: "visa",
            receiptSent: true,
            appointmentId: appt1.id,
        }
    });

    await prisma.payment.create({
        data: {
            amount: 120.00,
            paymentType: "mastercard",
            receiptSent: false,
            appointmentId: appt2.id,
        }
    });

    await prisma.payment.create({
        data: {
            amount: 100.00,
            paymentType: "visa",
            receiptSent: false,
            appointmentId: apptPast1.id,
        }
    });

    await prisma.payment.create({
        data: {
            amount: 125.00,
            paymentType: "visa",
            receiptSent: true,
            appointmentId: apptPast2.id,
        }
    });

    await prisma.payment.create({
        data: {
            amount: 85.00,
            paymentType: "debit",
            receiptSent: true,
            appointmentId: apptPast3.id,
        }
    });

    await prisma.payment.create({
        data: {
            amount: 95.00,
            paymentType: "cash",
            receiptSent: false,
            appointmentId: apptPast4.id,
        }
    });
    /////////PAYMENTS/////////

    /////////CARDS/////////
    await prisma.card.create({
        data: {
            brand: "Visa",
            last4: "4242",
            expMonth: 12,
            expYear: 2027,
            patientId: patient0.id,
        }
    });

    await prisma.card.create({
        data: {
            brand: "Mastercard",
            last4: "8888",
            expMonth: 6,
            expYear: 2026,
            patientId: patient1.id,
        }
    });

    await prisma.card.create({
        data: {
            brand: "Visa",
            last4: "1234",
            expMonth: 3,
            expYear: 2028,
            patientId: patient10.id,
        }
    });
    /////////CARDS/////////

    console.log("Payment Created.");
    console.log("Finished");
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });