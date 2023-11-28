import { PrismaClient } from '@prisma/client'
const prisma = new PrismaClient()
async function main() {
     await prisma.user.upsert({
        where: { email: 'tilican@protonmail.com' },
        update: {

            myOrganizations: {
                create: {
                    name: "default",
                    shareds: {
                        createMany: {
                            data: [
                                {
                                    name: '/constants',
                                    enable: false,
                                    code: '// test'
                                },
                                {
                                    name: '/twitch/command',
                                    enable: true,
                                    code: '// test'
                                }
                            ]
                        }
                    },
                    triggers: {
                        createMany: {
                            data: [
                                {
                                    name: '/twitch/process-command',
                                    enable: true,
                                    code: '// test',
                                    channel: ''
                                }
                            ]
                        }
                    }
                }
            }
        },
        create: {
            email: 'tilican@protonmail.com',
            name: 'Tilican',

            myOrganizations: {
                create: {
                    name: "default",
                    shareds: {
                        createMany: {
                            data: [
                                {
                                    name: '/constants',
                                    enable: false,
                                    code: '// test'
                                },
                                {
                                    name: '/twitch/command',
                                    enable: true,
                                    code: '// test'
                                }
                            ]
                        }
                    },
                    triggers: {
                        createMany: {
                            data: [
                                {
                                    name: '/twitch/process-command',
                                    enable: true,
                                    code: '// test',
                                    channel: ''
                                }
                            ]
                        }
                    }
                }
            }
        },
    })
}
main()
    .then(async () => {
        await prisma.$disconnect()
    })
    .catch(async (e) => {
        console.error(e)
        await prisma.$disconnect()
        process.exit(1)
    })