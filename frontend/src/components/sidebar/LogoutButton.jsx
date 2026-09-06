import { BiLogOut } from "react-icons/bi";
import { FaCog } from "react-icons/fa";
import { Link } from "react-router-dom";
import { useAuthContext } from "../../context/AuthContext";
import useLogout from "../../hooks/useLogout";
import Avatar from "../Avatar";

const LogoutButton = () => {
  const { loading, logout } = useLogout();
  const { authUser } = useAuthContext();

  return (
    <div className="mt-auto pt-3 border-t border-white/10 flex items-center justify-between">
      <div className="flex items-center gap-2 overflow-hidden">
        <Avatar
          src={authUser?.profilePic}
          name={authUser?.fullName}
          className="w-8 h-8 flex-shrink-0"
        />
        <div className="flex flex-col truncate">
          <span className="text-xs font-semibold text-[var(--text-main)] leading-tight truncate">
            {authUser?.fullName}
          </span>
          <span className="text-[10px] text-[var(--text-muted)] truncate">
            @{authUser?.username}
          </span>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/profile" title="Profile Settings">
          <FaCog className="w-5 h-5 text-slate-300 hover:text-white transition-colors cursor-pointer" />
        </Link>
        {!loading ? (
          <BiLogOut
            className="w-5 h-5 text-red-400 hover:text-red-500 transition-colors cursor-pointer"
            onClick={logout}
            title="Logout"
          />
        ) : (
          <span className="loading loading-spinner loading-xs text-red-400"></span>
        )}
      </div>
    </div>
  );
};
export default LogoutButton;
