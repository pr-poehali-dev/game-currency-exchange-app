import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "home" | "wallet" | "withdraw" | "history";
type WithdrawMethod = "card" | "qiwi" | "yoomoney" | "sbp" | "crypto" | "bank";
type WithdrawStatus = "pending" | "processing" | "done" | "rejected";

interface WithdrawRequest {
  id: number;
  method: WithdrawMethod;
  methodLabel: string;
  amountGp: number;
  amountRub: number;
  status: WithdrawStatus;
  date: string;
  requisite: string;
}

interface Transaction {
  id: number;
  type: "in" | "out";
  amount: number;
  desc: string;
  date: string;
}

const TRANSACTIONS: Transaction[] = [
  { id: 1, type: "in", amount: 1500, desc: "Продажа предметов", date: "18 мар" },
  { id: 2, type: "out", amount: 800, desc: "Вывод на карту", date: "17 мар" },
  { id: 3, type: "in", amount: 3200, desc: "Турнир — призовые", date: "15 мар" },
  { id: 4, type: "out", amount: 1200, desc: "Вывод в ЮMoney", date: "12 мар" },
  { id: 5, type: "in", amount: 600, desc: "Продажа скина", date: "10 мар" },
];

const INITIAL_HISTORY: WithdrawRequest[] = [
  { id: 1, method: "card", methodLabel: "Банковская карта", amountGp: 2000, amountRub: 1700, status: "done", date: "17 мар, 14:32", requisite: "**** 4231" },
  { id: 2, method: "sbp", methodLabel: "СБП", amountGp: 1500, amountRub: 1275, status: "processing", date: "18 мар, 09:15", requisite: "+7 900 ***-**-12" },
  { id: 3, method: "crypto", methodLabel: "Криптовалюта", amountGp: 5000, amountRub: 4250, status: "pending", date: "18 мар, 11:40", requisite: "TRC-20 · T***...abc" },
  { id: 4, method: "yoomoney", methodLabel: "ЮMoney", amountGp: 800, amountRub: 680, status: "rejected", date: "12 мар, 18:05", requisite: "41001***XXX" },
];

const STATUS_CONFIG: Record<WithdrawStatus, { label: string; color: string; bg: string; icon: string }> = {
  pending:    { label: "Ожидает",    color: "text-amber-600",  bg: "bg-amber-50 border-amber-100",  icon: "Clock" },
  processing: { label: "В обработке", color: "text-blue-600", bg: "bg-blue-50 border-blue-100",    icon: "Loader" },
  done:       { label: "Выполнен",   color: "text-green-600", bg: "bg-green-50 border-green-100",  icon: "CheckCircle" },
  rejected:   { label: "Отклонён",  color: "text-red-500",   bg: "bg-red-50 border-red-100",      icon: "XCircle" },
};

const WITHDRAW_METHODS = [
  { id: "card" as WithdrawMethod, label: "Банковская карта", icon: "CreditCard", fee: "2%", time: "1–3 дня" },
  { id: "sbp" as WithdrawMethod, label: "СБП / По номеру", icon: "Smartphone", fee: "1%", time: "моментально" },
  { id: "yoomoney" as WithdrawMethod, label: "ЮMoney", icon: "Wallet", fee: "1.5%", time: "до 1 часа" },
  { id: "qiwi" as WithdrawMethod, label: "QIWI Кошелёк", icon: "CircleDollarSign", fee: "1.5%", time: "до 1 часа" },
  { id: "crypto" as WithdrawMethod, label: "Криптовалюта", icon: "Bitcoin", fee: "0.5%", time: "до 30 мин" },
  { id: "bank" as WithdrawMethod, label: "Банковский перевод", icon: "Building2", fee: "0%", time: "3–5 дней" },
];

interface RequisiteFields {
  // card
  cardNumber?: string;
  cardHolder?: string;
  // sbp
  sbpPhone?: string;
  sbpBank?: string;
  // yoomoney / qiwi
  walletNumber?: string;
  // crypto
  cryptoAddress?: string;
  cryptoNetwork?: string;
  // bank
  bankBik?: string;
  bankAccount?: string;
  bankFio?: string;
}

