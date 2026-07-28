import { Clock3 } from "lucide-react";
import type { DashboardGraphType } from "@/lib/types";

type DashboardRange = "today" | "last_7_days" | "last_30_days" | "this_month" | "this_year";

type RangeData = {
  label: string;
  income: number;
  expense: number;
  prevIncome: number;
  prevExpense: number;
  incomeTrend: number[];
  expenseTrend: number[];
};

const DATA: Record<DashboardRange, RangeData> = {
  today: { label: "Today", income: 520, expense: 180, prevIncome: 430, prevExpense: 210, incomeTrend: [5, 11, 9, 14, 18, 20, 16], expenseTrend: [4, 8, 6, 9, 11, 8, 7] },
  last_7_days: { label: "Last 7 Days", income: 4380, expense: 1820, prevIncome: 3900, prevExpense: 2050, incomeTrend: [20, 34, 30, 42, 55, 62, 58], expenseTrend: [16, 27, 22, 30, 38, 33, 29] },
  last_30_days: { label: "Last 30 Days", income: 17830, expense: 7420, prevIncome: 15400, prevExpense: 8100, incomeTrend: [12, 20, 26, 18, 30, 36, 28, 40, 46, 38, 49, 52], expenseTrend: [8, 12, 18, 14, 16, 24, 20, 27, 23, 28, 24, 21] },
  this_month: { label: "This Month", income: 21370, expense: 8616, prevIncome: 19200, prevExpense: 9400, incomeTrend: [15, 25, 33, 29, 35, 41, 37, 45, 52, 56, 49, 58], expenseTrend: [9, 14, 21, 17, 22, 28, 24, 26, 30, 35, 31, 27] },
  this_year: { label: "This Year", income: 124300, expense: 49610, prevIncome: 109200, prevExpense: 52340, incomeTrend: [28, 34, 39, 43, 46, 49, 52, 58, 61, 67, 72, 76], expenseTrend: [19, 21, 24, 29, 27, 31, 35, 33, 38, 41, 43, 45] },
};

function toCurrency(value: number) {
  return `₹${value.toLocaleString("en-IN")}.00`;
}

function buildPath(values: number[], width = 360, height = 42) {
  const max = Math.max(...values, 1);
  const step = width / Math.max(values.length - 1, 1);

  return values
    .map((v, i) => {
      const x = i * step;
      const y = height - (v / max) * (height - 4);
      return `${i === 0 ? "M" : "L"}${x.toFixed(2)} ${y.toFixed(2)}`;
    })
    .join(" ");
}

function DonutGraph({ income, expense }: { income: number; expense: number }) {
  const total = income + expense;
  const incomeArc = Math.max(5, Math.round((income / total) * 360));
  const expenseArc = 360 - incomeArc;

  return (
    <svg width="170" height="170" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="85" cy="85" r="58" stroke="#e7edf3" strokeWidth="10" />
      <circle cx="85" cy="85" r="58" stroke="#22b88a" strokeWidth="10" strokeDasharray={`${incomeArc} ${expenseArc}`} transform="rotate(-90 85 85)" />
      <circle cx="85" cy="85" r="58" stroke="#ef3d7a" strokeWidth="10" strokeDasharray={`${expenseArc} ${incomeArc}`} transform="rotate(60 85 85)" />
    </svg>
  );
}

function BarGraph({ income, expense }: { income: number; expense: number }) {
  const max = Math.max(income, expense, 1);
  const incomeH = Math.max(12, Math.round((income / max) * 110));
  const expenseH = Math.max(12, Math.round((expense / max) * 110));

  return (
    <svg width="170" height="170" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <line x1="20" y1="140" x2="150" y2="140" stroke="#dce5ee" />
      <rect x="45" y={140 - incomeH} width="28" height={incomeH} rx="4" fill="#22b88a" />
      <rect x="95" y={140 - expenseH} width="28" height={expenseH} rx="4" fill="#ef3d7a" />
      <text x="59" y="156" textAnchor="middle" fontSize="10" fill="#6f8195">Income</text>
      <text x="109" y="156" textAnchor="middle" fontSize="10" fill="#6f8195">Expense</text>
    </svg>
  );
}

function AreaGraph({ incomeTrend, expenseTrend }: { incomeTrend: number[]; expenseTrend: number[] }) {
  const income = buildPath(incomeTrend, 170, 110);
  const expense = buildPath(expenseTrend, 170, 110);
  return (
    <svg width="170" height="170" viewBox="0 0 170 170" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="0" y="0" width="170" height="170" fill="#fff" />
      <path d={income} stroke="#22b88a" strokeWidth="2" transform="translate(0,20)" />
      <path d={expense} stroke="#ef3d7a" strokeWidth="2" transform="translate(0,20)" />
      <line x1="0" y1="132" x2="170" y2="132" stroke="#dce5ee" />
    </svg>
  );
}

export default function IncomeExpenses({
  range = "this_month",
  graphType = "donut",
}: {
  range?: DashboardRange;
  graphType?: DashboardGraphType;
}) {
  const view = DATA[range];

  return (
    <div className="card p-4">
      <h3 className="section-title mb-4">
        <Clock3 size={15} className="text-[#93a1af]" /> Income vs Expenses
      </h3>

      <div className="grid grid-cols-[190px_1fr] gap-4">
        <div className="flex items-center justify-center">
          {graphType === "donut" ? (
            <DonutGraph income={view.income} expense={view.expense} />
          ) : graphType === "bar" ? (
            <BarGraph income={view.income} expense={view.expense} />
          ) : (
            <AreaGraph incomeTrend={view.incomeTrend} expenseTrend={view.expenseTrend} />
          )}
        </div>

        <div className="space-y-4 text-sm text-[#617284]">
          <div>
            <p className="mb-1 text-[15px]">{view.label}</p>
            <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#22b88a]" />{toCurrency(view.income)}</p>
            <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ef3d7a]" />{toCurrency(view.expense)}</p>
          </div>
          <div>
            <p className="mb-1 text-[15px]">Previous Period</p>
            <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#22b88a]" />{toCurrency(view.prevIncome)}</p>
            <p><span className="mr-2 inline-block h-2 w-2 rounded-full bg-[#ef3d7a]" />{toCurrency(view.prevExpense)}</p>
          </div>
        </div>
      </div>

      <div className="mt-4 text-sm text-[#7f8d9c]">
        <p>{view.label} Trend</p>
        <svg className="mt-1" width="100%" height="42" viewBox="0 0 360 42" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d={buildPath(view.expenseTrend)} stroke="#ef3d7a" strokeWidth="2" />
          <path d={buildPath(view.incomeTrend)} stroke="#22b88a" strokeWidth="2" />
        </svg>
      </div>
    </div>
  );
}
