import type { Request, Response } from "express";
import QRCode from "qrcode";
import Menu from "../models/menu/Menu.js";
import { userCanAccessApplication } from "../middleware/auth.js";
import { resolveMenuPublicUrl } from "./menuController.js";

const FORMAT_VALUES = ["png", "svg"] as const;

function isValidFormat(format: unknown): format is (typeof FORMAT_VALUES)[number] {
  return typeof format === "string" && (FORMAT_VALUES as readonly string[]).includes(format);
}

// The QR image always encodes the PUBLIC menu URL (see resolveMenuPublicUrl/
// buildMenuPublicUrl) — never an admin-panel link — so scanning it from a
// printed table card takes a customer straight to the public menu page, not
// somewhere requiring a staff login.
export async function getMenuQrCode(req: Request, res: Response) {
  const { format = "png" } = req.query;
  if (!isValidFormat(format)) {
    return res.status(400).json({ message: `format must be one of: ${FORMAT_VALUES.join(", ")}` });
  }

  const menu = await Menu.findById(req.params.id);
  if (!menu) return res.status(404).json({ message: "Menu not found" });
  if (!userCanAccessApplication(req.user!, menu.application)) {
    return res.status(403).json({ message: "Insufficient permissions" });
  }

  const url = await resolveMenuPublicUrl(menu);
  if (!url) {
    return res
      .status(400)
      .json({ message: "Application domain is not configured. Set it before generating a menu QR code." });
  }

  if (format === "svg") {
    const svg = await QRCode.toString(url, { type: "svg", errorCorrectionLevel: "H", margin: 2 });
    res.setHeader("Content-Type", "image/svg+xml");
    return res.send(svg);
  }

  res.setHeader("Content-Type", "image/png");
  res.on("error", (err) => {
    console.error(err);
    if (!res.headersSent) res.status(500);
    res.end();
  });
  QRCode.toFileStream(res, url, { errorCorrectionLevel: "H", width: 400, margin: 2 });
}
