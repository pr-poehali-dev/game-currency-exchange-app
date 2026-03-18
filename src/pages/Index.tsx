import { useState } from "react";
import Icon from "@/components/ui/icon";

type Tab = "home" | "wallet" | "withdraw";
type WithdrawMethod = "card" | "qiwi" | "yoomoney" | "sbp" | "crypto" | "bank";

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

const WITHDRAW_METHODS = [
  { id: "card" as WithdrawMethod, label: "Банковская карта", icon: "CreditCard", fee: "2%", time: "1–3 дня" },
  { id: "sbp" as WithdrawMethod, label: "СБП / По номеру", icon: "Smartphone", fee: "1%", time: "моментально" },
  { id: "yoomoney" as WithdrawMethod, label: "ЮMoney", icon: "Wallet", fee: "1.5%", time: "до 1 часа" },
  { id: "qiwi" as WithdrawMethod, label: "QIWI Кошелёк", icon: "CircleDollarSign", fee: "1.5%", time: "до 1 часа" },
  { id: "crypto" as WithdrawMethod, label: "Криптовалюта", icon: "Bitcoin", fee: "0.5%", time: "до 30 мин" },
  { id: "bank" as WithdrawMethod, label: "Банковский перевод", icon: "Building2", fee: "0%", time: "3–5 дней" },
];

export default function Index() {
  const [tab, setTab] = useState<Tab>("home");
  const [selectedMethod, setSelectedMethod] = useState<WithdrawMethod | null>(null);
  const [amount, setAmount] = useState("");
  const [gameBalance] = useState(12_450);
  const [realBalance] = useState(3_820);

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

            {selectedMethod && (
              <div className="animate-fade-in rounded-2xl bg-[var(--c-card)] border border-[var(--c-border)] p-6 mb-4">
                <h3 className="font-semibold mb-4">Сумма вывода</h3>
                <div className="mb-4">
                  <label className="text-xs text-[var(--c-muted)] uppercase tracking-wider mb-2 block">Игровая валюта (GP)</label>
                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Введите сумму"
                    className="w-full bg-[var(--c-surface)] border border-[var(--c-border)] rounded-xl px-4 py-3 text-lg font-semibold outline-none focus:border-[var(--c-accent)] transition-colors text-[var(--c-text)]"
                  />
                  <div className="flex gap-2 mt-2">
                    {[1000, 2000, 5000].map((v) => (
                      <button
                        key={v}
                        onClick={() => setAmount(String(v))}
                        className="text-xs px-3 py-1.5 rounded-lg bg-[var(--c-surface)] border border-[var(--c-border)] hover:border-[var(--c-accent)] transition-colors text-[var(--c-text)]"
                      >
                        {v.toLocaleString("ru")} GP
                      </button>
                    ))}
                  </div>
                </div>

                <div className="rounded-xl bg-[var(--c-surface)] p-4 mb-4 space-y-2 text-sm">
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

                <button className="w-full bg-[var(--c-accent)] text-white rounded-xl py-3.5 font-semibold hover:opacity-90 transition-opacity">
                  Продолжить вывод
                </button>
              </div>
            )}

            {!selectedMethod && (
              <div className="text-center py-8 text-sm text-[var(--c-muted)]">
                Выберите способ вывода выше
              </div>
            )}
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
