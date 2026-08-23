import prisma from "../config/prisma.js";
import { ApiError } from "../utils/apiError.js";

const getProjectOrThrow = async (id: number, orgId: number) => {
    const project = await prisma.project.findFirst({ where: { id, orgId } });
    if (!project) throw new ApiError(404, "Project not found", "PROJECT_NOT_FOUND");
    return project;
};

export const createProject = (name: string, orgId: number) =>
    prisma.project.create({ data: { name, orgId } });

export const getProjects = (orgId: number) =>
    prisma.project.findMany({ where: { orgId }, orderBy: { id: "desc" } });


export const getProject = (id: number, orgId: number) => getProjectOrThrow(id, orgId);

export const updateProject = async (id: number, name: string | undefined, orgId: number) => {
    await getProjectOrThrow(id, orgId);
    return prisma.project.update({ where: { id }, data: name === undefined ? {} : { name } });
};

export const deleteProject = async (id: number, orgId: number) => {
    await getProjectOrThrow(id, orgId);
    await prisma.project.delete({ where: { id } });
};

export const getProjectDashboard = async (id: number, orgId: number) => {
    await getProjectOrThrow(id, orgId);
    const groups = await prisma.task.groupBy({
        by: ["status"],
        where: { projectId: id },
        _count: { _all: true },
    });
    const counts = { todo: 0, in_progress: 0, review: 0, done: 0 };
    for (const group of groups) counts[group.status] = group._count._all;
    return { projectId: id, taskCounts: counts };
};
