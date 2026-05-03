"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { createClient } from "@/supabase/client";

const supabase = createClient();
const ADMINS_API = "/api/dashboard/admins";

// ─── Keys ─────────────────────────────────────────────────────────────────────
export const adminKeys = {
  all: ["admins"],
  list: (filters) => ["admins", "list", filters],
  byLGA: (lga) => ["admins", "lga", lga],
  stats: () => ["admins", "stats"],
};

async function apiFetch(url, options = {}) {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok || data?.error) throw new Error(data?.error || "Request failed.");
  return data;
}

// ─── Fetch current actor info ──────────────────────────────────────────────────
export function useCurrentAdmin() {
  return useQuery({
    queryKey: ["current-admin"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const { data, error } = await supabase
        .from("admins")
        .select("id, email, full_name, role, lga, is_active")
        .eq("id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    staleTime: 5 * 60 * 1000,
    retry: 2,
  });
}

// ─── Fetch all admins (scoped by role — client-side Supabase for reads) ───────
export function useAdmins(filters = {}) {
  const { data: actor } = useCurrentAdmin();

  return useQuery({
    queryKey: adminKeys.list({
      ...filters,
      actorRole: actor?.role,
      actorLGA: actor?.lga,
    }),
    queryFn: async () => {
      let query = supabase
        .from("admins")
        .select(
          `id, email, full_name, role, lga, phone,
           is_active, created_at, last_login, created_by,
           creator:created_by(full_name, role)`,
        )
        .order("lga", { ascending: true })
        .order("role", { ascending: true })
        .order("created_at", { ascending: false });

      if (actor?.role === "super_user") {
        query = query.eq("lga", actor.lga).neq("role", "state_admin");
      } else if (actor?.role === "administrator") {
        query = query
          .eq("lga", actor.lga)
          .in("role", ["registration", "manager"]);
      } else if (actor?.role !== "state_admin") {
        return [];
      }

      if (filters.lga) query = query.eq("lga", filters.lga);
      if (filters.role) query = query.eq("role", filters.role);
      if (filters.is_active !== undefined)
        query = query.eq("is_active", filters.is_active);
      if (filters.search) {
        query = query.or(
          `full_name.ilike.%${filters.search}%,email.ilike.%${filters.search}%`,
        );
      }

      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!actor,
    staleTime: 30 * 1000,
  });
}

// ─── Admin stats per LGA ─────────────────────────────────────────────────────
export function useAdminStats() {
  const { data: actor } = useCurrentAdmin();

  return useQuery({
    queryKey: adminKeys.stats(),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("admins")
        .select("role, lga, is_active");
      if (error) throw error;

      const byLGA = {};
      data.forEach((a) => {
        if (!a.lga) return;
        if (!byLGA[a.lga]) {
          byLGA[a.lga] = { total: 0, active: 0, byRole: {} };
        }
        byLGA[a.lga].total += 1;
        if (a.is_active) byLGA[a.lga].active += 1;
        byLGA[a.lga].byRole[a.role] = (byLGA[a.lga].byRole[a.role] || 0) + 1;
      });

      return byLGA;
    },
    enabled: actor?.role === "state_admin",
    staleTime: 60 * 1000,
  });
}

// ─── Toggle admin status ──────────────────────────────────────────────────────
export function useToggleAdminStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ adminId, newStatus }) =>
      apiFetch(`${ADMINS_API}/${adminId}`, {
        method: "PATCH",
        body: JSON.stringify({ newStatus }),
      }),
    onMutate: async ({ adminId, newStatus }) => {
      await queryClient.cancelQueries({ queryKey: adminKeys.all });
      const snapshot = queryClient.getQueryData(adminKeys.all);
      queryClient.setQueriesData({ queryKey: adminKeys.all }, (old) => {
        if (!Array.isArray(old)) return old;
        return old.map((a) =>
          a.id === adminId ? { ...a, is_active: newStatus } : a,
        );
      });
      return { snapshot };
    },
    onError: (_err, _vars, ctx) => {
      if (ctx?.snapshot) {
        queryClient.setQueriesData({ queryKey: adminKeys.all }, ctx.snapshot);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

// ─── Delete admin ─────────────────────────────────────────────────────────────
export function useDeleteAdmin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (adminId) =>
      apiFetch(`${ADMINS_API}/${adminId}`, { method: "DELETE" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: adminKeys.all });
    },
  });
}

