"use client";

import { useState } from "react";
import Link from "next/link";
import { QRCodeSVG } from "qrcode.react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import { ArrowLeft, Heart, Copy, Check } from "lucide-react";

const BTC_ADDRESS = process.env.NEXT_PUBLIC_BTC_ADDRESS;
const ETH_ADDRESS = process.env.NEXT_PUBLIC_ETH_ADDRESS;
const PAYPAL_DONATE_URL =
  "https://www.paypal.com/donate/?business=3XPK2RUCL4XFL&no_recurring=0&item_name=To+support+this+project+and+to+say+thank+you%21+%E2%9D%A4%EF%B8%8F&currency_code=EUR";

type Tab = "crypto" | "paypal";

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false);

  function handleCopy() {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={handleCopy}
      className="rounded p-1 text-neutral-500 transition-colors hover:text-neutral-300"
      title="Copy address"
    >
      {copied ? (
        <Check className="h-4 w-4 text-green-400" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
    </button>
  );
}

function WalletCard({
  name,
  network,
  icon,
  address,
  uri,
  color,
}: {
  name: string;
  network: string;
  icon: React.ReactNode;
  address: string;
  uri: string;
  color: string;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-[#0d1117] p-4">
      <div className="mb-1 flex items-center gap-2">
        {icon}
        <span className={`text-sm font-medium ${color}`}>{name}</span>
      </div>
      <p className="mb-3 text-xs text-neutral-500">
        {network} network only
      </p>
      <div className="flex justify-center rounded-lg bg-white p-3">
        <QRCodeSVG value={uri} size={160} level="M" />
      </div>
      <div className="mt-3 flex items-center gap-2">
        <code className="flex-1 truncate rounded bg-white/5 px-2 py-1.5 text-xs text-neutral-400">
          {address}
        </code>
        <CopyButton text={address} />
      </div>
    </div>
  );
}

export default function DonatePage() {
  const [tab, setTab] = useState<Tab>(
    BTC_ADDRESS || ETH_ADDRESS ? "crypto" : "paypal"
  );

  const hasCrypto = BTC_ADDRESS || ETH_ADDRESS;

  return (
    <div>
      <div className="mb-8">
        <Link
          href="/dashboard"
          className="mb-4 inline-flex items-center gap-1 text-sm text-neutral-400 transition-colors hover:text-neutral-200"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to dashboard
        </Link>
        <h1 className="font-serif text-3xl text-neutral-100">
          Support Renata
        </h1>
      </div>

      <Card className="mx-auto max-w-lg border-white/10 bg-[#161b22]">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/10">
            <Heart className="h-6 w-6 text-amber-500" />
          </div>
          <CardTitle className="text-neutral-100">
            Thank you for considering a donation
          </CardTitle>
          <CardDescription className="text-neutral-400">
            Si este proyecto te ayudó a mejorar tu CV, puedes donar cualquier
            monto que quieras para mantener el proyecto vivo y retribuir la
            ayuda. No es obligatorio.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          {/* Tabs */}
          <div className="flex gap-1 rounded-lg bg-[#0d1117] p-1">
            {hasCrypto && (
              <button
                onClick={() => setTab("crypto")}
                className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                  tab === "crypto"
                    ? "bg-white/10 text-neutral-100"
                    : "text-neutral-500 hover:text-neutral-300"
                }`}
              >
                Crypto
              </button>
            )}
            <button
              onClick={() => setTab("paypal")}
              className={`flex-1 rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                tab === "paypal"
                  ? "bg-white/10 text-neutral-100"
                  : "text-neutral-500 hover:text-neutral-300"
              }`}
            >
              PayPal
            </button>
          </div>

          {/* Crypto tab */}
          {tab === "crypto" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-neutral-500">
                Scan the QR code or copy the wallet address. Please send only
                on the specified network.
              </p>
              <div className="grid gap-4 sm:grid-cols-2">
                {BTC_ADDRESS && (
                  <WalletCard
                    name="Bitcoin"
                    network="Bitcoin (BTC)"
                    address={BTC_ADDRESS}
                    uri={`bitcoin:${BTC_ADDRESS}`}
                    color="text-[#F7931A]"
                    icon={
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 text-[#F7931A]"
                        fill="currentColor"
                      >
                        <path d="M23.638 14.904c-1.602 6.43-8.113 10.34-14.542 8.736C2.67 22.05-1.244 15.525.362 9.105 1.962 2.67 8.475-1.243 14.9.358c6.43 1.605 10.342 8.115 8.738 14.546zm-6.35-4.613c.24-1.59-.974-2.45-2.64-3.03l.54-2.153-1.315-.33-.52 2.107c-.345-.087-.7-.168-1.05-.25l.526-2.127-1.32-.33-.54 2.165c-.285-.067-.565-.13-.84-.2l-1.815-.45-.35 1.407s.975.225.955.236c.535.136.63.486.615.766l-1.477 5.92c-.075.166-.24.406-.614.314.015.02-.96-.24-.96-.24l-.66 1.51 1.71.426.93.242-.54 2.19 1.32.327.54-2.17c.36.1.705.19 1.05.273l-.51 2.154 1.32.33.545-2.19c2.24.427 3.93.257 4.64-1.774.57-1.637-.03-2.58-1.217-3.196.854-.193 1.5-.74 1.68-1.93zm-3.01 4.22c-.404 1.64-3.157.75-4.05.53l.72-2.9c.896.23 3.757.67 3.33 2.37zm.41-4.24c-.37 1.49-2.662.735-3.405.55l.654-2.64c.744.18 3.137.52 2.75 2.084z" />
                      </svg>
                    }
                  />
                )}
                {ETH_ADDRESS && (
                  <WalletCard
                    name="Ethereum"
                    network="Ethereum (ERC-20)"
                    address={ETH_ADDRESS}
                    uri={`ethereum:${ETH_ADDRESS}`}
                    color="text-[#627EEA]"
                    icon={
                      <svg
                        viewBox="0 0 24 24"
                        className="h-5 w-5 text-[#627EEA]"
                        fill="currentColor"
                      >
                        <path d="M11.944 17.97L4.58 13.62 11.943 24l7.37-10.38-7.372 4.35h.003zM12.056 0L4.69 12.223l7.365 4.354 7.365-4.35L12.056 0z" />
                      </svg>
                    }
                  />
                )}
              </div>
            </div>
          )}

          {/* PayPal tab */}
          {tab === "paypal" && (
            <div className="space-y-4">
              <p className="text-center text-sm text-neutral-500">
                You&apos;ll be redirected to PayPal to complete the donation.
              </p>
              <Button
                onClick={() => window.open(PAYPAL_DONATE_URL, "_blank")}
                className="w-full bg-[#0070BA] text-white hover:bg-[#005C99]"
              >
                <svg
                  viewBox="0 0 24 24"
                  className="mr-2 h-4 w-4"
                  fill="currentColor"
                >
                  <path d="M7.076 21.337H2.47a.641.641 0 0 1-.633-.74L4.944.901C5.026.382 5.474 0 5.998 0h7.46c2.57 0 4.578.543 5.69 1.81 1.01 1.15 1.304 2.42 1.012 4.287-.023.143-.047.288-.077.437-.983 5.05-4.349 6.797-8.647 6.797h-2.19c-.524 0-.968.382-1.05.9l-1.12 7.106zm14.146-14.42a3.35 3.35 0 0 0-.607-.541c1.145 4.876-2.274 8.005-7.268 8.005H11.43l-1.617 10.243h3.32c.46 0 .85-.334.923-.788l.038-.194.73-4.627.047-.256a.933.933 0 0 1 .923-.788h.582c3.768 0 6.715-1.53 7.577-5.957.36-1.848.174-3.39-.73-4.097z" />
                </svg>
                Donate with PayPal
              </Button>
            </div>
          )}

          <p className="text-center text-xs text-neutral-600">
            Any amount helps. Thank you for your support.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
