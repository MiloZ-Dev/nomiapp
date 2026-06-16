import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"
import { getAccessToken } from "@/lib/tokenStore"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Formats a number as Colombian pesos, e.g. 1750905 -> "$ 1.750.905". */
export const formatCOP = (valor: number) =>
  new Intl.NumberFormat("es-CO", {
    style: "currency",
    currency: "COP",
    minimumFractionDigits: 0,
  }).format(valor)

/** Fetches an authenticated PDF and triggers a browser download. */
export async function downloadPDF(url: string, filename: string) {
  const response = await fetch(url, {
    headers: {
      Authorization: `Bearer ${getAccessToken()}`,
    },
  })
  if (!response.ok) {
    throw new Error(`Error ${response.status} al descargar el PDF`)
  }
  const blob = await response.blob()
  const link = document.createElement("a")
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}
