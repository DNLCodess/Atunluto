// app/dashboard/page.jsx
"use client";

import { useQueries } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";
import { format, subDays, startOfDay } from "date-fns";
import {
  Users,
  TrendingUp,
  MapPin,
  Calendar,
  UserPlus,
  BarChart3,
  Activity,
} from "lucide-react";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const supabase = createClient();

// ─── Lean fetchers — only select what's needed ────────────────────────────────

async function fetchStats() {
  const now = new Date();
  const todayStart = startOfDay(now).toISOString();
  const weekStart = startOfDay(subDays(now, 7)).toISOString();
  const monthStart = startOfDay(subDays(now, 30)).toISOString();

  const [
    { count: total,      error: e1 },
    { count: todayJoins, error: e2 },
    { count: weekJoins,  error: e3 },
    { count: monthJoins, error: e4 },
    { data: latest,      error: e5 },
  ] = await Promise.all([
    supabase.from("members").select("*", { count: "exact", head: true }),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .gte("created_at", todayStart),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .gte("created_at", weekStart),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .gte("created_at", monthStart),
    supabase
      .from("members")
      .select("full_name, created_at")
      .order("created_at", { ascending: false })
      .limit(1),
  ]);

  const err = e1 || e2 || e3 || e4 || e5;
  if (err) throw err;

  return {
    total: total ?? 0,
    todayJoins: todayJoins ?? 0,
    weekJoins: weekJoins ?? 0,
    monthJoins: monthJoins ?? 0,
    lastJoinName: latest?.[0]?.full_name ?? null,
    lastJoinDate: latest?.[0]?.created_at ?? null,
  };
}

