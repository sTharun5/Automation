const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();

const getEvents = async () => {
    return await prisma.calendarEvent.findMany({
        orderBy: { startDate: "asc" }
    });
};

const createEvent = async (data) => {
    return await prisma.calendarEvent.create({
        data: {
            title: data.title,
            description: data.description,
            startDate: new Date(data.startDate),
            endDate: new Date(data.endDate),
            type: data.type
        }
    });
};

const deleteEvent = async (id) => {
    return await prisma.calendarEvent.delete({
        where: { id: parseInt(id) }
    });
};

module.exports = {
    getEvents,
    createEvent,
    deleteEvent
};
