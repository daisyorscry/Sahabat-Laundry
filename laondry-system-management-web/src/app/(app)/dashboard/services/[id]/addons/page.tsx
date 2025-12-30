"use client";

import ServiceAddonsSection from "./_parts/ServiceAddonsSection";
import { useParams, useRouter } from "next/navigation";
import Button from "@/components/button/Button";
import Surface from "@/components/layouts/page/Surface";
import HeaderBar from "@/components/layouts/page/HeaderBar";
import { PageContainer } from "@/components/layouts/page/Page";
import { HiArrowLeft } from "react-icons/hi"; // <— tambah ini

export default function ServiceAddonsPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  return (
    <PageContainer>
      <Surface padding="md" rounded="2xl">
        <HeaderBar
          title="Manage Addons"
          description="Tambahkan, wajibkan, atau lepaskan addons untuk service ini."
          actions={
            <Button
              variant="soft"
              tone="neutral"
              onClick={() => router.push("/dashboard/services")}
              leftIcon={<HiArrowLeft className="h-4 w-4" />} 
            >
              Kembali ke Services
            </Button>
          }
        />
        <ServiceAddonsSection serviceId={String(id)} />
      </Surface>
    </PageContainer>
  );
}
