import QRCode from "qrcode"

export async function generateQRCode(url: string): Promise<string> {
  try {
    const qrCodeDataUrl = await QRCode.toDataURL(url, {
      width: 300,
      margin: 2,
    })
    return qrCodeDataUrl
  } catch (error) {
    console.error("Error generating QR code:", error)
    throw error
  }
}

