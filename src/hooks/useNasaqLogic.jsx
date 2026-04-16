import { useState, useEffect, useCallback } from "react";
import { supabase } from "../lib/supabase";

export function useNasaqLogic(userName, showToastMsg) {
  const [myGroups, setMyGroups] = useState([]);
  const [currentGroup, setcurrentGroup] = useState(null);
  const [logs, setLogs] = useState([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [loading, setLoading] = useState(false);

  // 1. جلب المجموعات
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
      const ids = (membersRes.data || []).map((m) => m.group_id);
      let joinedGroups = [];
      if (ids.length > 0) {
        const { data } = await supabase
          .from("groups")
          .select("*")
          .in("id", ids);
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
    } catch (err) {
      console.warn("Offline Mode");
    }
  }, [userName]);

  // 2. جلب القراءات
  // 2. جلب القراءات
  const fetchLogs = useCallback(async () => {
    if (!userName) return;

    // 👇 السطر ده هيخلي الشاشة تصفر فوراً لحد ما الداتا الجديدة تيجي 👇
    setLogs([]);

    try {
      let query = supabase
        .from("nasaq_logs")
        .select("*")
        .order("created_at", { ascending: true });
      if (currentGroup && currentGroup.id) {
        query = query.eq("group_id", currentGroup.id);
      } else {
        query = query.is("group_id", null).eq("user_name", userName);
      }
      const { data } = await query;
      setLogs(data || []);
    } catch (err) {
      console.error("Logs Fetch Error:", err);
    }
  }, [userName, currentGroup]);

  // 3. الدالة الشاملة اللي بتعمل ريفريش لكل حاجة في جزء من الثانية
  const fetchData = useCallback(async () => {
    await fetchGroups();
    await fetchLogs();
  }, [fetchGroups, fetchLogs]);

  // 👇 السحر هنا: أي تغيير في الاسم أو اختيار المجموعة، بيعمل ريفريش آلي 👇
  useEffect(() => {
    if (userName) fetchData();
  }, [userName, currentGroup, fetchData]);

  // معالج روابط الدعوة
  useEffect(() => {
    if (!userName) return;
    const processInvite = async () => {
      const url = new URL(window.location.href);
      const inviteName = url.searchParams.get("invite");
      const inviteCode = url.searchParams.get("code");
      if (inviteName) {
        try {
          const { data: groupData } = await supabase
            .from("groups")
            .select("*")
            .eq("name", inviteName)
            .limit(1)
            .maybeSingle();
          if (groupData) {
            if (groupData.is_private && groupData.invite_code !== inviteCode) {
              showToastMsg("رابط الدعوة غير صالح أو انتهى ❌", "error");
            } else {
              const { data: memberCheck } = await supabase
                .from("group_members")
                .select("*")
                .eq("group_id", groupData.id)
                .eq("user_name", userName)
                .maybeSingle();
              if (!memberCheck) {
                await supabase
                  .from("group_members")
                  .insert([{ group_id: groupData.id, user_name: userName }]);
                showToastMsg(`مرحباً بك في "${groupData.name}" 🎉`, "success");
              }
              setcurrentGroup(groupData);
              fetchData();
            }
          }
        } catch (e) {
          console.error(e);
        }
        window.history.replaceState(
          {},
          document.title,
          window.location.pathname,
        );
      }
    };
    processInvite();
  }, [userName, fetchData, showToastMsg]);

  return {
    myGroups,
    currentGroup,
    setcurrentGroup,
    logs,
    isOnline,
    loading,
    setLoading,
    fetchData,
  };
}
