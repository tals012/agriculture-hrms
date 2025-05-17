"use server";

import axios from "axios";
import prisma from "@/lib/prisma";

const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL;
const SMS_USERNAME = process.env.SMS_USERNAME;
const SMS_PASSWORD = process.env.SMS_PASSWORD;
const SMS_SENDER = process.env.SMS_SENDER;

const sendSMS = async (
  phone,
  message,
  workerId,
  clientId,
  managerId,
  organizationId,
  sentBy,
  sentTo
) => {
  try {
    // Check if required SMS environment variables are defined
    if (!SMS_GATEWAY_URL || !SMS_USERNAME || !SMS_PASSWORD || !SMS_SENDER) {
      console.warn(
        "SMS environment variables are not configured. SMS sending skipped."
      );

      // Still create an SMS record to track the attempt
      await prisma.sMS.create({
        data: {
          message: message,
          status: "FAILED",
          failureReason: "SMS gateway not configured",
          ...(workerId && { workerId }),
          ...(clientId && { clientId }),
          ...(managerId && { managerId }),
          ...(organizationId && { organizationId }),
          ...(sentBy && { sentBy }),
          ...(sentTo && { sentTo }),
        },
      });

      return false;
    }

    // Validate phone number is available
    if (!phone) {
      console.warn("No phone number provided for SMS. SMS sending skipped.");
      return false;
    }

    const encodedURL = encodeURI(
      `${SMS_GATEWAY_URL}?UserName=${SMS_USERNAME}&Password=${SMS_PASSWORD}&SenderCellNumber=${SMS_SENDER}&CellNumber=${phone}&MessageString=${message}`
    );

    console.log("------------- SENDING SMS -------------");
    console.log({
      phone,
      message,
      workerId,
      clientId,
      managerId,
      organizationId,
      sentBy,
      sentTo,
    });

    const response = await axios.get(encodedURL);
    const body = response.data;
    console.log("Response from SMS gateway:", body);

    const smsRecord = await prisma.sMS.create({
      data: {
        message: message,
        status: body === "1" || body === 1 ? "SENT" : "FAILED",
        failureReason:
          body !== "1" && body !== 1 ? `Gateway response: ${body}` : null,
        ...(workerId && { workerId }),
        ...(clientId && { clientId }),
        ...(managerId && { managerId }),
        ...(organizationId && { organizationId }),
        ...(sentBy && { sentBy }),
        ...(sentTo && { sentTo }),
      },
    });
    console.log("SMS Record Created:", smsRecord);
    return body === "1" || body === 1;
  } catch (error) {
    console.error("Error in sendSMS function:", error);

    // Try to create an SMS record even if there was an error
    try {
      await prisma.sMS.create({
        data: {
          message: message,
          status: "FAILED",
          failureReason: error.message,
          ...(workerId && { workerId }),
          ...(clientId && { clientId }),
          ...(managerId && { managerId }),
          ...(organizationId && { organizationId }),
          ...(sentBy && { sentBy }),
          ...(sentTo && { sentTo }),
        },
      });
    } catch (dbError) {
      console.error("Failed to record SMS failure in database:", dbError);
    }

    return false;
  }
};

export default sendSMS;
