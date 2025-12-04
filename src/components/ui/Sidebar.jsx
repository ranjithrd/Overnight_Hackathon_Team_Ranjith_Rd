// src/components/Sidebar.jsx
import { LayoutDashboard, Wallet, Users, FileText, Settings } from "lucide-react";

const Sidebar = () => {
  const menuItems = [
    { icon: LayoutDashboard, label: "Dashboard", active: true },
    { icon: Wallet, label: "Active Loans", active: false },
    { icon: Users, label: "Borrowers", active: false },
    { icon: FileText, label: "Reports", active: false },
    { icon: Settings, label: "Settings", active: false },
    {icon: Settings, label: "Deposits", active: false },
    {icon: Settings, label: "Loan Application", active: false },
  ];

  return (
    <aside className="w-64 bg-white hidden md:flex flex-col border-r border-gray-100 p-4 m-4 rounded-xl shadow-sm h-[calc(100vh-2rem)]">
      <div className="flex items-center gap-2 mb-8 px-2">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center text-white font-bold">C</div>
        <span className="text-xl font-bold text-navy-700">Coop Manager</span>
      </div>

      <nav className="flex-1 space-y-2">
        {menuItems.map((item) => (
          <button
            key={item.label}
            className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
              item.active
                ? "bg-blue-50 text-blue-600 border-r-4 border-blue-600"
                : "text-gray-500 hover:bg-gray-50 hover:text-gray-900"
            }`}
          >
            <item.icon className="w-5 h-5" />
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
};

export default Sidebar;