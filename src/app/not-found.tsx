import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6 bg-white text-[#1C1C1E] text-center">
      <div className="max-w-md space-y-4">
        <span className="px-3 py-1 rounded-full bg-[#E11D8F] text-white text-[12px] font-bold shadow-sm">
          404 · Página não encontrada
        </span>
        <h1 className="font-display text-[36px] text-[#1C1C1E]">
          Ops! Esta página não existe na LUVEA
        </h1>
        <p className="text-[14px] text-[#6E6E73]">
          O endereço que você tentou acessar não foi encontrado ou foi movido.
        </p>
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
          <Link
            href="/"
            className="w-full sm:w-auto inline-block px-6 py-2.5 rounded-full bg-[#1C1C1E] text-white text-[13px] font-semibold hover:bg-black transition-colors"
          >
            Página Inicial
          </Link>
          <Link
            href="/app"
            className="w-full sm:w-auto inline-block px-6 py-2.5 rounded-full border border-zinc-300 bg-white text-[#18181B] text-[13px] font-semibold hover:bg-zinc-50 transition-colors"
          >
            Acessar Painel
          </Link>
        </div>
      </div>
    </div>
  );
}
