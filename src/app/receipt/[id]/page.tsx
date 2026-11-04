import { Metadata } from "next";
import { PublicReceiptView } from "@/components/agendaste/public-receipt-view";

interface ReceiptPageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ d?: string }>;
}

export async function generateMetadata({
  params,
}: ReceiptPageProps): Promise<Metadata> {
  const { id } = await params;
  const cleanNum = id.replace("sale-", "").toUpperCase();
  return {
    title: `Comprovante #${cleanNum} | Luvea Studio`,
    description: "Comprovante oficial de atendimento e pagamento no Luvea Studio.",
    robots: {
      index: false,
      follow: false,
    },
  };
}

export default async function ReceiptPage({
  params,
  searchParams,
}: ReceiptPageProps) {
  const { id } = await params;
  const { d } = await searchParams;

  return <PublicReceiptView saleId={id} initialEncodedData={d} />;
}
