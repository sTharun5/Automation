const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    console.log("==========================================");
    console.log("TESTING ROSTER VISIBILITY");
    console.log("==========================================\n");

    const events = await prisma.event.findMany({ take: 1, include: { ods: { include: { student: true } } } });
    if(events.length === 0) {
        console.log("No events to test.");
        return;
    }

    const event = events[0];
    console.log(`Testing Event: ${event.name} (ID: ${event.id})`);
    
    const rosterOds = await prisma.od.findMany({
        where: { eventId: event.id },
        include: {
            student: {
                select: { name: true, rollNo: true, department: true, semester: true }
            }
        },
        orderBy: { student: { rollNo: 'asc' } }
    });

    console.log(`\nFound ${rosterOds.length} students in roster:`);
    rosterOds.forEach((od, idx) => {
        console.log(`  ${idx + 1}. [${od.student.rollNo}] ${od.student.name} - ${od.student.department}`);
    });

    console.log("\n✅ Roster query simulated successfully.");
}

main().catch(console.error).finally(() => prisma.$disconnect());
