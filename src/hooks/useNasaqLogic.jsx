import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useNasaqLogic(userName, showToastMsg) {
  const [myGroups, setMyGroups] = useState([]);
  const [currentGroup, setcurrentGroup] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);

  // تحديث حالة الإنترنت
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
    try {
      const [membersRes, createdGroupsRes] = await Promise.all([
        supabase
          .from("group_members")
          .select("group_id")
          .eq("user_name", userName),
        supabase.from("groups").select("*").eq("creator_name", userName),
      ]);

      // 👇 السر هنا: لو Supabase رجع خطأ، لازم نرميه عشان نروح للـ Catch والكاش ميمسحش
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
      console.warn("Offline Mode: Loading Groups from Cache");
      const cached = localStorage.getItem(`nasaq_groups_${userName}`);
      if (cached) setMyGroups(JSON.parse(cached));
    }
  }, [userName]);

  const fetchLogs = useCallback(async () => {
    if (!userName) return;
    const cacheKey =
      currentGroup && currentGroup.id
        ? `nasaq_logs_${currentGroup.id}`
        : `nasaq_logs_${userName}`;

    try {
      let query = supabase
        .from("nasaq_logs")
        .select("*")
        .order("created_at", { ascending: true });
      if (currentGroup && currentGroup.id)
        query = query.eq("group_id", currentGroup.id);
      else query = query.is("group_id", null).eq("user_name", userName);

      const { data, error } = await query;

      // 👇 السر هنا: لازم نرمي الإيرور عشان الكود ميكملش ويمسح الكاش بمصفوفة فاضية
      if (error) throw error;

      setLogs(data || []);
      localStorage.setItem(cacheKey, JSON.stringify(data || []));
    } catch (err) {
      console.warn("Offline Mode: Loading Logs from Cache");
      const cached = localStorage.getItem(cacheKey);
      if (cached) setLogs(JSON.parse(cached));
    }
  }, [userName, currentGroup]);

  const fetchData = useCallback(async () => {
    await fetchGroups();
    await fetchLogs();
  }, [fetchGroups, fetchLogs]);

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
