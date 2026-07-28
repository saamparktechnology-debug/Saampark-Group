"use client";

import Image from "next/image";
import { Bell, LogOut, LogIn, Search } from "lucide-react";

// TRY THIS PATH: It goes up one folder, into context, then AuthContext
import { useAuth } from "../context/AuthContext"; 

export default function Topbar() {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <header className="fixed top-0 right-0 left-0 z-50 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <div className="flex items-center gap-4">
        <div className="text-xl font-bold text-blue-600">ShopManager</div>
      </div>

      <div className="flex items-center gap-3">
        {isAuthenticated ? (
          <>
            <button className="relative rounded-full p-2 text-gray-500 hover:bg-gray-100">
              <Bell size={20} />
              <span className="absolute right-2 top-2 h-2 w-2 rounded-full bg-red-500"></span>
            </button>

            <div className="flex items-center gap-3 border-l pl-4 ml-2">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-semibold text-gray-800 capitalize">{user?.username}</p>
                <p className="text-[10px] font-medium text-gray-400 uppercase">{user?.role}</p>
              </div>
              
              <button 
                onClick={logout}
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50"
              >
                <LogOut size={18} />
                <span>Logout</span>
              </button>
            </div>
          </>
        ) : (
          <button className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white hover:bg-blue-700">
            <LogIn size={18} />
            <span>Login</span>
          </button>
        )}
      </div>
    </header>
  );
}