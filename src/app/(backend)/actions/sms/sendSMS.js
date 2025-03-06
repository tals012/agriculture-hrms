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
  organizationId,
  sentBy,
  sentTo
) => {
  if (!workerId) {
    console.error("No worker ID provided");
    return false;
  }

  const encodedURL = encodeURI(
    `${SMS_GATEWAY_URL}?UserName=${SMS_USERNAME}&Password=${SMS_PASSWORD}&SenderCellNumber=${SMS_SENDER}&CellNumber=${phone}&MessageString=${message}`
  );

  try {
    const response = await axios.get(encodedURL);
    const body = response.data;
    console.log("Response from SMS gateway:", body);
    console.log("Sending SMS to worker ID:", workerId);

    const smsRecord = await prisma.SMS.create({
      data: {
        message: message,
        status: response.status === 200 && body === "1" ? "SENT" : "FAILED",
        ...(workerId && { workerId }),
        ...(clientId && { clientId }),
        ...(organizationId && { organizationId }),
        ...(sentBy && { sentBy }),
        ...(sentTo && { sentTo }),
      },
    });
    console.log("SMS Record Created:", smsRecord);
    return response.status === 200 && body === "1";
  } catch (error) {
    console.error("Error in sendSMS function:", error);
    return false;
  }
}

export default sendSMS;
