import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useNasaqLogic(userName, showToastMsg) {
  const [myGroups, setMyGroups] = useState([]);
  const [currentGroup, setcurrentGroup] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  const fetchGroups = useCallback(async () => {
    if (!userName) return;
    const cachedStr = localStorage.getItem(`nasaq_groups_${userName}`);
    const cachedData = cachedStr ? JSON.parse(cachedStr) : [];

    if (!navigator.onLine) {
      if (cachedData.length > 0) setMyGroups(cachedData);
      return;
    }

    try {
      const [membersRes, createdGroupsRes] = await Promise.all([
        supabase
          .from("group_members")
          .select("group_id")
          .eq("user_name", userName),
        supabase.from("groups").select("*").eq("creator_name", userName),
      ]);

      if (membersRes.error) throw membersRes.error;
      if (createdGroupsRes.error) throw createdGroupsRes.error;

      const ids = (membersRes.data || []).map((m) => m.group_id);
      let joinedGroups = [];
      if (ids.length > 0) {
        const { data, error } = await supabase
          .from("groups")
          .select("*")
          .in("id", ids);
        if (error) throw error;
        joinedGroups = data || [];
      }

      const allGroups = [...(createdGroupsRes.data || []), ...joinedGroups];
      const uniqueGroups = Array.from(
        new Map(allGroups.map((item) => [item.id, item])).values(),
      );
      uniqueGroups.sort(
        (a, b) => new Date(b.created_at) - new Date(a.created_at),
      );

      setMyGroups(uniqueGroups);
      localStorage.setItem(
        `nasaq_groups_${userName}`,
        JSON.stringify(uniqueGroups),
      );
    } catch (err) {
      if (cachedData.length > 0) setMyGroups(cachedData);
    }
  }, [userName]);

  const fetchLogs = useCallback(async () => {
    if (!userName) return;
    const cacheKey =
      currentGroup && currentGroup.id
        ? `nasaq_logs_${currentGroup.id}`
        : `nasaq_logs_${userName}`;

    // 1. الداتا الموثوقة من السيرفر (فقط)
    const cachedStr = localStorage.getItem(cacheKey);
    let serverData = cachedStr ? JSON.parse(cachedStr) : [];

    // 2. تحديث الداتا لو النت شغال
    if (navigator.onLine) {
      try {
        let query = supabase
          .from("nasaq_logs")
          .select("*")
          .order("created_at", { ascending: true });
        if (currentGroup && currentGroup.id)
          query = query.eq("group_id", currentGroup.id);
        else query = query.is("group_id", null).eq("user_name", userName);

        const { data, error } = await query;
        if (error) throw error;
        if (data) {
          serverData = data;
          localStorage.setItem(cacheKey, JSON.stringify(serverData)); // تحديث كاش السيرفر
        }
      } catch (err) {
        console.warn("Offline or fetch failed, using cache.");
      }
    }

    // 3. دمج داتا السيرفر مع داتا الأوفلاين اللي لسه في الطابور
    const pending = JSON.parse(
      localStorage.getItem("nasaq_pending_logs") || "[]",
    );
    const relevantPending = pending.filter((p) =>
      currentGroup && currentGroup.id
        ? p.group_id === currentGroup.id
        : p.group_id === null && p.user_name === userName,
    );

    // الشاشة دايماً هتعرض المجموع الصافي للاتنين!
    setLogs([...serverData, ...relevantPending]);
  }, [userName, currentGroup]);

  const fetchData = useCallback(async () => {
    await fetchGroups();
    await fetchLogs();
  }, [fetchGroups, fetchLogs]);

  // دالة المزامنة الأوتوماتيكية
  useEffect(() => {
    const syncPendingLogs = async () => {
      if (isOnline && navigator.onLine) {
        const pending = JSON.parse(
          localStorage.getItem("nasaq_pending_logs") || "[]",
        );
        if (pending.length > 0) {
          try {
            const cleanInserts = pending.map(({ id, ...rest }) => rest);
            const { error } = await supabase
              .from("nasaq_logs")
              .insert(cleanInserts);
            if (!error) {
              localStorage.setItem("nasaq_pending_logs", "[]"); // تفريغ الطابور
              fetchData(); // جلب الداتا المحدثة من السيرفر
              if (showToastMsg)
                showToastMsg("تمت مزامنة قراءاتك السابقة بنجاح ☁️", "success");
            }
          } catch (e) {
            console.error("Sync error", e);
          }
        }
      }
    };

    const timer = setTimeout(syncPendingLogs, 1500);
    return () => clearTimeout(timer);
  }, [isOnline, fetchData]);

  useEffect(() => {
    if (userName) fetchData();
  }, [userName, currentGroup, fetchData]);

  return {
    myGroups,
    currentGroup,
    setcurrentGroup,
    logs,
    setLogs,
    isOnline,
    loading,
    setLoading,
    fetchData,
  };
}
