// app/admin/page.jsx
"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/supabase/client";
import { format, subDays, startOfDay, endOfDay, parseISO } from "date-fns";
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
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

const supabase = createClient();

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    totalMembers: 0,
    todayJoins: 0,
    weekJoins: 0,
    monthJoins: 0,
    lastJoinDate: null,
    lastJoinName: null,
  });

  const [lgaData, setLgaData] = useState([]);
  const [wardData, setWardData] = useState([]);
  const [pollingData, setPollingData] = useState([]);
  const [dailyGrowth, setDailyGrowth] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboard = async () => {
      setLoading(true);

      const { data: members, error } = await supabase
        .from("members")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching members:", error);
        setLoading(false);
        return;
      }

      const now = new Date();
      const todayStart = startOfDay(now);
      const weekStart = subDays(now, 7);
      const monthStart = subDays(now, 30);

      const todayJoins = members.filter(
        (m) => new Date(m.created_at) >= todayStart
      ).length;

      const weekJoins = members.filter(
        (m) => new Date(m.created_at) >= weekStart
      ).length;

      const monthJoins = members.filter(
        (m) => new Date(m.created_at) >= monthStart
      ).length;

      setStats({
        totalMembers: members.length,
        todayJoins,
        weekJoins,
        monthJoins,
        lastJoinDate: members[0]?.created_at,
        lastJoinName: members[0]?.full_name,
      });

      // LGA data
      const lgaCounts = members.reduce((acc, m) => {
        acc[m.lga] = (acc[m.lga] || 0) + 1;
        return acc;
      }, {});

      const lgaChartData = Object.entries(lgaCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setLgaData(lgaChartData);

      // Ward data
      const wardCounts = members.reduce((acc, m) => {
        const key = `${m.lga} - Ward ${m.ward}`;
        acc[key] = (acc[key] || 0) + 1;
        return acc;
      }, {});

      const wardChartData = Object.entries(wardCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 10);

      setWardData(wardChartData);

      // Polling unit data
      const pollingCounts = members.reduce((acc, m) => {
        acc[m.polling_unit] = (acc[m.polling_unit] || 0) + 1;
        return acc;
      }, {});

      const pollingChartData = Object.entries(pollingCounts)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 15);

      setPollingData(pollingChartData);

      // Daily Growth
      const last30Days = Array.from({ length: 30 }, (_, i) => {
        const date = subDays(now, 29 - i);
        return {
          date: format(date, "MMM dd"),
          fullDate: format(date, "yyyy-MM-dd"),
          count: 0,
        };
      });

      members.forEach((m) => {
        const memberDate = format(new Date(m.created_at), "yyyy-MM-dd");
        const dayIndex = last30Days.findIndex((d) => d.fullDate === memberDate);
        if (dayIndex !== -1) {
          last30Days[dayIndex].count++;
        }
      });

      let cumulative = 0;
      const growthData = last30Days.map((day) => {
        cumulative += day.count;
        return {
          date: day.date,
          daily: day.count,
          total: cumulative,
        };
      });

      setDailyGrowth(growthData);
      setLoading(false);
    };

    loadDashboard();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-green-600 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600 font-medium">Loading Analytics...</p>
        </div>
      </div>
    );
  }

  const COLORS = ["#1B5E20", "#2E7D32", "#4CAF50", "#66BB6A", "#81C784"];

  return (
    <div className="space-y-8 pb-20">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Dashboard</h1>
        <p className="text-gray-600 mt-1">
          Atunluto Group Membership Analytics
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Total Members */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Total Members</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.totalMembers.toLocaleString()}
              </p>
            </div>
            <div className="w-14 h-14 bg-green-100 rounded-xl flex items-center justify-center">
              <Users className="w-7 h-7 text-green-700" />
            </div>
          </div>
        </div>

        {/* Today's Joins */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Today</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.todayJoins}
              </p>
            </div>
            <div className="w-14 h-14 bg-blue-100 rounded-xl flex items-center justify-center">
              <UserPlus className="w-7 h-7 text-blue-700" />
            </div>
          </div>
        </div>

        {/* This Week */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Last 7 Days</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.weekJoins}
              </p>
            </div>
            <div className="w-14 h-14 bg-purple-100 rounded-xl flex items-center justify-center">
              <TrendingUp className="w-7 h-7 text-purple-700" />
            </div>
          </div>
        </div>

        {/* This Month */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-600 font-medium">Last 30 Days</p>
              <p className="text-3xl font-bold text-gray-900 mt-2">
                {stats.monthJoins}
              </p>
            </div>
            <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center">
              <Activity className="w-7 h-7 text-orange-700" />
            </div>
          </div>
        </div>
      </div>

      {/* Last Registration Card */}
      {stats.lastJoinName && (
        <div className="bg-l-to-r from-green-700 to-green-900 rounded-2xl shadow-lg p-6 text-white">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Calendar className="w-6 h-6" />
            </div>
            <div>
              <p className="text-green-100 text-sm font-medium">
                Latest Member
              </p>
              <p className="text-xl font-bold">{stats.lastJoinName}</p>
              <p className="text-green-100 text-sm mt-1">
                Joined {format(new Date(stats.lastJoinDate), "PPpp")}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Growth Chart */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          30-Day Registration Trend
        </h2>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={dailyGrowth}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="date"
              tick={{ fill: "#6B7280", fontSize: 12 }}
              stroke="#D1D5DB"
            />
            <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} stroke="#D1D5DB" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFF",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            <Legend wrapperStyle={{ paddingTop: "20px" }} iconType="circle" />
            <Line
              type="monotone"
              dataKey="daily"
              stroke="#2E7D32"
              strokeWidth={3}
              name="Daily Registrations"
              dot={{ fill: "#2E7D32", r: 4 }}
              activeDot={{ r: 6 }}
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

      {/* LGA Distribution */}
      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Members by LGA
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={lgaData} layout="horizontal">
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                type="number"
                tick={{ fill: "#6B7280", fontSize: 12 }}
                stroke="#D1D5DB"
              />
              <YAxis
                type="category"
                dataKey="name"
                tick={{ fill: "#6B7280", fontSize: 11 }}
                stroke="#D1D5DB"
                width={120}
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              />
              <Bar dataKey="count" fill="#1B5E20" radius={[0, 8, 8, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Ward Distribution */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-6">
            Top 10 Wards by Members
          </h2>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={wardData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
              <XAxis
                dataKey="name"
                tick={{ fill: "#6B7280", fontSize: 10 }}
                stroke="#D1D5DB"
                angle={-45}
                textAnchor="end"
                height={100}
              />
              <YAxis
                tick={{ fill: "#6B7280", fontSize: 12 }}
                stroke="#D1D5DB"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#FFF",
                  border: "1px solid #E5E7EB",
                  borderRadius: "12px",
                  padding: "12px",
                }}
              />
              <Bar dataKey="count" fill="#2E7D32" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Polling Units */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
        <h2 className="text-xl font-bold text-gray-900 mb-6">
          Top 15 Polling Units by Members
        </h2>
        <ResponsiveContainer width="100%" height={400}>
          <BarChart data={pollingData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#E5E7EB" />
            <XAxis
              dataKey="name"
              tick={{ fill: "#6B7280", fontSize: 10 }}
              stroke="#D1D5DB"
              angle={-45}
              textAnchor="end"
              height={120}
            />
            <YAxis tick={{ fill: "#6B7280", fontSize: 12 }} stroke="#D1D5DB" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#FFF",
                border: "1px solid #E5E7EB",
                borderRadius: "12px",
                padding: "12px",
              }}
            />
            <Bar dataKey="count" fill="#4CAF50" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Distribution Summary Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <h2 className="text-xl font-bold text-gray-900">
            Quick Distribution Summary
          </h2>
        </div>
        <div className="grid md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-gray-200">
          {/* Most Populated LGA */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                <MapPin className="w-5 h-5 text-green-700" />
              </div>
              <h3 className="font-semibold text-gray-900">Top LGA</h3>
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {lgaData[0]?.name || "N/A"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {lgaData[0]?.count || 0} members
            </p>
          </div>

          {/* Most Populated Ward */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-blue-700" />
              </div>
              <h3 className="font-semibold text-gray-900">Top Ward</h3>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {wardData[0]?.name || "N/A"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {wardData[0]?.count || 0} members
            </p>
          </div>

          {/* Most Populated Polling Unit */}
          <div className="p-6">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                <Activity className="w-5 h-5 text-purple-700" />
              </div>
              <h3 className="font-semibold text-gray-900">Top Polling Unit</h3>
            </div>
            <p className="text-lg font-bold text-gray-900">
              {pollingData[0]?.name || "N/A"}
            </p>
            <p className="text-sm text-gray-600 mt-1">
              {pollingData[0]?.count || 0} members
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
