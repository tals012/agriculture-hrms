const { PrismaClient } = require("@prisma/client");
const prisma = new PrismaClient();
const readline = require('readline');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

const question = (query) => new Promise((resolve) => rl.question(query, resolve));

async function deleteAllUsers() {
  try {
    const users = await prisma.user.findMany({
      include: {
        manager: {
          include: {
            fields: true,
            client: true,
            workerAttendance: true
          }
        },
        worker: {
          include: {
            groups: {
              include: {
                group: true,
                workerAttendance: true
              }
            },
            harvestEntries: true,
            clientHistory: true,
            workingSchedule: true,
            attendance: true,
            monthlySubmissions: true
          }
        },
        organization: true,
        workerAttendance: true
      }
    });

    if (users.length === 0) {
      console.log("No users found in the database");
      return;
    }

    const totalManagers = users.filter(u => u.manager).length;
    const totalWorkers = users.filter(u => u.worker).length;
    const totalGroupLeaders = users.filter(u => 
      u.worker?.groups.some(g => g.isGroupLeader)).length;
    const totalFieldsManaged = users.reduce((sum, u) => 
      sum + (u.manager?.fields.length || 0), 0);
    const totalHarvestEntries = users.reduce((sum, u) => 
      sum + (u.worker?.harvestEntries.length || 0), 0);
    const totalWorkingSchedules = users.reduce((sum, u) => 
      sum + (u.worker?.workingSchedule.length || 0), 0);
    const totalAttendance = users.reduce((sum, u) => 
      sum + u.workerAttendance.length + 
      (u.manager?.workerAttendance.length || 0) +
      (u.worker?.attendance.length || 0), 0);
    const totalMonthlySubmissions = users.reduce((sum, u) => 
      sum + (u.worker?.monthlySubmissions.length || 0), 0);

    console.log("\nFound users:");
    console.log(`Total users: ${users.length}`);
    console.log("\nSummary:");
    console.log(`Field managers: ${totalManagers}`);
    console.log(`Workers: ${totalWorkers}`);
    console.log(`Group leaders: ${totalGroupLeaders}`);
    console.log(`Total fields managed: ${totalFieldsManaged}`);
    console.log(`Total harvest entries: ${totalHarvestEntries}`);
    console.log(`Total working schedules: ${totalWorkingSchedules}`);
    console.log(`Total attendance records: ${totalAttendance}`);
    console.log(`Total monthly submissions: ${totalMonthlySubmissions}`);

    const confirm = await question('\nAre you sure you want to delete ALL users? This will:\n' +
      '- Delete ALL user accounts\n' +
      '- Remove manager roles and unassign managed fields\n' +
      '- Remove group leader statuses\n' +
      '- Delete ALL working schedules\n' +
      '- Delete ALL attendance records\n' +
      '- Delete ALL monthly submissions\n' +
      '- Unlink workers from their user accounts\n' +
      'Type "YES" to confirm: ');

    if (confirm !== "YES") {
      console.log("Deletion cancelled");
      return;
    }

    // Process each user in its own transaction
    for (const user of users) {
      await prisma.$transaction(async (tx) => {
        if (user.manager) {
          // Delete manager's worker attendance records
          await tx.workerAttendance.deleteMany({
            where: { managerId: user.manager.id }
          });

          // Update fields to remove manager reference
          await tx.field.updateMany({
            where: { managerId: user.manager.id },
            data: { managerId: null }
          });

          // Delete manager record
          await tx.manager.delete({
            where: { id: user.manager.id }
          });
        }

        if (user.worker) {
          // Delete worker's attendance records
          await tx.workerAttendance.deleteMany({
            where: { workerId: user.worker.id }
          });

          // Delete working schedules
          await tx.workingSchedule.deleteMany({
            where: { workerId: user.worker.id }
          });

          // Delete monthly submissions
          await tx.workerMonthlyWorkingHoursSubmission.deleteMany({
            where: { workerId: user.worker.id }
          });

          // Remove group leader status if applicable
          const leaderGroups = user.worker.groups.filter(g => g.isGroupLeader);
          for (const membership of leaderGroups) {
            await tx.groupMember.update({
              where: { id: membership.id },
              data: { isGroupLeader: false }
            });
          }

          // Unlink worker from user
          await tx.worker.update({
            where: { id: user.worker.id },
            data: { userId: null }
          });
        }

        // Delete user's attendance records
        await tx.workerAttendance.deleteMany({
          where: { userId: user.id }
        });

        // Delete the user
        await tx.user.delete({
          where: { id: user.id }
        });
      }, {
        timeout: 30000 // 30 second timeout
      });

      console.log(`Deleted user: ${user.name} (${user.email})`);
    }

    console.log("\nAll users and related records deleted successfully");

  } catch (error) {
    console.error("Error deleting users:", error);
  } finally {
    await prisma.$disconnect();
    rl.close();
  }
}

deleteAllUsers(); 