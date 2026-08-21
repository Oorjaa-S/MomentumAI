import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import "./sidebar.css";

const Sidebar = () => {
  const pathname = usePathname();
  
  const navItems = [
    { path: "/", icon: "📊", label: "Dashboard" },
    { path: "/goals", icon: "🎯", label: "Goals" },
    { path: "/tasks", icon: "✅", label: "Tasks" },
    { path: "/ai-planner", icon: "✨", label: "AI Planner" },
    { path: "/analytics", icon: "📈", label: "Analytics" },
    { path: "/settings", icon: "⚙️", label: "Settings" }
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-content">
        <div className="nav-links">
          <ul>
            {navItems.map((item) => (
              <li 
                key={item.path} 
                className={`nav-item ${pathname === item.path ? 'active' : ''}`}
              >
                <Link href={item.path} className="nav-link">
                  <span className="nav-icon">{item.icon}</span>
                  <span className="nav-text">{item.label}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
        
        <div className="logo-container">
          <Link href="/">
            <div className="logo-wrapper">
              {/*<Image 
                src="https://i.ibb.co/LXkB5kJK/logo.png" 
                alt="App Logo" 
                width={120} 
                height={120}
                className="logo-image"
              />*/}
            </div>
          </Link>
        </div>
      </div>
    </aside>
  );
};

export default Sidebar;