async function fetchLgaDistribution() {
  const { data, error } = await supabase
    .from("members")
    .select("lga")
    .not("lga", "is", null)
    .limit(50000);

  if (error) throw error;

  const counts = data.reduce((acc, { lga }) => {
    acc[lga] = (acc[lga] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function fetchWardDistribution() {
  const { data, error } = await supabase
    .from("members")
    .select("lga, ward")
    .not("ward", "is", null)
    .limit(50000);

  if (error) throw error;

  const counts = data.reduce((acc, { lga, ward }) => {
    const key = `${lga} - Ward ${ward}`;
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

async function fetchPollingDistribution() {
  const { data, error } = await supabase
    .from("members")
    .select("polling_unit")
    .not("polling_unit", "is", null)
    .limit(50000);

  if (error) throw error;

  const counts = data.reduce((acc, { polling_unit }) => {
    acc[polling_unit] = (acc[polling_unit] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 15);
}

async function fetchDailyGrowth() {
  const now = new Date();
  const windowStart = startOfDay(subDays(now, 29));
  const windowStartISO = windowStart.toISOString();

  const [{ data, error }, { count: baseline, error: baselineError }] = await Promise.all([
    supabase
      .from("members")
      .select("created_at")
      .gte("created_at", windowStartISO)
      .order("created_at", { ascending: true })
      .limit(50000),
    supabase
      .from("members")
      .select("*", { count: "exact", head: true })
      .lt("created_at", windowStartISO),
  ]);

  if (error) throw error;
  if (baselineError) throw baselineError;

  const days = Array.from({ length: 30 }, (_, i) => ({
    date: format(subDays(now, 29 - i), "MMM dd"),
    fullDate: format(subDays(now, 29 - i), "yyyy-MM-dd"),
    daily: 0,
  }));

  data.forEach(({ created_at }) => {
    const d = format(new Date(created_at), "yyyy-MM-dd");
    const idx = days.findIndex((day) => day.fullDate === d);
    if (idx !== -1) days[idx].daily++;
  });

  let cumulative = baseline ?? 0;
  return days.map(({ date, daily }) => {
    cumulative += daily;
    return { date, daily, total: cumulative };
  });
}

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function StatCardSkeleton() {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="space-y-2">
          <div className="h-3 bg-gray-200 rounded w-24" />
          <div className="h-8 bg-gray-200 rounded w-16 mt-2" />
        </div>
        <div className="w-14 h-14 bg-gray-100 rounded-xl" />
      </div>
    </div>
  );
}

function ChartSkeleton({ height = 300 }) {
  return (
    <div className="bg-white rounded-2xl border border-gray-200 p-6 animate-pulse">
      <div className="h-5 bg-gray-200 rounded w-48 mb-6" />
      <div className="bg-gray-100 rounded-xl" style={{ height }} />
    </div>
  );
}

// ─── Tooltip style ────────────────────────────────────────────────────────────

const tooltipStyle = {
  contentStyle: {
    backgroundColor: "#fff",
    border: "1px solid #E5E7EB",
    borderRadius: "12px",
    padding: "12px",
    fontFamily: "Poppins, sans-serif",
    fontSize: "12px",
  },
};

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AdminDashboard() {
  const results = useQueries({
    queries: [
      {
        queryKey: ["dashboard", "stats"],
        queryFn: fetchStats,
        staleTime: 2 * 60 * 1000, // 2 min
      },
      {
        queryKey: ["dashboard", "lga"],
        queryFn: fetchLgaDistribution,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ["dashboard", "ward"],
        queryFn: fetchWardDistribution,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ["dashboard", "polling"],
        queryFn: fetchPollingDistribution,
        staleTime: 5 * 60 * 1000,
      },
      {
        queryKey: ["dashboard", "growth"],
        queryFn: fetchDailyGrowth,
        staleTime: 5 * 60 * 1000,
      },
    ],
  });

  const [statsQ, lgaQ, wardQ, pollingQ, growthQ] = results;

  const stats = statsQ.data;
  const lgaData = lgaQ.data ?? [];
  const wardData = wardQ.data ?? [];
  const pollingData = pollingQ.data ?? [];
  const dailyGrowth = growthQ.data ?? [];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-extrabold text-gray-900">Dashboard</h1>
        <p className="text-gray-500 mt-1 font-poppins text-sm">
          Atunluto Group Membership Analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {statsQ.isLoading ? (
          Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            {[
              {
                label: "Total Members",
                value: (stats?.total ?? 0).toLocaleString(),
                icon: <Users className="w-7 h-7 text-green-700" />,
                bg: "bg-green-100",
              },
              {
                label: "Today",
                value: stats?.todayJoins,
                icon: <UserPlus className="w-7 h-7 text-blue-700" />,
                bg: "bg-blue-100",
              },
              {
                label: "Last 7 Days",
                value: stats?.weekJoins,
                icon: <TrendingUp className="w-7 h-7 text-purple-700" />,
                bg: "bg-purple-100",
              },
              {
                label: "Last 30 Days",
                value: stats?.monthJoins,
                icon: <Activity className="w-7 h-7 text-orange-700" />,
                bg: "bg-orange-100",
              },
            ].map(({ label, value, icon, bg }) => (
              <div
                key={label}
                className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500 font-poppins font-medium">
                      {label}
                    </p>
                    <p className="text-3xl font-extrabold text-gray-900 mt-2">
                      {value ?? "—"}
                    </p>
                  </div>
                  <div
                    className={`w-14 h-14 ${bg} rounded-xl flex items-center justify-center`}
                  >
                    {icon}
                  </div>
                </div>
              </div>
            ))}
          </>
        )}
      </div>

      {/* Latest Member Banner */}
      {stats?.lastJoinName && (
        <div
          className="rounded-2xl shadow-lg p-6 text-white"
          style={{ background: "linear-gradient(135deg, #1B5E20, #2E7D32)" }}
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center shrink-0">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-green-100 text-sm font-poppins font-medium">
                Latest Member
              </p>
              <p className="text-xl font-extrabold">{stats.lastJoinName}</p>
              <p className="text-green-100 text-sm mt-1 font-poppins">
                Joined {format(new Date(stats.lastJoinDate), "PPpp")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Growth Chart */}
      {growthQ.isLoading ? (
        <ChartSkeleton height={300} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-extrabold text-gray-900 mb-6">
            30-Day Registration Trend
          </h2>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={dailyGrowth}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="date"
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                stroke="#E5E7EB"
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                stroke="#E5E7EB"
              />
              <Tooltip {...tooltipStyle} />
              <Legend
                wrapperStyle={{ paddingTop: "20px", fontSize: "12px" }}
                iconType="circle"
              />
              <Line
                type="monotone"
                dataKey="daily"
                stroke="#2E7D32"
                strokeWidth={3}
                name="Daily Registrations"
                dot={{ fill: "#2E7D32", r: 3 }}
                activeDot={{ r: 5 }}
              />
              <Line
                type="monotone"
                dataKey="total"
                stroke="#1B5E20"
                strokeWidth={2}
                strokeDasharray="5 5"
                name="Cumulative Total"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* LGA + Ward Charts */}
      <div className="grid lg:grid-cols-2 gap-6">
        {lgaQ.isLoading ? (
          <ChartSkeleton height={350} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-6">
              Members by LGA
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={lgaData} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  type="number"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  stroke="#E5E7EB"
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  stroke="#E5E7EB"
                  width={120}
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#1B5E20" radius={[0, 8, 8, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {wardQ.isLoading ? (
          <ChartSkeleton height={350} />
        ) : (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-extrabold text-gray-900 mb-6">
              Top 10 Wards by Members
            </h2>
            <ResponsiveContainer width="100%" height={350}>
              <BarChart data={wardData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: "#9CA3AF", fontSize: 10 }}
                  stroke="#E5E7EB"
                  angle={-45}
                  textAnchor="end"
                  height={100}
                />
                <YAxis
                  tick={{ fill: "#9CA3AF", fontSize: 11 }}
                  stroke="#E5E7EB"
                />
                <Tooltip {...tooltipStyle} />
                <Bar dataKey="count" fill="#2E7D32" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Polling Units Chart */}
      {pollingQ.isLoading ? (
        <ChartSkeleton height={400} />
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-extrabold text-gray-900 mb-6">
            Top 15 Polling Units by Members
          </h2>
          <ResponsiveContainer width="100%" height={400}>
            <BarChart data={pollingData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#9CA3AF", fontSize: 10 }}
                stroke="#E5E7EB"
                angle={-45}
                textAnchor="end"
                height={120}
              />
              <YAxis
                tick={{ fill: "#9CA3AF", fontSize: 11 }}
                stroke="#E5E7EB"
              />
              <Tooltip {...tooltipStyle} />
              <Bar dataKey="count" fill="#4CAF50" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* Distribution Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-100">
          <h2 className="text-lg font-extrabold text-gray-900">
            Quick Distribution Summary
          </h2>
        </div>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-100">
          {[
            {
              label: "Top LGA",
              data: lgaData[0],
              icon: <MapPin className="w-5 h-5 text-green-700" />,
              bg: "bg-green-100",
            },
            {
              label: "Top Ward",
              data: wardData[0],
              icon: <BarChart3 className="w-5 h-5 text-blue-700" />,
              bg: "bg-blue-100",
            },
            {
              label: "Top Polling Unit",
              data: pollingData[0],
              icon: <Activity className="w-5 h-5 text-purple-700" />,
              bg: "bg-purple-100",
            },
          ].map(({ label, data, icon, bg }) => (
            <div key={label} className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center`}
                >
                  {icon}
                </div>
                <h3 className="font-semibold text-gray-900 font-poppins text-sm">
                  {label}
                </h3>
              </div>
              {lgaQ.isLoading || wardQ.isLoading || pollingQ.isLoading ? (
                <div className="animate-pulse space-y-2">
                  <div className="h-6 bg-gray-200 rounded w-32" />
                  <div className="h-4 bg-gray-100 rounded w-20" />
                </div>
              ) : (
                <>
                  <p className="text-xl font-extrabold text-gray-900 truncate">
                    {data?.name || "N/A"}
                  </p>
                  <p className="text-sm text-gray-500 mt-1 font-poppins">
                    {data?.count ?? 0} members
                  </p>
                </>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
