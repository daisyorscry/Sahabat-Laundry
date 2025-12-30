export type IconJson = {
  filename: string;
  mime: string;
  base64: string;
};

export function validateImageFile(file: File, opts?: { maxMB?: number; mimes?: string[] }) {
  const maxMB = opts?.maxMB ?? 5;
  const allowed = opts?.mimes ?? [
    "image/png",
    "image/jpeg",
    "image/jpg",
    "image/webp",
    "image/gif",
    "image/svg+xml",
  ];
  if (!allowed.includes(file.type)) {
    throw new Error("Tipe file tidak diizinkan");
  }
  const sizeMB = file.size / (1024 * 1024);
  if (sizeMB > maxMB) {
    throw new Error(`Ukuran file melebihi ${maxMB} MB`);
  }
}

export async function fileToIconPathJson(file: File): Promise<string> {
  validateImageFile(file);

  const base64 = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const res = String(reader.result ?? "");
      const comma = res.indexOf(",");
      if (comma < 0) return reject(new Error("Data URL tidak valid"));
      resolve(res.slice(comma + 1));
    };
    reader.onerror = () => reject(reader.error ?? new Error("Gagal membaca file"));
    reader.readAsDataURL(file);
  });

  const payload: IconJson = {
    filename: file.name,
    mime: file.type,
    base64,
  };

  return JSON.stringify(payload);
}
