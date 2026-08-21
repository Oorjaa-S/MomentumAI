import Link from "next/link";
import "./navbar.css";

const Navbar = () => {
  return (
    <nav className="navbar">
      <ul>
        <li><Link href="/">Dashboard</Link></li>
        <li><Link href="/goals">Goals</Link></li>
        <li className="logo">
          <Link href="/">MomentumAI</Link>
        </li>
        <li><Link href="/tasks">Tasks</Link></li>
        <li><Link href="/ai-planner">AI Planner</Link></li>
      </ul>
    </nav>
  );
};

export default Navbar;
