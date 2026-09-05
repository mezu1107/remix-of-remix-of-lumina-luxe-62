import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export const Route = createFileRoute("/admin/payments")({ component: PaymentsAdmin });

type Row = Record<string, any>;

function PaymentsAdmin() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin", "payment_settings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("payment_settings" as any)
        .select("*")
        .order("created_at", { ascending: true })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return (data ?? null) as Row | null;
    },
  });

  const [f, setF] = useState<Row>({});
  useEffect(() => { if (data) setF(data); }, [data]);

  const set = (k: string, v: any) => setF((p) => ({ ...p, [k]: v }));

  const save = useMutation({
    mutationFn: async () => {
      const payload = {
        currency: f.currency || "PKR",
        currency_symbol: f.currency_symbol || "Rs",
        cod_enabled: !!f.cod_enabled,
        cod_charge: Number(f.cod_charge || 0),
        delivery_charge: Number(f.delivery_charge || 0),
        free_delivery_above: Number(f.free_delivery_above || 0),
        easypaisa_enabled: !!f.easypaisa_enabled,
        easypaisa_number: f.easypaisa_number || null,
        easypaisa_account_name: f.easypaisa_account_name || null,
        jazzcash_enabled: !!f.jazzcash_enabled,
        jazzcash_number: f.jazzcash_number || null,
        jazzcash_account_name: f.jazzcash_account_name || null,
        bank_enabled: !!f.bank_enabled,
        bank_name: f.bank_name || null,
        bank_account_title: f.bank_account_title || null,
        bank_account_number: f.bank_account_number || null,
        bank_iban: f.bank_iban || null,
        warranty_months: Number(f.warranty_months || 12),
        warranty_note: f.warranty_note || "",
        payment_note: f.payment_note || null,
      };
      if (f.id) {
        const { error } = await supabase.from("payment_settings" as any).update(payload).eq("id", f.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from("payment_settings" as any).insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      toast.success("Payment settings saved. Changes are live on the storefront.");
      qc.invalidateQueries({ queryKey: ["admin", "payment_settings"] });
      qc.invalidateQueries({ queryKey: ["payment_settings"] });
    },
    onError: (e: any) => toast.error(e?.message ?? "Could not save."),
  });

  if (isLoading) return <div className="text-muted-foreground">Loading settings…</div>;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-serif text-3xl sm:text-4xl">Payments & Delivery</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Turn payment methods on or off, set delivery charges and warranty — every change goes live on the storefront and checkout immediately.
        </p>
      </div>

      <Card title="Delivery (Pakistan)">
        <Row2>
          <Field label="Delivery charge (Rs)"><Input type="number" value={f.delivery_charge ?? ""} onChange={(e) => set("delivery_charge", e.target.value)} /></Field>
          <Field label="Free delivery above (Rs)" help="Order total ≥ this amount ships free."><Input type="number" value={f.free_delivery_above ?? ""} onChange={(e) => set("free_delivery_above", e.target.value)} /></Field>
        </Row2>
      </Card>

      <Card title="Cash on Delivery (COD)">
        <Toggle checked={!!f.cod_enabled} onChange={(v) => set("cod_enabled", v)} label="Accept Cash on Delivery" />
        <Field label="Extra COD charge (Rs)" help="Optional handling fee on COD orders."><Input type="number" value={f.cod_charge ?? ""} onChange={(e) => set("cod_charge", e.target.value)} /></Field>
      </Card>

      <Card title="Easypaisa">
        <Toggle checked={!!f.easypaisa_enabled} onChange={(v) => set("easypaisa_enabled", v)} label="Accept Easypaisa transfers" />
        <Row2>
          <Field label="Easypaisa number"><Input value={f.easypaisa_number ?? ""} onChange={(e) => set("easypaisa_number", e.target.value)} placeholder="03XX-XXXXXXX" /></Field>
          <Field label="Account title"><Input value={f.easypaisa_account_name ?? ""} onChange={(e) => set("easypaisa_account_name", e.target.value)} /></Field>
        </Row2>
      </Card>

      <Card title="JazzCash">
        <Toggle checked={!!f.jazzcash_enabled} onChange={(v) => set("jazzcash_enabled", v)} label="Accept JazzCash transfers" />
        <Row2>
          <Field label="JazzCash number"><Input value={f.jazzcash_number ?? ""} onChange={(e) => set("jazzcash_number", e.target.value)} placeholder="03XX-XXXXXXX" /></Field>
          <Field label="Account title"><Input value={f.jazzcash_account_name ?? ""} onChange={(e) => set("jazzcash_account_name", e.target.value)} /></Field>
        </Row2>
      </Card>

      <Card title="Bank Transfer">
        <Toggle checked={!!f.bank_enabled} onChange={(v) => set("bank_enabled", v)} label="Accept Bank transfers" />
        <Row2>
          <Field label="Bank name"><Input value={f.bank_name ?? ""} onChange={(e) => set("bank_name", e.target.value)} /></Field>
          <Field label="Account title"><Input value={f.bank_account_title ?? ""} onChange={(e) => set("bank_account_title", e.target.value)} /></Field>
          <Field label="Account number"><Input value={f.bank_account_number ?? ""} onChange={(e) => set("bank_account_number", e.target.value)} /></Field>
          <Field label="IBAN"><Input value={f.bank_iban ?? ""} onChange={(e) => set("bank_iban", e.target.value)} /></Field>
        </Row2>
      </Card>

      <Card title="Warranty & notes">
        <Row2>
          <Field label="Warranty (months)"><Input type="number" value={f.warranty_months ?? 12} onChange={(e) => set("warranty_months", e.target.value)} /></Field>
          <Field label="Currency symbol"><Input value={f.currency_symbol ?? "Rs"} onChange={(e) => set("currency_symbol", e.target.value)} /></Field>
        </Row2>
        <Field label="Warranty note (shown on product & checkout)">
          <Textarea rows={2} value={f.warranty_note ?? ""} onChange={(e) => set("warranty_note", e.target.value)} />
        </Field>
        <Field label="Checkout payment note (shown after order)">
          <Textarea rows={2} value={f.payment_note ?? ""} onChange={(e) => set("payment_note", e.target.value)} />
        </Field>
      </Card>

      <div className="flex justify-end">
        <Button size="lg" disabled={save.isPending} onClick={() => save.mutate()}>
          {save.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Save changes
        </Button>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border bg-card p-4 sm:p-6">
      <h2 className="font-serif text-xl">{title}</h2>
      <div className="mt-4 space-y-4">{children}</div>
    </div>
  );
}
function Row2({ children }: { children: React.ReactNode }) {
  return <div className="grid gap-4 sm:grid-cols-2">{children}</div>;
}
function Field({ label, help, children }: { label: string; help?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs uppercase tracking-widest text-muted-foreground">{label}</Label>
      {children}
      {help && <p className="text-xs text-muted-foreground">{help}</p>}
    </div>
  );
}
function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between gap-3 rounded-md border border-border/60 p-3">
      <span className="text-sm">{label}</span>
      <Switch checked={checked} onCheckedChange={onChange} />
    </label>
  );
}
