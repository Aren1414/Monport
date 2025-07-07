"use client";

import * as Select from "@radix-ui/react-select";
import Image from "next/image";
import { utils as ethersUtils } from "ethers";
import { TOKENS } from "@/lib/constants";

type Props = {
  value: string;
  onChange: (val: string) => void;
  balances: Record<string, string>;
  tokenLogos: Record<string, string>;
};

export default function TokenSelect({ value, onChange, balances, tokenLogos }: Props) {
  const normalizedValue = ethersUtils.getAddress(value);
  const symbol = Object.entries(TOKENS).find(([, addr]) => ethersUtils.getAddress(addr) === normalizedValue)?.[0];
  const logo = tokenLogos[normalizedValue];

  return (
    <Select.Root value={normalizedValue} onValueChange={onChange}>
      <Select.Trigger
        style={{
          flex: 1,
          minWidth: 0,
          padding: 8,
          borderRadius: 8,
          border: "1px solid #ccc",
          background: "#fff",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          position: "relative",
          overflow: "visible"
        }}
      >
        <Select.Value asChild>
          <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
            {logo ? (
              <Image
                src={logo}
                alt={symbol || "token"}
                width={16}
                height={16}
                style={{ borderRadius: "50%" }}
                onError={(e) => (e.currentTarget.src = "/logos/default.png")}
              />
            ) : (
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: "50%",
                  background: "#eee",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "#999"
                }}
              >
                ?
              </div>
            )}
            <span>{symbol}</span>
          </div>
        </Select.Value>
        <Select.Icon>▼</Select.Icon>
      </Select.Trigger>

      <Select.Portal>
        <Select.Content
          position="popper"
          sideOffset={4}
          style={{
            width: "240px",
            background: "#fff",
            border: "1px solid #ccc",
            borderRadius: 8,
            padding: 4,
            zIndex: 9999,
            boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
            maxHeight: "var(--radix-select-content-available-height)",
            overflowY: "auto"
          }}
        >
          <Select.Viewport>
            {Object.entries(TOKENS).map(([symbol, addr]) => {
              const normalized = ethersUtils.getAddress(addr);
              const logo = tokenLogos[normalized];
              const balance = parseFloat(balances[normalized] || "0").toFixed(3);

              return (
                <Select.Item
                  key={normalized}
                  value={normalized}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    padding: 6,
                    borderRadius: 6,
                    cursor: "pointer"
                  }}
                >
                  {logo ? (
                    <Image
                      src={logo}
                      alt={symbol}
                      width={20}
                      height={20}
                      style={{ marginRight: 8, borderRadius: "50%" }}
                      onError={(e) => (e.currentTarget.src = "/logos/default.png")}
                    />
                  ) : (
                    <div
                      style={{
                        width: 20,
                        height: 20,
                        marginRight: 8,
                        borderRadius: "50%",
                        background: "#eee",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        fontSize: 12,
                        color: "#999"
                      }}
                    >
                      ?
                    </div>
                  )}
                  <span style={{ fontSize: 14 }}>{symbol}</span>
                  <span style={{ marginLeft: "auto", fontSize: 12, color: "#888" }}>
                    {balance}
                  </span>
                </Select.Item>
              );
            })}
          </Select.Viewport>
        </Select.Content>
      </Select.Portal>
    </Select.Root>
  );
 }
