'use server'

import prisma from '@/lib/prisma'
import { revalidatePath } from 'next/cache'

export async function createClient(formData) {
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
  }

  try {
    await prisma.client.create({ data })
    revalidatePath('/clients')
    return { success: true }
  } catch (error) {
    return { error: error.message }
  }
}

export async function updateClient(formData) {
  const id = parseInt(formData.get('id'))
  const data = {
    name: formData.get('name'),
    email: formData.get('email'),
    phone: formData.get('phone'),
  }

  try {
    await prisma.client.update({
      where: { id },
      data,
    })
    revalidatePath('/clients')
    return { success: true }
  } catch (error) {
    return { error: error.message }
  }
}

export async function deleteClient(formData) {
  const id = parseInt(formData.get('id'))

  try {
    await prisma.client.delete({
      where: { id },
    })
    revalidatePath('/clients')
    return { success: true }
  } catch (error) {
    return { error: error.message }
  }
}

export async function getClients() {
  try {
    const clients = await prisma.client.findMany({
      orderBy: { createdAt: 'desc' },
    })
    return clients
  } catch (error) {
    return []
  }
}

export async function getClientById(id) {
  try {
    const client = await prisma.client.findUnique({
      where: { id: parseInt(id) },
      include: {
        workers: true,
        fields: true,
      },
    })
    return client
  } catch (error) {
    return null
  }
} 