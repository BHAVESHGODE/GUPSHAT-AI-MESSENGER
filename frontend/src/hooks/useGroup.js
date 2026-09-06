import { useState } from "react";
import toast from "react-hot-toast";

const useGroup = () => {
  const [loading, setLoading] = useState(false);

  const createGroup = async ({ groupName, participantIds, groupPic }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups/create", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupName, participantIds, groupPic }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success(`Group "${groupName}" created!`);
      return data;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const getGroups = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      return data;
    } catch (err) {
      toast.error(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  };

  const addGroupMember = async ({ groupId, userIdToAdd }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups/add-member", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, userIdToAdd }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Member added to group");
      return data;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  const removeGroupMember = async ({ groupId, userIdToRemove }) => {
    setLoading(true);
    try {
      const res = await fetch("/api/groups/remove-member", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ groupId, userIdToRemove }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      toast.success("Member removed from group");
      return data;
    } catch (err) {
      toast.error(err.message);
      return null;
    } finally {
      setLoading(false);
    }
  };

  return { createGroup, getGroups, addGroupMember, removeGroupMember, loading };
};

export default useGroup;
