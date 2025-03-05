"use server";

import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";

export const updatePassword = async ({ workerId, username, currentPassword, newPassword }) => {
  if (!workerId) {
    return {
      ok: false,
      message: "מזהה עובד לא סופק",
    };
  }

  // Get the worker
  const worker = await prisma.worker.findUnique({
    where: { id: workerId },
    include: { user: true },
  });

  if (!worker) {
    return {
      ok: false,
      message: "העובד לא נמצא",
    };
  }

  // If the worker doesn't have a user account and no new password is provided
  if (!worker.userId && !newPassword) {
    return {
      ok: false,
      message: "לא נמצא חשבון משתמש לעובד זה. יש לספק סיסמה חדשה ליצירת חשבון",
    };
  }

  // If updating an existing user account
  if (worker.userId) {
    // If changing password, current password is required
    if (newPassword && !currentPassword) {
      return {
        ok: false,
        message: "הסיסמה הנוכחית נדרשת כדי לשנות את הסיסמה",
      };
    }

    // Verify current password if provided
    if (currentPassword) {
      const isPasswordCorrect = await bcrypt.compare(currentPassword, worker.user.password);
      if (!isPasswordCorrect) {
        return {
          ok: false,
          message: "הסיסמה הנוכחית שגויה",
        };
      }
    }

    // Update user
    try {
      const updateData = {};
      
      // Update username if provided
      if (username) {
        // Check if username is already taken by another user
        const existingUser = await prisma.user.findUnique({
          where: { 
            username,
            NOT: { 
              id: worker.userId 
            }
          },
        });

        if (existingUser) {
          return {
            ok: false,
            message: "שם משתמש זה כבר בשימוש",
          };
        }
        
        updateData.username = username;
      }
      
      // Update password if provided
      if (newPassword) {
        const saltRounds = 10;
        const hashedPassword = await bcrypt.hash(newPassword, saltRounds);
        updateData.password = hashedPassword;
      }
      
      // If there's nothing to update
      if (Object.keys(updateData).length === 0) {
        return {
          ok: false,
          message: "לא סופקו נתונים לעדכון",
        };
      }
      
      await prisma.user.update({
        where: { id: worker.userId },
        data: updateData,
      });
      
      return {
        ok: true,
        message: "פרטי המשתמש עודכנו בהצלחה",
      };
    } catch (error) {
      console.error("Error updating user credentials:", error);
      return {
        ok: false,
        message: "אירעה שגיאה בעדכון פרטי המשתמש",
      };
    }
  }
  
  // Create new user account for worker
  if (!worker.userId && newPassword) {
    if (!username) {
      return {
        ok: false,
        message: "שם משתמש נדרש ליצירת חשבון חדש",
      };
    }
    
    try {
      // Check if username is already taken
      const existingUser = await prisma.user.findUnique({
        where: { username },
      });

      if (existingUser) {
        return {
          ok: false,
          message: "שם משתמש זה כבר בשימוש",
        };
      }
      
      // Get organization ID
      const organization = await prisma.organization.findFirst();
      if (!organization) {
        return {
          ok: false,
          message: "לא נמצא ארגון במערכת",
        };
      }
      
      // Create user and link to worker
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      const nameFirst = worker.name ? worker.name : worker.nameHe;
      const nameLast = worker.surname ? worker.surname : worker.surnameHe;
      
      const user = await prisma.user.create({
        data: {
          name: nameFirst + " " + nameLast,
          username,
          password: hashedPassword,
          email: worker.email || `${username}@example.com`,
          phone: worker.primaryPhone,
          role: "WORKER",
          organizationId: organization.id,
        },
      });
      
      // Link worker to user
      await prisma.worker.update({
        where: { id: workerId },
        data: { userId: user.id },
      });
      
      return {
        ok: true,
        message: "חשבון משתמש נוצר בהצלחה",
      };
    } catch (error) {
      console.error("Error creating user account:", error);
      return {
        ok: false,
        message: "אירעה שגיאה ביצירת חשבון המשתמש",
      };
    }
  }
};
