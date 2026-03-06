const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("==========================================");
    console.log("TESTING HIERARCHY / EVENT VISIBILITY");
    console.log("==========================================\n");

    const now = new Date();
    const past = new Date(now.getTime() - 1000 * 60 * 60 * 24); // 1 day ago

    console.log(`Current Time (UTC): ${now.toISOString()}`);
    console.log(`Past Time (UTC): ${past.toISOString()}\n`);

    // Get a valid faculty ID
    const faculty = await prisma.faculty.findFirst();
    if (!faculty) {
        console.error("No faculty found in DB to test with.");
        return;
    }

    // 1. Create a dummy test event that ended yesterday
    const oldEvent = await prisma.event.create({
        data: {
            eventId: `EVT-OLD-${Math.floor(Math.random() * 1000)}`,
            name: "Expired Test Event",
            startDate: new Date(now.getTime() - 1000 * 60 * 60 * 48), // 2 days ago
            endDate: past,
            isInternal: true,
            status: "ACTIVE",
            allocatedHours: 2,
            qrSecretKey: "dummy_secret_old",
            staffCoordinatorId: faculty.id 
        }
    });
    console.log(`✅ Created OLD Event: ${oldEvent.eventId} ending at ${oldEvent.endDate} linked to Faculty: ${faculty.name}`);

    // 2. Fetch assigned events for Faculty and see if OLD Event is included
    const activeEvents = await prisma.event.findMany({
        where: { 
            staffCoordinatorId: faculty.id,
            endDate: { gte: now }
        }
    });

    const isOldIncluded = activeEvents.some(e => e.id === oldEvent.id);
    if (isOldIncluded) {
        console.error("❌ FAILED: Old event is still showing up in the active query.");
    } else {
        console.log("✅ SUCCESS: Old event was correctly filtered out from active assigned events.");
    }

    // 3. Clean up the old event
    await prisma.event.delete({ where: { id: oldEvent.id } });
    console.log("✅ Cleanup complete. Deleted dummy event.\n");
    console.log("Tests Passed.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