// ─── Member collation hooks (direct Supabase reads — no server action needed) ─

export function useMemberCollationByLGA() {
  const { data: actor } = useCurrentAdmin();

  return useQuery({
    queryKey: ["members-collation-lga", actor?.role, actor?.lga],
    queryFn: async () => {
      let query = supabase
        .from("members")
        .select("lga, ward, gender, created_at")
        .limit(50000);

      if (
        actor?.role === "super_user" ||
        actor?.role === "administrator" ||
        actor?.role === "registration"
      ) {
        query = query.eq("lga", actor.lga);
      }

      const { data, error } = await query;
      if (error) throw error;

      const byLGA = {};
      data.forEach((m) => {
        if (!byLGA[m.lga]) {
          byLGA[m.lga] = {
            lga: m.lga,
            total: 0,
            male: 0,
            female: 0,
            other: 0,
            byWard: {},
            monthlyTrend: {},
          };
        }

        const l = byLGA[m.lga];
        l.total += 1;
        if (m.gender === "male") l.male += 1;
        else if (m.gender === "female") l.female += 1;
        else l.other += 1;

        if (!l.byWard[m.ward]) {
          l.byWard[m.ward] = { total: 0, male: 0, female: 0, other: 0 };
        }
        const w = l.byWard[m.ward];
        w.total += 1;
        if (m.gender === "male") w.male += 1;
        else if (m.gender === "female") w.female += 1;
        else w.other += 1;

        const month = m.created_at?.slice(0, 7);
        if (month) {
          l.monthlyTrend[month] = (l.monthlyTrend[month] || 0) + 1;
        }
      });

      return Object.values(byLGA).sort((a, b) => b.total - a.total);
    },
    enabled:
      !!actor &&
      ["state_admin", "super_user", "administrator", "registration"].includes(
        actor.role,
      ),
    staleTime: 60 * 1000,
  });
}

export function useMemberStats() {
  const { data: actor } = useCurrentAdmin();

  return useQuery({
    queryKey: ["member-stats", actor?.role, actor?.lga],
    queryFn: async () => {
      const now = new Date();
      const thisMonthStart = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
      ).toISOString();
      const lastMonthStart = new Date(
        now.getFullYear(),
        now.getMonth() - 1,
        1,
      ).toISOString();

      const base = () => {
        let q = supabase
          .from("members")
          .select("*", { count: "exact", head: true });
        if (actor?.role !== "state_admin") q = q.eq("lga", actor.lga);
        return q;
      };

      const [
        { count: total, error: e1 },
        { count: maleCount, error: e2 },
        { count: femaleCount, error: e3 },
        { count: thisMonthCount, error: e4 },
        { count: lastMonthCount, error: e5 },
      ] = await Promise.all([
        base(),
        base().eq("gender", "male"),
        base().eq("gender", "female"),
        base().gte("created_at", thisMonthStart),
        base()
          .gte("created_at", lastMonthStart)
          .lt("created_at", thisMonthStart),
      ]);

      const err = e1 || e2 || e3 || e4 || e5;
      if (err) throw err;

      const t = total ?? 0;
      const m = maleCount ?? 0;
      const f = femaleCount ?? 0;
      const tm = thisMonthCount ?? 0;
      const lm = lastMonthCount ?? 0;

      return {
        total: t,
        thisMonth: tm,
        lastMonth: lm,
        male: m,
        female: f,
        other: t - m - f,
        growth:
          lm > 0 ? Math.round(((tm - lm) / lm) * 100) : null,
      };
    },
    enabled: !!actor,
    staleTime: 30 * 1000,
  });
}
