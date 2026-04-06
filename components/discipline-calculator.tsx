"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertCircle,
  ArrowLeftRight,
  ArrowRight,
  BriefcaseBusiness,
  CalendarDays,
  CalendarRange,
  ChevronDown,
  ChevronUp,
  Landmark,
  Sparkles,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const monthOptions = [
  "Januari",
  "Februari",
  "Maret",
  "April",
  "Mei",
  "Juni",
  "Juli",
  "Agustus",
  "September",
  "Oktober",
  "November",
  "Desember",
];

const weekdayLabels = ["Sen", "Sel", "Rab", "Kam", "Jum", "Sab", "Min"];

const CURRENT_DATE = new Date();
const DEFAULT_MONTH = CURRENT_DATE.getMonth();
const DEFAULT_YEAR = CURRENT_DATE.getFullYear();
const DEFAULT_COMPARE_MONTH = (DEFAULT_MONTH + 1) % 12;
const DEFAULT_COMPARE_YEAR =
  DEFAULT_MONTH === 11 ? DEFAULT_YEAR + 1 : DEFAULT_YEAR;

type HolidayItem = {
  date: string;
  name: string;
};

type CalendarCellStatus =
  | "empty"
  | "workday"
  | "weekend"
  | "holiday-workday"
  | "holiday-weekend";

type CalendarCell = {
  key: string;
  day: number | null;
  holiday?: HolidayItem;
  status: CalendarCellStatus;
};

type MonthMetrics = {
  calendarCells: CalendarCell[];
  countedHolidayList: HolidayItem[];
  daysInMonth: number;
  isHolidayDataAvailable: boolean;
  minimumDisciplineTarget: number;
  monthHolidayList: HolidayItem[];
  nationalHolidayCount: number;
  statusMessage: string;
  totalLateDays: number;
  totalShift: number;
  weekends: number;
};

const INDONESIA_NATIONAL_HOLIDAYS_2026: HolidayItem[] = [
  { date: "2026-01-01", name: "Tahun Baru 2026 Masehi" },
  { date: "2026-01-16", name: "Isra Mikraj Nabi Muhammad S.A.W." },
  { date: "2026-02-17", name: "Tahun Baru Imlek 2577 Kongzili" },
  { date: "2026-03-19", name: "Hari Suci Nyepi (Tahun Baru Saka 1948)" },
  { date: "2026-03-21", name: "Idul Fitri 1447 Hijriah" },
  { date: "2026-03-22", name: "Idul Fitri 1447 Hijriah" },
  { date: "2026-04-03", name: "Wafat Yesus Kristus" },
  { date: "2026-04-05", name: "Kebangkitan Yesus Kristus (Paskah)" },
  { date: "2026-05-01", name: "Hari Buruh Internasional" },
  { date: "2026-05-14", name: "Kenaikan Yesus Kristus" },
  { date: "2026-05-27", name: "Idul Adha 1447 Hijriah" },
  { date: "2026-05-31", name: "Hari Raya Waisak 2570 BE" },
  { date: "2026-06-01", name: "Hari Lahir Pancasila" },
  { date: "2026-06-16", name: "1 Muharam Tahun Baru Islam 1448 Hijriah" },
  { date: "2026-08-17", name: "Proklamasi Kemerdekaan" },
  { date: "2026-08-25", name: "Maulid Nabi Muhammad S.A.W." },
  { date: "2026-12-25", name: "Kelahiran Yesus Kristus" },
];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function getWeekendCount(year: number, month: number) {
  const daysInMonth = getDaysInMonth(year, month);
  let weekends = 0;

  for (let day = 1; day <= daysInMonth; day += 1) {
    const weekday = new Date(year, month, day).getDay();
    if (weekday === 0 || weekday === 6) {
      weekends += 1;
    }
  }

  return weekends;
}

function formatDateKey(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
}

function isWeekendDate(dateString: string) {
  const weekday = new Date(dateString).getDay();
  return weekday === 0 || weekday === 6;
}