const BANKS = ["Сбербанк", "Тинькофф", "ВТБ", "Альфа-Банк", "Газпромбанк", "Россельхозбанк", "Открытие", "Другой"];
const CRYPTO_NETWORKS = ["TRC-20 (USDT)", "ERC-20 (USDT)", "BEP-20 (USDT)", "Bitcoin (BTC)", "Ethereum (ETH)", "TON"];

// --- Validators ---
const validators: Record<string, (v: string) => string | null> = {
  cardNumber: (v) => {
    const digits = v.replace(/\s/g, "");
    if (!digits) return "Введите номер карты";
    if (!/^\d{16}$/.test(digits)) return "Номер карты — 16 цифр";
    return null;
  },
  cardHolder: (v) => {
    if (!v.trim()) return "Введите имя держателя";
    if (!/^[A-Za-z\s]+$/.test(v)) return "Только латинские буквы";
    if (v.trim().split(/\s+/).length < 2) return "Укажите имя и фамилию";
    return null;
  },
  sbpPhone: (v) => {
    const digits = v.replace(/\D/g, "");
    if (!digits) return "Введите номер телефона";
    if (digits.length !== 11 || !digits.startsWith("7")) return "Формат: +7 9XX XXX-XX-XX";
    return null;
  },
  sbpBank: (v) => (!v ? "Выберите банк" : null),
  walletNumber: (v) => (!v.trim() ? "Введите номер кошелька" : null),
  cryptoNetwork: (v) => (!v ? "Выберите сеть" : null),
  cryptoAddress: (v) => {
    if (!v.trim()) return "Введите адрес кошелька";
    if (v.trim().length < 20) return "Адрес слишком короткий";
    return null;
  },
  bankFio: (v) => {
    if (!v.trim()) return "Введите ФИО";
    if (v.trim().split(/\s+/).length < 2) return "Укажите имя и фамилию";
    return null;
  },
  bankBik: (v) => {
    if (!v.trim()) return "Введите БИК";
    if (!/^\d{9}$/.test(v.trim())) return "БИК — 9 цифр";
    return null;
  },
  bankAccount: (v) => {
    if (!v.trim()) return "Введите расчётный счёт";
    if (!/^\d{20}$/.test(v.trim())) return "Расчётный счёт — 20 цифр";
    return null;
  },
  amount: (v) => {
    if (!v || parseFloat(v) <= 0) return "Введите сумму вывода";
    if (parseFloat(v) < 100) return "Минимум 100 GP";
    return null;
  },
};

function validate(method: WithdrawMethod, amount: string, req: RequisiteFields): Record<string, string> {
  const errors: Record<string, string> = {};
  const check = (key: string, val: string) => {
    const err = validators[key]?.(val);
    if (err) errors[key] = err;
  };
  check("amount", amount);
  if (method === "card") { check("cardNumber", req.cardNumber ?? ""); check("cardHolder", req.cardHolder ?? ""); }
  if (method === "sbp") { check("sbpPhone", req.sbpPhone ?? ""); check("sbpBank", req.sbpBank ?? ""); }
  if (method === "yoomoney" || method === "qiwi") { check("walletNumber", req.walletNumber ?? ""); }
  if (method === "crypto") { check("cryptoNetwork", req.cryptoNetwork ?? ""); check("cryptoAddress", req.cryptoAddress ?? ""); }
  if (method === "bank") { check("bankFio", req.bankFio ?? ""); check("bankBik", req.bankBik ?? ""); check("bankAccount", req.bankAccount ?? ""); }
  return errors;
}

function formatCardNumber(v: string) {
  return v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();
}
function formatPhone(v: string) {
  const d = v.replace(/\D/g, "").slice(0, 11);
  if (d.length <= 1) return d ? "+7" : "";
  const n = d.startsWith("7") ? d : "7" + d;
  return "+7" + (n[1] ? " " + n.slice(1, 4) : "") + (n[4] ? " " + n.slice(4, 7) : "") + (n[7] ? "-" + n.slice(7, 9) : "") + (n[9] ? "-" + n.slice(9, 11) : "");
}

