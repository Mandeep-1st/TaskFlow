import prisma from "../src/config/prisma.js";

async function main() {
    console.log("🌱 Seeding database...");

    // -------------------------
    // Users
    // -------------------------

    const mandeep = await prisma.user.create({
        data: {
            name: "Mandeep",
            email: "mandeep@example.com",
            password: "password123",
        },
    });

    const rohan = await prisma.user.create({
        data: {
            name: "Rohan",
            email: "rohan@example.com",
            password: "password123",
        },
    });

    const priya = await prisma.user.create({
        data: {
            name: "Priya",
            email: "priya@example.com",
            password: "password123",
        },
    });

    // -------------------------
    // Organizations
    // -------------------------

    const nimbus = await prisma.organization.create({
        data: {
            name: "Nimbus Studio",
        },
    });

    const acme = await prisma.organization.create({
        data: {
            name: "Acme Corp",
        },
    });

    // -------------------------
    // Organization Members
    // -------------------------

    await prisma.orgMember.createMany({
        data: [
            {
                userId: mandeep.id,
                orgId: nimbus.id,
                role: "org_admin",
            },
            {
                userId: rohan.id,
                orgId: nimbus.id,
                role: "member",
            },
            {
                userId: priya.id,
                orgId: nimbus.id,
                role: "member",
            },
            {
                userId: mandeep.id,
                orgId: acme.id,
                role: "member",
            },
        ],
    });

    // -------------------------
    // Projects
    // -------------------------

    const websiteProject = await prisma.project.create({
        data: {
            name: "Client Website Redesign",
            orgId: nimbus.id,
        },
    });

    const mobileProject = await prisma.project.create({
        data: {
            name: "Mobile App",
            orgId: nimbus.id,
        },
    });

    const internalProject = await prisma.project.create({
        data: {
            name: "Internal Tools",
            orgId: acme.id,
        },
    });

    // -------------------------
    // Tasks
    // -------------------------

    const homepageTask = await prisma.task.create({
        data: {
            title: "Design homepage",
            description: "Create the new homepage design",
            status: "in_progress",
            priority: "high",
            projectId: websiteProject.id,
        },
    });

    const logoTask = await prisma.task.create({
        data: {
            title: "Update company logo",
            description: "Replace the old logo with the new branding",
            status: "todo",
            priority: "medium",
            projectId: websiteProject.id,
        },
    });

    const loginTask = await prisma.task.create({
        data: {
            title: "Implement login screen",
            description: "Build the mobile login UI",
            status: "review",
            priority: "urgent",
            projectId: mobileProject.id,
        },
    });

    const dashboardTask = await prisma.task.create({
        data: {
            title: "Build admin dashboard",
            description: "Create the internal admin dashboard",
            status: "done",
            priority: "high",
            projectId: internalProject.id,
        },
    });

    // -------------------------
    // Task Assignments
    // -------------------------

    await prisma.taskAssignment.createMany({
        data: [
            {
                taskId: homepageTask.id,
                userId: rohan.id,
            },
            {
                taskId: homepageTask.id,
                userId: priya.id,
            },
            {
                taskId: logoTask.id,
                userId: priya.id,
            },
            {
                taskId: loginTask.id,
                userId: rohan.id,
            },
            {
                taskId: dashboardTask.id,
                userId: mandeep.id,
            },
        ],
    });

    // -------------------------
    // Comments
    // -------------------------

    await prisma.comment.createMany({
        data: [
            {
                content: "Please use the new brand colors.",
                taskId: homepageTask.id,
                userId: mandeep.id,
            },
            {
                content: "I'll have the first version ready today.",
                taskId: homepageTask.id,
                userId: rohan.id,
            },
            {
                content: "The new logo files are uploaded.",
                taskId: logoTask.id,
                userId: priya.id,
            },
            {
                content: "Login screen is ready for review.",
                taskId: loginTask.id,
                userId: rohan.id,
            },
        ],
    });

    console.log("✅ Database seeded successfully!");
}

main()
    .catch((error) => {
        console.error("❌ Seed failed:", error);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });