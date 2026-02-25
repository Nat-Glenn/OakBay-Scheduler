import { PrismaClient } from "@prisma/client";


const prisma = new PrismaClient();

async function main() {
    console.log("Loading..." );

    await prisma.payment.deleteMany();
    await prisma.appointment.deleteMany();
    await prisma.patient.deleteMany();
    await prisma.user.deleteMany();
    console.log("Done." );


        /////////STAFF/////////
    const doctor = await prisma.user.create({
        data: {
            name: "Dr. Brad Pritchard",
            email: "brad.pritchard@example.com",
            password: "password",
            role: "Chiropractor",
        },
    });

    const receptionist = await prisma.user.create({
        data: {
            name: "John Doe",
            email: "johndoe@email.com",
            password: "password",
            role: "Receptionist",
        },
    });
        /////////STAFF/////////


        /////////PATIENTS/////////
    const patient0 = await prisma.patient.create({
        data: {
            firstName:"Prince",
            lastName:"Pande",
            phone: "123-456-7890",
            email:"prince.pande@example.com",
            notes: "Patient has a history of back pain",
            ahcNumber: "AHC012345678",
        }
    });

    const patient1 = await prisma.patient.create({
        data: {
            firstName:"Estefano",
            lastName:"Campana",
            phone: "123-456-7890",
            email:"estefano.campana@example.com",
            notes: "Patient has a history of neck pain",
            ahcNumber: "AHC1123456789",
        }
    });

    const patient2 = await prisma.patient.create({
        data: {
            firstName:"Ashton",
            lastName:"Pritchard",
            phone: "123-456-7890",
            email:"ashton.pritchard@example.com",
            notes: "Patient has a history of neck pain",
            ahcNumber: "AHC2123456789",
        }
    });

    const patient3 = await prisma.patient.create({
        data: {
            firstName:"Riley",
            lastName:"Yonda",
            phone: "123-456-7890",
            email:"riley.yonda@example.com",
            notes: "Patient has a history of back pain",
            ahcNumber: "AHC3123456789",
        }
    });

    const patient4 = await prisma.patient.create({
        data: {
            firstName:"Nat-Glenn",
            lastName:"Atanga",
            phone: "123-456-7890",
            email:"nat-glenn.atanga@example.com",
            notes: "None",
            ahcNumber: "AHC4123456789",
        }
    });

    const patient5 = await prisma.patient.create({
        data: {
            firstName:"Vincent",
            lastName:"Manimtim",
            phone: "123-456-7890",
            email:"vincent.manimtim@example.com",
            notes: "None",
            ahcNumber: "AHC5123456789",
        }
    });
    console.log("Patient Created." );
        /////////PATIENTS/////////


        /////////APPOINTMENTS/////////
    const appointmentConfirmed = await prisma.appointment.create({
        data: {
            status: "CONFIRMED",
            type: "Initial Consultation",
            startTime: new Date("2024-07-01T10:00:00Z"),
            endTime: new Date("2024-07-01T10:30:00Z"),
            patientId: patient0.id,
            providerId: doctor.id,
            requestMessage: "None",
            adminNotes: "More back exercises and stretches",
            createdByUserId: receptionist.id,
        }
    });

    const appointmentCompleted = await prisma.appointment.create({
        data: {
            status: "COMPLETED",
            type: "Follow-up",
            startTime: new Date("2024-07-02T11:00:00Z"),
            endTime: new Date("2024-07-02T11:30:00Z"),
            patientId: patient1.id,
            providerId: doctor.id,
            requestMessage: "None",
            adminNotes: "More neck exercises",
            createdByUserId: receptionist.id,
        }
    });

    const appointmentRequested = await prisma.appointment.create({
        data: {
            status: "REQUESTED",
            type: "Adjustment",
            startTime: new Date("2024-07-03T09:00:00Z"),
            endTime: new Date("2024-07-03T09:30:00Z"),
            patientId: patient2.id,
            providerId: doctor.id,
            requestMessage: "Prefer morning appointment",
            adminNotes: "More stretching exercises",
            createdByUserId: receptionist.id,
        }
    });

    const appointmentCancelled = await prisma.appointment.create({
        data: {
            status: "CANCELLED",
            type: "Follow-up",
            startTime: new Date("2024-07-04T14:00:00Z"),
            endTime: new Date("2024-07-04T14:30:00Z"),
            patientId: patient4.id,
            providerId: doctor.id,
            requestMessage: "None",
            adminNotes: "None",
            createdByUserId: receptionist.id,
        }
    });
        /////////APPOINTMENTS/////////


        /////////Payment////////
    await prisma.payment.create({
        data: {
            amount: 100.00,
            paymentType: "Credit Card",
            receiptSent: false,
            appointmentId: appointmentConfirmed.id,
        } 
    });

    await prisma.payment.create({
        data: {
            amount: 125.00,
            paymentType: "Credit Card",
            receiptSent: true,
            appointmentId: appointmentCompleted.id,
        } 
    });
        /////////Payment////////


    console.log("Payment Created." );
    console.log("Finished" );
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
