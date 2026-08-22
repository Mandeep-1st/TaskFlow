import { z } from 'zod'

export const registerSchema = z.object({
    name: z.string().min(1),
    email: z.email(),
    password: z.string().min(8),
    organizationName: z.string().min(1), //can create a brand new org if there is none matching.
})

export const loginSchema = z.object({
    email: z.email(),
    password: z.string().min(8),
    orgId: z.number().optional() //required if user belongs to multiple orgs
})

export const addMemberSchema = z.object({
    email: z.email(),
    role: z.enum(["org_admin", "member"]).default("member"),
});