function formatDate(dateString: string) {
  return new Intl.DateTimeFormat("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(new Date(dateString));
}

function clampToPositiveNumber(value: string) {
  const parsedValue = Math.floor(Number(value));

  if (!Number.isFinite(parsedValue) || parsedValue < 0) {
    return 0;
  }

  return parsedValue;
}

function getCalendarCells(
  year: number,
  month: number,
  holidayList: HolidayItem[],
): CalendarCell[] {
  const daysInMonth = getDaysInMonth(year, month);
  const firstDayOffset = (new Date(year, month, 1).getDay() + 6) % 7;
  const cells: CalendarCell[] = [];

  for (let index = 0; index < firstDayOffset; index += 1) {
    cells.push({
      key: `empty-${year}-${month}-${index}`,
      day: null,
      status: "empty",
    });
  }

  for (let day = 1; day <= daysInMonth; day += 1) {
    const dateKey = formatDateKey(year, month, day);
    const holiday = holidayList.find((item) => item.date === dateKey);
    const weekday = new Date(year, month, day).getDay();
    const isWeekend = weekday === 0 || weekday === 6;

    let status: CalendarCellStatus = "workday";

    if (holiday && isWeekend) {
      status = "holiday-weekend";
    } else if (holiday) {
      status = "holiday-workday";
    } else if (isWeekend) {
      status = "weekend";
    }

    cells.push({
      key: dateKey,
      day,
      holiday,
      status,
    });
  }

  while (cells.length % 7 !== 0) {
    cells.push({
      key: `empty-tail-${year}-${month}-${cells.length}`,
      day: null,
      status: "empty",
    });
  }

  return cells;
}

function getMonthMetrics(year: number, month: number): MonthMetrics {
  const daysInMonth = getDaysInMonth(year, month);
  const weekends = getWeekendCount(year, month);
  const monthHolidayList =
    year === 2026
      ? INDONESIA_NATIONAL_HOLIDAYS_2026.filter((holiday) => {
          const holidayDate = new Date(holiday.date);
          return holidayDate.getFullYear() === year && holidayDate.getMonth() === month;
        })
      : [];
  const countedHolidayList = monthHolidayList.filter(
    (holiday) => !isWeekendDate(holiday.date),
  );
  const nationalHolidayCount = countedHolidayList.length;
  const totalShift = Math.max(0, daysInMonth - weekends - nationalHolidayCount);
  const minimumDisciplineTarget = Math.ceil(totalShift * 0.85);
  const totalLateDays = Math.max(0, totalShift - minimumDisciplineTarget);
  const isHolidayDataAvailable = year === 2026;
  const statusMessage = isHolidayDataAvailable
    ? nationalHolidayCount > 0
      ? `Bulan ${monthOptions[month]} ${year} memiliki ${nationalHolidayCount} libur nasional hari kerja. Setelah dikurangi dari total shift, sistem menghitung batas telat maksimum dengan target kedisiplinan minimal 85%.`
      : `Bulan ${monthOptions[month]} ${year} tidak memiliki libur nasional hari kerja dalam dataset resmi yang dipakai. Batas telat maksimum tetap dihitung dari target kedisiplinan minimal 85%.`
    : "Daftar libur nasional otomatis saat ini tersedia untuk tahun 2026.";

  return {
    calendarCells: getCalendarCells(year, month, monthHolidayList),
    countedHolidayList,
    daysInMonth,
    isHolidayDataAvailable,
    minimumDisciplineTarget,
    monthHolidayList,
    nationalHolidayCount,
    statusMessage,
    totalLateDays,
    totalShift,
    weekends,
  };
}

function useValuePulse(value: number | string) {
  const [active, setActive] = useState(false);
  const previousValue = useRef(value);

  useEffect(() => {
    if (previousValue.current === value) {
      return;
    }

    previousValue.current = value;
    setActive(true);

    const timeoutId = window.setTimeout(() => {
      setActive(false);
    }, 750);

    return () => window.clearTimeout(timeoutId);
  }, [value]);

  return active;
}

export function DisciplineCalculator() {
  const [month, setMonth] = useState(DEFAULT_MONTH);
  const [year, setYear] = useState(DEFAULT_YEAR);
  const [compareEnabled, setCompareEnabled] = useState(true);
  const [compareMonth, setCompareMonth] = useState(DEFAULT_COMPARE_MONTH);
  const [compareYear, setCompareYear] = useState(DEFAULT_COMPARE_YEAR);
  const [showHolidayDetails, setShowHolidayDetails] = useState(false);
  const primaryMetrics = useMemo(() => getMonthMetrics(year, month), [month, year]);
  const compareMetrics = useMemo(
    () => getMonthMetrics(compareYear, compareMonth),
    [compareMonth, compareYear],
  );
  const [selectedCalendarKey, setSelectedCalendarKey] = useState<string | null>(null);

  useEffect(() => {
    const nextSelectedKey =
      primaryMetrics.calendarCells.find(
        (cell) => cell.day && cell.status === "holiday-workday",
      )?.key ??
      primaryMetrics.calendarCells.find(
        (cell) => cell.day && cell.status === "holiday-weekend",
      )?.key ??
      primaryMetrics.calendarCells.find((cell) => cell.day)?.key ??
      null;

    const hasSelectedKey = primaryMetrics.calendarCells.some(
      (cell) => cell.key === selectedCalendarKey && cell.day,
    );

    if (!hasSelectedKey) {
      setSelectedCalendarKey(nextSelectedKey);
    }
  }, [primaryMetrics.calendarCells, selectedCalendarKey]);

  const selectedCalendarCell =
    primaryMetrics.calendarCells.find((cell) => cell.key === selectedCalendarKey) ?? null;
  const lateDaysPulse = useValuePulse(primaryMetrics.totalLateDays);
  const totalShiftPulse = useValuePulse(primaryMetrics.totalShift);
  const targetPulse = useValuePulse(primaryMetrics.minimumDisciplineTarget);
  const compareLatePulse = useValuePulse(compareMetrics.totalLateDays);
  const compareShiftPulse = useValuePulse(compareMetrics.totalShift);
  const deltaLateDays = primaryMetrics.totalLateDays - compareMetrics.totalLateDays;
  const deltaShift = primaryMetrics.totalShift - compareMetrics.totalShift;
  const comparisonLabel = `${monthOptions[compareMonth]} ${compareYear}`;

  const primaryStatCards = [
    {
      detail:
        "Hasil dari total hari bulan dikurangi Sabtu/Minggu dan libur nasional hari kerja.",
      label: "Total Shift",
      pulse: totalShiftPulse,
      value: `${primaryMetrics.totalShift} hari`,
    },
    {
      detail:
        "Jumlah minimum hari disiplin yang harus tercapai agar tetap berada di angka 85% atau lebih.",
      label: "Minimum 85%",
      pulse: targetPulse,
      value: `${primaryMetrics.minimumDisciplineTarget} hari`,
    },
    {
      detail: "Hasil akhir dari total shift dikurangi kebutuhan minimum 85%.",
      label: "Total Hari Bisa Telat",
      pulse: lateDaysPulse,
      value: `${primaryMetrics.totalLateDays} hari`,
    },
  ];

  return (
    <main className="surface-grid min-h-screen">
      <section className="mx-auto flex min-h-screen w-full max-w-7xl flex-col px-4 py-4 sm:px-8 sm:py-6 lg:px-10">
        <div className="flex flex-1 flex-col gap-5 sm:gap-8">
          <header className="overflow-hidden rounded-[36px] border border-red-100 bg-white/90 shadow-panel">
            <div className="h-1.5 w-full bg-primary" />
            <div className="grid gap-5 px-4 py-5 sm:px-8 sm:py-8 lg:grid-cols-[minmax(0,1.15fr)_minmax(300px,0.85fr)] lg:items-start">
              <div className="flex flex-col gap-4 sm:gap-6">
                <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                  <Badge variant="default" className="w-fit bg-primary text-primary-foreground">
                    Lion Parcel
                  </Badge>
                  <span className="text-xs text-muted-foreground sm:text-sm">
                    Kalkulator batas telat bulanan
                  </span>
                </div>

                <div className="max-w-3xl">
                  <h1 className="font-display text-[1.7rem] font-semibold leading-tight tracking-tight text-foreground sm:text-4xl lg:text-5xl">
                    Batas maksimal hari telat dengan target kedisiplinan minimum 85%.
                  </h1>
                  <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:mt-4 sm:text-lg sm:leading-7">
                    Sistem menghitung total shift efektif setelah mengurangi Sabtu,
                    Minggu, dan libur nasional hari kerja, lalu mencari toleransi telat
                    maksimum yang masih aman.
                  </p>
                </div>

                <div className="grid gap-3 sm:grid-cols-2 xl:max-w-3xl">
                  <div className="rounded-[22px] border border-red-100 bg-red-50/70 px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <CalendarRange className="size-4 text-primary" />
                      Dasar Perhitungan
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Total shift efektif dikurangi kebutuhan minimum 85%.
                    </p>
                  </div>
                  <div className="rounded-[22px] border border-border bg-background/80 px-4 py-4">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Landmark className="size-4 text-primary" />
                      Aturan Libur Nasional
                    </div>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Libur nasional yang jatuh pada Sabtu atau Minggu tidak dikurangkan lagi.
                    </p>
                  </div>
                </div>
              </div>

              <div
                className={cn(
                  "rounded-[28px] border border-red-100 bg-red-50/75 p-4 sm:p-5",
                  lateDaysPulse && "metric-highlight",
                )}
              >
                <div className="flex items-start gap-3 sm:gap-4">
                  <div className="flex size-11 items-center justify-center rounded-2xl bg-primary text-primary-foreground sm:size-12">
                    <CalendarDays className="size-6" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground sm:text-sm">
                      Hasil Utama
                    </p>
                    <p className="mt-2 text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
                      {primaryMetrics.totalLateDays} hari
                    </p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3">
                      Maksimal hari telat yang masih menjaga poin kedisiplinan tetap
                      minimal 85% pada periode ini.
                    </p>
                  </div>
                </div>

                <Separator className="my-4 sm:my-5" />

                <div className="grid grid-cols-3 gap-2 sm:gap-3 lg:grid-cols-1 xl:grid-cols-3">
                  <HeaderMetric
                    label="Total Shift"
                    pulse={totalShiftPulse}
                    value={`${primaryMetrics.totalShift}`}
                  />
                  <HeaderMetric
                    label="Target 85%"
                    pulse={targetPulse}
                    value={`${primaryMetrics.minimumDisciplineTarget}`}
                  />
                  <HeaderMetric
                    label="Libur Kerja"
                    value={`${primaryMetrics.nationalHolidayCount}`}
                  />
                </div>
              </div>
            </div>
          </header>

          <section className="grid gap-5 xl:items-start xl:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)] xl:gap-6">
            <Card className="order-1 self-start bg-white/82">
              <CardHeader>
                <Badge variant="secondary" className="w-fit">
                  Parameter Bulanan
                </Badge>
                <CardTitle className="font-display text-2xl sm:text-3xl">
                  Pilih periode
                </CardTitle>
                <CardDescription>
                  Pilih bulan dan tahun. Sistem akan menghitung akhir pekan, lalu
                  mengambil daftar libur nasional pada bulan tersebut.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5 sm:gap-6">
                <div className="grid gap-4 md:grid-cols-2">
                  <MonthSelect
                    id="month"
                    label="Bulan"
                    value={month}
                    onChange={setMonth}
                  />

                  <div className="flex flex-col gap-2">
                    <Label htmlFor="year">Tahun</Label>
                    <Input
                      id="year"
                      type="number"
                      min={2024}
                      value={year}
                      onChange={(event) => setYear(clampToPositiveNumber(event.target.value))}
                    />
                  </div>

                  <div className="md:col-span-2 rounded-[24px] border border-dashed border-border bg-secondary/60 p-4">
                    <p className="text-sm font-medium text-foreground">Catatan perhitungan</p>
                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                      Web ini hanya memakai <strong>libur nasional</strong>, tidak memakai
                      cuti bersama pemerintah. Libur nasional yang jatuh pada Sabtu atau
                      Minggu juga tidak dipotong lagi karena sudah termasuk weekend.
                    </p>
                  </div>
                </div>

                <Separator />

                <div className="flex flex-col gap-4 rounded-[24px] border border-border bg-background/72 p-4">
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">
                        Quick compare
                      </p>
                      <p className="mt-1 text-sm leading-6 text-muted-foreground">
                        Bandingkan toleransi telat bulan aktif dengan periode lain.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setCompareEnabled((value) => !value)}
                    >
                      <ArrowLeftRight data-icon="inline-start" />
                      {compareEnabled ? "Sembunyikan" : "Aktifkan"}
                    </Button>
                  </div>

                  <div
                    className={cn(
                      "overflow-hidden transition-all duration-300 ease-out",
                      compareEnabled ? "max-h-60 opacity-100" : "max-h-0 opacity-0",
                    )}
                    aria-hidden={!compareEnabled}
                  >
                    <div className="grid gap-4 pb-1 pt-1 md:grid-cols-2">
                      <MonthSelect
                        id="compare-month"
                        label="Bulan pembanding"
                        value={compareMonth}
                        onChange={setCompareMonth}
                      />

                      <div className="flex flex-col gap-2">
                        <Label htmlFor="compare-year">Tahun pembanding</Label>
                        <Input
                          id="compare-year"
                          type="number"
                          min={2024}
                          value={compareYear}
                          onChange={(event) =>
                            setCompareYear(clampToPositiveNumber(event.target.value))
                          }
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="order-2 flex flex-col gap-5 xl:gap-6">
              <Card className="bg-[linear-gradient(180deg,rgba(255,255,255,0.96),rgba(255,247,238,0.92))]">
                <CardHeader>
                  <Badge className="w-fit">Ringkasan Hasil</Badge>
                  <CardTitle className="font-display text-2xl sm:text-3xl">
                    {monthOptions[month]} {year}
                  </CardTitle>
                  <CardDescription>
                    Rekap total maksimal hari telat dari rumus total shift efektif
                    dikurangi kebutuhan minimum 85%.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4 sm:gap-5">
                  <div
                    className={cn(
                      "rounded-[26px] border px-4 py-4 sm:px-5 sm:py-5",
                      primaryMetrics.isHolidayDataAvailable
                        ? "border-red-200 bg-red-50/80"
                        : "border-orange-200 bg-orange-50/80",
                    )}
                  >
                    <div className="flex items-start gap-4">
                      <div
                        className={cn(
                          "flex size-11 shrink-0 items-center justify-center rounded-2xl",
                          primaryMetrics.isHolidayDataAvailable
                            ? "bg-red-100"
                            : "bg-orange-100",
                        )}
                      >
                        <AlertCircle
                          className={cn(
                            "size-5",
                            primaryMetrics.isHolidayDataAvailable
                              ? "text-red-600"
                              : "text-orange-600",
                          )}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
                          Informasi Periode
                        </p>
                        <p className="mt-2 text-sm leading-6 text-foreground sm:text-base sm:leading-7">
                          {primaryMetrics.statusMessage}
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="grid gap-3 sm:gap-4">
                    <ResultPanel
                      className={cn(lateDaysPulse && "metric-highlight")}
                      label="Total Hari Yang Bisa Digunakan Untuk Telat"
                      value={`${primaryMetrics.totalLateDays} hari`}
                      detail="Rumus: total shift efektif dikurangi jumlah minimum hari disiplin untuk mempertahankan 85%."
                    />
                  </div>

                  <div className="grid gap-3 md:grid-cols-3">
                    {primaryStatCards.map((item) => (
                      <InsightCard
                        key={item.label}
                        detail={item.detail}
                        label={item.label}
                        pulse={item.pulse}
                        value={item.value}
                      />
                    ))}
                  </div>
                </CardContent>
              </Card>

              {compareEnabled ? (
                <Card className="bg-white/88">
                  <CardHeader>
                    <Badge variant="secondary" className="w-fit">
                      Quick Compare
                    </Badge>
                    <CardTitle className="font-display text-2xl">
                      Bandingkan dengan {comparisonLabel}
                    </CardTitle>
                    <CardDescription>
                      Lihat apakah periode aktif lebih longgar atau lebih ketat dari bulan pembanding.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex flex-col gap-4">
                    <div className="rounded-[24px] border border-border bg-background/80 p-4">
                      <p className="text-sm font-medium text-foreground">
                        {deltaLateDays === 0
                          ? "Toleransi telat sama"
                          : deltaLateDays > 0
                            ? `${monthOptions[month]} ${year} lebih longgar ${deltaLateDays} hari`
                            : `${comparisonLabel} lebih longgar ${Math.abs(deltaLateDays)} hari`}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        Selisih total shift: {deltaShift > 0 ? "+" : ""}
                        {deltaShift} hari. Selisih total hari bisa telat:{" "}
                        {deltaLateDays > 0 ? "+" : ""}
                        {deltaLateDays} hari.
                      </p>
                    </div>

                    <div className="grid gap-3 sm:grid-cols-2">
                      <ComparePanel
                        pulse={lateDaysPulse}
                        subtitle="Periode aktif"
                        title={`${monthOptions[month]} ${year}`}
                        totalLateDays={primaryMetrics.totalLateDays}
                        totalShift={primaryMetrics.totalShift}
                      />
                      <ComparePanel
                        pulse={compareLatePulse || compareShiftPulse}
                        subtitle="Pembanding"
                        title={comparisonLabel}
                        totalLateDays={compareMetrics.totalLateDays}
                        totalShift={compareMetrics.totalShift}
                      />
                    </div>
                  </CardContent>
                </Card>
              ) : null}

              <Card className="bg-white/88">
                <CardHeader>
                  <Badge variant="secondary" className="w-fit">
                    Interactive Calendar
                  </Badge>
                  <CardTitle className="font-display text-2xl">
                    Kalender kerja {monthOptions[month]} {year}
                  </CardTitle>
                  <CardDescription>
                    Klik tanggal untuk melihat apakah hari itu termasuk kerja, weekend, atau libur nasional.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <LegendPill className="bg-background" label="Hari kerja" />
                    <LegendPill className="bg-secondary" label="Weekend" />
                    <LegendPill className="bg-red-100 text-red-700" label="Libur kerja" />
                    <LegendPill className="bg-red-50 text-red-500" label="Libur saat weekend" />
                  </div>

                  <div className="rounded-[24px] border border-border bg-background/70 p-3 sm:p-4">
                    <div className="grid grid-cols-7 gap-2.5 sm:gap-3">
                    {weekdayLabels.map((day) => (
                      <div
                        key={day}
                        className="py-1.5 text-center text-[10px] font-semibold uppercase tracking-[0.12em] text-muted-foreground sm:py-2 sm:text-[11px]"
                      >
                        {day}
                      </div>
                    ))}

                    {primaryMetrics.calendarCells.map((cell) =>
                      cell.day ? (
                        <button
                          key={cell.key}
                          type="button"
                          className={cn(
                            "flex aspect-square min-h-[42px] items-center justify-center rounded-[18px] border px-1 text-[13px] font-medium leading-none shadow-sm transition sm:min-h-[48px] sm:rounded-2xl sm:text-sm",
                            getCalendarCellClassName(cell.status),
                            selectedCalendarKey === cell.key &&
                              "ring-2 ring-primary ring-offset-2 ring-offset-background",
                          )}
                          onClick={() => setSelectedCalendarKey(cell.key)}
                        >
                          {cell.day}
                        </button>
                      ) : (
                        <div
                          key={cell.key}
                          className="aspect-square min-h-[42px] rounded-[18px] bg-transparent sm:min-h-[48px] sm:rounded-2xl"
                        />
                      ),
                    )}
                    </div>
                  </div>

                  {selectedCalendarCell?.day ? (
                    <div className="rounded-[24px] border border-border bg-background/80 p-4">
                      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                        <Sparkles className="size-4 text-primary" />
                        Detail tanggal terpilih
                      </div>
                      <p className="mt-2 text-base font-semibold text-foreground">
                        {formatDate(selectedCalendarCell.key)}
                      </p>
                      <p className="mt-2 text-sm leading-6 text-muted-foreground">
                        {getCalendarCellDescription(selectedCalendarCell)}
                      </p>
                    </div>
                  ) : null}
                </CardContent>
              </Card>

              <Card className="bg-white/88">
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <Badge variant="secondary" className="w-fit">
                        Daftar Libur Nasional
                      </Badge>
                      <CardTitle className="mt-3 font-display text-2xl">
                        {monthOptions[month]} {year}
                      </CardTitle>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowHolidayDetails((value) => !value)}
                    >
                      {showHolidayDetails ? (
                        <ChevronUp data-icon="inline-start" />
                      ) : (
                        <ChevronDown data-icon="inline-start" />
                      )}
                      {showHolidayDetails ? "Tutup detail" : "Lihat detail"}
                    </Button>
                  </div>
                  <CardDescription>
                    Ringkasan libur nasional tetap tampil. Detail daftar tanggal bisa dibuka saat dibutuhkan.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-5">
                  <div className="grid gap-3 sm:grid-cols-3">
                    <InfoMiniCard
                      label="Total libur bulan ini"
                      value={`${primaryMetrics.monthHolidayList.length} hari`}
                    />
                    <InfoMiniCard
                      label="Yang dihitung"
                      value={`${primaryMetrics.nationalHolidayCount} hari`}
                    />
                    <InfoMiniCard
                      label="Jatuh di weekend"
                      value={`${
                        primaryMetrics.monthHolidayList.length -
                        primaryMetrics.nationalHolidayCount
                      } hari`}
                    />
                  </div>

                  <div
                    className={cn(
                      "holiday-details-wrap overflow-hidden transition-all duration-300 ease-out",
                      showHolidayDetails
                        ? "max-h-[1600px] opacity-100"
                        : "max-h-0 opacity-0",
                    )}
                    aria-hidden={!showHolidayDetails}
                  >
                    <div className="pb-1 pt-1">
                      {primaryMetrics.isHolidayDataAvailable ? (
                        primaryMetrics.monthHolidayList.length > 0 ? (
                          <div className="grid gap-3">
                            {primaryMetrics.monthHolidayList.map((holiday) => (
                              <div
                                key={`${holiday.date}-${holiday.name}`}
                                className="rounded-[22px] border border-red-100 bg-red-50/70 px-4 py-4"
                              >
                                <div className="flex items-start justify-between gap-3">
                                  <div>
                                    <p className="text-sm text-muted-foreground">
                                      {formatDate(holiday.date)}
                                    </p>
                                    <p className="mt-2 text-lg font-semibold text-foreground">
                                      {holiday.name}
                                    </p>
                                    <p className="mt-2 text-sm leading-6 text-muted-foreground">
                                      {isWeekendDate(holiday.date)
                                        ? "Tidak dihitung karena jatuh pada Sabtu/Minggu."
                                        : "Dihitung sebagai pengurang hari kerja efektif."}
                                    </p>
                                  </div>
                                  <ArrowRight className="mt-1 size-4 text-red-500" />
                                </div>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <div className="rounded-[22px] border border-border bg-background/80 px-4 py-5 text-sm leading-7 text-muted-foreground">
                            Tidak ada libur nasional pada bulan ini.
                          </div>
                        )
                      ) : (
                        <div className="rounded-[22px] border border-border bg-background/80 px-4 py-5 text-sm leading-7 text-muted-foreground">
                          Daftar otomatis saat ini tersedia untuk tahun 2026.
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="overflow-hidden rounded-[24px] border border-border">
                    <table className="w-full border-collapse text-left text-sm">
                      <thead className="bg-secondary/70 text-foreground">
                        <tr>
                          <th className="px-4 py-3 font-medium">Komponen</th>
                          <th className="px-4 py-3 font-medium">Nilai</th>
                        </tr>
                      </thead>
                      <tbody>
                        <TableRow
                          label="Total hari dalam bulan"
                          value={`${primaryMetrics.daysInMonth} hari`}
                        />
                        <TableRow
                          label="Total Sabtu & Minggu"
                          value={`${primaryMetrics.weekends} hari`}
                        />
                        <TableRow
                          label="Libur nasional hari kerja"
                          value={`${primaryMetrics.nationalHolidayCount} hari`}
                        />
                        <TableRow
                          label="Total shift efektif"
                          value={`${primaryMetrics.totalShift} hari`}
                        />
                        <TableRow
                          label="Target minimum 85%"
                          value={`${primaryMetrics.minimumDisciplineTarget} hari`}
                        />
                        <TableRow
                          label="Total hari yang bisa digunakan untuk telat"
                          value={`${primaryMetrics.totalLateDays} hari`}
                        />
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </div>
          </section>

          <footer className="flex flex-col items-start justify-between gap-3 rounded-[28px] border border-white/70 bg-white/72 px-4 py-4 shadow-panel sm:flex-row sm:flex-wrap sm:items-center sm:gap-4 sm:px-5">
            <div className="flex items-center gap-3">
              <div className="flex size-11 items-center justify-center rounded-2xl bg-primary/12">
                <BriefcaseBusiness className="size-5 text-primary" />
              </div>
              <p className="text-sm leading-6 text-muted-foreground">
                Versi statis untuk menghitung batas maksimal hari telat bulanan Lion Parcel.
              </p>
            </div>
            <p className="text-sm text-muted-foreground">
              Rumus: total shift efektif - kebutuhan minimum 85%
            </p>
          </footer>
        </div>
      </section>
    </main>
  );
}

type MonthSelectProps = {
  id: string;
  label: string;
  onChange: (value: number) => void;
  value: number;
};

function MonthSelect({ id, label, onChange, value }: MonthSelectProps) {
  return (
    <div className="flex flex-col gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <select
          id={id}
          className="flex h-11 w-full appearance-none rounded-2xl border border-border bg-background/90 px-4 py-2 pr-11 text-sm text-foreground shadow-sm outline-none transition focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background"
          value={value}
          onChange={(event) => onChange(Number(event.target.value))}
        >
          {monthOptions.map((monthName, index) => (
            <option key={monthName} value={index}>
              {monthName}
            </option>
          ))}
        </select>
        <ChevronDown className="pointer-events-none absolute right-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      </div>
    </div>
  );
}

type ResultPanelProps = {
  className?: string;
  detail: string;
  label: string;
  value: string;
};

function ResultPanel({ className, detail, label, value }: ResultPanelProps) {
  return (
    <div className={cn("rounded-[24px] border border-border bg-background/88 p-4", className)}>
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
        {value}
      </p>
      <p className="mt-2 text-sm leading-6 text-muted-foreground sm:mt-3">{detail}</p>
    </div>
  );
}

type HeaderMetricProps = {
  label: string;
  pulse?: boolean;
  value: string;
};

function HeaderMetric({ label, pulse = false, value }: HeaderMetricProps) {
  return (
    <div
      className={cn(
        "rounded-[20px] border border-red-100 bg-white/80 px-3 py-3 sm:px-4",
        pulse && "metric-highlight",
      )}
    >
      <p className="text-[10px] uppercase tracking-[0.14em] text-muted-foreground sm:text-xs">
        {label}
      </p>
      <p className="mt-1 text-xl font-semibold tracking-tight text-foreground sm:mt-2 sm:text-2xl">
        {value}
      </p>
    </div>
  );
}

type ComparePanelProps = {
  pulse?: boolean;
  subtitle: string;
  title: string;
  totalLateDays: number;
  totalShift: number;
};

function ComparePanel({
  pulse = false,
  subtitle,
  title,
  totalLateDays,
  totalShift,
}: ComparePanelProps) {
  return (
    <div
      className={cn(
        "rounded-[24px] border border-border bg-background/80 p-4",
        pulse && "metric-highlight",
      )}
    >
      <p className="text-xs uppercase tracking-[0.14em] text-muted-foreground">{subtitle}</p>
      <p className="mt-2 text-lg font-semibold text-foreground">{title}</p>
      <div className="mt-4 grid grid-cols-2 gap-3">
        <InfoMiniCard label="Bisa telat" value={`${totalLateDays} hari`} />
        <InfoMiniCard label="Total shift" value={`${totalShift} hari`} />
      </div>
    </div>
  );
}

type InfoMiniCardProps = {
  label: string;
  value: string;
};

function InfoMiniCard({ label, value }: InfoMiniCardProps) {
  return (
    <div className="rounded-[18px] border border-border bg-white/75 px-3 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}

type InsightCardProps = {
  detail: string;
  label: string;
  pulse?: boolean;
  value: string;
};

function InsightCard({ detail, label, pulse = false, value }: InsightCardProps) {
  return (
    <div
      className={cn(
        "rounded-[22px] border border-border bg-background/80 px-4 py-4",
        pulse && "metric-highlight",
      )}
    >
      <p className="text-sm text-muted-foreground">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-6 text-muted-foreground">{detail}</p>
    </div>
  );
}

type LegendPillProps = {
  className?: string;
  label: string;
};

function LegendPill({ className, label }: LegendPillProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-border px-3 py-1",
        className,
      )}
    >
      {label}
    </span>
  );
}

type TableRowProps = {
  label: string;
  value: string;
};

function TableRow({ label, value }: TableRowProps) {
  return (
    <tr className="border-t border-border bg-white/70">
      <td className="break-words px-4 py-3 align-top text-muted-foreground">{label}</td>
      <td className="break-words px-4 py-3 align-top font-medium text-foreground">
        {value}
      </td>
    </tr>
  );
}

function getCalendarCellClassName(status: CalendarCellStatus) {
  switch (status) {
    case "holiday-workday":
      return "border-red-200 bg-red-100 text-red-700 hover:bg-red-200";
    case "holiday-weekend":
      return "border-red-100 bg-red-50 text-red-500 hover:bg-red-100";
    case "weekend":
      return "border-border bg-secondary text-muted-foreground hover:bg-secondary/80";
    case "workday":
      return "border-border bg-background text-foreground hover:bg-secondary/40";
    default:
      return "border-transparent bg-transparent text-transparent";
  }
}

function getCalendarCellDescription(cell: CalendarCell) {
  if (cell.status === "holiday-workday" && cell.holiday) {
    return `${cell.holiday.name}. Hari ini dihitung sebagai pengurang total shift efektif.`;
  }

  if (cell.status === "holiday-weekend" && cell.holiday) {
    return `${cell.holiday.name}. Libur ini tidak mengurangi shift lagi karena sudah jatuh pada akhir pekan.`;
  }

  if (cell.status === "weekend") {
    return "Hari akhir pekan. Otomatis tidak dihitung sebagai total shift efektif.";
  }

  return "Hari kerja biasa. Hari ini tetap masuk ke total shift efektif.";
}
