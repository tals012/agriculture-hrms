import fetch from "node-fetch";
import prisma from "@/lib/prisma";

export const SMS_GATEWAY_URL = process.env.SMS_GATEWAY_URL;
export const SMS_USERNAME = process.env.SMS_USERNAME;
export const SMS_PASSWORD = process.env.SMS_PASSWORD;
export const SMS_SENDER = process.env.SMS_SENDER;

export async function sendSMS(
  phone,
  message,
  workerId,
  clientId,
  organizationId,
  sentBy,
  sentTo
) {
  if (!workerId) {
    console.error("No worker ID provided");
    return false;
  }

  const encodedURL = encodeURI(
    `${SMS_GATEWAY_URL}?UserName=${SMS_USERNAME}&Password=${SMS_PASSWORD}&SenderCellNumber=${SMS_SENDER}&CellNumber=${phone}&MessageString=${message}`
  );

  try {
    const response = await fetch(encodedURL, { method: "GET" });
    const body = await response.text();
    console.log("Response from SMS gateway:", body);
    console.log("Sending SMS to worker ID:", workerId);

    const smsRecord = await prisma.sms.create({
      data: {
        message: message,
        status: response.ok && body === "1" ? "SENT" : FAILED,
        ...(workerId && { workerId }),
        ...(clientId && { clientId }),
        ...(organizationId && { organizationId }),
        ...(sentBy && { sentBy }),
        ...(sentTo && { sentTo }),
      },
    });
    console.log("SMS Record Created:", smsRecord);
    return response.ok && body === "1";
  } catch (error) {
    console.error("Error in sendSMS function:", error);
    return false;
  }
}