function FieldInput({ label, value, onChange, placeholder, type = "text", error }: {
  label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string; error?: string;
}) {
  return (
    <div>
      <label className="text-xs text-[var(--c-muted)] uppercase tracking-wider mb-1.5 block">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={`w-full bg-[var(--c-surface)] border rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors text-[var(--c-text)] placeholder:text-[var(--c-muted)] ${
          error ? "border-red-400 focus:border-red-400" : "border-[var(--c-border)] focus:border-[var(--c-accent)]"
        }`}
      />
      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}

function FieldSelect({ label, value, onChange, options, error }: {
  label: string; value: string; onChange: (v: string) => void; options: string[]; error?: string;
}) {
  return (
    <div>
      <label className="text-xs text-[var(--c-muted)] uppercase tracking-wider mb-1.5 block">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={`w-full bg-[var(--c-surface)] border rounded-xl px-4 py-3 text-sm font-medium outline-none transition-colors text-[var(--c-text)] appearance-none cursor-pointer ${
          error ? "border-red-400" : "border-[var(--c-border)] focus:border-[var(--c-accent)]"
        }`}
      >
        <option value="">Выберите...</option>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      {error && <p className="text-xs text-red-500 mt-1 ml-1">{error}</p>}
    </div>
  );
}

export default function Index() {
  const [tab, setTab] = useState<Tab>("home");
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [gameBalance] = useState(12_450);
  const [realBalance] = useState(3_820);
  const [req, setReq] = useState<RequisiteFields>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitted, setSubmitted] = useState(false);
  const [history, setHistory] = useState<WithdrawRequest[]>(INITIAL_HISTORY);
  const [filterStatus, setFilterStatus] = useState<WithdrawStatus | "all">("all");

  const setField = (key: keyof RequisiteFields) => (val: string) => {
    setReq((prev) => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors((prev) => { const e = { ...prev }; delete e[key]; return e; });
  };

  const getRequisiteLabel = (method: WithdrawMethod, r: RequisiteFields): string => {
    if (method === "card") return r.cardNumber ? `**** ${r.cardNumber.replace(/\s/g, "").slice(-4)}` : "";
    if (method === "sbp") return r.sbpPhone ? r.sbpPhone.slice(0, 6) + "***" + r.sbpPhone.slice(-2) : "";
    if (method === "yoomoney" || method === "qiwi") return r.walletNumber ? r.walletNumber.slice(0, 5) + "***" : "";
    if (method === "crypto") return r.cryptoNetwork ? `${r.cryptoNetwork.split(" ")[0]} · ${r.cryptoAddress?.slice(0, 4)}...` : "";
    if (method === "bank") return r.bankFio ?? "";
    return "";
  };

  const handleSubmit = () => {
    if (!selectedMethod) return;
    const errs = validate(selectedMethod, amount, req);
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }
    setErrors({});
    const methodData = WITHDRAW_METHODS.find(m => m.id === selectedMethod)!;
    const newEntry: WithdrawRequest = {
      id: Date.now(),
      method: selectedMethod,
      methodLabel: methodData.label,
      amountGp: parseFloat(amount),
      amountRub: Math.floor(parseFloat(amount) * rate),
      status: "pending",
      date: new Date().toLocaleString("ru", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }),
      requisite: getRequisiteLabel(selectedMethod, req),
    };
    setHistory((prev) => [newEntry, ...prev]);
    setSubmitted(true);
  };

  const rate = 0.85;
  const convertedAmount = amount ? Math.floor(parseFloat(amount) * rate) : 0;

  return (
    <div className="min-h-screen bg-[var(--c-bg)] font-golos text-[var(--c-text)]">
      {/* Header */}
      <header className="border-b border-[var(--c-border)] px-6 py-4 flex items-center justify-between max-w-2xl mx-auto">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-full bg-[var(--c-accent)] flex items-center justify-center">
            <Icon name="Zap" size={14} className="text-white" />
          </div>
          <span className="font-semibold text-sm tracking-wide">GamePay</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-full bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center">
            <Icon name="Bell" size={15} className="text-[var(--c-muted)]" />
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center">
            <Icon name="User" size={15} className="text-[var(--c-muted)]" />
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-2xl mx-auto px-6 pb-28">

        {/* HOME TAB */}
        {tab === "home" && (
          <div className="animate-fade-in">
            {/* Balance Card */}
            <div className="mt-8 rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-8">
              <p className="text-xs uppercase tracking-widest text-[var(--c-muted)] mb-3">Игровой баланс</p>
              <div className="flex items-end gap-3">
                <span className="text-5xl font-bold leading-none tracking-tight">
                  {gameBalance.toLocaleString("ru")}
                </span>
                <span className="text-xl text-[var(--c-muted)] mb-1">GP</span>
              </div>
              <div className="mt-4 pt-4 border-t border-[var(--c-border)] flex items-center gap-2">
                <Icon name="TrendingUp" size={14} className="text-[var(--c-accent)]" />
                <span className="text-sm text-[var(--c-muted)]">
                  ≈ {Math.floor(gameBalance * rate).toLocaleString("ru")} ₽ · курс 1 GP = {rate} ₽
                </span>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="mt-4 grid grid-cols-2 gap-3">
              <button
                onClick={() => setTab("withdraw")}
                className="rounded-xl bg-[var(--c-accent)] text-white px-5 py-4 flex items-center gap-3 hover:opacity-90 transition-opacity"
              >
                <Icon name="ArrowUpRight" size={20} />
                <div className="text-left">
                  <p className="font-semibold text-sm">Вывести</p>
                  <p className="text-xs opacity-70">На карту, кошелёк</p>
                </div>
              </button>
              <button
                onClick={() => setTab("wallet")}
                className="rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] px-5 py-4 flex items-center gap-3 hover:bg-[var(--c-card)] transition-colors"
              >
                <Icon name="LayoutGrid" size={20} className="text-[var(--c-accent)]" />
                <div className="text-left">
                  <p className="font-semibold text-sm">Управление</p>
                  <p className="text-xs text-[var(--c-muted)]">Баланс и валюта</p>
                </div>
              </button>
            </div>

            {/* Real Balance Mini Card */}
            <div className="mt-3 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-[var(--c-muted)] uppercase tracking-widest mb-1">Рублёвый счёт</p>
                <p className="font-semibold text-lg">{realBalance.toLocaleString("ru")} ₽</p>
              </div>
              <button className="text-xs text-[var(--c-accent)] font-medium border border-[var(--c-accent)] rounded-lg px-3 py-2 hover:bg-[var(--c-accent)] hover:text-white transition-colors">
                Пополнить
              </button>
            </div>

            {/* Recent Transactions */}
            <div className="mt-8">
              <h2 className="text-xs uppercase tracking-widest text-[var(--c-muted)] mb-4">Последние операции</h2>
              <div className="space-y-2">
                {TRANSACTIONS.map((t) => (
                  <div
                    key={t.id}
                    className="flex items-center justify-between rounded-xl px-4 py-3.5 bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-[var(--c-accent-dim)] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        t.type === "in" ? "bg-green-50" : "bg-red-50"
                      }`}>
                        <Icon
                          name={t.type === "in" ? "ArrowDownLeft" : "ArrowUpRight"}
                          size={14}
                          className={t.type === "in" ? "text-green-600" : "text-red-500"}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-medium leading-tight">{t.desc}</p>
                        <p className="text-xs text-[var(--c-muted)] mt-0.5">{t.date}</p>
                      </div>
                    </div>
                    <span className={`text-sm font-semibold ${t.type === "in" ? "text-green-600" : "text-[var(--c-text)]"}`}>
                      {t.type === "in" ? "+" : "−"}{t.amount.toLocaleString("ru")} GP
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* WALLET TAB */}
        {tab === "wallet" && (
          <div className="animate-fade-in">
            <div className="mt-8 mb-6">
              <h1 className="text-2xl font-bold">Управление балансом</h1>
              <p className="text-sm text-[var(--c-muted)] mt-1">Игровая валюта и рублёвый счёт</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              <div className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-5">
                <div className="w-9 h-9 rounded-xl bg-[var(--c-accent)] flex items-center justify-center mb-4" style={{ opacity: 0.12 }}>
                  <Icon name="Zap" size={18} className="text-[var(--c-accent)]" style={{ opacity: 1 }} />
                </div>
                <p className="text-xs text-[var(--c-muted)] uppercase tracking-wider mb-1">GamePoints</p>
                <p className="text-2xl font-bold">{gameBalance.toLocaleString("ru")}</p>
                <p className="text-xs text-[var(--c-muted)] mt-1">GP</p>
              </div>
              <div className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-5">
                <div className="w-9 h-9 rounded-xl bg-green-50 flex items-center justify-center mb-4">
                  <Icon name="Banknote" size={18} className="text-green-600" />
                </div>
                <p className="text-xs text-[var(--c-muted)] uppercase tracking-wider mb-1">Рублей</p>
                <p className="text-2xl font-bold">{realBalance.toLocaleString("ru")}</p>
                <p className="text-xs text-[var(--c-muted)] mt-1">₽</p>
              </div>
            </div>

            {/* Converter */}
            <div className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-6">
              <h3 className="font-semibold mb-4">Конвертер валюты</h3>
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-[var(--c-muted)] uppercase tracking-wider mb-2 block">Игровая валюта (GP)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0"
                    className="w-full bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl px-4 py-3 text-lg font-semibold outline-none focus:border-[var(--c-accent)] transition-colors text-[var(--c-text)]"
                  />
                </div>
                <div className="flex items-center justify-center py-1">
                  <div className="w-8 h-8 rounded-full bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center">
                    <Icon name="ArrowUpDown" size={14} className="text-[var(--c-muted)]" />
                  </div>
                </div>
                <div>
                  <label className="text-xs text-[var(--c-muted)] uppercase tracking-wider mb-2 block">Получите (₽)</label>
                  <div className="w-full bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl px-4 py-3 text-lg font-semibold text-[var(--c-muted)]">
                    {convertedAmount > 0 ? `≈ ${convertedAmount.toLocaleString("ru")} ₽` : "0 ₽"}
                  </div>
                </div>
              </div>
              <p className="text-xs text-[var(--c-muted)] mt-3 text-center">
                Курс: 1 GP = {rate} ₽ · комиссия зависит от метода вывода
              </p>
            </div>

            {/* Stats */}
            <div className="mt-4 grid grid-cols-3 gap-3">
              {[
                { label: "Выведено за месяц", value: "2 000 GP" },
                { label: "Операций всего", value: "24" },
                { label: "Экономия на комиссии", value: "140 ₽" },
              ].map((s) => (
                <div key={s.label} className="rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] p-4 text-center">
                  <p className="font-bold text-base">{s.value}</p>
                  <p className="text-xs text-[var(--c-muted)] mt-1 leading-tight">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* WITHDRAW TAB */}
        {tab === "withdraw" && (
          <div className="animate-fade-in">
            <div className="mt-8 mb-6">
              <h1 className="text-2xl font-bold">Вывод средств</h1>
              <p className="text-sm text-[var(--c-muted)] mt-1">Выберите удобный способ</p>
            </div>

            <div className="grid grid-cols-2 gap-3 mb-6">
              {WITHDRAW_METHODS.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedMethod(m.id)}
                  className={`rounded-xl border p-4 text-left transition-all ${
                    selectedMethod === m.id
                      ? "border-[var(--c-accent)] bg-[var(--c-accent-bg)]"
                      : "border-[var(--c-border)] bg-[var(--c-surface)] hover:border-[var(--c-accent-dim)]"
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 transition-colors ${
                    selectedMethod === m.id ? "bg-[var(--c-accent)]" : "bg-[var(--c-card)] border border-[var(--c-border)]"
                  }`}>
                    <Icon
                      name={m.icon}
                      size={18}
                      className={selectedMethod === m.id ? "text-white" : "text-[var(--c-muted)]"}
                    />
                  </div>
                  <p className="font-medium text-sm leading-tight text-[var(--c-text)]">{m.label}</p>
                  <div className="mt-2 flex gap-2 flex-wrap">
                    <span className="text-xs text-[var(--c-muted)] bg-[var(--c-bg)] border border-[var(--c-border)] rounded px-1.5 py-0.5">{m.fee}</span>
                    <span className="text-xs text-[var(--c-muted)]">{m.time}</span>
                  </div>
                </button>
              ))}
            </div>

            {selectedMethod && !submitted && (
              <div className="animate-fade-in space-y-3 mb-4">
                {/* Amount */}
                <div className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-6">
                  <h3 className="font-semibold mb-4">Сумма вывода</h3>
                  <label className="text-xs text-[var(--c-muted)] uppercase tracking-wider mb-1.5 block">Игровая валюта (GP)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => { setAmount(e.target.value); if (errors.amount) setErrors((p) => { const e = {...p}; delete e.amount; return e; }); }}
                    placeholder="Введите сумму"
                    className={`w-full bg-[var(--c-surface)] border rounded-xl px-4 py-3 text-lg font-semibold outline-none transition-colors text-[var(--c-text)] ${
                      errors.amount ? "border-red-400" : "border-[var(--c-border)] focus:border-[var(--c-accent)]"
                    }`}
                  />
                  {errors.amount && <p className="text-xs text-red-500 mt-1 ml-1">{errors.amount}</p>}
                  <div className="flex gap-2 mt-2">
                    {[1000, 2000, 5000].map((v) => (
                      <button
                        key={v}
                        onClick={() => { setAmount(String(v)); setErrors((p) => { const e = {...p}; delete e.amount; return e; }); }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-[var(--c-accent)] transition-colors text-[var(--c-text)]"
                      >
                        {v.toLocaleString("ru")} GP
                      </button>
                    ))}
                  </div>
                </div>

                {/* Requisites */}
                <div className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-6">
                  <h3 className="font-semibold mb-4">Реквизиты</h3>
                  <div className="space-y-3">
                    {selectedMethod === "card" && (
                      <>
                        <FieldInput
                          label="Номер карты"
                          value={req.cardNumber ?? ""}
                          onChange={(v) => setField("cardNumber")(formatCardNumber(v))}
                          placeholder="0000 0000 0000 0000"
                          error={errors.cardNumber}
                        />
                        <FieldInput
                          label="Имя держателя (латиницей)"
                          value={req.cardHolder ?? ""}
                          onChange={(v) => setField("cardHolder")(v.toUpperCase())}
                          placeholder="IVAN IVANOV"
                          error={errors.cardHolder}
                        />
                      </>
                    )}

                    {selectedMethod === "sbp" && (
                      <>
                        <FieldInput
                          label="Номер телефона"
                          value={req.sbpPhone ?? ""}
                          onChange={(v) => setField("sbpPhone")(formatPhone(v))}
                          placeholder="+7 900 000-00-00"
                          type="tel"
                          error={errors.sbpPhone}
                        />
                        <FieldSelect
                          label="Банк получателя"
                          value={req.sbpBank ?? ""}
                          onChange={setField("sbpBank")}
                          options={BANKS}
                          error={errors.sbpBank}
                        />
                      </>
                    )}

                    {(selectedMethod === "yoomoney" || selectedMethod === "qiwi") && (
                      <FieldInput
                        label={selectedMethod === "yoomoney" ? "Номер кошелька ЮMoney" : "Номер кошелька QIWI"}
                        value={req.walletNumber ?? ""}
                        onChange={setField("walletNumber")}
                        placeholder={selectedMethod === "yoomoney" ? "41001XXXXXXXXX" : "+7 900 000-00-00"}
                        error={errors.walletNumber}
                      />
                    )}

                    {selectedMethod === "crypto" && (
                      <>
                        <FieldSelect
                          label="Сеть и монета"
                          value={req.cryptoNetwork ?? ""}
                          onChange={setField("cryptoNetwork")}
                          options={CRYPTO_NETWORKS}
                          error={errors.cryptoNetwork}
                        />
                        <FieldInput
                          label="Адрес кошелька"
                          value={req.cryptoAddress ?? ""}
                          onChange={setField("cryptoAddress")}
                          placeholder="T... / 0x... / bc1..."
                          error={errors.cryptoAddress}
                        />
                        <p className="text-xs text-[var(--c-muted)] bg-amber-50 border border-amber-100 rounded-xl px-3 py-2.5">
                          ⚠️ Проверьте адрес и сеть — ошибочные переводы невозможно вернуть
                        </p>
                      </>
                    )}

                    {selectedMethod === "bank" && (
                      <>
                        <FieldInput
                          label="ФИО получателя"
                          value={req.bankFio ?? ""}
                          onChange={setField("bankFio")}
                          placeholder="Иванов Иван Иванович"
                          error={errors.bankFio}
                        />
                        <FieldInput
                          label="БИК банка"
                          value={req.bankBik ?? ""}
                          onChange={setField("bankBik")}
                          placeholder="044525225"
                          error={errors.bankBik}
                        />
                        <FieldInput
                          label="Расчётный счёт"
                          value={req.bankAccount ?? ""}
                          onChange={setField("bankAccount")}
                          placeholder="40817810099910001111"
                          error={errors.bankAccount}
                        />
                      </>
                    )}
                  </div>
                </div>

                {/* Summary */}
                <div className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-6">
                  <div className="space-y-2 text-sm mb-4">
                    <div className="flex justify-between">
                      <span className="text-[var(--c-muted)]">Вы выводите</span>
                      <span className="font-medium">{amount || 0} GP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--c-muted)]">Курс</span>
                      <span className="font-medium">{rate} ₽ / GP</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-[var(--c-muted)]">Комиссия</span>
                      <span className="font-medium">{WITHDRAW_METHODS.find((m) => m.id === selectedMethod)?.fee}</span>
                    </div>
                    <div className="border-t border-[var(--c-border)] pt-2 flex justify-between font-semibold">
                      <span>Получите</span>
                      <span className="text-[var(--c-accent)]">≈ {convertedAmount.toLocaleString("ru")} ₽</span>
                    </div>
                  </div>
                  <button
                    onClick={handleSubmit}
                    className="w-full bg-[var(--c-accent)] text-white rounded-xl py-3.5 font-semibold hover:opacity-90 transition-opacity"
                  >
                    Подтвердить вывод
                  </button>
                </div>
              </div>
            )}

            {/* Success screen */}
            {submitted && (
              <div className="animate-fade-in rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-8 text-center mb-4">
                <div className="w-14 h-14 rounded-full bg-green-50 border border-green-100 flex items-center justify-center mx-auto mb-4">
                  <Icon name="Check" size={28} className="text-green-600" />
                </div>
                <h3 className="text-xl font-bold mb-2">Заявка отправлена</h3>
                <p className="text-sm text-[var(--c-muted)] mb-1">
                  Сумма: <span className="font-semibold text-[var(--c-text)]">{amount} GP → ≈ {convertedAmount.toLocaleString("ru")} ₽</span>
                </p>
                <p className="text-sm text-[var(--c-muted)] mb-6">
                  Способ: <span className="font-semibold text-[var(--c-text)]">{WITHDRAW_METHODS.find(m => m.id === selectedMethod)?.label}</span>
                </p>
                <div className="flex gap-3 justify-center">
                  <button
                    onClick={() => { setSubmitted(false); setSelectedMethod(null); setAmount(""); setReq({}); setErrors({}); }}
                    className="text-sm text-[var(--c-accent)] font-medium border border-[var(--c-accent)] rounded-xl px-5 py-2.5 hover:bg-[var(--c-accent)] hover:text-white transition-colors"
                  >
                    Новый вывод
                  </button>
                  <button
                    onClick={() => { setSubmitted(false); setSelectedMethod(null); setAmount(""); setReq({}); setErrors({}); setTab("history"); }}
                    className="text-sm font-medium bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl px-5 py-2.5 hover:border-[var(--c-accent)] transition-colors"
                  >
                    В историю
                  </button>
                </div>
              </div>
            )}

            {!selectedMethod && !submitted && (
              <div className="text-center py-8 text-sm text-[var(--c-muted)]">
                Выберите способ вывода выше
              </div>
            )}
          </div>
        )}

        {/* HISTORY TAB */}
        {tab === "history" && (
          <div className="animate-fade-in">
            <div className="mt-8 mb-5 flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold">История заявок</h1>
                <p className="text-sm text-[var(--c-muted)] mt-1">{history.length} операций</p>
              </div>
              <div className="text-xs text-[var(--c-accent)] font-medium border border-[var(--c-accent)] rounded-lg px-3 py-1.5">
                {history.filter(h => h.status === "pending" || h.status === "processing").length} активных
              </div>
            </div>

            {/* Filter pills */}
            <div className="flex gap-2 mb-5 overflow-x-auto pb-1">
              {(["all", "pending", "processing", "done", "rejected"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => setFilterStatus(s)}
                  className={`flex-shrink-0 text-xs px-3 py-1.5 rounded-full border transition-colors font-medium ${
                    filterStatus === s
                      ? "bg-[var(--c-accent)] text-white border-[var(--c-accent)]"
                      : "bg-[var(--c-surface)] text-[var(--c-muted)] border-[var(--c-border)]"
                  }`}
                >
                  {s === "all" ? "Все" : STATUS_CONFIG[s].label}
                </button>
              ))}
            </div>

            {/* List */}
            <div className="space-y-3">
              {history
                .filter(h => filterStatus === "all" || h.status === filterStatus)
                .map((item) => {
                  const st = STATUS_CONFIG[item.status];
                  const methodInfo = WITHDRAW_METHODS.find(m => m.id === item.method);
                  return (
                    <div key={item.id} className="rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-xl bg-[var(--c-surface)] border border-[var(--c-border)] flex items-center justify-center flex-shrink-0">
                            <Icon name={methodInfo?.icon ?? "Wallet"} size={18} className="text-[var(--c-muted)]" />
                          </div>
                          <div>
                            <p className="font-semibold text-sm">{item.methodLabel}</p>
                            <p className="text-xs text-[var(--c-muted)] mt-0.5">{item.requisite}</p>
                          </div>
                        </div>
                        <span className={`text-xs font-medium px-2.5 py-1 rounded-full border ${st.bg} ${st.color}`}>
                          {st.label}
                        </span>
                      </div>

                      <div className="flex items-end justify-between pt-3 border-t border-[var(--c-border)]">
                        <div>
                          <p className="text-xs text-[var(--c-muted)] mb-0.5">Выведено</p>
                          <p className="font-bold">{item.amountGp.toLocaleString("ru")} GP</p>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-[var(--c-muted)] mb-0.5">Получено</p>
                          <p className={`font-bold ${item.status === "done" ? "text-green-600" : "text-[var(--c-text)]"}`}>
                            {item.status === "rejected" ? "—" : `≈ ${item.amountRub.toLocaleString("ru")} ₽`}
                          </p>
                        </div>
                      </div>

                      <p className="text-xs text-[var(--c-muted)] mt-2">{item.date}</p>
                    </div>
                  );
                })}

              {history.filter(h => filterStatus === "all" || h.status === filterStatus).length === 0 && (
                <div className="text-center py-12">
                  <Icon name="Inbox" size={32} className="text-[var(--c-muted)] mx-auto mb-3" />
                  <p className="text-sm text-[var(--c-muted)]">Заявок с таким статусом нет</p>
                </div>
              )}
            </div>
          </div>
        )}
      </main>

      {/* Bottom Nav */}
      <nav className="fixed bottom-0 left-0 right-0 bg-[var(--c-bg)] border-t border-[var(--c-border)]">
        <div className="max-w-2xl mx-auto flex">
          {(
            [
              { id: "home" as Tab, label: "Главная", icon: "Home" },
              { id: "wallet" as Tab, label: "Кошелёк", icon: "Wallet" },
              { id: "withdraw" as Tab, label: "Вывести", icon: "ArrowUpRight" },
              { id: "history" as Tab, label: "История", icon: "ClipboardList" },
            ] as const
          ).map((n) => (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              className={`flex-1 flex flex-col items-center gap-1 py-4 transition-colors ${
                tab === n.id ? "text-[var(--c-accent)]" : "text-[var(--c-muted)]"
              }`}
            >
              <Icon name={n.icon} size={20} />
              <span className="text-[10px] font-medium tracking-wide">{n.label}</span>
            </button>
          ))}
        </div>
      </nav>
    </div>
  );
}